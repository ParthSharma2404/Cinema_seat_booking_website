import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { createShowSchema } from '@/server/validations/schemas';
import { logAuditEvent } from '@/server/services/auditService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get('movieId');
    const date = searchParams.get('date');
    const all = searchParams.get('all') === 'true';

    const whereClause: any = {};

    if (!all && !date) {
      whereClause.startTime = { gte: new Date(Date.now() - 4 * 60 * 60 * 1000) };
    }

    if (movieId) {
      whereClause.movieId = movieId;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const shows = await prisma.show.findMany({
      where: whereClause,
      include: {
        movie: true,
        screen: {
          include: { theatre: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json({ shows });
  } catch (error: any) {
    console.error('Fetch shows error:', error);
    return NextResponse.json({ error: 'Failed to fetch shows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['ADMIN', 'STAFF']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const validated = createShowSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { movieId, screenId, startTime, endTime, basePrice, format } = validated.data;

    // Verify screen exists
    const screen = await prisma.screen.findUnique({ where: { id: screenId } });
    if (!screen) {
      return NextResponse.json({ error: 'Screen not found' }, { status: 404 });
    }

    // Check for scheduling conflicts on the same screen
    const conflictingShow = await prisma.show.findFirst({
      where: {
        screenId,
        OR: [
          {
            startTime: { lte: new Date(startTime) },
            endTime: { gte: new Date(startTime) },
          },
          {
            startTime: { lte: new Date(endTime) },
            endTime: { gte: new Date(endTime) },
          },
        ],
      },
    });

    if (conflictingShow) {
      return NextResponse.json(
        { error: 'Scheduling conflict: Screen is already booked for another show during this time window' },
        { status: 409 }
      );
    }

    const show = await prisma.show.create({
      data: {
        movieId,
        screenId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        basePrice,
        format,
      },
      include: {
        movie: true,
        screen: { include: { theatre: true } },
      },
    });

    await logAuditEvent({
      actorId: auth.user.userId,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: 'SHOW_SCHEDULED',
      targetEntity: 'Show',
      targetId: show.id,
      details: {
        movieId,
        screenId,
        startTime,
        basePrice,
      },
    });

    return NextResponse.json({ show }, { status: 201 });
  } catch (error: any) {
    console.error('Create show error:', error);
    return NextResponse.json({ error: 'Failed to schedule show' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request, ['ADMIN', 'STAFF']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const ids: string[] = body.showIds || body.ids || [];
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No screening IDs provided' }, { status: 400 });
    }

    const deleteResult = await prisma.show.deleteMany({
      where: { id: { in: ids } },
    });

    await logAuditEvent({
      actorId: auth.user.userId,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: 'SHOWS_BATCH_DELETED',
      targetEntity: 'Show',
      details: {
        deletedCount: deleteResult.count,
        showIds: ids,
      },
    });

    return NextResponse.json({
      message: `Successfully removed ${deleteResult.count} screening(s)`,
      count: deleteResult.count,
    });
  } catch (error: any) {
    console.error('Batch delete shows error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete selected screenings' },
      { status: 500 }
    );
  }
}

