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
  Volume2,
  Tv,
  ChevronRight,
  Flame,
  ShieldCheck,
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
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Loading movie experience...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="py-20 text-center space-y-4">
        <Film className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">{error || 'Movie not found'}</h2>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-violet-400 hover:text-violet-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Movies
        </Link>
      </div>
    );
  }

  const hours = Math.floor(movie.durationMins / 60);
  const mins = movie.durationMins % 60;
  const durationFormatted = `${hours}h ${mins}m`;

  return (
    <div className="space-y-10 pt-24 px-4 sm:px-8 pb-16 max-w-7xl mx-auto w-full">
      {/* Top Back Navigation */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to All Titles</span>
        </Link>
      </div>

      {/* Cinematic Editorial Showcase Banner */}
      <div className="relative rounded-3xl border border-white/10 bg-[#0e101a] p-6 sm:p-10 shadow-2xl overflow-hidden">
        {/* Dynamic Ambient Glow using poster */}
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-3xl scale-125 opacity-20 pointer-events-none"
          style={{ backgroundImage: `url(${movie.posterUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090e] via-[#08090e]/85 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* Movie Poster Card */}
          <div className="w-full sm:w-72 lg:w-80 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/80 flex-shrink-0 border border-white/10 bg-black relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
              <span className="text-[10px] font-mono tracking-widest text-violet-300 uppercase font-bold">
                CINEBOOK EXCLUSIVE SCREENING
              </span>
            </div>
          </div>

          {/* Editorial Details */}
          <div className="flex-1 space-y-6">
            {/* Badges Strip */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 rounded-full bg-violet-600/30 border border-violet-500/40 text-violet-300 text-xs font-bold uppercase tracking-wider font-mono">
                {movie.genre}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold font-mono tracking-wider border border-white/10">
                {movie.rating}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 text-slate-300 text-xs font-medium border border-white/10">
                {movie.language}
              </span>
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30 font-mono">
                IMAX 4K LASER
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {movie.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 mt-2">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                  {durationFormatted} ({movie.durationMins}m)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-violet-400" />
                  Released {new Date(movie.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Synopsis */}
            <div className="space-y-2">
              <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400">
                Storyline & Synopsis
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                {movie.description}
              </p>
            </div>

            {/* Sensory Experience Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/10">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400">
                  <Tv className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-white block font-mono">
                    Laser Projection
                  </span>
                  <span className="text-[11px] text-slate-400">
                    High Dynamic 4K Clarity
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-pink-600/20 text-pink-400">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-white block font-mono">
                    Dolby Spatial Sound
                  </span>
                  <span className="text-[11px] text-slate-400">
                    12-Channel Acoustic Grid
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400">
                  <Armchair className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-white block font-mono">
                    Reserved Recliners
                  </span>
                  <span className="text-[11px] text-slate-400">
                    8-Minute Live Seat Hold
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Showtimes & Screens */}
      <section className="space-y-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Ticket className="w-6 h-6 text-violet-400" />
            <span>Available Showtimes & Screens</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select an auditorium to view live seat availability with microsecond concurrency locks
          </p>
        </div>

        {movie.shows && movie.shows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {movie.shows.map((show) => (
              <div
                key={show.id}
                className="group p-6 rounded-3xl border border-white/10 bg-[#0e101a] hover:border-violet-500/50 transition-all duration-300 flex flex-col justify-between space-y-5 shadow-lg hover:shadow-2xl hover:shadow-violet-600/20 hover:-translate-y-1"
              >
                <div>
                  {/* Top Theatre + Format */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      {show.screen.theatre.name}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-violet-600/30 border border-violet-500/40 text-violet-300 text-[10px] font-bold font-mono">
                      {show.format}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    {show.screen.name}
                  </p>

                  {/* Showtime */}
                  <div className="my-4">
                    <span className="text-3xl font-black text-white tracking-tight font-mono">
                      {formatTime(show.startTime)}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      Starts {formatDateTime(show.startTime)}
                    </p>
                  </div>
                </div>

                {/* Pricing & CTA */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-mono font-semibold">
                      Standard Seat From
                    </span>
                    <span className="text-base font-extrabold text-white font-mono">
                      {formatCurrency(show.basePrice)}
                    </span>
                  </div>

                  <Link
                    href={`/shows/${show.id}`}
                    className="px-5 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 flex items-center gap-1.5 transition-all group-hover:scale-105"
                  >
                    <Armchair className="w-3.5 h-3.5" />
                    <span>Select Seats</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#0e101a] rounded-3xl border border-white/10">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">No scheduled shows for this title currently.</p>
            <p className="text-xs text-slate-500 mt-1">Check back soon as new showtimes are added regularly.</p>
          </div>
        )}
      </section>
    </div>
  );
}
