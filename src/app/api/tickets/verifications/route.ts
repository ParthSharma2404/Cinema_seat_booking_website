import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ['STAFF', 'ADMIN']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // 1. Fetch tickets currently marked as REDEEMED
    const redeemedTickets = await prisma.ticket.findMany({
      where: {
        validationStatus: 'REDEEMED',
      },
      orderBy: {
        redeemedAt: 'desc',
      },
      take: Math.min(limit, 100),
      include: {
        booking: {
          include: {
            user: { select: { fullName: true, email: true } },
            show: {
              include: {
                movie: { select: { title: true, posterUrl: true } },
                screen: { select: { name: true } },
              },
            },
            bookingSeats: {
              include: {
                seat: { select: { rowName: true, seatNumber: true, category: true } },
              },
            },
          },
        },
      },
    });

    const knownIds = new Set<string>();
    const knownTokens = new Set<string>();
    const knownRefs = new Set<string>();

    const verifications = redeemedTickets.map((t: any) => {
      knownIds.add(t.id);
      knownTokens.add(t.qrValidationToken.toUpperCase());
      if (t.booking?.bookingReference) {
        knownRefs.add(t.booking.bookingReference.toUpperCase());
      }

      return {
        id: t.id,
        token: t.qrValidationToken,
        bookingReference: t.booking?.bookingReference || 'N/A',
        attendee: t.booking?.user?.fullName || t.booking?.user?.email || 'Cinema Patron',
        movieTitle: t.booking?.show?.movie?.title || 'Cinema Screening',
        screenName: t.booking?.show?.screen?.name || 'Screen 1',
        showTime: t.booking?.show?.startTime || t.createdAt,
        seats: (t.booking?.bookingSeats || []).map(
          (bs: any) => `${bs.seat?.rowName || ''}${bs.seat?.seatNumber || ''}`
        ),
        seatsCount: t.booking?.bookingSeats?.length || 0,
        status: 'VERIFIED',
        valid: true,
        redeemedAt: t.redeemedAt || t.createdAt,
        operatorEmail: 'Gate Staff',
      };
    });

    // 2. Retrieve TICKET_REDEEMED audit logs only for historical/orphaned logs not in Ticket table
    const auditLogs = await prisma.auditLog.findMany({
      where: { action: 'TICKET_REDEEMED' },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });

    for (const log of auditLogs) {
      let details: any = {};
      try {
        details = typeof log.details === 'string' ? JSON.parse(log.details) : (log.details || {});
      } catch {
        details = {};
      }

      const targetId = log.targetId || '';
      const token = (details.qrToken || '').toUpperCase();
      const bookingRef = (details.bookingReference || '').toUpperCase();

      // If this redemption is already captured by a real ticket record, skip duplicate
      if (
        (targetId && knownIds.has(targetId)) ||
        (token && knownTokens.has(token)) ||
        (bookingRef && knownRefs.has(bookingRef))
      ) {
        continue;
      }

      if (token || targetId) {
        knownIds.add(targetId);
        if (token) knownTokens.add(token);
        if (bookingRef) knownRefs.add(bookingRef);

        verifications.push({
          id: log.id,
          token: details.qrToken || log.targetId,
          bookingReference: details.bookingReference || 'N/A',
          attendee: details.attendee || 'Verified Patron',
          movieTitle: details.movieTitle || 'Cinema Screening',
          screenName: details.screenName || 'Auditorium Gate 1',
          showTime: details.showTime || log.createdAt,
          seats: Array.isArray(details.seats) ? details.seats : [],
          seatsCount: Array.isArray(details.seats) ? details.seats.length : 0,
          status: 'VERIFIED',
          valid: true,
          redeemedAt: log.createdAt,
          operatorEmail: log.actorEmail || 'Gate Staff',
        });
      }
    }

    // Sort combined verifications chronologically (newest first)
    verifications.sort(
      (a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime()
    );

    return NextResponse.json({
      verifications: verifications.slice(0, limit),
      total: verifications.length,
    });
  } catch (error: any) {
    console.error('Fetch ticket verifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket verifications' },
      { status: 500 }
    );
  }
}
