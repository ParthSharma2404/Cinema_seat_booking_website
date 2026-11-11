'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  Star,
} from 'lucide-react';
import { formatTime } from '@/lib/utils';

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
  const [selectedFormat, setSelectedFormat] = useState('ALL');
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
    }, 6000);
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

  const genres = ['All', 'Sci-Fi', 'Action', 'Biography', 'Drama'];
  const formats = ['ALL', 'IMAX', '4K DOLBY', '2D'];

  const activeMovie = movies.length > 0 ? movies[activeHeroIndex] : null;

  // Filter movies by format if selected
  const displayedMovies = movies.filter((m) => {
    if (selectedFormat === 'ALL') return true;
    return m.shows.some((s) => s.format.toUpperCase().includes(selectedFormat));
  });

  return (
    <div className="space-y-12 pb-16">
      {/* 1. GRAND DYNAMIC CINEMATIC HERO SCREEN WITH OVERLAPPING CAROUSEL */}
      {loading ? (
        <div className="w-full h-[520px] rounded-3xl bg-white/[0.03] border border-white/10 animate-pulse flex items-center justify-center">
          <Film className="w-10 h-10 text-slate-700 animate-spin" />
        </div>
      ) : activeMovie ? (
        <div
          className="relative w-full rounded-3xl overflow-hidden border border-white/10 bg-[#0e101a] min-h-[500px] lg:min-h-[540px] flex flex-col justify-between p-6 sm:p-10 lg:p-12 shadow-2xl transition-all duration-700"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Dynamic Blurred Ambient Background Poster */}
          <div
            className="absolute inset-0 bg-cover bg-center filter blur-3xl scale-125 opacity-25 transition-all duration-1000"
            style={{ backgroundImage: `url(${activeMovie.posterUrl})` }}
          />

          {/* Cinematic Vignette Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#08090e] via-[#08090e]/90 to-[#08090e]/40 z-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08090e] via-transparent to-[#08090e]/60 z-0" />

          {/* Hero Content: 2-Column Split (Left: Movie Details, Right-Center: Overlapping Movie Posters Carousel) */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
            {/* LEFT COLUMN: Active Movie Presentation */}
            <div className="lg:col-span-7 space-y-5">
              {/* Badges & Tags */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-violet-600/30 border border-violet-500/40 text-violet-300 text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <Flame className="w-3 h-3 text-amber-400" />
                  Premiere Spotlight
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-white text-[10px] font-mono font-bold">
                  {activeMovie.rating}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-slate-300 text-[10px] font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {activeMovie.durationMins}m
                </span>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
                  {activeMovie.language} • {activeMovie.genre}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1] drop-shadow-md">
                {activeMovie.title}
              </h1>

              {/* Synopsis */}
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl line-clamp-3">
                {activeMovie.description}
              </p>

              {/* Available Showtimes Pill Strip */}
              {activeMovie.shows && activeMovie.shows.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
                    Select Showtime:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeMovie.shows.slice(0, 3).map((show) => (
                      <Link
                        key={show.id}
                        href={`/shows/${show.id}`}
                        className="py-1.5 px-3.5 rounded-xl bg-white/10 hover:bg-violet-600 border border-white/15 hover:border-violet-500 transition-all text-xs font-mono text-white flex items-center gap-2 group/btn shadow-md"
                      >
                        <span className="font-bold">{formatTime(show.startTime)}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-violet-300 font-sans font-semibold">
                          {show.format}
                        </span>
                        <span className="text-[10px] text-slate-300">
                          ₹{show.basePrice.toFixed(0)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Primary Call to Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                {activeMovie.shows && activeMovie.shows.length > 0 ? (
                  <Link
                    href={`/shows/${activeMovie.shows[0].id}`}
                    className="py-3 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.02]"
                  >
                    <span>Book Tickets Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    href={`/movies/${activeMovie.id}`}
                    className="py-3 px-6 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-violet-600/30 transition-all"
                  >
                    <span>View Movie Overview</span>
                  </Link>
                )}
                <Link
                  href={`/movies/${activeMovie.id}`}
                  className="py-3 px-5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white text-xs font-semibold border border-white/10 transition-colors"
                >
                  Movie Details
                </Link>
              </div>
            </div>

            {/* RIGHT COLUMN: Overlapping Movie Posters Carousel */}
            <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center space-y-4">
              <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto py-3 px-1 w-full max-w-full justify-start lg:justify-end">
                {movies.map((movie, idx) => {
                  const isCurrent = idx === activeHeroIndex;
                  return (
                    <button
                      key={movie.id}
                      onClick={() => setActiveHeroIndex(idx)}
                      className={`relative shrink-0 rounded-2xl overflow-hidden transition-all duration-300 text-left group ${
                        isCurrent
                          ? 'w-36 sm:w-44 h-52 sm:h-64 ring-2 ring-violet-500 shadow-2xl shadow-violet-600/40 scale-105 z-20'
                          : 'w-24 sm:w-28 h-36 sm:h-44 opacity-60 hover:opacity-100 hover:scale-100 z-10'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <span className="text-[10px] font-bold text-white line-clamp-1 block">
                          {movie.title}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] text-violet-300 font-mono block">
                            Now Playing
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Carousel Controls (Prev / Next & Dots) */}
              <div className="flex items-center justify-between w-full max-w-xs pt-1">
                <div className="flex items-center gap-1.5">
                  {movies.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={() => setActiveHeroIndex(dotIdx)}
                      className={`h-1.5 rounded-full transition-all ${
                        dotIdx === activeHeroIndex
                          ? 'w-6 bg-violet-500'
                          : 'w-1.5 bg-white/20 hover:bg-white/50'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevHero}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
                    title="Previous Movie"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextHero}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
                    title="Next Movie"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 2. DISCOVERY & FILTERING BAR (STANDARD CINEMA BOOKING WORKFLOW) */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-3xl bg-[#0e101a] border border-white/10">
          {/* Genre Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {genres.map((g) => {
              const active = (g === 'All' && !selectedGenre) || selectedGenre === g;
              return (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(g === 'All' ? '' : g)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search titles, cast, genres..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-violet-600 text-white text-xs font-semibold transition-colors shrink-0"
            >
              Search
            </button>
          </form>
        </div>

        {/* Format Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-mono text-slate-400 uppercase font-bold mr-1">
            Format:
          </span>
          {formats.map((fmt) => (
            <button
              key={fmt}
              onClick={() => setSelectedFormat(fmt)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                selectedFormat === fmt
                  ? 'bg-white/20 text-white font-bold border border-white/30'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </section>

      {/* 3. NOW SHOWING CATALOG (MOVIE CARDS WITH DIRECT SHOWTIMES) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Now Showing in Theatres
              </h2>
              <p className="text-xs text-slate-400">
                Live seat availability with microsecond concurrency holds
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {displayedMovies.length} Available
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 rounded-3xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : displayedMovies.length === 0 ? (
          <div className="text-center py-16 rounded-3xl bg-[#0e101a] border border-white/10">
            <Film className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No movies found</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting your search or format filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedMovies.map((movie) => (
              <div
                key={movie.id}
                className="group flex flex-col rounded-3xl overflow-hidden bg-[#0e101a] border border-white/10 hover:border-violet-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-600/20 hover:-translate-y-1"
              >
                {/* Poster Artwork with Floating Badges */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-white shadow-xs">
                    {movie.rating}
                  </div>
                  <div className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300 flex items-center gap-1 shadow-xs">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {movie.durationMins}m
                  </div>
                </div>

                {/* Details & Showtimes */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-violet-400 font-bold tracking-wider">
                      {movie.genre}
                    </span>
                    <h3 className="text-base font-bold text-white group-hover:text-violet-400 transition-colors line-clamp-1 mt-0.5">
                      {movie.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {movie.description}
                    </p>
                  </div>

                  {/* Showtimes Pill List */}
                  <div className="pt-2 border-t border-white/10 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                      Today&apos;s Shows:
                    </span>
                    {movie.shows && movie.shows.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {movie.shows.slice(0, 3).map((show) => (
                          <Link
                            key={show.id}
                            href={`/shows/${show.id}`}
                            className="text-xs px-2.5 py-1 rounded-xl bg-white/5 hover:bg-violet-600 text-slate-200 hover:text-white border border-white/10 hover:border-violet-500 font-mono transition-colors flex items-center gap-1.5"
                          >
                            <span>{formatTime(show.startTime)}</span>
                            <span className="text-[9px] px-1 rounded bg-black/40 text-violet-300 font-sans font-bold">
                              {show.format}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">No upcoming shows</span>
                    )}
                  </div>

                  {/* Action Link */}
                  <Link
                    href={`/movies/${movie.id}`}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-violet-600 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-white/10 hover:border-violet-500"
                  >
                    <span>Movie & Hall Info</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. CINEMA ARCHITECTURE PILLARS (SRS TECHNICAL ASSURANCES) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        <div className="p-5 rounded-3xl bg-[#0e101a] border border-white/10 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">Zero Double-Booking</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Database composite unique constraint guarantees no duplicate ticket issuance under high traffic.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#0e101a] border border-white/10 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">8-Minute Live Hold</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Temporary reservation with active timer prevents cart hijacking during payment processing.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#0e101a] border border-white/10 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <QrCode className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">Single-Use QR Pass</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Cryptographically unique dynamic token verified by the gate scanner with sub-second response.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#0e101a] border border-white/10 space-y-2">
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
