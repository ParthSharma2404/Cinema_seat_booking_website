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
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency, formatDateTime, formatTime } from '@/lib/utils';
import { getMovieExtendedMeta } from '@/lib/movie-data';
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
        <div className="w-9 h-9 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono tracking-wider">Loading cinematic showcase...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen pt-32 text-center space-y-4 px-4">
        <Film className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">{error || 'Movie not found'}</h2>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 hover:text-amber-300"
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

  // Filter shows based on selected date index (shows that start on that day, or fallback to all shows)
  const targetDateObj = upcomingDates[selectedDateIndex].date;
  const dateShows = movie.shows.filter((show) => {
    const showDate = new Date(show.startTime);
    return (
      showDate.getFullYear() === targetDateObj.getFullYear() &&
      showDate.getMonth() === targetDateObj.getMonth() &&
      showDate.getDate() === targetDateObj.getDate()
    );
  });

  // If no shows specifically matched that exact calendar date, show the available active shows
  const displayedShows = dateShows.length > 0 ? dateShows : movie.shows;

  const currentShow = movie.shows.find((s) => s.id === selectedShowId);
  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
  const totalPrice = selectedSeats.reduce((acc, curr) => acc + curr.price, 0);

  return (
    <div className="min-h-screen pb-32 text-white">
      {/* ========================================================
          FIRST FOLD: CINEMATIC SHOWCASE & CAST GALLERY
          ======================================================== */}
      <section className="relative w-full overflow-hidden border-b border-white/10 pt-20">
        {/* Full-width Ambient Backdrop */}
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-20 scale-110 pointer-events-none"
          style={{ backgroundImage: `url(${extendedMeta.backdropUrl || movie.posterUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#090b14]/70 via-[#090b14]/90 to-[#090b14] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-10 lg:py-16 space-y-12">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Featured Screenings</span>
            </Link>

            <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25">
              PREMIERE SPOTLIGHT
            </span>
          </div>

          {/* Main Hero Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left: Movie Poster Card */}
            <div className="lg:col-span-4 xl:col-span-4 flex justify-center">
              <div className="w-64 sm:w-72 lg:w-full aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl shadow-black/90 border border-white/15 bg-black relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-5">
                  <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold">
                    OFFICIAL THEATRICAL RELEASE
                  </span>
                  <span className="text-xs text-slate-300 font-mono mt-0.5">
                    Directed by {extendedMeta.director}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Movie Title, Ratings, Synopsis, Sensory Specs */}
            <div className="lg:col-span-8 xl:col-span-8 space-y-6">
              {/* Category & Format Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300 text-xs font-bold uppercase tracking-wider font-mono">
                  {movie.genre}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold font-mono tracking-wider border border-white/10">
                  {movie.rating}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/5 text-slate-300 text-xs font-medium border border-white/10">
                  {movie.language}
                </span>
                <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold border border-violet-500/30 font-mono">
                  IMAX 4K LASER
                </span>
              </div>

              {/* Title & Tagline */}
              <div>
                <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none">
                  {movie.title}
                </h1>
                <p className="text-base sm:text-lg text-slate-400 italic mt-2 font-medium">
                  &ldquo;{extendedMeta.tagline}&rdquo;
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 mt-3">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {durationFormatted} ({movie.durationMins}m)
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    {new Date(movie.releaseDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Verified Ratings Cards (IMDb, Rotten Tomatoes, Audience) */}
              <div className="grid grid-cols-3 gap-3 max-w-md pt-1">
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="text-base font-black font-mono">{extendedMeta.imdbRating}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mt-0.5">
                    IMDb Score
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center text-center">
                  <div className="text-base font-black font-mono text-rose-400">
                    🍅 {extendedMeta.rottenTomatoes}
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mt-0.5">
                    Tomatometer
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center text-center">
                  <div className="text-base font-black font-mono text-emerald-400">
                    🍿 {extendedMeta.audienceScore}
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mt-0.5">
                    Audience
                  </span>
                </div>
              </div>

              {/* Storyline / Synopsis */}
              <div className="space-y-2 pt-1">
                <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400">
                  Storyline & Synopsis
                </h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                  {movie.description}
                </p>
              </div>

              {/* Cast & Crew Gallery */}
              <div className="space-y-3 pt-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400">
                    Top Cast & Characters
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {extendedMeta.cast.length} Actors Featured
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {extendedMeta.cast.map((actor, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center text-center group hover:border-amber-400/40 hover:bg-white/[0.06] transition-all"
                    >
                      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden border-2 border-white/15 group-hover:border-amber-400 group-hover:scale-105 transition-all shadow-md bg-slate-900 mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={actor.photoUrl}
                          alt={actor.name}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <span className="text-xs font-bold text-white leading-tight group-hover:text-amber-300 transition-colors">
                        {actor.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono leading-tight mt-0.5">
                        {actor.character}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sensory Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-400/20 text-amber-400">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-white block font-mono">
                      Laser 4K Projection
                    </span>
                    <span className="text-[10px] text-slate-400">Dual-Laser HDR Sharpness</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-white block font-mono">
                      Dolby Atmos Sound
                    </span>
                    <span className="text-[10px] text-slate-400">12-Channel Acoustic Grid</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400">
                    <Armchair className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-white block font-mono">
                      VIP Recliners
                    </span>
                    <span className="text-[10px] text-slate-400">8-Min Concurrency Holds</span>
                  </div>
                </div>
              </div>

              {/* Direct Jump CTA to Date & Seat Selection */}
              <div className="pt-4 flex items-center gap-4">
                <button
                  onClick={scrollToBooking}
                  className="px-8 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-xl shadow-amber-400/25 transition-all hover:scale-105 active:scale-95 group"
                >
                  <Ticket className="w-4 h-4 fill-current" />
                  <span>Select Date & Reserve Seats</span>
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 text-[11px] font-mono font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Interactive Theatrical Booking</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Select Your Date, Screen & Seats
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time seat locks with 8-minute TTL reservation protection and instant single-use QR ticketing.
          </p>
        </div>

        {/* STEP 1: Date Selection Strip */}
        <div className="space-y-3">
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400 block text-center sm:text-left">
            1. Choose Screening Date:
          </span>
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
            {upcomingDates.map((item, idx) => {
              const isSelected = idx === selectedDateIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDateIndex(idx)}
                  className={`flex flex-col items-center justify-center min-w-[76px] sm:min-w-[84px] py-3 px-3 rounded-2xl border transition-all duration-200 ${
                    isSelected
                      ? 'bg-amber-400 text-black border-amber-300 shadow-xl shadow-amber-400/20 scale-105 font-bold'
                      : 'bg-[#10121d] text-slate-300 border-white/10 hover:border-white/30 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${isSelected ? 'text-black' : 'text-slate-400'}`}>
                    {item.dayName}
                  </span>
                  <span className="text-xl sm:text-2xl font-black tracking-tight my-0.5">
                    {item.dayNumber}
                  </span>
                  <span className={`text-[10px] font-mono uppercase tracking-widest ${isSelected ? 'text-black/80 font-bold' : 'text-slate-400'}`}>
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
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
              2. Available Showtimes & Formats:
            </span>
            <span className="text-[11px] font-mono text-violet-400">
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
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-br from-violet-950/80 to-[#10121d] border-violet-500 shadow-xl shadow-violet-600/20 ring-1 ring-violet-400'
                        : 'bg-[#0e101a] border-white/10 hover:border-white/25 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono uppercase">
                        {show.screen.name}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-violet-600/30 border border-violet-500/40 text-violet-300 text-[10px] font-bold font-mono">
                        {show.format}
                      </span>
                    </div>

                    <div className="my-3 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-white font-mono tracking-tight">
                        {formatTime(show.startTime)}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {show.screen.theatre.name}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono">From {formatCurrency(show.basePrice)}</span>
                      {isSelected ? (
                        <span className="text-amber-400 font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Selected
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px] group-hover:text-white">
                          Click to View Seats →
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-[#0e101a] rounded-2xl border border-white/10">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No screenings available for this date. Please select another date.</p>
            </div>
          )}
        </div>

        {/* STEP 3: Live Seating Map with Contained Screen Display */}
        {selectedShowId && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400 block">
                  3. Select Your Seats:
                </span>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {currentShow ? `${currentShow.screen.name} • ${currentShow.format} Auditorium` : 'Auditorium'}
                </p>
              </div>

              <button
                onClick={() => loadSeats(false)}
                className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="w-3 h-3 text-slate-400" />
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
            <div className="rounded-3xl bg-[#0c0d16] border border-white/10 p-5 sm:p-10 shadow-2xl overflow-hidden relative">
              {seatsLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3">
                  <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-mono">Syncing luxury seating status...</p>
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
          Only visible when seats are selected or being booked
          ======================================================== */}
      {selectedSeatIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="floating-bottom-bar-luxury rounded-full p-3 pl-6 pr-3 flex items-center justify-between shadow-2xl">
            {/* Left: Total Price */}
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Total Amount:
              </span>
              <div className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none mt-0.5">
                {formatCurrency(totalPrice)}
              </div>
              <span className="text-[10px] text-amber-400 font-mono font-medium mt-0.5">
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
                  className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold border border-white/15 transition-all"
                >
                  Hold Seats (8m)
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={isBooking}
                className="px-6 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
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
