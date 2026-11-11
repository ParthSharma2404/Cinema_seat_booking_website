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
  ScanLine,
  BarChart3,
  UserCheck,
} from 'lucide-react';
import { formatTime, formatCurrency } from '@/lib/utils';

const MOVIE_BACKDROPS: Record<string, string> = {
  'Interstellar': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&auto=format&fit=crop&q=85',
  'Dune: Part Two': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1920&auto=format&fit=crop&q=85',
  'Oppenheimer': 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1920&auto=format&fit=crop&q=85',
  'Inception': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&auto=format&fit=crop&q=85',
};

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
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; fullName: string; role: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

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
  const backdropUrl = activeMovie
    ? MOVIE_BACKDROPS[activeMovie.title] || activeMovie.posterUrl
    : '';

  // Filter movies into categories matching the Lionsgate style spread
  const sciFiMovies = movies.filter((m) =>
    m.genre.toLowerCase().includes('sci-fi') || m.genre.toLowerCase().includes('adventure')
  );
  const dramaMovies = movies.filter((m) =>
    m.genre.toLowerCase().includes('biography') || m.genre.toLowerCase().includes('drama') || m.genre.toLowerCase().includes('action')
  );

  return (
    <div className="space-y-12 pb-20 w-full select-none">
      {/* ========================================================
          0. ROLE-BASED ACTIVE PERSONA BAR (STAFF / ADMIN / CUSTOMER)
          Eliminates the "nothing happens" confusion: clearly surfaces the active role
          ======================================================== */}
      {currentUser && currentUser.role === 'STAFF' && (
        <div className="w-full p-4 rounded-3xl bg-amber-500/15 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0 border border-amber-500/30">
              <ScanLine className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-black text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40">
                  STAFF GATEHOUSE PERSONA ACTIVE
                </span>
                <span className="text-xs text-amber-200/90 font-medium">Logged in as {currentUser.fullName}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                You are authenticated as Gate Staff. Your primary workstation is the Gate QR Scanner for attendee check-in.
              </p>
            </div>
          </div>
          <Link
            href="/admin/scan"
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all shrink-0"
          >
            <span>Launch Gate Turnstile Scanner</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {currentUser && currentUser.role === 'ADMIN' && (
        <div className="w-full p-4 rounded-3xl bg-violet-600/15 border border-violet-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold shrink-0 border border-violet-500/30">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-black text-violet-400 px-2.5 py-0.5 rounded-full bg-violet-600/20 border border-violet-500/40">
                  CINEMA ADMINISTRATOR ACTIVE
                </span>
                <span className="text-xs text-violet-200/90 font-medium">Logged in as {currentUser.fullName}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Full executive access: Hall occupancy reconciliation proof (Test 5), financial revenue, and immutable audit logs.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/admin"
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-violet-600/25 transition-all"
            >
              <span>Reconciliation Hub</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/admin/audit-logs"
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-white/10"
            >
              <span>Audit Trail</span>
            </Link>
          </div>
        </div>
      )}

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
          className="relative w-full rounded-[36px] overflow-hidden border border-white/15 bg-[#090b14] min-h-[580px] lg:min-h-[640px] flex flex-col justify-between p-6 sm:p-10 lg:p-14 shadow-2xl transition-all duration-700"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* High-Definition Widescreen Cinema Backdrop (Anchored to Left, Fading Across to Deep Black on Right) */}
          <div
            className="absolute inset-0 bg-cover bg-left transition-all duration-1000 ease-out opacity-85 scale-100"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          />

          {/* Sweeping Left-to-Right Transition into Pure Solid Black on the Right for the Console Card */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#090b14]/15 via-[#090b14]/85 to-[#090b14] z-0 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090b14] via-transparent to-[#090b14]/70 z-0 pointer-events-none" />

          {/* Ambient Glow behind left poster */}
          <div className="absolute left-16 top-1/2 -translate-y-1/2 w-[380px] h-[480px] bg-violet-600/30 rounded-full blur-3xl pointer-events-none z-0 hidden lg:block" />

          {/* Top Subtle Studio Navigation Bar */}
          <div className="relative z-10 flex items-center justify-between pb-6 border-b border-white/[0.08]">
            <div className="flex items-center gap-6 text-[11px] font-mono tracking-widest uppercase">
              <span className="text-white font-black flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                CINEBOOK STUDIOS
              </span>
              <span className="hidden sm:inline text-slate-300">IMAX 70MM LASER</span>
              <span className="hidden sm:inline text-slate-400">DOLBY ATMOS</span>
              <span className="hidden sm:inline text-slate-400">VIP LEATHER RECLINERS</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-slate-400">
                AUDITORIUM
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-violet-600/30 text-violet-300 font-mono text-[10px] font-bold border border-violet-500/40">
                HALL 1 • LIVE
              </span>
            </div>
          </div>

          {/* MAIN HERO SPREAD: Left Movie Poster Card | Right Console Card on Deep Black */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-6 flex-1">
            {/* LEFT COLUMN: Hero Portrait Poster Artwork Shifted to Left */}
            <div className="lg:col-span-5 flex justify-center lg:justify-start items-center">
              <div className="relative w-64 sm:w-72 lg:w-80 aspect-[2/3] rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] border border-white/20 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeMovie.posterUrl}
                  alt={activeMovie.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end p-5">
                  <div className="flex items-center justify-between w-full text-[10px] font-mono">
                    <span className="px-2.5 py-1 rounded-lg bg-black/70 text-white font-bold border border-white/20 backdrop-blur-md">
                      {activeMovie.rating}
                    </span>
                    <span className="text-slate-300 px-2.5 py-1 rounded-lg bg-black/70 border border-white/10 backdrop-blur-md">
                      {activeMovie.durationMins} MINS
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Studio Typography, Synopsis, Console Card, & Controls on Solid Black */}
            <div className="lg:col-span-7 space-y-6 flex flex-col justify-center">
              {/* Category & Genre Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-violet-600/30 border border-violet-500/40 text-violet-300 text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  PREMIERE SPOTLIGHT
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-mono font-semibold">
                  {activeMovie.genre}
                </span>
              </div>

              {/* Grand Movie Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase leading-[1.05]">
                {activeMovie.title}
              </h1>

              {/* Specs Strip */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono text-slate-300">
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-white font-bold">
                  {activeMovie.rating}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                  {activeMovie.durationMins} MINS
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">{activeMovie.language}</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 font-bold">IMAX with Laser</span>
              </div>

              {/* Synopsis */}
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed line-clamp-3 font-normal max-w-xl">
                {activeMovie.description}
              </p>

              {/* The Interactive Console Action Card */}
              {activeMovie.shows && activeMovie.shows.length > 0 && (
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-xl shadow-2xl hover:border-violet-500/40 transition-all backdrop-blur-md">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-violet-600/25 border border-violet-500/40 flex items-center justify-center shrink-0">
                      <Clapperboard className="w-6 h-6 text-violet-300" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                        Next Screening • {activeMovie.shows[0].format}
                      </span>
                      <p className="text-sm font-bold text-white truncate">
                        {formatTime(activeMovie.shows[0].startTime)} • {activeMovie.shows[0].screen.name}
                      </p>
                      <span className="text-xs font-mono text-violet-300 font-semibold">
                        Tickets from {formatCurrency(activeMovie.shows[0].basePrice)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/shows/${activeMovie.shows[0].id}`}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-violet-600/30 transition-transform active:scale-95 group"
                    >
                      <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                      <span>BOOK SEATS</span>
                    </Link>
                    <Link
                      href={`/movies/${activeMovie.id}`}
                      className="px-3.5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors border border-white/10"
                      title="View full film overview & showtimes"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              )}

              {/* Bottom Carousel Controls (Prev / Next & Numeric Progress: 01 / 04) */}
              <div className="pt-2 flex items-center justify-between max-w-xl border-t border-white/[0.08]">
                {/* Slide Counter & Animated Progress */}
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-black text-white tracking-widest">
                    0{activeHeroIndex + 1}
                  </span>
                  <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                      style={{ width: `${((activeHeroIndex + 1) / movies.length) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-sm text-slate-500 tracking-widest">
                    0{movies.length}
                  </span>
                </div>

                {/* Quick Slide Selector Dots */}
                <div className="hidden sm:flex items-center gap-1.5">
                  {movies.map((m, idx) => (
                    <button
                      key={m.id}
                      onClick={() => setActiveHeroIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === activeHeroIndex ? 'w-6 bg-violet-500' : 'w-2 bg-white/20 hover:bg-white/40'
                      }`}
                      title={`Switch to ${m.title}`}
                    />
                  ))}
                </div>

                {/* Prev / Next Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevHero}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 text-white transition-colors border border-white/10 active:scale-95"
                    title="Previous Film"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextHero}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 text-white transition-colors border border-white/10 active:scale-95"
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
          2. CURATED CATEGORY ROW 1: DRAMA & AWARDS (EDITORIAL HIGH-CONTRAST WHITE CONTAINER)
          Emulates the Lionsgate reference image's crisp editorial white container
          Left: Bold black category headline & tagline
          Right: Horizontal row of movie cards with clean typography
          ======================================================== */}
      <section className="p-8 sm:p-10 rounded-[32px] bg-white text-slate-900 border border-slate-200/90 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Category Left Header */}
          <div className="lg:col-span-3 space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-violet-700 font-bold block mb-1">
                CURATED AUDITORIUM RELEASES
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
                Drama & Awards
              </h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Compelling, evocative, and critically acclaimed masterworks presented in pristine Dolby Atmos acoustic clarity.
              </p>
            </div>

            <Link
              href="/"
              onClick={() => setSelectedGenre('Drama')}
              className="inline-flex items-center gap-2 text-xs font-mono font-bold text-violet-700 hover:text-violet-900 uppercase tracking-wider group pt-2"
            >
              <span>Browse All Drama</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Category Right Movie Cards Row */}
          <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {dramaMovies.map((movie) => (
              <div
                key={movie.id}
                className="group flex flex-col rounded-3xl overflow-hidden bg-slate-50 border border-slate-200/80 hover:border-violet-500/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-white">
                    {movie.rating}
                  </div>
                  <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-mono text-slate-200 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-300" />
                    {movie.durationMins}m
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-violet-700 font-bold">
                      {movie.genre}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-violet-700 transition-colors line-clamp-1">
                      {movie.title}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    {movie.shows && movie.shows.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 text-[10px] font-mono font-bold">
                          {formatTime(movie.shows[0].startTime)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">Check Times</span>
                    )}

                    <Link
                      href={movie.shows && movie.shows.length > 0 ? `/shows/${movie.shows[0].id}` : `/movies/${movie.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all"
                    >
                      <span>Book</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          3. CURATED CATEGORY ROW 2: SCI-FI & EPIC SAGAS (DARK STUDIO CONTAINER)
          Left: Bold category headline & tagline
          Right: Horizontal row of movie cards
          ======================================================== */}
      <section className="p-8 sm:p-10 rounded-[32px] bg-[#0e111d] border border-white/10 shadow-2xl">
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
                className="group flex flex-col rounded-3xl overflow-hidden bg-[#090a14] border border-white/10 hover:border-violet-500/40 transition-all duration-300 shadow-xl hover:-translate-y-1"
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
                      href={movie.shows && movie.shows.length > 0 ? `/shows/${movie.shows[0].id}` : `/movies/${movie.id}`}
                      className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold transition-all"
                    >
                      Book
                    </Link>
                  </div>
                </div>
              </div>
            ))}
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
