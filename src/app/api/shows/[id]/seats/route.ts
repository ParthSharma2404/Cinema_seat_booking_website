import { NextRequest, NextResponse } from 'next/server';
import { SeatHoldService } from '@/server/services/seatHoldService';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showId } = await params;
    const session = await getSessionUser();
    const currentUserId = session?.userId;

    const data = await SeatHoldService.getSeatsForShow(showId, currentUserId);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Fetch show seats error:', error);
    if (error.message === 'Show not found') {
      return NextResponse.json({ error: 'Show not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to fetch seats status' },
      { status: 500 }
    );
  }
}

