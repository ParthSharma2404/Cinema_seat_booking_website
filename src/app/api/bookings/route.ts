import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { BookingService } from '@/server/services/bookingService';
import { createBookingSchema } from '@/server/validations/schemas';

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

    return NextResponse.json(
      {
        message: 'Booking confirmed successfully',
        booking,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Confirm booking error:', error);
    // Double booking or conflict
    return NextResponse.json(
      { error: error.message || 'Failed to confirm booking' },
      { status: 409 }
    );
  }
}

