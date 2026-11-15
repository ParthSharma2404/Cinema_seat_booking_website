import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logAuditEvent } from '@/server/services/auditService';
import { createMovieSchema } from '@/server/validations/schemas';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movie = await prisma.movie.findUnique({
      where: { id },
      include: {
        cast: {
          orderBy: { order: 'asc' },
        },
        shows: {
          where: {
            startTime: { gte: new Date(Date.now() - 4 * 60 * 60 * 1000) },
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

    // Partial validation of movie schema
    const updateSchema = createMovieSchema.partial();
    const validated = updateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { cast, releaseDate, ...movieFields } = validated.data;

    // Check movie exists
    const existing = await prisma.movie.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    const updatedMovie = await prisma.$transaction(async (tx) => {
      // Update movie fields
      const movie = await tx.movie.update({
        where: { id },
        data: {
          ...movieFields,
          ...(releaseDate ? { releaseDate: new Date(releaseDate) } : {}),
        },
      });

      // If cast is explicitly provided, replace existing cast
      if (cast !== undefined) {
        await tx.castMember.deleteMany({ where: { movieId: id } });
        if (cast.length > 0) {
          await tx.castMember.createMany({
            data: cast.map((c, idx) => ({
              movieId: id,
              name: c.name,
              character: c.character,
              photoUrl: c.photoUrl || null,
              order: c.order ?? idx,
            })),
          });
        }
      }

      return tx.movie.findUnique({
        where: { id },
        include: {
          cast: {
            orderBy: { order: 'asc' },
          },
        },
      });
    }, { maxWait: 15000, timeout: 30000 });

    await logAuditEvent({
      actorId: auth.user.userId,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: 'MOVIE_UPDATED',
      targetEntity: 'Movie',
      targetId: id,
      details: { title: updatedMovie?.title },
    });

    return NextResponse.json({ movie: updatedMovie });
  } catch (error: any) {
    console.error('Update movie error:', error);
    return NextResponse.json({ error: 'Failed to update movie' }, { status: 500 });
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

    // Safety check: protect real customer bookings & financial records
    const bookingsCount = await prisma.booking.count({
      where: {
        show: {
          movieId: id,
        },
      },
    });

    if (bookingsCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete movie: There are ${bookingsCount} customer booking(s) associated with its shows. Please cancel/refund those bookings first before removing the movie.`,
        },
        { status: 400 }
      );
    }

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
