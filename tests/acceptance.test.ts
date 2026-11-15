import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';
import { SeatHoldService } from '../src/server/services/seatHoldService';
import { BookingService } from '../src/server/services/bookingService';
import { TicketService } from '../src/server/services/ticketService';
import { ReportingService } from '../src/server/services/reportingService';

describe('Cinema Hall Ticket Booking System - Acceptance Tests (SRS Suite)', { timeout: 30000 }, () => {
  let testUserId1: string;
  let testUserId2: string;
  let staffUserId: string;
  let testShowId: string;
  let availableSeatId1: string;
  let availableSeatId2: string;
  let availableSeatId3: string;

  beforeAll(async () => {
    // 1. Ensure test users exist
    let u1 = await prisma.user.findUnique({ where: { email: 'test_cust1@test.com' } });
    if (!u1) {
      u1 = await prisma.user.create({
        data: {
          email: 'test_cust1@test.com',
          passwordHash: 'dummy',
          fullName: 'Test Customer 1',
          role: 'CUSTOMER',
        },
      });
    }
    testUserId1 = u1.id;

    let u2 = await prisma.user.findUnique({ where: { email: 'test_cust2@test.com' } });
    if (!u2) {
      u2 = await prisma.user.create({
        data: {
          email: 'test_cust2@test.com',
          passwordHash: 'dummy',
          fullName: 'Test Customer 2',
          role: 'CUSTOMER',
        },
      });
    }
    testUserId2 = u2.id;

    let staff = await prisma.user.findUnique({ where: { email: 'test_staff@test.com' } });
    if (!staff) {
      staff = await prisma.user.create({
        data: {
          email: 'test_staff@test.com',
          passwordHash: 'dummy',
          fullName: 'Test Staff',
          role: 'STAFF',
        },
      });
    }
    staffUserId = staff.id;

    // 2. Locate or create a FUTURE test show and seats (must be in the future for booking validation)
    let show = await prisma.show.findFirst({
      where: {
        startTime: { gt: new Date() },
      },
      include: {
        screen: {
          include: { seats: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    if (!show) {
      // Seed a minimal theatre, screen, movie, and show if none exist
      const movie = await prisma.movie.create({
        data: {
          title: 'Test Movie',
          description: 'A test film for automated test suite',
          durationMins: 120,
          language: 'English',
          genre: 'Action',
          posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
        },
      });

      const theatre = await prisma.theatre.create({
        data: {
          name: 'Test Theatre',
          city: 'Metropolis',
          address: '100 Main St',
        },
      });

      const screen = await prisma.screen.create({
        data: {
          theatreId: theatre.id,
          name: 'Test Screen',
          totalSeats: 10,
        },
      });

      for (let i = 1; i <= 10; i++) {
        await prisma.seat.create({
          data: {
            screenId: screen.id,
            rowName: 'A',
            seatNumber: i,
            category: 'SILVER',
            priceMultiplier: 1.0,
          },
        });
      }

      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 2);
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + 4);

      show = await prisma.show.create({
        data: {
          movieId: movie.id,
          screenId: screen.id,
          startTime,
          endTime,
          basePrice: 200,
        },
        include: {
          screen: { include: { seats: true } },
        },
      });
    }

    testShowId = show.id;
    availableSeatId1 = show.screen.seats[0].id;
    availableSeatId2 = show.screen.seats[1].id;
    availableSeatId3 = show.screen.seats[2].id;

    // Clean any prior holds or bookings by test users
    await prisma.seatHold.deleteMany({
      where: {
        userId: { in: [testUserId1, testUserId2] },
      },
    });
    const testBookings = await prisma.booking.findMany({
      where: {
        userId: { in: [testUserId1, testUserId2] },
      },
    });
    for (const tb of testBookings) {
      await prisma.payment.deleteMany({ where: { bookingId: tb.id } });
      await prisma.ticket.deleteMany({ where: { bookingId: tb.id } });
      await prisma.bookingSeat.deleteMany({ where: { bookingId: tb.id } });
      await prisma.booking.delete({ where: { id: tb.id } });
    }
  }, 45000);

  afterAll(async () => {
    await prisma.$disconnect();
  }, 15000);

  // ==========================================
  // Acceptance Test 1: An available seat can be held and booked for a show
  // ==========================================
  it('Acceptance Criterion 1: An available seat can be held and booked for a show', async () => {
    // Step A: Hold seat
    const holdResult = await SeatHoldService.holdSeats({
      showId: testShowId,
      seatIds: [availableSeatId1],
      userId: testUserId1,
    });

    expect(holdResult.holds).toHaveLength(1);
    expect(new Date(holdResult.expiresAt).getTime()).toBeGreaterThan(Date.now());

    // Step B: Book seat
    const booking = await BookingService.confirmBooking({
      showId: testShowId,
      seatIds: [availableSeatId1],
      userId: testUserId1,
    });

    expect(booking.status).toBe('CONFIRMED');
    expect(booking.bookingReference).toMatch(/^BK-/);
    expect(booking.ticket).toBeDefined();
    expect(booking.ticket.validationStatus).toBe('VALID');
  });

  // ==========================================
  // Acceptance Test 2: Concurrency & Double Booking Prevention
  // ==========================================
  it('Acceptance Criterion 2: The same seat cannot be confirmed to two users for one show (Race condition check)', async () => {
    // Attempt to book availableSeatId1 (which was already confirmed in Test 1 above) with a second user
    let conflictOccurred = false;

    try {
      await BookingService.confirmBooking({
        showId: testShowId,
        seatIds: [availableSeatId1],
        userId: testUserId2,
      });
    } catch (err: any) {
      conflictOccurred = true;
      expect(err.message).toMatch(/Double-booking prevented|already booked|already confirmed|reserved by another/i);
    }

    expect(conflictOccurred).toBe(true);

    // Now test concurrent hold collision on availableSeatId2
    await SeatHoldService.holdSeats({
      showId: testShowId,
      seatIds: [availableSeatId2],
      userId: testUserId1,
    });

    // User 2 attempts to hold availableSeatId2 while User 1 holds it
    let holdCollisionCaught = false;
    try {
      await SeatHoldService.holdSeats({
        showId: testShowId,
        seatIds: [availableSeatId2],
        userId: testUserId2,
      });
    } catch (err: any) {
      holdCollisionCaught = true;
      expect(err.message).toMatch(/held by another customer/i);
    }

    expect(holdCollisionCaught).toBe(true);
  });

  // ==========================================
  // Acceptance Test 3: Hold Expiry & Automatic Release
  // ==========================================
  it('Acceptance Criterion 3: Expired holds release the seat; confirmed bookings remain unavailable', async () => {
    // Create an artificially expired hold on availableSeatId3
    const expiredTimestamp = new Date(Date.now() - 60000); // 1 minute in the past
    await prisma.seatHold.upsert({
      where: {
        showId_seatId: {
          showId: testShowId,
          seatId: availableSeatId3,
        },
      },
      update: {
        expiresAt: expiredTimestamp,
        userId: testUserId1,
      },
      create: {
        showId: testShowId,
        seatId: availableSeatId3,
        userId: testUserId1,
        holdToken: 'expired-token',
        expiresAt: expiredTimestamp,
      },
    });

    // When querying seats status, expired hold must be cleaned up and seat must be AVAILABLE
    const { seats } = await SeatHoldService.getSeatsForShow(testShowId);
    const seat3Status = seats.find((s) => s.id === availableSeatId3);
    const seat1Status = seats.find((s) => s.id === availableSeatId1);

    // Expired seat must be released back to AVAILABLE
    expect(seat3Status?.status).toBe('AVAILABLE');

    // Confirmed booking seat must remain permanently BOOKED
    expect(seat1Status?.status).toBe('BOOKED');

    // Another user should now be able to hold and book seat3 without error
    const newHold = await SeatHoldService.holdSeats({
      showId: testShowId,
      seatIds: [availableSeatId3],
      userId: testUserId2,
    });
    expect(newHold.holds).toHaveLength(1);
  });

  // ==========================================
  // Acceptance Test 4: Single-Use QR Entry Validation
  // ==========================================
  it('Acceptance Criterion 4: A ticket reference/QR can be validated once in a simulated entry flow', async () => {
    // Create a fresh booking & ticket specifically for entry scan testing
    const booking = await BookingService.confirmBooking({
      showId: testShowId,
      seatIds: [availableSeatId3],
      userId: testUserId2,
    });

    expect(booking).toBeDefined();
    expect(booking.ticket).toBeDefined();
    const token = booking.ticket!.qrValidationToken;

    // Scan 1: First scan by staff must SUCCEED
    const scan1 = await TicketService.validateForEntry(token, staffUserId, 'staff@cinema.com');
    expect(scan1.valid).toBe(true);
    expect(scan1.status).toBe('VALID');
    expect(scan1.ticket.validationStatus).toBe('REDEEMED');

    // Scan 2: Second scan of the same ticket must be REJECTED (Already Redeemed)
    const scan2 = await TicketService.validateForEntry(token, staffUserId, 'staff@cinema.com');
    expect(scan2.valid).toBe(false);
    expect(scan2.status).toBe('ALREADY_REDEEMED');
    expect(scan2.message).toMatch(/ALREADY REDEEMED/i);
  });

  // ==========================================
  // Acceptance Test 5: Admin Occupancy Report & Reconciliation
  // ==========================================
  it('Acceptance Criterion 5: The admin occupancy report matches bookings and cancellations', async () => {
    const report = await ReportingService.getOccupancyAndReconciliation();

    expect(report.summary).toBeDefined();
    expect(report.shows.length).toBeGreaterThan(0);

    // Every single show in the system must mathematically reconcile:
    // bookedSeats + heldSeats + availableSeats === totalCapacity
    expect(report.summary.allShowsReconciled).toBe(true);

    const showReport = report.shows.find((s) => s.showId === testShowId);
    expect(showReport).toBeDefined();
    expect(showReport!.isReconciled).toBe(true);
    expect(showReport!.totalCapacity).toBe(
      showReport!.bookedSeatsCount + showReport!.heldSeatsCount + showReport!.availableSeatsCount
    );
  });
});
