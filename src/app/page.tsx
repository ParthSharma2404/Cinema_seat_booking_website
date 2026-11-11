'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Film,
  Clock,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Calendar,
  Lock,
  QrCode,
  ShieldCheck,
  Flame,
  Tv,
  Play,
  Armchair,
  Clapperboard,
} from 'lucide-react';
import { formatTime, formatCurrency } from '@/lib/utils';

interface Movie {
  id: string;
  title: string;
  description: string;
  durationMins: number;
  language: string;
  genre: string;
  posterUrl: string;
  rating: string;
  shows: Array<{
    id: string;
    startTime: string;
    basePrice: number;
    format: string;
    screen: {
      name: string;
      theatre: { name: string };
    };
  }>;
}

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (selectedGenre) query.set('genre', selectedGenre);

      const res = await fetch(`/api/movies?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMovies(data.movies || []);
      }
    } catch (err) {
      console.error('Failed to fetch movies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [selectedGenre]);

  // Autoplay hero carousel
  useEffect(() => {
    if (movies.length === 0 || isPaused) return;
    const interval = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % movies.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [movies.length, isPaused]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMovies();
  };

  const handlePrevHero = () => {
    setActiveHeroIndex((prev) => (prev - 1 + movies.length) % movies.length);
  };

  const handleNextHero = () => {
    setActiveHeroIndex((prev) => (prev + 1) % movies.length);
  };

  const activeMovie = movies.length > 0 ? movies[activeHeroIndex] : null;

  // Filter movies into categories matching the Lionsgate style spread
  const sciFiMovies = movies.filter((m) =>
    m.genre.toLowerCase().includes('sci-fi') || m.genre.toLowerCase().includes('adventure')
  );
  const dramaMovies = movies.filter((m) =>
    m.genre.toLowerCase().includes('biography') || m.genre.toLowerCase().includes('drama') || m.genre.toLowerCase().includes('action')
  );

  return (
    <div className="space-y-16 pb-20 w-full select-none">
      {/* ========================================================
          1. LIONSGATE-STYLE WIDE HERO BANNER SPREAD
          Center: Majestic movie visual
          Left: Grand cinema specs & numerical statistics
          Right: Bold typography, synopsis, mini preview action card, & slide controls
          ======================================================== */}
      {loading ? (
        <div className="w-full h-[600px] rounded-[36px] bg-[#0c0e18] border border-white/10 animate-pulse flex items-center justify-center">
          <Film className="w-10 h-10 text-slate-700 animate-spin" />
        </div>
      ) : activeMovie ? (
        <div
          className="relative w-full rounded-[36px] overflow-hidden border border-white/[0.08] bg-[#090a12] min-h-[580px] lg:min-h-[640px] flex flex-col justify-between p-6 sm:p-10 lg:p-14 shadow-2xl transition-all duration-700"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Dynamic Ambient Background Art */}
          <div
            className="absolute inset-0 bg-cover bg-center scale-110 filter blur-2xl opacity-25 transition-all duration-1000"
            style={{ backgroundImage: `url(${activeMovie.posterUrl})` }}
          />

          {/* Deep Theatrical Gradient Vignettes */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#08090e] via-[#08090e]/80 to-[#08090e] z-0" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#08090e]/80 via-transparent to-[#08090e] z-0" />

          {/* Top Subtle Studio Navigation Bar */}
          <div className="relative z-10 flex items-center justify-between pb-6 border-b border-white/[0.07]">
            <div className="flex items-center gap-6 text-[11px] font-mono tracking-widest uppercase">
              <span className="text-white font-black flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                CINEBOOK STUDIOS
              </span>
              <span className="hidden sm:inline text-slate-400">IMAX 70MM LASER</span>
              <span className="hidden sm:inline text-slate-400">DOLBY ATMOS</span>
              <span className="hidden sm:inline text-slate-400">VIP LEATHER RECLINERS</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-slate-400">
                AUDITORIUM SELECTION
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-violet-600/30 text-violet-300 font-mono text-[10px] font-bold border border-violet-500/40">
                HALL 1
              </span>
            </div>
          </div>

          {/* CENTER HERO SPREAD: Left Stats | Center Art | Right Title & Action */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6 flex-1">
            {/* LEFT COLUMN: Large Numerical Stats & Architecture Metrics */}
            <div className="lg:col-span-3 space-y-6 hidden lg:block">
              {/* Stat 1 */}
              <div>
                <div className="text-4xl xl:text-5xl font-black text-white tracking-tight font-mono">
                  4K
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-widest font-mono mt-1 font-semibold">
                  Laser Ultra-HD Resolution
                </div>
              </div>

              <div className="w-12 h-[1px] bg-white/20" />

              {/* Stat 2 */}
              <div>
                <div className="text-4xl xl:text-5xl font-black text-white tracking-tight font-mono">
                  64
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-widest font-mono mt-1 font-semibold">
                  Dolby Atmos Acoustic Grid
                </div>
              </div>

              <div className="w-12 h-[1px] bg-white/20" />

              {/* Stat 3 */}
              <div>
                <div className="text-4xl xl:text-5xl font-black text-emerald-400 tracking-tight font-mono">
                  100%
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-widest font-mono mt-1 font-semibold">
                  Zero Double-Booking Guarantee
                </div>
              </div>
            </div>

            {/* CENTER COLUMN: Hero Portrait Artwork */}
            <div className="lg:col-span-4 flex justify-center items-center">
              <div className="relative w-56 sm:w-64 lg:w-72 aspect-[2/3] rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border border-white/10 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeMovie.posterUrl}
                  alt={activeMovie.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                  <div className="flex items-center justify-between w-full text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-black/60 text-white font-bold border border-white/20">
                      {activeMovie.rating}
                    </span>
                    <span className="text-slate-300">
                      {activeMovie.durationMins} MINS
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Bold Studio Typography, Description, & Mini Action Card */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-violet-400 font-bold block mb-1">
                  PREMIERE SPOTLIGHT • {activeMovie.genre}
                </span>
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-[1.05]">
                  {activeMovie.title}
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mt-3 line-clamp-3 font-normal max-w-lg">
                  {activeMovie.description}
                </p>
              </div>

              {/* Mini Preview / Action Card (Matching the Lionsgate Watch/Book widget) */}
              {activeMovie.shows && activeMovie.shows.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-4 max-w-md shadow-xl hover:border-violet-500/40 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                      <Clapperboard className="w-6 h-6 text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                        Next Screening • {activeMovie.shows[0].format}
                      </span>
                      <p className="text-xs font-bold text-white truncate">
                        {formatTime(activeMovie.shows[0].startTime)} • {activeMovie.shows[0].screen.name}
                      </p>
                      <span className="text-[10px] font-mono text-violet-300">
                        From {formatCurrency(activeMovie.shows[0].basePrice)}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/shows/${activeMovie.shows[0].id}`}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-xs uppercase tracking-wider shrink-0 shadow-lg shadow-violet-600/30 transition-transform active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Book Seats</span>
                  </Link>
                </div>
              )}

              {/* Bottom Carousel Controls (Prev / Next & Numeric Progress: 01 / 04) */}
              <div className="flex items-center justify-between pt-2 max-w-md border-t border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-white tracking-widest">
                    0{activeHeroIndex + 1}
                  </span>
                  <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-violet-500 transition-all duration-500"
                      style={{ width: `${((activeHeroIndex + 1) / movies.length) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-slate-500 tracking-widest">
                    0{movies.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevHero}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white transition-colors border border-white/10"
                    title="Previous Film"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextHero}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white transition-colors border border-white/10"
                    title="Next Film"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ========================================================
          2. CURATED CATEGORY ROW 1: SCI-FI & EPIC SAGAS (LIONSGATE LAYOUT)
          Left: Bold category headline & tagline
          Right: Horizontal row of movie cards
          ======================================================== */}
      <section className="p-8 sm:p-10 rounded-[32px] bg-[#0c0e18] border border-white/[0.08]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Category Left Header */}
          <div className="lg:col-span-3 space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-violet-400 font-bold block mb-1">
                CURATED AUDITORIUM RELEASES
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                Sci-Fi & Epic Sagas
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Transcendent worlds, deep space exploration, and mind-bending architectural realities in IMAX Laser.
              </p>
            </div>

            <Link
              href="/"
              onClick={() => setSelectedGenre('Sci-Fi')}
              className="inline-flex items-center gap-2 text-xs font-mono font-bold text-violet-400 hover:text-violet-300 uppercase tracking-wider group pt-2"
            >
              <span>Browse All Sci-Fi</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Category Right Movie Cards Row */}
          <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sciFiMovies.map((movie) => (
              <div
                key={movie.id}
                className="group flex flex-col rounded-3xl overflow-hidden bg-[#08090e] border border-white/10 hover:border-violet-500/40 transition-all duration-300 shadow-xl hover:-translate-y-1"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-white">
                    {movie.rating}
                  </div>
                  <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {movie.durationMins}m
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-violet-400 font-bold">
                      {movie.genre}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors line-clamp-1">
                      {movie.title}
                    </h3>
                  </div>

                  {/* Showtimes & Direct Action */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    {movie.shows && movie.shows.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {movie.shows.slice(0, 2).map((s) => (
                          <Link
                            key={s.id}
                            href={`/shows/${s.id}`}
                            className="text-[10px] px-2 py-1 rounded-lg bg-white/5 hover:bg-violet-600 text-slate-200 hover:text-white font-mono transition-colors"
                          >
                            {formatTime(s.startTime)}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">No shows</span>
                    )}

                    <Link
                      href={`/movies/${movie.id}`}
                      className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold transition-all"
                    >
                      Overview
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          3. CURATED CATEGORY ROW 2: DRAMA & HISTORICAL EPICS (ALTERNATING LIONSGATE LAYOUT)
          Left: Movie cards
          Right: Bold category headline & tagline
          ======================================================== */}
      <section className="p-8 sm:p-10 rounded-[32px] bg-[#0c0e18] border border-white/[0.08]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Category Left Movie Cards Row */}
          <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 order-2 lg:order-1">
            {dramaMovies.map((movie) => (
              <div
                key={movie.id}
                className="group flex flex-col rounded-3xl overflow-hidden bg-[#08090e] border border-white/10 hover:border-violet-500/40 transition-all duration-300 shadow-xl hover:-translate-y-1"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-white">
                    {movie.rating}
                  </div>
                  <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {movie.durationMins}m
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-violet-400 font-bold">
                      {movie.genre}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors line-clamp-1">
                      {movie.title}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    {movie.shows && movie.shows.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {movie.shows.slice(0, 2).map((s) => (
                          <Link
                            key={s.id}
                            href={`/shows/${s.id}`}
                            className="text-[10px] px-2 py-1 rounded-lg bg-white/5 hover:bg-violet-600 text-slate-200 hover:text-white font-mono transition-colors"
                          >
                            {formatTime(s.startTime)}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">No shows</span>
                    )}

                    <Link
                      href={`/movies/${movie.id}`}
                      className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold transition-all"
                    >
                      Overview
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Category Right Header */}
          <div className="lg:col-span-3 space-y-4 order-1 lg:order-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-fuchsia-400 font-bold block mb-1">
                ACADEMY AWARD SPOTLIGHT
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                Biography & Drama
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Historic masterworks, intense character studies, and legendary performances in 70mm large format.
              </p>
            </div>

            <Link
              href="/"
              onClick={() => setSelectedGenre('Biography')}
              className="inline-flex items-center gap-2 text-xs font-mono font-bold text-fuchsia-400 hover:text-fuchsia-300 uppercase tracking-wider group pt-2"
            >
              <span>Browse All Drama</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. ARCHITECTURE & CONCURRENCY ASSURANCES
          ======================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[#0c0e18] border border-white/[0.08] space-y-2">
          <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">Zero Double-Booking</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Database composite unique constraint guarantees zero seat collisions under peak traffic.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#0c0e18] border border-white/[0.08] space-y-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">8-Minute Live Hold</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Temporary reservation with active timer prevents cart hijacking during payment processing.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#0c0e18] border border-white/[0.08] space-y-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <QrCode className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">Single-Use QR Pass</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Cryptographically unique dynamic token verified by the gate scanner with sub-second response.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#0c0e18] border border-white/[0.08] space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">Instant Self-Refund</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            1-click cancellation immediately returns seats to public inventory and updates refund ledger.
          </p>
        </div>
      </section>
    </div>
  );
}
