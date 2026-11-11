'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  Film,
  Clock,
  Calendar,
  ArrowLeft,
  Armchair,
  Ticket,
  Sparkles,
  Volume2,
  Tv,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
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
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('ALL');

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
      <div className="py-28 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Loading cinematic overview...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="py-20 text-center space-y-4">
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

  // Format hours and mins
  const hours = Math.floor(movie.durationMins / 60);
  const mins = movie.durationMins % 60;
  const durationFormatted = `${hours}h ${mins}m`;

  return (
    <div className="space-y-10 pb-16">
      {/* Top Back Navigation */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>All Screenings</span>
        </Link>
      </div>

      {/* Cinematic Editorial Showcase Card */}
      <div className="relative rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-soft overflow-hidden">
        {/* Ambient Gradient Aura behind poster */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-violet-200/40 via-pink-100/30 to-transparent rounded-full filter blur-3xl pointer-events-none -z-0" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-cyan-100/30 via-violet-100/20 to-transparent rounded-full filter blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* Movie Poster with High-End Glass Framing */}
          <div className="w-full sm:w-72 lg:w-80 aspect-[2/3] rounded-3xl overflow-hidden shadow-float flex-shrink-0 border border-slate-200/80 bg-slate-100 relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <span className="text-white text-xs font-mono tracking-wider">
                ORIGINAL CINEMATIC RELEASE
              </span>
            </div>
          </div>

          {/* Editorial Content */}
          <div className="flex-1 space-y-6">
            {/* Badges Strip (Pure Typography & Clean SVGs, No cheap emojis!) */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold uppercase tracking-wider font-mono">
                {movie.genre}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold font-mono tracking-wider">
                {movie.rating}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                {movie.language}
              </span>
              <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 text-xs font-bold border border-cyan-200 font-mono">
                IMAX 4K LASER
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                {movie.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 mt-2">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-violet-600" />
                  {durationFormatted} ({movie.durationMins}m)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-violet-600" />
                  Released {new Date(movie.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Synopsis */}
            <div className="space-y-2">
              <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400">
                Storyline & Synopsis
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                {movie.description}
              </p>
            </div>

            {/* Sensory / Hall Experience Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-violet-100 text-violet-700">
                  <Tv className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-900 block font-mono">
                    Laser Projection
                  </span>
                  <span className="text-[11px] text-slate-500">
                    High Dynamic 4K Clarity
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-pink-100 text-pink-700">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-900 block font-mono">
                    Dolby Spatial Sound
                  </span>
                  <span className="text-[11px] text-slate-500">
                    12-Channel Acoustic Grid
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-cyan-100 text-cyan-700">
                  <Armchair className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-900 block font-mono">
                    Reserved Recliners
                  </span>
                  <span className="text-[11px] text-slate-500">
                    8-Minute Live Seat Hold
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Showtimes Section */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Ticket className="w-6 h-6 text-violet-600" />
              Available Showtimes & Screens
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an auditorium to view live seat availability and reserve your seats
            </p>
          </div>
        </div>

        {movie.shows && movie.shows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {movie.shows.map((show) => (
              <div
                key={show.id}
                className="group p-6 rounded-3xl border border-slate-200/90 bg-white hover:border-violet-300 transition-all duration-300 flex flex-col justify-between space-y-5 shadow-soft hover:shadow-float hover:-translate-y-0.5"
              >
                <div>
                  {/* Top Theatre + Format */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold text-slate-900 uppercase tracking-wider">
                      {show.screen.theatre.name}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-bold font-mono">
                      {show.format}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    {show.screen.name}
                  </p>

                  {/* Main Showtime */}
                  <div className="my-3">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                      {formatTime(show.startTime)}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      Starts {formatDateTime(show.startTime)}
                    </p>
                  </div>
                </div>

                {/* Pricing & CTA */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-mono font-semibold">
                      Standard Seat From
                    </span>
                    <span className="text-base font-extrabold text-slate-900 font-mono">
                      {formatCurrency(show.basePrice)}
                    </span>
                  </div>

                  <Link
                    href={`/shows/${show.id}`}
                    className="px-5 py-2.5 rounded-full bg-slate-900 group-hover:bg-violet-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Armchair className="w-3.5 h-3.5" />
                    <span>Select Seats</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-soft">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No scheduled shows for this title currently.</p>
            <p className="text-xs text-slate-400 mt-1">Check back soon as new showtimes are added regularly.</p>
          </div>
        )}
      </section>
    </div>
  );
}
