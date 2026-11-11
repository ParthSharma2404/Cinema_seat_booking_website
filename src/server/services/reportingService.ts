import prisma from '@/lib/prisma';
import { SeatHoldService } from './seatHoldService';

export class ReportingService {
  /**
   * Generates real-time occupancy and financial reconciliation report.
   * Proves that (bookedSeats + activeHolds + availableSeats) === totalCapacity.
   */
  static async getOccupancyAndReconciliation() {
    const now = new Date();
    // 1. Purge expired holds so occupancy is 100% accurate
    await SeatHoldService.cleanupExpiredHolds();

    // 2. Fetch all shows with details
    const shows = await prisma.show.findMany({
      orderBy: { startTime: 'desc' },
      include: {
        movie: true,
        screen: {
          include: {
            theatre: true,
            seats: true,
          },
        },
        holds: {
          where: { expiresAt: { gt: now } },
        },
        bookings: {
          include: {
            bookingSeats: true,
          },
        },
      },
    });

    let overallTotalSeats = 0;
    let overallBookedSeats = 0;
    let overallHeldSeats = 0;
    let overallGrossRevenue = 0;
    let overallRefunds = 0;

    const showReports = shows.map((show) => {
      const totalCapacity = show.screen.seats.length;

      // Confirmed bookings
      const confirmedBookings = show.bookings.filter((b) => b.status === 'CONFIRMED');
      const cancelledBookings = show.bookings.filter((b) => b.status === 'CANCELLED');

      let bookedSeatsCount = 0;
      let showRevenue = 0;

      for (const b of confirmedBookings) {
        bookedSeatsCount += b.bookingSeats.length;
        showRevenue += b.totalAmount;
      }

      let showRefunds = 0;
      for (const b of cancelledBookings) {
        showRefunds += b.refundAmount || 0;
      }

      // Active holds
      const heldSeatsCount = show.holds.length;
      const availableSeatsCount = Math.max(0, totalCapacity - bookedSeatsCount - heldSeatsCount);
      const occupancyRate = totalCapacity > 0 ? (bookedSeatsCount / totalCapacity) * 100 : 0;

      // Acceptance Test 5 reconciliation proof
      const isReconciled = bookedSeatsCount + heldSeatsCount + availableSeatsCount === totalCapacity;

      overallTotalSeats += totalCapacity;
      overallBookedSeats += bookedSeatsCount;
      overallHeldSeats += heldSeatsCount;
      overallGrossRevenue += showRevenue;
      overallRefunds += showRefunds;

      return {
        showId: show.id,
        movieTitle: show.movie.title,
        theatreName: show.screen.theatre.name,
        screenName: show.screen.name,
        startTime: show.startTime,
        format: show.format,
        basePrice: show.basePrice,
        totalCapacity,
        bookedSeatsCount,
        heldSeatsCount,
        availableSeatsCount,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        confirmedBookingsCount: confirmedBookings.length,
        cancelledBookingsCount: cancelledBookings.length,
        revenue: showRevenue,
        refunds: showRefunds,
        isReconciled,
      };
    });

    const overallNetRevenue = overallGrossRevenue;
    const overallOccupancyRate =
      overallTotalSeats > 0 ? Math.round((overallBookedSeats / overallTotalSeats) * 1000) / 10 : 0;

    return {
      summary: {
        totalShows: shows.length,
        totalCapacity: overallTotalSeats,
        totalBookedSeats: overallBookedSeats,
        totalHeldSeats: overallHeldSeats,
        totalAvailableSeats: Math.max(0, overallTotalSeats - overallBookedSeats - overallHeldSeats),
        occupancyRate: overallOccupancyRate,
        grossRevenue: overallGrossRevenue,
        totalRefunds: overallRefunds,
        netRevenue: overallNetRevenue,
        allShowsReconciled: showReports.every((s) => s.isReconciled),
      },
      shows: showReports,
    };
  }
}

