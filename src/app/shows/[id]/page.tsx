import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export default async function ShowRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const show = await prisma.show.findUnique({
    where: { id },
    select: { id: true, movieId: true },
  });

  if (!show) {
    redirect('/');
  }

  // Redirect directly to the unified Movie Details & Seating page
  redirect(`/movies/${show.movieId}?showId=${show.id}`);
}
