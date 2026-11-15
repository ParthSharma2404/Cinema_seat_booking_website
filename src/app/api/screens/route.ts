import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logAuditEvent } from '@/server/services/auditService';

export async function GET() {
  try {
    const screens = await prisma.screen.findMany({
      where: {
        theatre: { name: { not: 'Test Theatre' } },
      },
      include: {
        theatre: true,
        _count: {
          select: { seats: true, shows: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ screens });
  } catch (error: any) {
    console.error('Fetch screens error:', error);
    return NextResponse.json({ error: 'Failed to fetch screens' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['ADMIN']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const { name, theatreId, rowCount = 8, seatsPerRow = 10, defaultFormat = 'IMAX' } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Auditorium name is required' }, { status: 400 });
    }

    // Determine target theatre
    let targetTheatreId = theatreId;
    if (!targetTheatreId) {
      const defaultTheatre = await prisma.theatre.findFirst({
        where: { name: { not: 'Test Theatre' } },
      });
      if (!defaultTheatre) {
        return NextResponse.json({ error: 'No theatre available' }, { status: 400 });
      }
      targetTheatreId = defaultTheatre.id;
    }

    const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].slice(0, Math.min(rowCount, 10));
    const totalSeats = rowLetters.length * seatsPerRow;

    const screen = await prisma.$transaction(async (tx) => {
      const newScreen = await tx.screen.create({
        data: {
          theatreId: targetTheatreId,
          name: name.trim(),
          totalSeats,
        },
      });

      // Populate seats with realistic amphitheater tiering:
      // Front 2 rows: SILVER (1.0x)
      // Middle rows: GOLD (1.3x)
      // Back 2 rows: VIP_RECLINER (1.8x)
      const seatRecords = [];
      for (let rIdx = 0; rIdx < rowLetters.length; rIdx++) {
        const row = rowLetters[rIdx];
        let category = 'GOLD';
        let priceMultiplier = 1.3;

        if (rIdx < 2) {
          category = 'SILVER';
          priceMultiplier = 1.0;
        } else if (rIdx >= rowLetters.length - 2) {
          category = 'VIP_RECLINER';
          priceMultiplier = 1.8;
        }

        for (let num = 1; num <= seatsPerRow; num++) {
          seatRecords.push({
            screenId: newScreen.id,
            rowName: row,
            seatNumber: num,
            category,
            priceMultiplier,
          });
        }
      }

      await tx.seat.createMany({
        data: seatRecords,
      });

      return newScreen;
    }, { maxWait: 15000, timeout: 30000 });

    await logAuditEvent({
      actorId: auth.user.userId,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: 'AUDITORIUM_CREATED',
      targetEntity: 'Screen',
      targetId: screen.id,
      details: {
        name: screen.name,
        totalSeats,
        rowCount: rowLetters.length,
      },
    });

    return NextResponse.json(
      {
        message: 'Auditorium created successfully',
        screen,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create screen error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create auditorium' },
      { status: 500 }
    );
  }
}
