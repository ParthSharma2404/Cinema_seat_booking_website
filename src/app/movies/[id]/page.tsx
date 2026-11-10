'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Film, Clock, Star, Calendar, ArrowLeft, Armchair, Ticket } from 'lucide-react';
import { formatCurrency, formatDateTime, formatTime } from '@/lib/utils';

interface MovieDetail {
  id: string;
  title: string;
  description: string;
  durationMins: number;
  language: string;
  genre: string;
  posterUrl: string;
  rating: string;
  releaseDate: string;
  shows: Array<{
    id: string;
    startTime: string;
    endTime: string;
    basePrice: number;
    format: string;
    screen: {
      id: string;
      name: string;
      theatre: {
        name: string;
        city: string;
        address: string;
      };
    };
  }>;
}

export default function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await fetch(`/api/movies/${id}`);
        if (!res.ok) {
          setError('Movie not found');
        } else {
          const data = await res.json();
          setMovie(data.movie);
        }
      } catch {
        setError('Failed to load movie details');
      } finally {
        setLoading(false);
      }
    };
    fetchMovie();
  }, [id]);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="py-12 text-center space-y-4">
        <Film className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">{error || 'Movie not found'}</h2>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-red-400 hover:text-red-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all movies
      </Link>

      {/* Movie Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-md">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full sm:w-64 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl flex-shrink-0 border border-slate-800 bg-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-800 text-red-400 text-xs font-semibold uppercase tracking-wider">
                  {movie.genre}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 text-xs font-bold flex items-center gap-1 border border-slate-700">
                  <Star className="w-3 h-3 fill-amber-400" />
                  {movie.rating}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                  {movie.language}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {movie.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 border-y border-slate-800 py-3">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-red-500" />
                <span>{movie.durationMins} minutes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-red-500" />
                <span>Released: {new Date(movie.releaseDate).toLocaleDateString()}</span>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
              {movie.description}
            </p>
          </div>
        </div>
      </div>

      {/* Available Showtimes Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Ticket className="w-5 h-5 text-red-500" />
          Select Showtime & Screen
        </h2>

        {movie.shows && movie.shows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {movie.shows.map((show) => (
              <div
                key={show.id}
                className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {show.screen.theatre.name}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-400 text-[10px] font-bold">
                      {show.format}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {show.screen.name}
                  </p>
                  <p className="text-lg font-bold text-white mt-2 font-mono">
                    {formatTime(show.startTime)}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Starts: {formatDateTime(show.startTime)}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Starting at</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {formatCurrency(show.basePrice)}
                    </span>
                  </div>
                  <Link
                    href={`/shows/${show.id}`}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md shadow-red-950 flex items-center gap-1.5 transition-colors"
                  >
                    <Armchair className="w-3.5 h-3.5" />
                    Select Seats
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-slate-800">
            <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No scheduled shows for this title currently.</p>
          </div>
        )}
      </section>
    </div>
  );
}
