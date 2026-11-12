'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Film,
  Clock,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Play,
  Star,
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  };

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/movies');
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
    fetchSession();
  }, []);

  const activeMovie = movies.length > 0 ? movies[activeHeroIndex] : null;

  // Sync selected showtime whenever active movie changes
  useEffect(() => {
    if (activeMovie && activeMovie.shows && activeMovie.shows.length > 0) {
      setSelectedShowId(activeMovie.shows[0].id);
    } else {
      setSelectedShowId(null);
    }
  }, [activeHeroIndex, activeMovie]);

  const handlePrevHero = () => {
    setActiveHeroIndex((prev) => (prev - 1 + movies.length) % movies.length);
  };

  const handleNextHero = () => {
    setActiveHeroIndex((prev) => (prev + 1) % movies.length);
  };

  const backdropUrl = activeMovie
    ? MOVIE_BACKDROPS[activeMovie.title] || activeMovie.posterUrl
    : '';

  const targetShowId = selectedShowId || (activeMovie?.shows?.[0]?.id ?? '');

  if (loading) {
    return (
      <div className="w-full h-screen bg-[#090b14] flex flex-col items-center justify-center gap-3">
        <Film className="w-10 h-10 text-amber-400 animate-spin" />
        <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">
          Loading Cinematic Experience...
        </span>
      </div>
    );
  }

  if (!activeMovie) {
    return (
      <div className="w-full h-screen bg-[#090b14] flex items-center justify-center">
        <p className="text-slate-400 text-sm font-mono">No movies currently scheduled.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen min-h-[700px] overflow-hidden flex flex-col justify-end pb-12 sm:pb-16 px-6 sm:px-12 lg:px-16 select-none bg-[#090b14]">
      {/* 1. Full-Bleed Edge-to-Edge Cinematic Backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out scale-105 pointer-events-none"
        style={{ backgroundImage: `url(${backdropUrl})` }}
      />

      {/* 2. Deep Theatrical Gradient Vignettes for High-Contrast Text Legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-transparent z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-transparent z-0 pointer-events-none" />

      {/* Staff / Admin Fast-Link Banner if logged in */}
      {currentUser?.role === 'STAFF' && (
        <div className="absolute top-24 left-6 sm:left-12 lg:left-16 z-30 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#0e101a]/95 border border-emerald-500/40 shadow-2xl backdrop-blur-xl">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-zinc-300">
            Logged in as <strong className="text-white">Gate Staff</strong>.
          </span>
          <Link
            href="/staff"
            className="px-3 py-1 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all ml-1 shadow-sm"
          >
            Open Staff Workstation →
          </Link>
        </div>
      )}

      {currentUser?.role === 'ADMIN' && (
        <div className="absolute top-24 left-6 sm:left-12 lg:left-16 z-30 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#0e101a]/95 border border-white/20 shadow-2xl backdrop-blur-xl">
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <span className="text-xs text-zinc-300">
            Logged in as <strong className="text-white">Cinema Administrator</strong>.
          </span>
          <Link
            href="/admin"
            className="px-3 py-1 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all ml-1 shadow-sm"
          >
            Open Admin Control Center →
          </Link>
        </div>
      )}

      {/* 3. Hero Content Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end w-full">
        {/* LEFT COLUMN: Date Pin, Giant Number, Title, Rating, Session Schedule, & Actions */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-5">
          {/* Vertical Timing Line & Pin (matching reference image) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
              <div className="w-0.5 h-7 bg-white/40" />
            </div>
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-white uppercase font-mono">
              Today Screening
            </span>
          </div>

          {/* Giant Slide Number + Movie Title */}
          <div className="flex items-baseline gap-4 sm:gap-6">
            <span className="font-cinematic text-6xl sm:text-7xl lg:text-8xl font-light text-white/80 tracking-tight select-none">
              0{activeHeroIndex + 1}
            </span>
            <div className="space-y-1.5">
              <h1 className="font-cinematic text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-[0.04em] uppercase leading-[1.05]">
                {activeMovie.title}
              </h1>
              {/* Star Ratings + Genre + Screen Format */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <div className="flex items-center text-[#d4af37] text-sm leading-none">
                  ★ ★ ★ ★ ★
                </div>
                <span className="text-zinc-400 font-mono">
                  Genre: <span className="text-zinc-200 font-sans">{activeMovie.genre}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-zinc-200 border border-white/15">
                  IMAX 70mm
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-zinc-200 border border-white/15">
                  {activeMovie.rating}
                </span>
              </div>
            </div>
          </div>

          {/* Session Schedule (Interactive Time Pills) */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-widest block">
              Session schedule
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              {activeMovie.shows && activeMovie.shows.length > 0 ? (
                activeMovie.shows.map((show, idx) => {
                  const isSelected = selectedShowId === show.id || (!selectedShowId && idx === 0);
                  return (
                    <button
                      key={show.id}
                      onClick={() => setSelectedShowId(show.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#e8c582] to-[#d4af37] text-zinc-950 border-[#d4af37] shadow-lg shadow-[#d4af37]/25 scale-105'
                          : 'bg-white/10 hover:bg-white/20 text-zinc-200 border-white/15'
                      }`}
                    >
                      {formatTime(show.startTime)}
                    </button>
                  );
                })
              ) : (
                <span className="text-xs text-zinc-400 font-mono">No shows scheduled</span>
              )}
            </div>
          </div>

          {/* Action Buttons + Slider Navigation Arrows */}
          <div className="pt-3 flex flex-wrap items-center gap-4">
            {/* Primary Action Button: Clean Minimalist White Pill */}
            <Link
              href={targetShowId ? `/movies/${activeMovie.id}?showId=${targetShowId}` : `/movies/${activeMovie.id}`}
              className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs tracking-wider uppercase px-7 py-3.5 rounded-xl transition-colors flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              <span>Book Now</span>
            </Link>

            {/* Secondary Action Button */}
            <Link
              href={`/movies/${activeMovie.id}`}
              className="px-6 py-3.5 rounded-xl border border-white/20 hover:border-white/50 bg-black/40 hover:bg-white/10 text-white font-medium text-xs tracking-wider uppercase transition-colors backdrop-blur-md"
            >
              More Details
            </Link>

            {/* Carousel Navigation Arrows: ( < ) ( > ) */}
            <div className="flex items-center gap-2 sm:ml-2">
              <button
                onClick={handlePrevHero}
                className="w-10 h-10 rounded-full border border-white/20 hover:border-white/70 bg-black/40 hover:bg-white/15 text-white flex items-center justify-center transition-all active:scale-95 shadow-lg"
                title="Previous film"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextHero}
                className="w-10 h-10 rounded-full border border-white/20 hover:border-white/70 bg-black/40 hover:bg-white/15 text-white flex items-center justify-center transition-all active:scale-95 shadow-lg"
                title="Next film"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Overlapping Horizontal Movie Poster Card Reel */}
        <div className="lg:col-span-6 xl:col-span-7 flex justify-start lg:justify-end items-end overflow-x-auto scrollbar-none pb-2 pt-4 w-full">
          <div className="flex items-end gap-4 overflow-visible">
            {movies.map((movie, idx) => {
              const isCurrent = idx === activeHeroIndex;
              const displayNum = `0${idx + 1}`;
              return (
                <div
                  key={movie.id}
                  onClick={() => setActiveHeroIndex(idx)}
                  className="flex flex-col items-start gap-2 cursor-pointer group flex-shrink-0 select-none"
                >
                  {/* Number tag above each card (e.g. 01, 02, 03, 04) */}
                  <span
                    className={`text-xs font-mono tracking-widest pl-1 transition-colors ${
                      isCurrent ? 'text-[#d4af37] font-black' : 'text-zinc-500 group-hover:text-white'
                    }`}
                  >
                    {displayNum}
                  </span>

                  {/* Vertical Poster Card */}
                  <div
                    className={`relative w-36 sm:w-40 lg:w-44 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 border ${
                      isCurrent
                        ? 'border-[#d4af37] ring-2 ring-[#d4af37]/60 scale-105 z-10'
                        : 'border-white/15 opacity-75 group-hover:opacity-100 group-hover:scale-105 group-hover:border-white/40'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-3">
                      <p className="font-cinematic text-xs font-bold text-white uppercase tracking-wider line-clamp-1 leading-tight">
                        {movie.title}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
