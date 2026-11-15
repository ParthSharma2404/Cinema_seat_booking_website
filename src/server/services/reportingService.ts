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

    // 2. Fetch all shows with details, ordered chronologically (upcoming first)
    const shows = await prisma.show.findMany({
      orderBy: { startTime: 'asc' },
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

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

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

    // Calculate Today's Screenings Metrics
    const todayShows = showReports.filter(
      (s) => new Date(s.startTime) >= startOfToday && new Date(s.startTime) <= endOfToday
    );
    const todayCapacity = todayShows.reduce((acc, s) => acc + s.totalCapacity, 0);
    const todayBookedSeats = todayShows.reduce((acc, s) => acc + s.bookedSeatsCount, 0);
    const todayHeldSeats = todayShows.reduce((acc, s) => acc + s.heldSeatsCount, 0);
    const todayOccupancyRate =
      todayCapacity > 0 ? Number(((todayBookedSeats / todayCapacity) * 100).toFixed(1)) : 0;

    // Calculate Active Shows (screenings with at least 1 booking or hold)
    const activeShows = showReports.filter((s) => s.bookedSeatsCount > 0 || s.heldSeatsCount > 0);
    const activeShowsCapacity = activeShows.reduce((acc, s) => acc + s.totalCapacity, 0);
    const activeShowsBooked = activeShows.reduce((acc, s) => acc + s.bookedSeatsCount, 0);
    const activeShowsOccupancyRate =
      activeShowsCapacity > 0 ? Number(((activeShowsBooked / activeShowsCapacity) * 100).toFixed(1)) : 0;

    // Calculate Catalog-wide 7-day Occupancy Rate (never round to 0 when bookedSeats > 0)
    const rawRate = overallTotalSeats > 0 ? (overallBookedSeats / overallTotalSeats) * 100 : 0;
    const overallOccupancyRate =
      rawRate > 0 && rawRate < 0.1
        ? Number(rawRate.toFixed(2))
        : Number(rawRate.toFixed(1));

    return {
      summary: {
        totalShows: shows.length,
        totalCapacity: overallTotalSeats,
        totalBookedSeats: overallBookedSeats,
        totalHeldSeats: overallHeldSeats,
        totalAvailableSeats: Math.max(0, overallTotalSeats - overallBookedSeats - overallHeldSeats),
        occupancyRate: overallOccupancyRate,
        todayShowsCount: todayShows.length,
        todayCapacity,
        todayBookedSeats,
        todayHeldSeats,
        todayOccupancyRate,
        activeShowsCount: activeShows.length,
        activeShowsCapacity,
        activeShowsBooked,
        activeShowsOccupancyRate,
        grossRevenue: overallGrossRevenue,
        totalRefunds: overallRefunds,
        netRevenue: overallNetRevenue,
        allShowsReconciled: showReports.every((s) => s.isReconciled),
      },
      shows: showReports,
    };
  }
}
