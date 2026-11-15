'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Film,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Clock,
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
  backdropUrl?: string | null;
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

// Curated high-definition cinematic backdrops for each film
const MOVIE_BACKDROPS: Record<string, string> = {
  'Dune: Part Two':
    'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=1920&auto=format&fit=crop&q=85',
  'Oppenheimer':
    'https://images.unsplash.com/photo-1516339901601-2e1562986307?w=1920&auto=format&fit=crop&q=85',
  'Interstellar':
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1920&auto=format&fit=crop&q=85',
  'Inception':
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&auto=format&fit=crop&q=85',
};

// Verified real cinematic poster fallbacks
const REAL_POSTERS: Record<string, string> = {
  'Dune: Part Two': '/posters/dune-poster.jpg',
  'Oppenheimer': 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
  'Interstellar': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
  'Inception': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
};

// Default fallback background
const DEFAULT_BACKDROP =
  'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=1920&auto=format&fit=crop&q=85';

export default function HomePage() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  // Auto-advance & intelligent user interaction states
  const [isHovered, setIsHovered] = useState(false);
  const [userInteractedCooldown, setUserInteractedCooldown] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Smooth cinematic dissolve navigation
  const handleNavigate = (url: string) => {
    setIsExiting(true);
    setTimeout(() => {
      router.push(url);
    }, 280);
  };

  // Filter out any test movie entries
  const displayedMovies = movies.filter((m) => !/test movie/i.test(m.title));

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
        const validMovies = (data.movies || []).filter(
          (m: Movie) => !/test movie/i.test(m.title)
        );
        setMovies(validMovies);
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

    const handleAuthChange = () => {
      fetchSession();
    };

    window.addEventListener('auth-changed', handleAuthChange);
    window.addEventListener('focus', handleAuthChange);

    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
      window.removeEventListener('focus', handleAuthChange);
    };
  }, []);

  const activeMovie =
    displayedMovies.length > 0 ? displayedMovies[activeHeroIndex] : null;

  // Auto-advance slideshow every 6 seconds unless hovered, paused, or recently interacted with
  useEffect(() => {
    if (displayedMovies.length <= 1) return;
    if (isHovered || isPaused || userInteractedCooldown) return;

    const interval = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % displayedMovies.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [displayedMovies.length, isHovered, isPaused, userInteractedCooldown]);

  // Grace period when user interacts: pauses auto-advance for 10 seconds of reading/browsing
  useEffect(() => {
    if (!userInteractedCooldown) return;
    const timer = setTimeout(() => {
      setUserInteractedCooldown(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, [userInteractedCooldown, activeHeroIndex]);

  // Pause when browser tab is inactive
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) setIsPaused(true);
      else setIsPaused(false);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Filter and sort active movie shows strictly for TODAY in chronological order
  const activeMovieTodayShows = useMemo(() => {
    if (!activeMovie?.shows || activeMovie.shows.length === 0) return [];
    const now = new Date();
    return activeMovie.shows
      .filter((show) => {
        const d = new Date(show.startTime);
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [activeMovie]);

  // Sync selected showtime to the first upcoming show of today whenever active movie changes
  useEffect(() => {
    if (activeMovieTodayShows.length > 0) {
      const firstUpcoming = activeMovieTodayShows.find(
        (s) => new Date(s.startTime).getTime() > Date.now()
      );
      if (firstUpcoming) {
        setSelectedShowId(firstUpcoming.id);
      } else {
        setSelectedShowId(null);
      }
    } else {
      setSelectedShowId(null);
    }
  }, [activeHeroIndex, activeMovieTodayShows]);

  const handlePrevHero = () => {
    if (displayedMovies.length === 0) return;
    setUserInteractedCooldown(true);
    setActiveHeroIndex(
      (prev) => (prev - 1 + displayedMovies.length) % displayedMovies.length
    );
  };

  const handleNextHero = () => {
    if (displayedMovies.length === 0) return;
    setUserInteractedCooldown(true);
    setActiveHeroIndex((prev) => (prev + 1) % displayedMovies.length);
  };

  const handleSelectCard = (idx: number) => {
    setUserInteractedCooldown(true);
    setActiveHeroIndex(idx);
  };

  const targetShowId =
    selectedShowId ||
    activeMovieTodayShows.find((s) => new Date(s.startTime).getTime() > Date.now())?.id ||
    '';

  const getPosterUrl = (movie: Movie) => {
    if (movie.posterUrl) {
      return movie.posterUrl;
    }
    if (movie.title === 'Dune: Part Two') {
      return '/posters/dune-poster.jpg';
    }
    return REAL_POSTERS[movie.title] || movie.posterUrl || '';
  };

  if (loading && displayedMovies.length === 0) {
    return (
      <div className="relative w-full min-h-screen overflow-hidden flex flex-col justify-end pt-28 pb-10 sm:pb-14 px-6 sm:px-10 lg:px-14 select-none bg-[#080d0d]">
        {/* Soft background glow & grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background:
              'radial-gradient(110% 85% at 0% 100%, rgba(8,13,13,0.95), rgba(8,13,13,0.8) 32%, transparent 68%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-full h-[40%] pointer-events-none z-[2]"
          style={{
            background: 'linear-gradient(to top, rgba(8,13,13,0.95), transparent)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none z-[3]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            opacity: 0.2,
            mixBlendMode: 'multiply',
          }}
        />

        {/* Hero layout skeleton */}
        <div className="relative z-10 flex flex-col lg:flex-row items-end justify-between gap-10 lg:gap-12 w-full max-w-[1440px] mx-auto animate-pulse">
          {/* Left Column */}
          <div className="w-full lg:max-w-[600px] flex flex-col justify-end space-y-4">
            {/* Tag / today badge */}
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/40" />
              <div className="h-4 w-40 rounded-full bg-white/10" />
            </div>

            {/* Index + Title */}
            <div className="flex items-baseline gap-4 sm:gap-6">
              <div className="h-20 w-16 sm:h-24 sm:w-20 rounded-lg bg-white/10" />
              <div className="h-10 sm:h-12 w-64 sm:w-80 rounded-xl bg-white/10" />
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-4 w-24 rounded bg-amber-400/20" />
              <div className="h-4 w-32 rounded-full bg-white/10" />
              <div className="h-5 w-20 rounded-full bg-white/10" />
              <div className="h-5 w-16 rounded-full bg-white/10" />
            </div>

            {/* Synopsis */}
            <div className="space-y-2 max-w-xl">
              <div className="h-4 w-full rounded bg-white/10" />
              <div className="h-4 w-4/5 rounded bg-white/10" />
            </div>

            {/* Session Schedule */}
            <div className="space-y-2 pt-1">
              <div className="h-3 w-44 rounded bg-white/10" />
              <div className="flex flex-wrap items-center gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-9 w-20 rounded-lg bg-white/5 border border-white/10"
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="h-[48px] w-36 rounded-[12px] bg-white/20" />
              <div className="h-[48px] w-32 rounded-[12px] bg-white/10 border border-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-[46px] h-[46px] rounded-full bg-white/10 border border-white/10" />
                <div className="w-[46px] h-[46px] rounded-full bg-white/10 border border-white/10" />
              </div>
            </div>
          </div>

          {/* Right Column: Carousel skeletons */}
          <div className="w-full lg:w-auto lg:flex-1 overflow-x-auto pt-3 pb-3 px-2 -mx-2">
            <div className="flex items-end justify-start lg:justify-end gap-[10px] min-w-max p-2">
              <div className="flex flex-col items-start gap-1.5 flex-shrink-0">
                <div className="h-3 w-6 rounded bg-white/20 pl-1" />
                <div className="w-[148px] h-[220px] rounded-[14px] bg-white/10 border border-white/20 ring-2 ring-white/30" />
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-start gap-1.5 flex-shrink-0">
                  <div className="h-3 w-6 rounded bg-white/10 pl-1" />
                  <div className="w-[124px] h-[184px] rounded-[14px] bg-white/5 border border-white/10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!activeMovie) {
    return (
      <div className="w-full h-screen bg-[#07080d] flex items-center justify-center">
        <p className="text-slate-400 text-sm font-mono">
          No movies currently scheduled.
        </p>
      </div>
    );
  }

  const activeIndexDisplay = String(activeHeroIndex + 1).padStart(2, '0');

  const currentBackdrop =
    activeMovie?.backdropUrl ||
    (activeMovie && MOVIE_BACKDROPS[activeMovie.title]) ||
    activeMovie?.posterUrl ||
    DEFAULT_BACKDROP;

  return (
    <div
      className={`relative w-full min-h-screen overflow-hidden flex flex-col justify-end pt-28 pb-10 sm:pb-14 px-6 sm:px-10 lg:px-14 select-none bg-[#080d0d] transition-all duration-300 ease-out ${
        isExiting ? 'opacity-0 scale-[0.99]' : 'opacity-100 scale-100'
      }`}
    >
      {/* 1. Full-bleed dynamic background per movie with smooth Ken-Burns cross-dissolve */}
      {displayedMovies.map((movie, idx) => {
        const isCurrent = idx === activeHeroIndex;
        const bgUrl =
          movie.backdropUrl ||
          MOVIE_BACKDROPS[movie.title] ||
          movie.posterUrl ||
          DEFAULT_BACKDROP;

        return (
          <div
            key={movie.id}
            className={`absolute inset-0 bg-cover bg-center pointer-events-none transition-all duration-1000 ease-in-out ${
              isCurrent
                ? 'opacity-100 z-0 scale-100'
                : 'opacity-0 -z-10 scale-105 pointer-events-none'
            }`}
            style={{
              backgroundImage: `url(${bgUrl})`,
            }}
            aria-hidden={!isCurrent}
          />
        );
      })}

      {/* 2. Soft radial gradient overlay (no visible edges) */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            'radial-gradient(110% 85% at 0% 100%, rgba(8,13,13,0.9), rgba(8,13,13,0.62) 32%, transparent 68%)',
        }}
      />

      {/* Subtle dark gradient across bottom 40% of the hero */}
      <div
        className="absolute bottom-0 left-0 w-full h-[40%] pointer-events-none z-[2]"
        style={{
          background: 'linear-gradient(to top, rgba(8,13,13,0.85), transparent)',
        }}
      />

      {/* Film grain overlay (opacity ~0.2, multiply blend) */}
      <div
        className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          opacity: 0.2,
          mixBlendMode: 'multiply',
        }}
      />

      {/* Logged in Staff / Admin Banner */}
      {currentUser?.role === 'STAFF' && (
        <div className="absolute top-24 left-6 sm:left-10 lg:left-14 z-30 flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#0c1414]/90 border border-emerald-500/40 shadow-xl backdrop-blur-xl">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-zinc-300">
            Logged in as <strong className="text-white">Gate Staff</strong>.
          </span>
          <Link
            href="/staff"
            className="px-3 py-1 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors ml-1 shadow-sm"
          >
            Staff Workstation →
          </Link>
        </div>
      )}

      {currentUser?.role === 'ADMIN' && (
        <div className="absolute top-24 left-6 sm:left-10 lg:left-14 z-30 flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#0c1414]/90 border border-white/20 shadow-xl backdrop-blur-xl">
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <span className="text-xs text-zinc-300">
            Logged in as <strong className="text-white">Cinema Administrator</strong>.
          </span>
          <Link
            href="/admin"
            className="px-3 py-1 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors ml-1 shadow-sm"
          >
            Admin Center →
          </Link>
        </div>
      )}

      {/* 3. Hero layout: left content (max-w ~600px) & right poster carousel */}
      <div className="relative z-10 flex flex-col lg:flex-row items-end justify-between gap-10 lg:gap-12 w-full max-w-[1440px] mx-auto">
        {/* LEFT COLUMN: Hero content, bottom-aligned, max width ~600px */}
        <div className="w-full lg:max-w-[600px] flex flex-col justify-end space-y-4">
          {/* "TODAY SCREENING" with small accent dot (amber #e9b949) */}
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full inline-block flex-shrink-0"
              style={{ backgroundColor: '#e9b949' }}
              aria-hidden="true"
            />
            <span className="text-xs sm:text-[13px] font-semibold tracking-wider text-white uppercase font-sans">
              TODAY SCREENINGS
            </span>
            <span className="text-xs font-mono text-zinc-400">
              • {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Large light-weight index number ("03", weight 200, ~112px) beside movie title (bold, uppercase, ~52px) */}
          <div className="flex items-baseline gap-4 sm:gap-6">
            <span
              className="font-sans font-extralight text-7xl sm:text-[96px] lg:text-[112px] text-white leading-none tracking-tight select-none flex-shrink-0"
              style={{ fontWeight: 200 }}
            >
              {activeIndexDisplay}
            </span>
            <h1 className="font-sans font-bold text-3xl sm:text-4xl lg:text-[52px] text-white tracking-[0.02em] uppercase leading-[1.05]">
              {activeMovie.title}
            </h1>
          </div>

          {/* Meta row: 5 gold stars, Genre: ..., and mono badges for format (IMAX 70mm) and rating (PG-13) */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div
              className="flex items-center text-sm leading-none"
              style={{ color: '#e9b949' }}
              aria-label="5 out of 5 stars"
            >
              ★★★★★
            </div>
            <span className="text-zinc-300 font-sans text-xs">
              Genre:{' '}
              <span className="text-white font-medium">{activeMovie.genre}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-mono text-zinc-200 border border-white/20">
              IMAX 70mm
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-mono text-zinc-200 border border-white/20">
              {activeMovie.rating}
            </span>
          </div>

          {/* One-line synopsis: 16px, line-height 1.6, 86% white */}
          <p className="text-[16px] leading-[1.6] text-white/86 line-clamp-1 max-w-xl font-sans">
            {activeMovie.description}
          </p>

          {/* SESSION SCHEDULE label with today's showtimes as chip buttons (mono, 13px, 1px translucent border) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-medium text-zinc-300 uppercase tracking-widest block">
                SESSION SCHEDULE (TODAY)
              </span>
              {activeMovieTodayShows.length > 0 && (
                <span className="text-[11px] font-mono text-zinc-400">
                  {activeMovieTodayShows.filter((s) => new Date(s.startTime).getTime() > Date.now()).length} of {activeMovieTodayShows.length} available
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {activeMovieTodayShows.length > 0 ? (
                activeMovieTodayShows.map((show) => {
                  const isPast = new Date(show.startTime).getTime() <= Date.now();
                  const isSelected = selectedShowId === show.id;
                  return (
                    <button
                      key={show.id}
                      type="button"
                      disabled={isPast}
                      onClick={() => {
                        if (!isPast) {
                          setSelectedShowId(show.id);
                          setUserInteractedCooldown(true);
                        }
                      }}
                      title={
                        isPast
                          ? 'This screening has already started or ended'
                          : `${formatTime(show.startTime)} (${show.screen?.name || 'Auditorium'}) - Click to select`
                      }
                      className={`px-3.5 py-1.5 rounded-lg text-[13px] font-mono transition-all border select-none ${
                        isPast
                          ? 'opacity-60 cursor-not-allowed bg-white/[0.04] text-zinc-300 border-white/50 line-through'
                          : isSelected
                          ? 'bg-white text-zinc-950 font-bold border-white shadow-md cursor-pointer'
                          : 'bg-[rgba(12,20,20,0.7)] hover:bg-white/15 text-white/90 border-white/20 cursor-pointer'
                      }`}
                    >
                      {formatTime(show.startTime)}
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-mono text-zinc-400 bg-white/5 border border-white/10">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>No screenings scheduled for today</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNavigate(`/movies/${activeMovie.id}`)}
                    className="inline-flex items-center gap-1 text-xs font-mono text-amber-400 hover:text-amber-300 underline underline-offset-4 cursor-pointer transition-colors"
                  >
                    <span>View upcoming dates →</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions: solid white BOOK NOW, dark glass MORE DETAILS, 2 circular 46px prev/next arrows */}
          <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
            {/* BOOK NOW: solid white button with ticket icon (48px tall, 12px radius) */}
            <button
              type="button"
              onClick={() =>
                handleNavigate(
                  targetShowId
                    ? `/movies/${activeMovie.id}?showId=${targetShowId}`
                    : `/movies/${activeMovie.id}`
                )
              }
              className="h-[48px] rounded-[12px] bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs tracking-wider uppercase px-7 flex items-center gap-2.5 shadow-lg transition-colors cursor-pointer"
            >
              <Ticket className="w-4 h-4 text-zinc-950" aria-hidden="true" />
              <span>{targetShowId ? 'BOOK NOW' : 'VIEW SHOWTIMES'}</span>
            </button>

            {/* MORE DETAILS: dark glass button (48px tall, 12px radius) */}
            <button
              type="button"
              onClick={() => handleNavigate(`/movies/${activeMovie.id}`)}
              className="h-[48px] rounded-[12px] bg-[rgba(12,20,20,0.74)] backdrop-blur-[14px] border border-white/[0.14] hover:bg-white/15 text-white font-medium text-xs tracking-wider uppercase px-6 flex items-center justify-center transition-colors shadow-lg cursor-pointer"
            >
              MORE DETAILS
            </button>

            {/* Circular 46px prev/next arrow buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevHero}
                aria-label="Previous movie"
                className="w-[46px] h-[46px] rounded-full border border-white/[0.14] bg-[rgba(12,20,20,0.74)] backdrop-blur-[14px] hover:bg-white/20 text-white flex items-center justify-center transition-colors shadow-lg cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleNextHero}
                aria-label="Next movie"
                className="w-[46px] h-[46px] rounded-full border border-white/[0.14] bg-[rgba(12,20,20,0.74)] backdrop-blur-[14px] hover:bg-white/20 text-white flex items-center justify-center transition-colors shadow-lg cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Movie Cards Carousel with Hover Pause & Click Selection */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="w-full lg:w-auto lg:flex-1 overflow-x-auto pt-3 pb-3 px-2 -mx-2 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]"
        >
          <div className="flex items-end justify-start lg:justify-end gap-[10px] min-w-max p-2">
            {displayedMovies.map((movie, idx) => {
              const isActive = idx === activeHeroIndex;
              const cardNum = String(idx + 1).padStart(2, '0');
              const poster = getPosterUrl(movie);

              return (
                <div
                  key={movie.id}
                  onClick={() => handleSelectCard(idx)}
                  className="flex flex-col items-start gap-1.5 cursor-pointer group flex-shrink-0 select-none"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSelectCard(idx);
                    }
                  }}
                  aria-label={`Select ${movie.title}`}
                >
                  {/* Mono number above each card, highlighted for active */}
                  <span
                    className={`text-xs font-mono tracking-widest pl-1 transition-colors ${
                      isActive
                        ? 'text-white font-bold'
                        : 'text-zinc-500 group-hover:text-zinc-300'
                    }`}
                  >
                    {cardNum}
                  </span>

                  {/* Card: 124x184 normal, 148x220 active with white ring and shadow */}
                  <div
                    className={`relative aspect-[2/3] rounded-[14px] overflow-hidden transition-all duration-300 ${
                      isActive
                        ? 'w-[148px] h-[220px] ring-2 ring-white border border-white shadow-[0_0_30px_rgba(255,255,255,0.25)] z-10'
                        : 'w-[124px] h-[184px] opacity-75 group-hover:opacity-100 border border-white/20 shadow-md group-hover:scale-[1.02]'
                    }`}
                  >
                    {/* Fallback gradient if poster is missing or loading */}
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black flex items-center justify-center p-3 text-center">
                      <span className="text-[10px] font-mono text-zinc-400">
                        {movie.title}
                      </span>
                    </div>

                    {/* Poster image */}
                    {poster && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={poster}
                        alt={movie.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}

                    {/* Dark gradient overlay with title at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex items-end p-2.5">
                      <p className="font-sans text-xs font-semibold text-white uppercase tracking-wider line-clamp-1 leading-tight">
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
