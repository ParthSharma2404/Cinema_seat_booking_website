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
      <div className="py-24 flex justify-center">
        <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="py-16 text-center space-y-4">
        <Film className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">{error || 'Movie not found'}</h2>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-violet-600 hover:text-violet-700"
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
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all movies
      </Link>

      {/* Movie Header Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full sm:w-64 aspect-[2/3] rounded-2xl overflow-hidden shadow-soft flex-shrink-0 border border-slate-200 bg-slate-100">
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
                <span className="px-3 py-0.5 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-xs font-semibold uppercase tracking-wider font-mono">
                  {movie.genre}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1 border border-slate-200">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                  {movie.rating}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                  {movie.language}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {movie.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 border-y border-slate-100 py-3">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-violet-600" />
                <span>{movie.durationMins} minutes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-violet-600" />
                <span>Released: {new Date(movie.releaseDate).toLocaleDateString()}</span>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
              {movie.description}
            </p>
          </div>
        </div>
      </div>

      {/* Available Showtimes Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Ticket className="w-5 h-5 text-violet-600" />
          Select Showtime & Screen
        </h2>

        {movie.shows && movie.shows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {movie.shows.map((show) => (
              <div
                key={show.id}
                className="p-5 rounded-3xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-4 shadow-soft hover:shadow-float"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {show.screen.theatre.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-[10px] font-bold font-mono">
                      {show.format}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {show.screen.name}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">
                    {formatTime(show.startTime)}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Starts: {formatDateTime(show.startTime)}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-mono">From</span>
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(show.basePrice)}
                    </span>
                  </div>
                  <Link
                    href={`/shows/${show.id}`}
                    className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Armchair className="w-3.5 h-3.5" />
                    Select Seats
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-soft">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No scheduled shows for this title currently.</p>
          </div>
        )}
      </section>
    </div>
  );
}
