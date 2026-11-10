import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { BookingService } from '@/server/services/bookingService';
import { cancelBookingSchema } from '@/server/validations/schemas';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const { id: bookingId } = await params;
    const body = await request.json();
    const validated = cancelBookingSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { reason } = validated.data;

    const cancelledBooking = await BookingService.cancelBooking({
      bookingId,
      userId: auth.user.userId,
      userRole: auth.user.role,
      reason,
    });

    return NextResponse.json({
      message: 'Booking cancelled successfully. Simulated refund completed.',
      booking: cancelledBooking,
    });
  } catch (error: any) {
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel booking' },
      { status: 400 }
    );
  }
}
