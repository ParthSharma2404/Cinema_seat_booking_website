import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { logAuditEvent } from './auditService';
import { SeatHoldService } from './seatHoldService';

function generateBookingReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'BK-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

function generateTicketToken(): string {
  return `TCK-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

export class BookingService {
  /**
   * Confirms a booking from active seat holds.
   * Employs database-level unique keys and transactions to ensure ZERO double-bookings.
   */
  static async confirmBooking(params: {
    showId: string;
    seatIds: string[];
    userId: string;
    paymentMethod?: string;
  }) {
    const { showId, seatIds, userId, paymentMethod = 'SIMULATED_CARD' } = params;
    const now = new Date();

    // 1. Fetch show and seats
    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: {
        movie: true,
        screen: {
          include: {
            theatre: true,
            seats: {
              where: { id: { in: seatIds } },
            },
          },
        },
      },
    });

    if (!show) {
      throw new Error('Show not found');
    }

    if (show.startTime <= now) {
      throw new Error('Cannot book tickets for a show that has already started');
    }

    if (show.screen.seats.length !== seatIds.length) {
      throw new Error('One or more selected seats do not belong to this screen');
    }

    // 2. Execute transactional booking creation
    const booking = await prisma.$transaction(async (tx) => {
      // Step A: Purge expired holds
      await tx.seatHold.deleteMany({
        where: {
          showId,
          expiresAt: { lt: now },
        },
      });

      // Step B: Verify the current user actually holds these seats or they are available
      const activeHolds = await tx.seatHold.findMany({
        where: {
          showId,
          seatId: { in: seatIds },
        },
      });

      // Check if any seat is held by someone else
      const heldByOthers = activeHolds.filter((h) => h.userId !== userId && h.expiresAt > now);
      if (heldByOthers.length > 0) {
        throw new Error('One or more seats have expired and been reserved by another customer');
      }

      // Step C: Check if already booked
      const existingConfirmed = await tx.bookingSeat.findMany({
        where: {
          activeShowSeatKey: {
            in: seatIds.map((sid) => `${showId}_${sid}`),
          },
        },
        include: { seat: true },
      });

      if (existingConfirmed.length > 0) {
        const booked = existingConfirmed.map((b) => `${b.seat.rowName}${b.seat.seatNumber}`).join(', ');
        throw new Error(`Double-booking prevented: Seat(s) ${booked} are already confirmed.`);
      }

      // Step D: Calculate pricing
      let totalAmount = 0;
      const seatAllocations = show.screen.seats.map((seat) => {
        const price = Math.round(show.basePrice * seat.priceMultiplier);
        totalAmount += price;
        return {
          seatId: seat.id,
          price,
          activeShowSeatKey: `${showId}_${seat.id}`, // DB Unique Constraint Enforcer
        };
      });

      // Step E: Create Booking
      let bookingReference = generateBookingReference();
      // Ensure reference is unique
      let attempts = 0;
      while (attempts < 5) {
        const exists = await tx.booking.findUnique({ where: { bookingReference } });
        if (!exists) break;
        bookingReference = generateBookingReference();
        attempts++;
      }

      const newBooking = await tx.booking.create({
        data: {
          bookingReference,
          userId,
          showId,
          totalAmount,
          status: 'CONFIRMED',
          bookingSeats: {
            create: seatAllocations,
          },
        },
        include: {
          bookingSeats: {
            include: { seat: true },
          },
        },
      });

      // Step F: Create Ticket with unique QR validation token
      const qrValidationToken = generateTicketToken();
      const ticket = await tx.ticket.create({
        data: {
          bookingId: newBooking.id,
          qrValidationToken,
          validationStatus: 'VALID',
        },
      });

      // Step G: Create Simulated Payment Record
      const transactionReference = `TXN-${Date.now()}-${Math.floor(Math.random() * 90000 + 10000)}`;
      await tx.payment.create({
        data: {
          bookingId: newBooking.id,
          transactionReference,
          amount: totalAmount,
          method: paymentMethod,
          status: 'SUCCESS',
          gatewayResponse: JSON.stringify({
            status: 'AUTHORIZED',
            gateway: 'MOCK_SANDBOX_GATEWAY',
            code: '200',
            timestamp: now.toISOString(),
          }),
        },
      });

      // Step H: Release Seat Holds now that booking is confirmed
      await tx.seatHold.deleteMany({
        where: {
          showId,
          seatId: { in: seatIds },
        },
      });

      return {
        ...newBooking,
        ticket,
      };
    });

    // Step I: Audit trail log
    await logAuditEvent({
      actorId: userId,
      action: 'BOOKING_CONFIRMED',
      targetEntity: 'Booking',
      targetId: booking.id,
      details: {
        reference: booking.bookingReference,
        showId,
        totalAmount: booking.totalAmount,
        seatIds,
      },
    });

    return booking;
  }

  /**
   * Cancel a confirmed booking and initiate simulated refund.
   * Atomically releases seats for other customers.
   */
  static async cancelBooking(params: {
    bookingId: string;
    userId: string;
    userRole: string;
    reason: string;
  }) {
    const { bookingId, userId, userRole, reason } = params;
    const now = new Date();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        show: {
          include: { movie: true },
        },
        bookingSeats: true,
        ticket: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (userRole !== 'ADMIN' && userRole !== 'STAFF' && booking.userId !== userId) {
      throw new Error('You do not have permission to cancel this booking');
    }

    if (booking.status === 'CANCELLED') {
      throw new Error('Booking is already cancelled');
    }

    // Check cancellation policy: Can only cancel before showtime
    if (booking.show.startTime <= now) {
      throw new Error('Cannot cancel a booking after the show has started');
    }

    // Execute atomic cancellation
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Step A: Set activeShowSeatKey = null so the seats become immediately available
      await tx.bookingSeat.updateMany({
        where: { bookingId },
        data: { activeShowSeatKey: null },
      });

      // Step B: Mark Ticket as CANCELLED
      if (booking.ticket) {
        await tx.ticket.update({
          where: { id: booking.ticket.id },
          data: { validationStatus: 'CANCELLED' },
        });
      }

      // Step C: Update Booking to CANCELLED with simulated refund
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          cancelledAt: now,
          cancellationReason: reason,
          refundStatus: 'COMPLETED',
          refundAmount: booking.totalAmount,
        },
        include: {
          bookingSeats: {
            include: { seat: true },
          },
          show: {
            include: { movie: true, screen: true },
          },
          ticket: true,
        },
      });

      // Step D: Create Refund Payment Record
      await tx.payment.create({
        data: {
          bookingId,
          transactionReference: `REF-${Date.now()}-${Math.floor(Math.random() * 90000 + 10000)}`,
          amount: booking.totalAmount,
          method: 'SIMULATED_REFUND',
          status: 'REFUNDED',
          gatewayResponse: JSON.stringify({
            refundStatus: 'SETTLED',
            simulatedGateway: 'MOCK_SANDBOX_REFUND',
            refundAmount: booking.totalAmount,
            timestamp: now.toISOString(),
          }),
        },
      });

      return updated;
    });

    // Audit log
    await logAuditEvent({
      actorId: userId,
      actorRole: userRole,
      action: 'BOOKING_CANCELLED',
      targetEntity: 'Booking',
      targetId: booking.id,
      details: {
        reference: booking.bookingReference,
        reason,
        refundAmount: booking.totalAmount,
      },
    });

    return updatedBooking;
  }

  /**
   * Fetch a booking by its reference code
   */
  static async getBookingByReference(reference: string) {
    return prisma.booking.findUnique({
      where: { bookingReference: reference },
      include: {
        show: {
          include: {
            movie: true,
            screen: {
              include: { theatre: true },
            },
          },
        },
        bookingSeats: {
          include: { seat: true },
        },
        ticket: true,
        payments: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Fetch all bookings for a user
   */
  static async getUserBookings(userId: string) {
    return prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        show: {
          include: {
            movie: true,
            screen: {
              include: { theatre: true },
            },
          },
        },
        bookingSeats: {
          include: { seat: true },
        },
        ticket: true,
        payments: true,
      },
    });
  }
}
