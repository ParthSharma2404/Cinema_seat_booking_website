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

// Failsafe, High-Fashion Editorial Cast Card
function CastMemberCard({ actor }: { actor: CastMember }) {
  const [imgError, setImgError] = useState(false);
  const initials = actor.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  return (
    <div className="p-3 rounded-2xl bg-gradient-to-b from-white/[0.04] to-black/40 border border-white/[0.08] hover:border-[#d4af37]/60 hover:bg-white/[0.07] transition-all flex flex-col items-center text-center group shadow-lg">
      <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-white/15 group-hover:border-[#d4af37] group-hover:scale-105 transition-all shadow-md bg-[#10121b] mb-2.5 relative flex items-center justify-center">
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
            <span className="font-cinematic text-xs font-bold tracking-widest">{initials}</span>
          </div>
        )}
      </div>
      <span className="text-xs font-display font-semibold text-zinc-100 leading-tight group-hover:text-[#d4af37] transition-colors line-clamp-1">
        {actor.name}
      </span>
      <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase leading-tight mt-1 line-clamp-1">
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
      <div className="min-h-screen pt-28 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-400 font-mono tracking-widest uppercase">Loading cinematic experience...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen pt-32 text-center space-y-4 px-4">
        <Film className="w-12 h-12 text-zinc-600 mx-auto" />
        <h2 className="text-xl font-cinematic font-bold text-white">{error || 'Movie not found'}</h2>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-display tracking-wider text-[#d4af37] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Premiere Feed
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

  return (
    <div className="min-h-screen pb-32 text-zinc-100 font-sans">
      {/* ========================================================
          FIRST FOLD: CINEMATIC SHOWCASE & EDITORIAL CAST GALLERY
          ======================================================== */}
      <section className="relative w-full overflow-hidden border-b border-white/[0.08] pt-24 pb-14">
        {/* Full-width Ambient Backdrop */}
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-15 scale-110 pointer-events-none"
          style={{ backgroundImage: `url(${extendedMeta.backdropUrl || movie.posterUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07080d]/80 via-[#07080d]/95 to-[#07080d] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-display tracking-wider uppercase text-zinc-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Premiere Showcase</span>
            </Link>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-[#d4af37]/40 text-[#d4af37] text-[10px] font-mono font-semibold tracking-[0.25em] uppercase">
              <Sparkles className="w-3 h-3 text-[#d4af37]" />
              <span>Exclusive Theatrical Engagement</span>
            </div>
          </div>

          {/* Main Hero Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Left: Movie Poster Card */}
            <div className="lg:col-span-4 xl:col-span-4 flex justify-center">
              <div className="w-64 sm:w-72 lg:w-full aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl shadow-black border border-white/10 bg-black relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-5">
                  <span className="text-[9px] font-mono tracking-[0.25em] text-[#d4af37] uppercase font-bold">
                    Official Release
                  </span>
                  <span className="text-xs text-zinc-200 font-display font-medium mt-0.5">
                    Directed by {extendedMeta.director}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Movie Title, Ratings, Storyline, Cast */}
            <div className="lg:col-span-8 xl:col-span-8 space-y-6">
              {/* Category & Format Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3.5 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/35 text-[#d4af37] text-xs font-mono font-medium uppercase tracking-wider">
                  {movie.genre}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/[0.06] text-white text-xs font-mono tracking-wider border border-white/10">
                  {movie.rating}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/[0.04] text-zinc-300 text-xs font-display tracking-wide border border-white/10">
                  {movie.language}
                </span>
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-mono border border-cyan-500/25">
                  IMAX 4K Laser
                </span>
              </div>

              {/* Title & Editorial Tagline */}
              <div className="space-y-3">
                <h1 className="font-cinematic text-4xl sm:text-6xl font-bold text-white tracking-[0.03em] uppercase leading-tight">
                  {movie.title}
                </h1>
                <p className="font-display italic text-zinc-300 border-l-2 border-[#d4af37]/70 pl-4 py-0.5 text-base sm:text-lg font-light leading-relaxed">
                  &ldquo;{extendedMeta.tagline}&rdquo;
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                    {durationFormatted} ({movie.durationMins}m)
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                    Released {new Date(movie.releaseDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Luxury Critics & Audience Rating Cards (No Emoji) */}
              <div className="grid grid-cols-3 gap-3 max-w-lg pt-1">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-1.5 text-[#d4af37]">
                    <Star className="w-4 h-4 fill-[#d4af37]" />
                    <span className="text-lg font-black font-mono tracking-tight">{extendedMeta.imdbRating}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">/ 10</span>
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-400 mt-1">
                    IMDb Score
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-1.5 text-zinc-100">
                    <Award className="w-4 h-4 text-[#d4af37]" />
                    <span className="text-lg font-black font-mono tracking-tight">{extendedMeta.rottenTomatoes}</span>
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-400 mt-1">
                    Tomatometer
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-1.5 text-zinc-100">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-lg font-black font-mono tracking-tight">{extendedMeta.audienceScore}</span>
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-400 mt-1">
                    Audience
                  </span>
                </div>
              </div>

              {/* Storyline & Synopsis */}
              <div className="space-y-1.5 pt-1">
                <h3 className="font-cinematic text-xs uppercase tracking-[0.2em] text-[#d4af37] font-bold">
                  Storyline & Synopsis
                </h3>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-light">
                  {movie.description}
                </p>
              </div>

              {/* Top Cast & Characters Gallery */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-cinematic text-xs uppercase tracking-[0.2em] text-[#d4af37] font-bold">
                    Principal Cast
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
                    Theatrical Ensemble
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {extendedMeta.cast.map((actor, idx) => (
                    <CastMemberCard key={idx} actor={actor} />
                  ))}
                </div>
              </div>

              {/* Sensory Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-display font-semibold text-white block">
                      Laser 4K Projection
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Dual-Laser HDR Clarity</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-display font-semibold text-white block">
                      Dolby Atmos Sound
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">12-Channel Spatial Field</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                    <Armchair className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-display font-semibold text-white block">
                      VIP Recliners
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">8-Minute Live Hold Protection</span>
                  </div>
                </div>
              </div>

              {/* Primary Luxury CTA */}
              <div className="pt-4 flex items-center gap-4">
                <button
                  onClick={scrollToBooking}
                  className="luxury-gold-btn px-8 py-4 rounded-full flex items-center gap-3 font-display text-xs tracking-[0.14em] uppercase transition-all group cursor-pointer"
                >
                  <Ticket className="w-4 h-4 fill-current" />
                  <span>Reserve Screening & Seats</span>
                  <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECOND FOLD: DATE PICKER, SHOWTIMES & INTERACTIVE SEATS
          Smoothly revealed when the user scrolls down
          ======================================================== */}
      <section
        id="booking-section"
        ref={bookingSectionRef}
        className="max-w-7xl mx-auto px-4 sm:px-8 pt-16 space-y-10 scroll-mt-24 transition-opacity duration-700"
      >
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-[10px] font-mono font-semibold uppercase tracking-[0.25em]">
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Auditorium Reservations</span>
          </div>
          <h2 className="font-cinematic text-3xl sm:text-4xl font-bold text-white tracking-wide uppercase">
            Select Screening Date & Seats
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-light">
            Microsecond concurrency locks with 8-minute TTL reservation protection and instant turnstile ticketing.
          </p>
        </div>

        {/* STEP 1: Date Selection Strip */}
        <div className="space-y-3">
          <span className="text-xs font-mono tracking-widest uppercase text-zinc-400 block text-center sm:text-left">
            1. Select Screening Date:
          </span>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
            {upcomingDates.map((item, idx) => {
              const isSelected = idx === selectedDateIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDateIndex(idx)}
                  className={`flex flex-col items-center justify-center min-w-[78px] sm:min-w-[86px] py-3.5 px-3 rounded-2xl border transition-all duration-300 ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#f0d59e] via-[#d4af37] to-[#aa801a] text-zinc-950 border-[#d4af37] shadow-xl shadow-[#d4af37]/20 scale-105 font-bold'
                      : 'bg-[#0f111a] text-zinc-300 border-white/[0.08] hover:border-white/25 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${isSelected ? 'text-zinc-950 font-bold' : 'text-zinc-400'}`}>
                    {item.dayName}
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-display tracking-tight my-0.5">
                    {item.dayNumber}
                  </span>
                  <span className={`text-[9px] font-mono uppercase tracking-widest ${isSelected ? 'text-zinc-900 font-bold' : 'text-zinc-500'}`}>
                    {item.monthName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 2: Time Slots & Screen Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono tracking-widest uppercase text-zinc-400">
              2. Available Showtimes & Formats:
            </span>
            <span className="text-[11px] font-mono text-[#d4af37]">
              Showing for {upcomingDates[selectedDateIndex].dayName}, {upcomingDates[selectedDateIndex].dayNumber} {upcomingDates[selectedDateIndex].monthName}
            </span>
          </div>

          {displayedShows.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    className={`p-5 rounded-2xl border text-left transition-all duration-200 relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#1c1810] via-[#12141e] to-[#0c0d14] border-[#d4af37] shadow-xl shadow-[#d4af37]/15 ring-1 ring-[#d4af37]/60'
                        : 'bg-[#0e101a] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-display font-bold text-white uppercase tracking-wider">
                        {show.screen.name}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-[10px] font-mono font-medium">
                        {show.format}
                      </span>
                    </div>

                    <div className="my-3.5 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-white font-mono tracking-tight">
                        {formatTime(show.startTime)}
                      </span>
                      <span className="text-xs text-zinc-400 font-display">
                        {show.screen.theatre.name}
                      </span>
                    </div>

                    <div className="pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-mono text-[11px]">From {formatCurrency(show.basePrice)}</span>
                      {isSelected ? (
                        <span className="text-[#d4af37] font-mono font-semibold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Auditorium Selected
                        </span>
                      ) : (
                        <span className="text-zinc-400 font-mono text-[11px] group-hover:text-white">
                          Select Auditorium →
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-[#0e101a] rounded-2xl border border-white/[0.08]">
              <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-400">No screenings available for this date. Please select another date.</p>
            </div>
          )}
        </div>

        {/* STEP 3: Live Seating Map with Contained Screen Display */}
        {selectedShowId && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono tracking-widest uppercase text-zinc-400 block">
                  3. Select Your Seats:
                </span>
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                  {currentShow ? `${currentShow.screen.name} • ${currentShow.format} Auditorium` : 'Auditorium'}
                </p>
              </div>

              <button
                onClick={() => loadSeats(false)}
                className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 hover:text-white px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="w-3 h-3 text-zinc-400" />
                <span>Refresh Grid</span>
              </button>
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-lg">
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
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* STRICTLY CONTAINED AUDITORIUM CARD */}
            <div className="rounded-3xl bg-[#0a0b12] border border-white/[0.08] p-5 sm:p-10 shadow-2xl overflow-hidden relative">
              {seatsLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3">
                  <div className="w-7 h-7 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-zinc-400 font-mono">Syncing luxury seating status...</p>
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
          LUXURY FLOATING BOTTOM BAR
          ======================================================== */}
      {selectedSeatIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="floating-bottom-bar-luxury rounded-full p-3 pl-6 pr-3 flex items-center justify-between shadow-2xl border border-white/10 bg-[#0b0c13]/95 backdrop-blur-2xl">
            {/* Left: Total Price */}
            <div className="flex flex-col">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-400 font-semibold">
                Total Amount:
              </span>
              <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight leading-none mt-0.5">
                {formatCurrency(totalPrice)}
              </div>
              <span className="text-[10px] text-[#d4af37] font-mono mt-0.5">
                {selectedSeatIds.length} seat(s) selected
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
              {!isHolding ? (
                <button
                  type="button"
                  onClick={handleAcquireHold}
                  className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-semibold border border-white/15 transition-all"
                >
                  Hold Seats (8m)
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={isBooking}
                className="luxury-gold-btn px-7 py-3 rounded-full text-zinc-950 font-display text-xs tracking-[0.14em] uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
              >
                {isBooking ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Booking...</span>
                  </>
                ) : (
                  <>
                    <span>BUY</span>
                    <span className="font-sans font-bold">→</span>
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
