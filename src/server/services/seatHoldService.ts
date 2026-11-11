import prisma from '@/lib/prisma';
import { logAuditEvent } from './auditService';

const HOLD_DURATION_MINUTES = parseInt(process.env.SEAT_HOLD_DURATION_MINUTES || '8', 10);
const HOLD_DURATION_MS = HOLD_DURATION_MINUTES * 60 * 1000;

export interface SeatWithStatus {
  id: string;
  rowName: string;
  seatNumber: number;
  category: string;
  price: number;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED';
  isHeldByMe: boolean;
  holdExpiresAt: Date | null;
}

export class SeatHoldService {
  /**
   * Release all expired holds across the system (or for a show).
   * Runs lazily on access or via background sweeps.
   */
  static async cleanupExpiredHolds(showId?: string): Promise<number> {
    const now = new Date();
    const result = await prisma.seatHold.deleteMany({
      where: {
        expiresAt: { lt: now },
        ...(showId ? { showId } : {}),
      },
    });
    return result.count;
  }

  /**
   * Fetch current status of all seats in a show (Booked, Held, or Available)
   */
  static async getSeatsForShow(showId: string, currentUserId?: string): Promise<{
    show: any;
    seats: SeatWithStatus[];
  }> {
    // 1. Clean up expired holds for this show first
    await this.cleanupExpiredHolds(showId);

    // 2. Fetch show with screen and seats
    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: {
        movie: true,
        screen: {
          include: {
            theatre: true,
            seats: {
              orderBy: [{ rowName: 'asc' }, { seatNumber: 'asc' }],
            },
          },
        },
      },
    });

    if (!show) {
      throw new Error('Show not found');
    }

    const now = new Date();

    // 3. Fetch active holds for this show
    const activeHolds = await prisma.seatHold.findMany({
      where: {
        showId,
        expiresAt: { gt: now },
      },
    });

    // 4. Fetch confirmed bookings for this show
    const confirmedBookings = await prisma.booking.findMany({
      where: {
        showId,
        status: 'CONFIRMED',
      },
      include: {
        bookingSeats: true,
      },
    });

    const bookedSeatIds = new Set<string>();
    for (const b of confirmedBookings) {
      for (const bs of b.bookingSeats) {
        bookedSeatIds.add(bs.seatId);
      }
    }

    const holdMap = new Map<string, (typeof activeHolds)[0]>();
    for (const h of activeHolds) {
      holdMap.set(h.seatId, h);
    }

    // 5. Map seats with calculated statuses and pricing
    const seatsWithStatus: SeatWithStatus[] = show.screen.seats.map((seat) => {
      const isBooked = bookedSeatIds.has(seat.id);
      const activeHold = holdMap.get(seat.id);

      let status: 'AVAILABLE' | 'HELD' | 'BOOKED' = 'AVAILABLE';
      let isHeldByMe = false;
      let holdExpiresAt: Date | null = null;

      if (isBooked) {
        status = 'BOOKED';
      } else if (activeHold) {
        status = 'HELD';
        isHeldByMe = Boolean(currentUserId && activeHold.userId === currentUserId);
        holdExpiresAt = activeHold.expiresAt;
      }

      // Base price * category multiplier
      const calculatedPrice = Math.round(show.basePrice * seat.priceMultiplier);

      return {
        id: seat.id,
        rowName: seat.rowName,
        seatNumber: seat.seatNumber,
        category: seat.category,
        price: calculatedPrice,
        status,
        isHeldByMe,
        holdExpiresAt,
      };
    });

    return { show, seats: seatsWithStatus };
  }

  /**
   * Acquire a temporary hold on one or more seats for a show.
   * Atomically checks for conflicting holds or confirmed bookings.
   */
  static async holdSeats(params: {
    showId: string;
    seatIds: string[];
    userId: string;
    holdToken?: string;
  }): Promise<{ holds: any[]; expiresAt: Date }> {
    const { showId, seatIds, userId } = params;
    const holdToken = params.holdToken || `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = new Date(Date.now() + HOLD_DURATION_MS);
    const now = new Date();

    // Execute in an interactive transaction with serializable isolation / ACID safety
    const holds = await prisma.$transaction(async (tx) => {
      // Step A: Purge expired holds
      await tx.seatHold.deleteMany({
        where: {
          showId,
          expiresAt: { lt: now },
        },
      });

      // Step B: Check if any seat is already CONFIRMED in a booking
      const conflictingBookings = await tx.bookingSeat.findMany({
        where: {
          seatId: { in: seatIds },
          booking: {
            showId,
            status: 'CONFIRMED',
          },
        },
        include: {
          seat: true,
        },
      });

      if (conflictingBookings.length > 0) {
        const takenSeats = conflictingBookings
          .map((b) => `${b.seat.rowName}${b.seat.seatNumber}`)
          .join(', ');
        throw new Error(`The following seats are already booked: ${takenSeats}`);
      }

      // Step C: Check if any seat is held by ANOTHER user
      const conflictingHolds = await tx.seatHold.findMany({
        where: {
          showId,
          seatId: { in: seatIds },
          userId: { not: userId },
          expiresAt: { gt: now },
        },
        include: {
          seat: true,
        },
      });

      if (conflictingHolds.length > 0) {
        const heldSeats = conflictingHolds
          .map((h) => `${h.seat.rowName}${h.seat.seatNumber}`)
          .join(', ');
        throw new Error(
          `The following seats are currently held by another customer: ${heldSeats}. Please choose different seats or try again in a few minutes.`
        );
      }

      // Step D: Remove any existing holds by this user on these seats to refresh TTL
      await tx.seatHold.deleteMany({
        where: {
          showId,
          seatId: { in: seatIds },
          userId,
        },
      });

      // Step E: Create fresh seat holds
      const createdHolds = [];
      for (const seatId of seatIds) {
        const hold = await tx.seatHold.create({
          data: {
            showId,
            seatId,
            userId,
            holdToken,
            expiresAt,
          },
        });
        createdHolds.push(hold);
      }

      return createdHolds;
    });

    return { holds, expiresAt };
  }

  /**
   * Release hold on seats (e.g. user deselects or navigates away)
   */
  static async releaseSeats(params: {
    showId: string;
    seatIds: string[];
    userId: string;
  }): Promise<{ releasedCount: number }> {
    const { showId, seatIds, userId } = params;

    const result = await prisma.seatHold.deleteMany({
      where: {
        showId,
        seatId: { in: seatIds },
        userId,
      },
    });

    return { releasedCount: result.count };
  }
}

