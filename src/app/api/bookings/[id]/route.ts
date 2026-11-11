import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const { id } = await params;
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id }, { bookingReference: id }],
      },
      include: {
        show: {
          include: {
            movie: true,
            screen: { include: { theatre: true } },
          },
        },
        bookingSeats: {
          include: { seat: true },
        },
        ticket: true,
        payments: true,
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Role check: customer can only view their own bookings
    if (auth.user.role === 'CUSTOMER' && booking.userId !== auth.user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ booking });
  } catch (error: any) {
    console.error('Fetch booking error:', error);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

