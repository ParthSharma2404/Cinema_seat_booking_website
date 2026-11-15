import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { BookingService } from '@/server/services/bookingService';
import { createBookingSchema } from '@/server/validations/schemas';
import { broadcastSeatEvent } from '@/lib/ws-bus';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const validated = createBookingSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { showId, seatIds } = validated.data;
    const paymentMethod = body.paymentMethod || 'SIMULATED_CARD';

    const booking = await BookingService.confirmBooking({
      showId,
      seatIds,
      userId: auth.user.userId,
      paymentMethod,
    });

    // Broadcast instant real-time update via WebSocket
    broadcastSeatEvent({
      showId,
      type: 'SEAT_BOOKED',
      seatIds,
      userId: auth.user.userId,
    });

    return NextResponse.json(
      {
        message: 'Booking confirmed successfully',
        booking,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Confirm booking error:', error);
    let friendlyMessage = error.message || 'Failed to confirm booking';
    if (
      error.code === 'P2002' ||
      friendlyMessage.includes('Unique constraint') ||
      friendlyMessage.includes('activeShowSeatKey') ||
      friendlyMessage.includes('prisma.')
    ) {
      friendlyMessage =
        'One or more of the selected seats were already booked by another guest. Please choose different seats.';
    }
    return NextResponse.json(
      { error: friendlyMessage },
      { status: 409 }
    );
  }
}

