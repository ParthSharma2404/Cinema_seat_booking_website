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
    const show = await prisma.show.findUnique({
      where: { id },
      include: {
        movie: true,
        screen: { include: { theatre: true, seats: true } },
      },
    });

    if (!show) {
      return NextResponse.json({ error: 'Show not found' }, { status: 404 });
    }

    return NextResponse.json({ show });
  } catch (error: any) {
    console.error('Fetch show error:', error);
    return NextResponse.json({ error: 'Failed to fetch show' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ['ADMIN', 'STAFF']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const existingShow = await prisma.show.findUnique({ where: { id } });
    if (!existingShow) {
      return NextResponse.json({ error: 'Show not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.startTime) updateData.startTime = new Date(body.startTime);
    if (body.endTime) updateData.endTime = new Date(body.endTime);
    if (body.basePrice !== undefined) updateData.basePrice = Number(body.basePrice);
    if (body.format) updateData.format = body.format;
    if (body.screenId) updateData.screenId = body.screenId;
    if (body.movieId) updateData.movieId = body.movieId;

    const updatedShow = await prisma.show.update({
      where: { id },
      data: updateData,
      include: {
        movie: true,
        screen: { include: { theatre: true } },
      },
    });

    await logAuditEvent({
      actorId: auth.user.userId,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: 'SHOW_UPDATED',
      targetEntity: 'Show',
      targetId: id,
      details: {
        movieTitle: updatedShow.movie.title,
        startTime: updatedShow.startTime.toISOString(),
      },
    });

    return NextResponse.json({
      message: 'Show updated successfully',
      show: updatedShow,
    });
  } catch (error: any) {
    console.error('Update show error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update show' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ['ADMIN', 'STAFF']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const { id } = await params;

    const existingShow = await prisma.show.findUnique({
      where: { id },
      include: { movie: true },
    });

    if (!existingShow) {
      return NextResponse.json({ error: 'Show not found' }, { status: 404 });
    }

    // Delete show (cascade will clean up holds, bookings handled gracefully)
    await prisma.show.delete({
      where: { id },
    });

    await logAuditEvent({
      actorId: auth.user.userId,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: 'SHOW_DELETED',
      targetEntity: 'Show',
      targetId: id,
      details: {
        movieTitle: existingShow.movie.title,
      },
    });

    return NextResponse.json({
      message: 'Show deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete show error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete show' },
      { status: 500 }
    );
  }
}

