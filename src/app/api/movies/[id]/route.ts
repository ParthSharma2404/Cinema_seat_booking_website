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
    const movie = await prisma.movie.findUnique({
      where: { id },
      include: {
        shows: {
          where: {
            startTime: { gt: new Date() },
          },
          orderBy: { startTime: 'asc' },
          include: {
            screen: {
              include: { theatre: true },
            },
          },
        },
      },
    });

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    return NextResponse.json({ movie });
  } catch (error: any) {
    console.error('Fetch movie error:', error);
    return NextResponse.json({ error: 'Failed to fetch movie' }, { status: 500 });
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
    const { id } = await params;
    await prisma.movie.delete({ where: { id } });

    await logAuditEvent({
      actorId: auth.user.userId,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: 'MOVIE_DELETED',
      targetEntity: 'Movie',
      targetId: id,
    });

    return NextResponse.json({ message: 'Movie deleted successfully' });
  } catch (error: any) {
    console.error('Delete movie error:', error);
    return NextResponse.json({ error: 'Failed to delete movie' }, { status: 500 });
  }
}

