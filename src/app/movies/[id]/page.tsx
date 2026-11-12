'use client';

import React, { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Film,
  Clock,
  Calendar,
  ArrowLeft,
  Armchair,
  Ticket,
  Volume2,
  Tv,
  Star,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronDown,
  RefreshCw,
  User,
  ShieldCheck,
  Award,
  Clapperboard,
} from 'lucide-react';
import { formatCurrency, formatTime } from '@/lib/utils';
import { getMovieExtendedMeta, CastMember } from '@/lib/movie-data';
import { SeatMap } from '@/components/SeatMap';
import { HoldTimer } from '@/components/HoldTimer';
import { SeatWithStatus } from '@/server/services/seatHoldService';

interface MovieShow {
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
}

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
  shows: MovieShow[];
}

// Failsafe, High-Fashion Editorial Cast Card with Fira Sans Typography
function CastMemberCard({ actor }: { actor: CastMember }) {
  const [imgError, setImgError] = useState(false);
  const initials = actor.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  return (
    <div className="flex-shrink-0 w-32 sm:w-36 p-2.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-[#d4af37]/60 hover:bg-black/60 transition-all flex flex-col items-center text-center group shadow-xl">
      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border border-white/15 group-hover:border-[#d4af37] group-hover:scale-105 transition-all shadow-md bg-[#10121b] mb-2 relative flex items-center justify-center">
        {!imgError && actor.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={actor.photoUrl}
            alt={actor.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1c29] via-[#12141e] to-[#0a0b12] text-[#d4af37] p-2">
            <User className="w-5 h-5 text-[#d4af37]/70 mb-0.5" />
            <span className="font-sans text-xs font-bold tracking-widest">{initials}</span>
          </div>
        )}
      </div>
      <span className="text-xs font-sans font-semibold text-zinc-100 leading-tight group-hover:text-[#d4af37] transition-colors line-clamp-1">
        {actor.name}
      </span>
      <span className="text-[10px] text-zinc-400 font-sans tracking-wide uppercase leading-tight mt-1 line-clamp-1">
        {actor.character}
      </span>
    </div>
  );
}

export default function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedShowId = searchParams.get('showId');

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking Flow States
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
  const [seats, setSeats] = useState<SeatWithStatus[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const bookingSectionRef = useRef<HTMLDivElement>(null);

  // Generate 7 upcoming dates starting today
  const upcomingDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      date: d,
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      dateKey: d.toDateString(),
    };
  });

  // Fetch Movie Details
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await fetch(`/api/movies/${id}`);
        if (!res.ok) {
          setError('Movie not found');
        } else {
          const data = await res.json();
          setMovie(data.movie);

          // Select requested show or first available show
          if (data.movie.shows && data.movie.shows.length > 0) {
            if (requestedShowId && data.movie.shows.some((s: MovieShow) => s.id === requestedShowId)) {
              setSelectedShowId(requestedShowId);
            } else {
              setSelectedShowId(data.movie.shows[0].id);
            }
          }
        }
      } catch {
        setError('Failed to load movie details');
      } finally {
        setLoading(false);
      }
    };
    fetchMovie();
  }, [id, requestedShowId]);

  // Load seats whenever selectedShowId changes
  const loadSeats = async (silent = false) => {
    if (!selectedShowId) return;
    try {
      if (!silent) setSeatsLoading(true);
      const res = await fetch(`/api/shows/${selectedShowId}/seats`);
      if (!res.ok) throw new Error('Failed to load seats');
      const data = await res.json();
      setSeats(data.seats);

      // Check if user already holds any seats
      const myHeldSeats = data.seats.filter((s: SeatWithStatus) => s.isHeldByMe);
      if (myHeldSeats.length > 0 && selectedSeatIds.length === 0) {
        setSelectedSeatIds(myHeldSeats.map((s: SeatWithStatus) => s.id));
        setHoldExpiresAt(myHeldSeats[0].holdExpiresAt);
        setIsHolding(true);
      }
    } catch (err: any) {
      if (!silent) setErrorMsg(err.message || 'Could not load seating map');
    } finally {
      if (!silent) setSeatsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedShowId) {
      loadSeats();
      const interval = setInterval(() => {
        loadSeats(true);
      }, 12000);
      return () => clearInterval(interval);
    }
  }, [selectedShowId]);

  // Smooth scroll helper
  const scrollToBooking = () => {
    if (bookingSectionRef.current) {
      bookingSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Toggle seat selection
  const handleToggleSeat = (seat: SeatWithStatus) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds((prev) => prev.filter((sId) => sId !== seat.id));
    } else {
      if (selectedSeatIds.length >= 10) {
        setErrorMsg('Maximum 10 seats allowed per booking.');
        return;
      }
      setSelectedSeatIds((prev) => [...prev, seat.id]);
    }
  };

  // Acquire or refresh temporary seat hold with TTL
  const handleAcquireHold = async () => {
    if (!selectedShowId || selectedSeatIds.length === 0) {
      setErrorMsg('Please select at least one seat first.');
      return;
    }

    try {
      setIsHolding(true);
      setErrorMsg('');
      const res = await fetch('/api/holds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showId: selectedShowId,
          seatIds: selectedSeatIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?redirect=/movies/${id}?showId=${selectedShowId}`);
          return;
        }
        setErrorMsg(data.error || 'Failed to hold selected seats');
        await loadSeats(true);
      } else {
        setHoldExpiresAt(data.holdExpiresAt);
        setSuccessMsg(`Seats held for ${data.ttlMinutes} minutes. Complete checkout to finalize!`);
        await loadSeats(true);
      }
    } catch {
      setErrorMsg('Network error while holding seats');
    }
  };

  // Final checkout booking creation
  const handleProceedToCheckout = async () => {
    if (!selectedShowId || selectedSeatIds.length === 0) {
      setErrorMsg('Please select at least one seat to proceed.');
      return;
    }

    try {
      setIsBooking(true);
      setErrorMsg('');

      // If seats not held yet, hold them first
      if (!isHolding || !holdExpiresAt) {
        const holdRes = await fetch('/api/holds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            showId: selectedShowId,
            seatIds: selectedSeatIds,
          }),
        });
        if (!holdRes.ok) {
          const holdData = await holdRes.json();
          if (holdRes.status === 401) {
            router.push(`/login?redirect=/movies/${id}?showId=${selectedShowId}`);
            return;
          }
          setErrorMsg(holdData.error || 'Seats no longer available. Please select other seats.');
          await loadSeats(true);
          return;
        }
      }

      // Create Booking
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showId: selectedShowId,
          seatIds: selectedSeatIds,
          paymentMethod: 'SIMULATED_CARD',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?redirect=/movies/${id}?showId=${selectedShowId}`);
          return;
        }
        setErrorMsg(data.error || 'Booking failed');
        await loadSeats(true);
      } else {
        router.push(`/checkout/${data.booking.id}`);
      }
    } catch {
      setErrorMsg('Transaction failed. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleHoldExpired = () => {
    setIsHolding(false);
    setHoldExpiresAt(null);
    setErrorMsg('Your seat hold has expired. The seats have been released.');
    loadSeats(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 flex flex-col items-center justify-center gap-3 bg-[#07080d]">
        <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-400 font-sans tracking-widest uppercase">Loading immersive showcase...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen pt-32 text-center space-y-4 px-4 bg-[#07080d]">
        <Film className="w-12 h-12 text-zinc-600 mx-auto" />
        <h2 className="text-2xl font-sans font-bold text-white">{error || 'Movie not found'}</h2>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-sans tracking-wider text-[#d4af37] hover:underline uppercase"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Featured Screenings
        </Link>
      </div>
    );
  }

  const extendedMeta = getMovieExtendedMeta(movie.title);
  const hours = Math.floor(movie.durationMins / 60);
  const mins = movie.durationMins % 60;
  const durationFormatted = `${hours}h ${mins}m`;

  const targetDateObj = upcomingDates[selectedDateIndex].date;
  const dateShows = movie.shows.filter((show) => {
    const showDate = new Date(show.startTime);
    return (
      showDate.getFullYear() === targetDateObj.getFullYear() &&
      showDate.getMonth() === targetDateObj.getMonth() &&
      showDate.getDate() === targetDateObj.getDate()
    );
  });

  const displayedShows = dateShows.length > 0 ? dateShows : movie.shows;
  const currentShow = movie.shows.find((s) => s.id === selectedShowId);
  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
  const totalPrice = selectedSeats.reduce((acc, curr) => acc + curr.price, 0);

  const heroBackgroundUrl = extendedMeta.backdropUrl || movie.posterUrl;

  return (
    <div className="relative min-h-screen text-zinc-100 font-sans selection:bg-[#d4af37] selection:text-black">
      {/* ========================================================
          FULL-BLEED CINEMATIC COVER BACKDROP (UNCONVENTIONAL UI)
          The cover image spans the entire viewport background
          with atmospheric multi-stop gradients for crisp legibility
          ======================================================== */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroBackgroundUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-center filter brightness-[0.72] contrast-[1.08] scale-105 transition-transform duration-1000 ease-out"
        />

        {/* Cinematic Vignettes & Radial Depth Scrims */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 30% 40%, rgba(7, 8, 13, 0.45) 0%, rgba(7, 8, 13, 0.88) 60%, #07080d 100%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-transparent to-[#07080d]/80 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080d]/90 via-[#07080d]/60 to-transparent pointer-events-none" />
      </div>

      {/* ========================================================
          FIRST FOLD: IMMERSIVE PRESTIGE FILM EXPERIENCE
          Completely different from traditional e-commerce ticket sites
          ======================================================== */}
      <section className="relative z-10 w-full min-h-[92vh] flex flex-col justify-between pt-24 pb-12 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto">
        {/* Top Controls */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/15 text-xs font-sans tracking-wide text-zinc-300 hover:text-white transition-all backdrop-blur-md group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>All Movies</span>
          </Link>
        </div>

        {/* Central Editorial Movie Content */}
        <div className="my-auto py-8 lg:py-12 max-w-3xl space-y-5">
          {/* Format & Classification Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-zinc-200 text-xs font-sans font-medium">
              {movie.genre}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-sans font-semibold border border-white/15">
              {movie.rating}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/5 text-zinc-300 text-xs font-sans border border-white/10">
              {movie.language}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-zinc-200 text-xs font-sans border border-white/15">
              IMAX 70mm
            </span>
          </div>

          {/* Clean Title in Fira Sans */}
          <div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight">
              {movie.title}
            </h1>
            <p className="text-base sm:text-lg text-zinc-300 italic mt-2 border-l-2 border-zinc-500 pl-3.5 font-light">
              &ldquo;{extendedMeta.tagline}&rdquo;
            </p>
          </div>

          {/* Quick Technical Specs Strip */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              {durationFormatted} ({movie.durationMins}m)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clapperboard className="w-3.5 h-3.5 text-zinc-400" />
              Directed by {extendedMeta.director}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              {new Date(movie.releaseDate).getFullYear()}
            </span>
          </div>

          {/* Film Narrative Synopsis */}
          <p className="text-sm sm:text-base text-zinc-300 font-normal leading-relaxed max-w-2xl">
            {movie.description}
          </p>

          {/* Critics & Audience Reception Capsule */}
          <div className="inline-flex flex-wrap items-center gap-5 p-2.5 px-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-1.5 text-zinc-200">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold font-sans">{extendedMeta.imdbRating}</span>
              <span className="text-[10px] text-zinc-400 uppercase font-sans">IMDb</span>
            </div>

            <div className="w-[1px] h-4 bg-white/15 hidden sm:block" />

            <div className="flex items-center gap-1.5 text-zinc-200">
              <span className="text-sm font-bold font-sans">{extendedMeta.rottenTomatoes}</span>
              <span className="text-[10px] text-zinc-400 uppercase font-sans">Tomatometer</span>
            </div>

            <div className="w-[1px] h-4 bg-white/15 hidden sm:block" />

            <div className="flex items-center gap-1.5 text-zinc-200">
              <span className="text-sm font-bold font-sans">{extendedMeta.audienceScore}</span>
              <span className="text-[10px] text-zinc-400 uppercase font-sans">Audience</span>
            </div>
          </div>

          {/* Action CTA: Minimalist Clean Button */}
          <div className="pt-2 flex items-center gap-4">
            <button
              onClick={scrollToBooking}
              className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs tracking-wider uppercase px-7 py-3.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Ticket className="w-4 h-4" />
              <span>Select Date & Seats</span>
              <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
            </button>
          </div>
        </div>

        {/* Bottom Principal Cast Horizontal Reel */}
        <div className="pt-5 border-t border-white/10">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs uppercase tracking-wider font-sans font-semibold text-zinc-400">
              Cast
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {extendedMeta.cast.map((actor, idx) => (
              <CastMemberCard key={idx} actor={actor} />
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          SECOND FOLD: MINIMALIST AUDITORIUM & BOOKING
          Seamlessly reveals when the user scrolls down
          ======================================================== */}
      <section
        id="booking-section"
        ref={bookingSectionRef}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-16 pb-28 space-y-8 scroll-mt-20"
      >
        {/* Section Heading */}
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Select Date & Seats
          </h2>
          <p className="text-xs text-zinc-400 font-normal">
            Real-time seat holds with 8-minute reservation timer.
          </p>
        </div>

        {/* STEP 1: Date Ribbon */}
        <div className="space-y-2.5">
          <span className="text-xs font-sans uppercase tracking-wider text-zinc-400 block text-center sm:text-left font-medium">
            1. Date:
          </span>
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
            {upcomingDates.map((item, idx) => {
              const isSelected = idx === selectedDateIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDateIndex(idx)}
                  className={`flex flex-col items-center justify-center min-w-[76px] sm:min-w-[84px] py-3 px-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-white text-black border-white shadow-md font-bold'
                      : 'bg-black/40 text-zinc-300 border-white/10 hover:border-white/25 hover:bg-black/60'
                  }`}
                >
                  <span className={`text-[10px] font-sans uppercase ${isSelected ? 'text-black' : 'text-zinc-400'}`}>
                    {item.dayName}
                  </span>
                  <span className="text-xl font-bold font-sans tracking-tight my-0.5">
                    {item.dayNumber}
                  </span>
                  <span className={`text-[9px] font-sans uppercase ${isSelected ? 'text-zinc-800' : 'text-zinc-500'}`}>
                    {item.monthName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 2: Time Slots */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans uppercase tracking-wider text-zinc-400 font-medium">
              2. Showtimes:
            </span>
          </div>

          {displayedShows.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {displayedShows.map((show) => {
                const isSelected = show.id === selectedShowId;
                return (
                  <button
                    key={show.id}
                    onClick={() => {
                      setSelectedShowId(show.id);
                      setSelectedSeatIds([]);
                      setIsHolding(false);
                      setHoldExpiresAt(null);
                      setErrorMsg('');
                    }}
                    className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white/15 border-white text-white ring-1 ring-white/40'
                        : 'bg-black/40 border-white/10 text-zinc-300 hover:border-white/20 hover:bg-black/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-sans font-semibold text-white">
                        {show.screen.name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/10 text-zinc-300 text-[10px] font-sans">
                        {show.format}
                      </span>
                    </div>

                    <div className="my-3 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white font-sans">
                        {formatTime(show.startTime)}
                      </span>
                      <span className="text-xs text-zinc-400 font-sans">
                        {show.screen.theatre.name}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-sans">
                      <span className="text-zinc-400 text-[11px]">{formatCurrency(show.basePrice)}</span>
                      {isSelected ? (
                        <span className="text-white font-medium text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          Selected
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-[11px] group-hover:text-white">
                          Select →
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-black/40 rounded-xl border border-white/10">
              <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-400 font-sans">No screenings available for this date.</p>
            </div>
          )}
        </div>

        {/* STEP 3: Seating Map */}
        {selectedShowId && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-sans uppercase tracking-wider text-zinc-400 font-medium">
                  3. Select Seats:
                </span>
              </div>

              <button
                onClick={() => loadSeats(false)}
                className="flex items-center gap-1.5 text-[11px] font-sans text-zinc-400 hover:text-white px-3 py-1 rounded-lg border border-white/15 bg-black/40 hover:bg-black/60 transition-colors"
              >
                <RefreshCw className="w-3 h-3 text-zinc-400" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                <button onClick={() => setErrorMsg('')} className="text-rose-400 font-bold text-xs hover:text-white">
                  ✕
                </button>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* SEAT MAP CANVAS */}
            <div className="rounded-2xl bg-[#0c0d14]/95 border border-white/10 p-5 sm:p-8 shadow-xl overflow-hidden relative">
              {seatsLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2.5">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-zinc-400 font-sans">Loading seats...</p>
                </div>
              ) : (
                <SeatMap
                  seats={seats}
                  selectedSeatIds={selectedSeatIds}
                  onToggleSeat={handleToggleSeat}
                  disabled={isBooking}
                />
              )}
            </div>
          </div>
        )}
      </section>

      {/* ========================================================
          MINIMALIST FLOATING BOTTOM BAR
          ======================================================== */}
      {selectedSeatIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="rounded-2xl p-3 px-5 flex items-center justify-between shadow-2xl border border-white/15 bg-[#0e1017]/95 backdrop-blur-xl">
            {/* Left: Total Price */}
            <div className="flex flex-col">
              <span className="text-[10px] font-sans uppercase text-zinc-400">
                Total
              </span>
              <div className="text-lg font-bold text-white font-sans leading-tight">
                {formatCurrency(totalPrice)}
              </div>
              <span className="text-[10px] text-zinc-400 font-sans">
                {selectedSeatIds.length} seat(s)
              </span>
            </div>

            {/* Center: Live TTL Hold Timer */}
            {isHolding && holdExpiresAt && (
              <div className="hidden sm:block">
                <HoldTimer expiresAt={holdExpiresAt} onExpire={handleHoldExpired} />
              </div>
            )}

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={isBooking}
                className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs tracking-wide uppercase px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isBooking ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Booking...</span>
                  </>
                ) : (
                  <>
                    <span>Book</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
