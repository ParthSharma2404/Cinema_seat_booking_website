import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logAuditEvent } from '@/server/services/auditService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const screen = await prisma.screen.findUnique({
      where: { id },
      include: {
        theatre: true,
        seats: {
          orderBy: [{ rowName: 'asc' }, { seatNumber: 'asc' }],
        },
        shows: {
          orderBy: { startTime: 'asc' },
          include: { movie: true },
        },
      },
    });

    if (!screen) {
      return NextResponse.json({ error: 'Screen not found' }, { status: 404 });
    }

    return NextResponse.json({ screen });
  } catch (error: any) {
    console.error('Fetch screen error:', error);
    return NextResponse.json({ error: 'Failed to fetch screen details' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ['ADMIN']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const { id: screenId } = await params;
    const body = await request.json();
    const { name, rowUpdates, seatUpdates, tierMultipliers } = body;

    const existingScreen = await prisma.screen.findUnique({
      where: { id: screenId },
      include: { seats: true },
    });

    if (!existingScreen) {
      return NextResponse.json({ error: 'Auditorium not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update Screen Name if provided
      if (name && typeof name === 'string' && name.trim() !== existingScreen.name) {
        await tx.screen.update({
          where: { id: screenId },
          data: { name: name.trim() },
        });
      }

      // 2. Batch update entire rows (e.g. Row 'C' to 'VIP_RECLINER' with multiplier 1.8)
      if (Array.isArray(rowUpdates) && rowUpdates.length > 0) {
        for (const update of rowUpdates) {
          if (update.rowName && update.category) {
            const mult =
              update.priceMultiplier !== undefined
                ? Number(update.priceMultiplier)
                : update.category === 'VIP_RECLINER'
                ? 1.8
                : update.category === 'GOLD'
                ? 1.3
                : 1.0;

            await tx.seat.updateMany({
              where: {
                screenId,
                rowName: update.rowName,
              },
              data: {
                category: update.category,
                priceMultiplier: mult,
              },
            });
          }
        }
      }

      // 3. Update individual seats (e.g. single seat category/multiplier change)
      if (Array.isArray(seatUpdates) && seatUpdates.length > 0) {
        for (const seatUpdate of seatUpdates) {
          if (seatUpdate.id) {
            const data: any = {};
            if (seatUpdate.category) data.category = seatUpdate.category;
            if (seatUpdate.priceMultiplier !== undefined) {
              data.priceMultiplier = Number(seatUpdate.priceMultiplier);
            } else if (seatUpdate.category) {
              data.priceMultiplier =
                seatUpdate.category === 'VIP_RECLINER'
                  ? 1.8
                  : seatUpdate.category === 'GOLD'
                  ? 1.3
                  : 1.0;
            }

            await tx.seat.update({
              where: { id: seatUpdate.id },
              data,
            });
          }
        }
      }

      // 4. Update global tier multipliers for this screen (e.g. adjust all VIP to 2.0x)
      if (tierMultipliers && typeof tierMultipliers === 'object') {
        for (const [tier, mult] of Object.entries(tierMultipliers)) {
          if (typeof mult === 'number' && mult > 0) {
            await tx.seat.updateMany({
              where: {
                screenId,
                category: tier,
              },
              data: {
                priceMultiplier: mult,
              },
            });
          }
        }
      }
    }, { maxWait: 15000, timeout: 30000 });

    // Fetch refreshed screen with updated seats
    const updatedScreen = await prisma.screen.findUnique({
      where: { id: screenId },
      include: {
        theatre: true,
        seats: {
          orderBy: [{ rowName: 'asc' }, { seatNumber: 'asc' }],
        },
      },
    });

    await logAuditEvent({
      actorId: auth.user.userId,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: 'AUDITORIUM_LAYOUT_UPDATED',
      targetEntity: 'Screen',
      targetId: screenId,
      details: { screenName: existingScreen.name },
    });

    return NextResponse.json({
      message: 'Auditorium seating layout updated successfully',
      screen: updatedScreen,
    });
  } catch (error: any) {
    console.error('Update screen error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update auditorium layout' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ['ADMIN']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const { id: screenId } = await params;

    const screen = await prisma.screen.findUnique({
      where: { id: screenId },
      include: {
        shows: {
          include: {
            bookings: { where: { status: 'CONFIRMED' } },
          },
        },
      },
    });

    if (!screen) {
      return NextResponse.json({ error: 'Auditorium not found' }, { status: 404 });
    }

    const hasConfirmedBookings = screen.shows.some((s) => s.bookings.length > 0);
    if (hasConfirmedBookings) {
      return NextResponse.json(
        { error: 'Cannot delete auditorium with active bookings. Cancel or reschedule shows first.' },
        { status: 400 }
      );
    }

    await prisma.screen.delete({
      where: { id: screenId },
    });

    await logAuditEvent({
      actorId: auth.user.userId,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: 'AUDITORIUM_DELETED',
      targetEntity: 'Screen',
      targetId: screenId,
      details: { screenName: screen.name },
    });

    return NextResponse.json({ message: 'Auditorium deleted successfully' });
  } catch (error: any) {
    console.error('Delete screen error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete auditorium' },
      { status: 500 }
    );
  }
}
