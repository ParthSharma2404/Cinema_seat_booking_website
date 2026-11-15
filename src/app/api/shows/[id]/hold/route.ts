import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { SeatHoldService } from '@/server/services/seatHoldService';
import { holdSeatsSchema, releaseHoldSchema } from '@/server/validations/schemas';
import { broadcastSeatEvent } from '@/lib/ws-bus';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const { id: showId } = await params;
    const body = await request.json();

    const validated = holdSeatsSchema.safeParse({
      ...body,
      showId,
    });

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { seatIds, holdToken } = validated.data;

    const result = await SeatHoldService.holdSeats({
      showId,
      seatIds,
      userId: auth.user.userId,
      holdToken,
    });

    // Broadcast instant real-time update via WebSocket
    broadcastSeatEvent({
      showId,
      type: 'SEAT_HELD',
      seatIds,
      userId: auth.user.userId,
      expiresAt: result.expiresAt.toISOString(),
    });

    return NextResponse.json({
      message: 'Seats held successfully',
      heldCount: result.holds.length,
      expiresAt: result.expiresAt,
    });
  } catch (error: any) {
    console.error('Hold seats error:', error);
    let friendlyMessage = error.message || 'Failed to hold seats';
    if (
      error.code === 'P2002' ||
      friendlyMessage.includes('Unique constraint') ||
      friendlyMessage.includes('prisma.') ||
      friendlyMessage.includes('foreign key') ||
      friendlyMessage.includes('invocation:')
    ) {
      friendlyMessage =
        'One or more of your selected seats were just claimed by another cinema guest. Please choose different seats.';
    }
    return NextResponse.json(
      { error: friendlyMessage },
      { status: 409 } // Conflict
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const { id: showId } = await params;
    const body = await request.json();

    const validated = releaseHoldSchema.safeParse({
      ...body,
      showId,
    });

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { seatIds } = validated.data;

    const result = await SeatHoldService.releaseSeats({
      showId,
      seatIds,
      userId: auth.user.userId,
    });

    // Broadcast instant real-time update via WebSocket
    broadcastSeatEvent({
      showId,
      type: 'SEAT_RELEASED',
      seatIds,
      userId: auth.user.userId,
    });

    return NextResponse.json({
      message: 'Seats released successfully',
      releasedCount: result.releasedCount,
    });
  } catch (error: any) {
    console.error('Release seats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to release seats' },
      { status: 500 }
    );
  }
}

