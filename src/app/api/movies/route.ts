import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { createMovieSchema } from '@/server/validations/schemas';
import { logAuditEvent } from '@/server/services/auditService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const genre = searchParams.get('genre') || '';
    const language = searchParams.get('language') || '';

    const movies = await prisma.movie.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { title: { contains: search } },
                  { description: { contains: search } },
                ],
              }
            : {},
          genre ? { genre: { contains: genre } } : {},
          language ? { language: { equals: language } } : {},
        ],
      },
      include: {
        shows: {
          where: {
            startTime: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
          },
          orderBy: { startTime: 'asc' },
          include: {
            screen: {
              include: { theatre: true },
            },
          },
        },
      },
      orderBy: { releaseDate: 'desc' },
    });

    return NextResponse.json({ movies });
  } catch (error: any) {
    console.error('Fetch movies error:', error);
    return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['ADMIN', 'STAFF']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const validated = createMovieSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const movie = await prisma.movie.create({
      data: {
        ...validated.data,
        releaseDate: validated.data.releaseDate ? new Date(validated.data.releaseDate) : new Date(),
      },
    });

    await logAuditEvent({
      actorId: auth.user.userId,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: 'MOVIE_CREATED',
      targetEntity: 'Movie',
      targetId: movie.id,
      details: { title: movie.title },
    });

    return NextResponse.json({ movie }, { status: 201 });
  } catch (error: any) {
    console.error('Create movie error:', error);
    return NextResponse.json({ error: 'Failed to create movie' }, { status: 500 });
  }
}

