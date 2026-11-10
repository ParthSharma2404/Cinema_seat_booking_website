import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { BookingService } from '@/server/services/bookingService';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const bookings = await BookingService.getUserBookings(auth.user.userId);
    return NextResponse.json({ bookings });
  } catch (error: any) {
    console.error('Fetch user bookings error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
