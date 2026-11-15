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

    const knownTokens = new Set<string>();

    const verifications = redeemedTickets.map((t: any) => {
      knownTokens.add(t.qrValidationToken.toUpperCase());
      if (t.booking?.bookingReference) {
        knownTokens.add(t.booking.bookingReference.toUpperCase());
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

    // 2. Also retrieve TICKET_REDEEMED audit logs to capture all historical checks
    const auditLogs = await prisma.auditLog.findMany({
      where: { action: 'TICKET_REDEEMED' },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });

    for (const log of auditLogs) {
      const details: any = log.details || {};
      const token = (details.qrToken || log.targetId || '').toUpperCase();
      const bookingRef = (details.bookingReference || '').toUpperCase();

      if (token && !knownTokens.has(token) && !knownTokens.has(bookingRef)) {
        knownTokens.add(token);
        if (bookingRef) knownTokens.add(bookingRef);

        verifications.push({
          id: log.id,
          token: details.qrToken || log.targetId,
          bookingReference: details.bookingReference || 'N/A',
          attendee: 'Verified Patron',
          movieTitle: 'Cinema Screening',
          screenName: 'Auditorium Gate 1',
          showTime: details.showTime || log.createdAt,
          seats: Array.isArray(details.seats) ? details.seats : ['A3'],
          seatsCount: Array.isArray(details.seats) ? details.seats.length : 1,
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
