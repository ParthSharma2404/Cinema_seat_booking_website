'use client';

import React, { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Film,
  Clock,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Ticket,
  Star,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  RefreshCw,
  Clapperboard,
  Play,
  Users,
  Bookmark,
} from 'lucide-react';
import { formatCurrency, formatTime } from '@/lib/utils';
import { getMovieExtendedMeta, CastMember } from '@/lib/movie-data';
import { SeatMap } from '@/components/SeatMap';
import { TicketPassCard } from '@/components/TicketPassCard';
import { SeatWithStatus } from '@/server/services/seatHoldService';
import { useSeatWebSocket, WebSocketSeatMessage } from '@/hooks/useSeatWebSocket';
import Lenis from 'lenis';

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
  backdropUrl?: string | null;
  rating: string;
  releaseDate: string;
  shows: MovieShow[];
  cast?: CastMember[];
}

const REAL_POSTERS: Record<string, string> = {
  'Dune: Part Two': '/posters/dune-poster.jpg',
  'Oppenheimer': 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
  'Interstellar': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
  'Inception': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
};

const MOVIE_BACKDROPS: Record<string, string> = {
  'Dune: Part Two': 'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=1920&auto=format&fit=crop&q=85',
  'Oppenheimer': 'https://images.unsplash.com/photo-1516339901601-2e1562986307?w=1920&auto=format&fit=crop&q=85',
  'Interstellar': 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1920&auto=format&fit=crop&q=85',
  'Inception': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&auto=format&fit=crop&q=85',
};

// Cast Member Avatar with Name & Role (Enlarged prominent high-definition portraits)
function CastMemberItem({ actor }: { actor: { name: string; character: string; photoUrl?: string | null } }) {
  const [imgError, setImgError] = useState(false);
  const initials = (actor.name || '')
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '••';

  return (
    <div className="flex items-center gap-4 flex-shrink-0 group">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white/20 bg-gradient-to-br from-zinc-800 to-zinc-900 flex-shrink-0 flex items-center justify-center shadow-xl group-hover:border-white/60 group-hover:scale-105 transition-all duration-300">
        {!imgError && actor.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={actor.photoUrl}
            alt={actor.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-top filter brightness-105 contrast-105"
          />
        ) : (
          <span className="text-base sm:text-lg font-mono font-bold text-zinc-300 group-hover:text-white transition-colors">
            {initials}
          </span>
        )}
      </div>
      <div className="flex flex-col text-left">
        <span className="text-sm sm:text-base font-semibold text-white leading-tight group-hover:text-[#cca255] transition-colors whitespace-nowrap">
          {actor.name}
        </span>
        <span className="text-xs sm:text-sm text-zinc-400 font-normal leading-tight mt-1 whitespace-nowrap">
          {actor.character}
        </span>
      </div>
    </div>
  );
}

export default function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedShowId = searchParams.get('showId');

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // Booking Flow States
  const [currentUser, setCurrentUser] = useState<any>(null);
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

  // Refs for 2 full-screen sections and Lenis instance
  const containerRef = useRef<HTMLDivElement>(null);
  const section1Ref = useRef<HTMLElement>(null);
  const section2Ref = useRef<HTMLElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Fade-in trigger on mount & Lenis silky smooth scroll setup
  useEffect(() => {
    setIsMounted(true);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
    });

    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Fetch current user session to determine ownership of held seats
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => null);
  }, []);

  // Generate 7 upcoming dates starting today
  const upcomingDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      date: d,
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
      formattedShort: `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getDate()}`,
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

          // Select requested show or first available upcoming show and auto-align date
          if (data.movie.shows && data.movie.shows.length > 0) {
            let targetShow: MovieShow | undefined;
            if (requestedShowId) {
              targetShow = data.movie.shows.find((s: MovieShow) => s.id === requestedShowId);
            }
            // If requested show is missing or has already started/ended, pick first upcoming show
            if (!targetShow || new Date(targetShow.startTime).getTime() <= Date.now()) {
              const upcomingShow = data.movie.shows.find(
                (s: MovieShow) => new Date(s.startTime).getTime() > Date.now()
              );
              if (upcomingShow) {
                targetShow = upcomingShow;
              } else if (!targetShow) {
                targetShow = data.movie.shows[0];
              }
            }

            if (targetShow) {
              setSelectedShowId(targetShow.id);
              const showDate = new Date(targetShow.startTime);
              const matchingIdx = upcomingDates.findIndex((item) => {
                const d = item.date;
                return (
                  d.getFullYear() === showDate.getFullYear() &&
                  d.getMonth() === showDate.getMonth() &&
                  d.getDate() === showDate.getDate()
                );
              });
              if (matchingIdx !== -1) {
                setSelectedDateIndex(matchingIdx);
              }
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
        setHoldExpiresAt(myHeldSeats[0].holdExpiresAt ? new Date(myHeldSeats[0].holdExpiresAt).toISOString() : null);
        setIsHolding(true);
      }

      // Prune any seats from selection that have been claimed by another guest
      setSelectedSeatIds((prev) => {
        if (prev.length === 0) return prev;
        const stillValid = prev.filter((id) => {
          const s = data.seats.find((seat: SeatWithStatus) => seat.id === id);
          return s && (s.status === 'AVAILABLE' || s.isHeldByMe);
        });
        if (stillValid.length < prev.length) {
          const lostCount = prev.length - stillValid.length;
          setErrorMsg(
            lostCount === 1
              ? 'A seat you had chosen was just reserved by another guest.'
              : `${lostCount} seats you had chosen were just reserved by another guest.`
          );
        }
        return stillValid;
      });
    } catch (err: any) {
      if (!silent) setErrorMsg(err.message || 'Could not load seating map');
    } finally {
      if (!silent) setSeatsLoading(false);
    }
  };

  // Instant Real-Time WebSocket Synchronization (<15ms direct in-memory delta patching)
  const handleWebSocketMessage = React.useCallback(
    (msg: WebSocketSeatMessage) => {
      if (!msg.type) return;

      const affectedIds = new Set(msg.seatIds || []);

      if (msg.type === 'SEAT_HELD' && affectedIds.size > 0) {
        // 1. Instantly patch seat status in memory (0ms network delay!)
        setSeats((prevSeats) =>
          prevSeats.map((seat) => {
            if (affectedIds.has(seat.id)) {
              const isHeldByMe = Boolean(currentUser && msg.userId === currentUser.id);
              return {
                ...seat,
                status: 'HELD',
                isHeldByMe,
                holdExpiresAt: msg.expiresAt ? new Date(msg.expiresAt) : null,
              };
            }
            return seat;
          })
        );

        // 2. If held by another user, immediately prune from my selected seats
        const isHeldByOther = !currentUser || msg.userId !== currentUser.id;
        if (isHeldByOther) {
          setSelectedSeatIds((prevSelected) => {
            const hasConflict = prevSelected.some((id) => affectedIds.has(id));
            if (hasConflict) {
              setErrorMsg('A seat you were viewing was just held by another guest.');
            }
            return prevSelected.filter((id) => !affectedIds.has(id));
          });
        }
        return;
      }

      if (msg.type === 'SEAT_RELEASED' && affectedIds.size > 0) {
        // Instantly mark seats as AVAILABLE in memory
        setSeats((prevSeats) =>
          prevSeats.map((seat) => {
            if (affectedIds.has(seat.id)) {
              return {
                ...seat,
                status: 'AVAILABLE',
                isHeldByMe: false,
                holdExpiresAt: null,
              };
            }
            return seat;
          })
        );
        return;
      }

      if (msg.type === 'SEAT_BOOKED' && affectedIds.size > 0) {
        // Instantly mark seats as BOOKED in memory
        setSeats((prevSeats) =>
          prevSeats.map((seat) => {
            if (affectedIds.has(seat.id)) {
              return {
                ...seat,
                status: 'BOOKED',
                isHeldByMe: false,
              };
            }
            return seat;
          })
        );
        setSelectedSeatIds((prevSelected) =>
          prevSelected.filter((id) => !affectedIds.has(id))
        );
        return;
      }

      // Fallback or full REFRESH
      loadSeats(true);
    },
    [selectedShowId, currentUser]
  );

  useSeatWebSocket(selectedShowId, handleWebSocketMessage);

  useEffect(() => {
    if (selectedShowId) {
      setSelectedSeatIds([]);
      setHoldExpiresAt(null);
      setIsHolding(false);
      loadSeats();
      const interval = setInterval(() => {
        loadSeats(true);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [selectedShowId]);

  // Smooth scroll between the 2 full-screen sections with Lenis momentum
  const scrollToSection = (sectionIndex: 1 | 2) => {
    const target = sectionIndex === 1 ? section1Ref.current : section2Ref.current;
    if (!target) return;

    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, {
        offset: 0,
        duration: 1.3,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Toggle seat selection
  const handleToggleSeat = async (seat: SeatWithStatus) => {
    if (isCurrentShowStartedOrEnded) {
      setErrorMsg('This screening has already started or ended. Booking is closed.');
      return;
    }
    if (seat.id.startsWith('skeleton-') || seat.id.startsWith('temp-')) {
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');

    if (selectedSeatIds.includes(seat.id)) {
      const nextSeatIds = selectedSeatIds.filter((sId) => sId !== seat.id);
      setSelectedSeatIds(nextSeatIds);

      // If this seat was held in the database, release it immediately so other users can see it unlocked
      if (seat.isHeldByMe || isHolding) {
        try {
          await fetch(`/api/shows/${selectedShowId}/hold`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seatIds: [seat.id] }),
          });
        } catch {
          // silent error
        }
      }

      if (nextSeatIds.length === 0) {
        setIsHolding(false);
        setHoldExpiresAt(null);
      }
    } else {
      if (selectedSeatIds.length >= 10) {
        setErrorMsg('Maximum 10 seats allowed per booking.');
        return;
      }
      setSelectedSeatIds((prev) => [...prev, seat.id]);
    }
  };

  // Final checkout: acquire 8-minute hold and proceed to checkout (DOES NOT confirm booking until payment!)
  const handleProceedToCheckout = async () => {
    if (isCurrentShowStartedOrEnded) {
      setErrorMsg('This screening has already started or ended. Booking is closed.');
      return;
    }
    if (!selectedShowId) {
      setErrorMsg('Please select a showtime.');
      return;
    }

    const validSeatIds = selectedSeatIds.filter(
      (id) => !id.startsWith('skeleton-') && !id.startsWith('temp-')
    );
    if (validSeatIds.length === 0) {
      setErrorMsg('Please select at least one seat to proceed.');
      return;
    }

    try {
      setIsBooking(true);
      setErrorMsg('');

      // Acquire or refresh 8-minute hold
      const holdRes = await fetch(`/api/shows/${selectedShowId}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatIds: validSeatIds,
        }),
      });

      const holdData = await holdRes.json();
      if (!holdRes.ok) {
        if (holdRes.status === 401) {
          router.push(`/login?redirect=/movies/${id}?showId=${selectedShowId}`);
          return;
        }
        setErrorMsg(holdData.error || 'Seats no longer available. Please select other seats.');
        setSelectedSeatIds([]);
        await loadSeats(true);
        return;
      }

      // 8-minute hold is active in database! Broadcasted to other users via WebSockets!
      // Forward user to dedicated /checkout page with live HoldTimer to review & pay
      router.push(`/checkout?showId=${selectedShowId}&seats=${validSeatIds.join(',')}`);
    } catch {
      setErrorMsg('Network error while reserving seats. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  if (loading || !movie) {
    if (error) {
      return (
        <div className="w-full h-screen flex flex-col items-center justify-center space-y-4 px-4 bg-[#08080a] text-center">
          <Film className="w-12 h-12 text-zinc-600 mx-auto" />
          <h2 className="text-2xl font-sans font-bold text-white">{error || 'Movie not found'}</h2>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-sans tracking-wider text-amber-400 hover:underline uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Featured Screenings
          </Link>
        </div>
      );
    }

    return (
      <div className="relative w-full min-h-screen overflow-hidden bg-[#090b10] text-zinc-100 flex flex-col justify-between px-6 sm:px-10 lg:px-14 pt-20 pb-12 select-none animate-pulse">
        {/* Soft Ambient Background Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 50% 10%, rgba(204, 162, 85, 0.08) 0%, transparent 70%)',
          }}
        />

        {/* Top Breadcrumb Placeholder */}
        <div className="relative z-10 pt-2 flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-white/10" />
          <div className="w-28 h-3.5 rounded-full bg-white/10" />
        </div>

        {/* Main 2-Column Hero Skeleton */}
        <div className="relative z-10 my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center max-w-7xl mx-auto w-full">
          {/* Left Column Skeleton */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            {/* Badges */}
            <div className="flex items-center gap-2">
              <div className="w-16 h-6 rounded-full bg-white/10" />
              <div className="w-14 h-6 rounded-full bg-white/10" />
              <div className="w-24 h-6 rounded-full bg-white/10" />
              <div className="w-20 h-6 rounded-full bg-white/10" />
            </div>

            {/* Title & Tagline */}
            <div className="space-y-2 pt-2">
              <div className="w-3/4 max-w-md h-12 sm:h-14 rounded-2xl bg-white/15" />
              <div className="w-1/2 max-w-xs h-4 rounded-full bg-white/10" />
            </div>

            {/* Metadata row */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-12 h-3.5 rounded-full bg-white/10" />
              <div className="w-1 h-3 bg-white/10" />
              <div className="w-32 h-3.5 rounded-full bg-white/10" />
              <div className="w-1 h-3 bg-white/10" />
              <div className="w-16 h-3.5 rounded-full bg-white/10" />
            </div>

            {/* Synopsis Lines */}
            <div className="space-y-2 pt-2 max-w-xl">
              <div className="w-full h-3.5 rounded-full bg-white/10" />
              <div className="w-5/6 h-3.5 rounded-full bg-white/10" />
              <div className="w-2/3 h-3.5 rounded-full bg-white/10" />
            </div>

            {/* Ratings row */}
            <div className="flex items-center gap-4 pt-1">
              <div className="w-20 h-4 rounded-full bg-white/10" />
              <div className="w-28 h-4 rounded-full bg-white/10" />
              <div className="w-24 h-4 rounded-full bg-white/10" />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-4">
              <div className="w-48 h-12 rounded-full bg-white/20" />
              <div className="w-36 h-12 rounded-full bg-white/10" />
            </div>
          </div>

          {/* Right Poster Skeleton */}
          <div className="hidden lg:flex justify-end lg:col-span-5 xl:col-span-4">
            <div className="w-[320px] xl:w-[350px] aspect-[2/3] rounded-2xl bg-white/[0.04] border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>
          </div>
        </div>

        {/* Principal Cast Row Skeleton */}
        <div className="relative z-10 pt-4 pb-2 max-w-7xl mx-auto w-full space-y-3">
          <div className="w-28 h-4 rounded-full bg-white/10" />
          <div className="flex items-center gap-6 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10" />
                <div className="space-y-2">
                  <div className="w-24 h-3.5 rounded-full bg-white/10" />
                  <div className="w-16 h-3 rounded-full bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const extendedMeta = getMovieExtendedMeta(movie.title);
  const hours = Math.floor(movie.durationMins / 60);
  const mins = movie.durationMins % 60;
  const durationFormatted = `${hours}h ${mins}m`;

  const targetDateObj = upcomingDates[selectedDateIndex].date;
  const displayedShows = (movie?.shows || [])
    .filter((show) => {
      const showDate = new Date(show.startTime);
      return (
        showDate.getFullYear() === targetDateObj.getFullYear() &&
        showDate.getMonth() === targetDateObj.getMonth() &&
        showDate.getDate() === targetDateObj.getDate()
      );
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const currentShow = movie?.shows?.find((s) => s.id === selectedShowId) || displayedShows[0];
  const isCurrentShowStartedOrEnded = currentShow
    ? new Date(currentShow.startTime).getTime() <= Date.now()
    : false;
  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
  const totalPrice = selectedSeats.reduce((acc, curr) => acc + curr.price, 0);

  const posterUrl =
    movie.posterUrl ||
    (movie.title === 'Dune: Part Two'
      ? '/posters/dune-poster.jpg'
      : REAL_POSTERS[movie.title] || '/posters/dune-poster.jpg');

  const heroBackdropUrl =
    movie.backdropUrl ||
    MOVIE_BACKDROPS[movie.title] ||
    extendedMeta.backdropUrl ||
    posterUrl;

  const castToDisplay =
    movie.cast && movie.cast.length > 0 ? movie.cast : extendedMeta.cast;

  // Format screen display text for Ticket (e.g. "Screen 1 - IMAX with Laser")
  const screenFormatted = currentShow
    ? currentShow.screen.name
    : 'Screen 1 - IMAX with Laser';

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-h-screen overflow-x-clip select-none bg-[#090b10] text-zinc-100 transition-opacity duration-500 ease-out ${
        isMounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* ========================================================
          SECTION 1: EDITORIAL MOVIE SHOWCASE (IMAGE 1)
          Full-bleed fold with smooth fade into Section 2
          ======================================================== */}
      <section
        id="section-hero"
        ref={section1Ref}
        className="relative w-full min-h-screen flex flex-col justify-between px-6 sm:px-10 lg:px-14 pt-20 pb-12"
      >
        {/* Backdrop Image strictly inside Section 1 with smooth vertical mask */}
        <div
          className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
          style={{
            backgroundImage: `url(${heroBackdropUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 20%',
            opacity: 0.6,
            filter: 'brightness(0.9) contrast(1.1)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 50%, rgba(0,0,0,0.3) 80%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, black 0%, black 50%, rgba(0,0,0,0.3) 80%, transparent 100%)',
          }}
        />

        {/* Directional & Vertical Gradient Overlay (Seamlessly dissolves into page tone #090b10) */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background:
              'linear-gradient(to right, rgba(8,10,14,0.96) 0%, rgba(10,13,18,0.85) 45%, rgba(14,17,23,0.3) 75%, rgba(14,17,23,0.65) 100%), linear-gradient(to bottom, rgba(8,10,14,0.35) 0%, rgba(10,13,18,0.1) 35%, rgba(10,12,18,0.75) 70%, #090b10 100%)',
          }}
        />

        {/* Top Breadcrumb: ← All Movies & Shows */}
        <div className="relative z-10 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-sans tracking-wide text-zinc-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>All Movies &amp; Shows</span>
          </Link>
        </div>

        {/* Central 2-Column Hero: Typography & Meta on left, 2:3 Poster on right (Matching Image 1) */}
        <div className="relative z-10 my-auto py-4 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center max-w-7xl mx-auto w-full">
          {/* Left Column: Badges, Title, Tagline, Stats, Synopsis, Ratings, Buttons */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-3.5 sm:space-y-4">
            {/* Format Pills: [IMAX] [PG-13] [Genre] [Language] */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 rounded-full bg-white text-black text-xs font-bold font-sans tracking-wide shadow-sm">
                IMAX
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-sans font-medium">
                {movie.rating}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-zinc-200 text-xs font-sans">
                {movie.genre}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-zinc-200 text-xs font-sans">
                {movie.language}
              </span>
            </div>

            {/* Title & Tagline */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-wide uppercase leading-tight font-sans drop-shadow-md">
                {movie.title}
              </h1>
              {extendedMeta.tagline && (
                <p className="text-sm sm:text-base text-zinc-300 font-light italic mt-1 flex items-center gap-2">
                  <span className="text-zinc-500 font-normal">|</span>
                  <span>&ldquo;{extendedMeta.tagline}&rdquo;</span>
                </p>
              )}
            </div>

            {/* Technical Metadata Row */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-sans text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>{new Date(movie.releaseDate).getFullYear()}</span>
              </span>
              <span className="text-zinc-600">|</span>
              <span className="flex items-center gap-1.5">
                <Clapperboard className="w-3.5 h-3.5 text-zinc-400" />
                <span>
                  Directed by <strong className="text-zinc-100 font-medium">{extendedMeta.director}</strong>
                </span>
              </span>
              <span className="text-zinc-600">|</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>{durationFormatted}</span>
              </span>
            </div>

            {/* Narrative Synopsis */}
            <p className="text-sm text-zinc-300 leading-relaxed max-w-xl font-normal drop-shadow-sm line-clamp-3">
              {movie.description}
            </p>

            {/* Ratings Row */}
            <div className="flex flex-wrap items-center gap-3.5 sm:gap-4 text-xs font-sans text-zinc-200 pt-0.5">
              <span className="flex items-center gap-1.5 text-white font-semibold">
                <Star className="w-4 h-4 text-white fill-white" />
                <span>{extendedMeta.imdbRating} / 10</span>
              </span>
              <span className="text-zinc-600">|</span>
              <span className="flex items-center gap-1.5">
                <span className="text-sm leading-none">🍅</span>
                <span>
                  <strong className="text-white font-semibold">{extendedMeta.rottenTomatoes}</strong> Tomatometer
                </span>
              </span>
              <span className="text-zinc-600">|</span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span>
                  <strong className="text-white font-semibold">{extendedMeta.audienceScore}</strong> Audience
                </span>
              </span>
            </div>

            {/* Action Buttons: SELECT DATE & SEATS → (Smooth scrolls down to Section 2) */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => scrollToSection(2)}
                className="px-6 py-3 rounded-full bg-white text-black font-bold text-xs tracking-wider uppercase flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-xl active:scale-95 cursor-pointer"
              >
                <Ticket className="w-4 h-4" />
                <span>Select Date &amp; Seats →</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToSection(2)}
                className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs tracking-wider uppercase flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>View Showtimes</span>
              </button>

              <button
                type="button"
                aria-label="Bookmark film"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Clean 2:3 Vertical Movie Poster Card */}
          <div className="hidden lg:flex justify-end lg:col-span-5 xl:col-span-4">
            <div className="relative w-[320px] xl:w-[350px] aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl bg-zinc-900 border border-white/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Principal Cast Section (No hard border divider — seamless integration) */}
        <div className="relative z-10 pt-4 pb-2 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-white">
              Principal Cast
            </h3>
            <button
              type="button"
              className="text-[11px] text-zinc-400 hover:text-white transition-colors flex items-center gap-1 group"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          <div className="flex items-center gap-7 sm:gap-9 overflow-x-auto pb-2 scrollbar-none">
            {castToDisplay.map((actor, idx) => (
              <CastMemberItem key={idx} actor={actor} />
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 2: LUXURIOUS SEAT BOOKING & PHYSICAL TICKET (IMAGE 2)
          No fixed line — seamlessly continues the single unified page background
          ======================================================== */}
      <section
        id="section-booking"
        ref={section2Ref}
        className="relative w-full min-h-screen flex flex-col justify-between bg-transparent py-10 sm:py-14 px-4 sm:px-8 lg:px-14"
      >
        {/* Soft Ambient Cinema Screen Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 40% at 50% 120px, rgba(204, 162, 85, 0.12) 0%, transparent 70%)',
          }}
        />

        {/* TOP HEADER: SCREEN tracker + "CHOOSE YOUR SEATS" (Fira Sans) + Date & Time pills */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 max-w-7xl mx-auto w-full pt-2 pb-4">
          {/* Left Title Group in project's authentic Fira Sans font */}
          <div>
            <span className="text-[11px] font-mono font-bold tracking-[0.25em] uppercase text-[#cca255] block mb-1">
              {currentShow
                ? `${currentShow.screen.name} • ${currentShow.format}`
                : 'SCREEN 1 • IMAX WITH LASER'}
            </span>
            <h2 className="font-sans text-3xl sm:text-4xl text-white font-bold tracking-tight uppercase leading-none">
              Choose your seats
            </h2>
          </div>

          {/* Right: Sleek Date & Showtime Selection Pills */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Date Pills (All 7 Days) */}
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md overflow-x-auto scrollbar-none max-w-full">
              {upcomingDates.map((item, idx) => {
                const isSelected = idx === selectedDateIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (isHolding && selectedShowId && selectedSeatIds.length > 0) {
                        fetch(`/api/shows/${selectedShowId}/hold`, {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ seatIds: selectedSeatIds }),
                        }).catch(() => null);
                      }
                      setSelectedDateIndex(idx);
                      const showsOnDate = (movie.shows || [])
                        .filter((s) => {
                          const sd = new Date(s.startTime);
                          return (
                            sd.getFullYear() === item.date.getFullYear() &&
                            sd.getMonth() === item.date.getMonth() &&
                            sd.getDate() === item.date.getDate()
                          );
                        })
                        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

                      // Auto-select first upcoming show on that date
                      const firstUpcoming = showsOnDate.find(
                        (s) => new Date(s.startTime).getTime() > Date.now()
                      );
                      const nextShowId = firstUpcoming
                        ? firstUpcoming.id
                        : showsOnDate.length > 0
                        ? showsOnDate[0].id
                        : null;

                      if (nextShowId !== selectedShowId) {
                        setSeats([]);
                      }
                      setSelectedShowId(nextShowId);
                      setSelectedSeatIds([]);
                      setIsHolding(false);
                      setHoldExpiresAt(null);
                      setErrorMsg('');
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-sans whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#e8c887] text-zinc-950 font-bold shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.formattedShort}
                  </button>
                );
              })}
            </div>

            {/* Quick Showtime Pills with Started/Ended Slots Disabled */}
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md flex-wrap">
              {displayedShows.length > 0 ? (
                displayedShows.map((show) => {
                  const isPast = new Date(show.startTime).getTime() <= Date.now();
                  const isSelected = show.id === selectedShowId;
                  return (
                    <button
                      key={show.id}
                      type="button"
                      disabled={isPast}
                      onClick={() => {
                        if (!isPast && show.id !== selectedShowId) {
                          if (isHolding && selectedShowId && selectedSeatIds.length > 0) {
                            fetch(`/api/shows/${selectedShowId}/hold`, {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ seatIds: selectedSeatIds }),
                            }).catch(() => null);
                          }
                          setSeats([]);
                          setSelectedShowId(show.id);
                          setSelectedSeatIds([]);
                          setIsHolding(false);
                          setHoldExpiresAt(null);
                          setErrorMsg('');
                        }
                      }}
                      title={
                        isPast
                          ? 'This screening has already started or ended'
                          : `${formatTime(show.startTime)} (${show.screen?.name || 'Screen'}) - Available`
                      }
                      className={`px-3 py-1 rounded-full text-xs font-mono transition-all select-none ${
                        isPast
                          ? 'opacity-60 cursor-not-allowed text-zinc-300 bg-white/[0.04] border border-white/40 line-through'
                          : isSelected
                          ? 'bg-[#e8c887] text-zinc-950 font-bold shadow-sm cursor-pointer'
                          : 'text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer'
                      }`}
                    >
                      {formatTime(show.startTime)}
                    </button>
                  );
                })
              ) : (
                <span className="px-3 py-1 text-xs font-mono text-zinc-400">No screenings on this date</span>
              )}
            </div>

            {/* Refresh Grid Button */}
            <button
              type="button"
              onClick={() => loadSeats(false)}
              title="Refresh live seating status"
              className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Concluded Screening Warning Banner */}
        {isCurrentShowStartedOrEnded && (
          <div className="relative z-20 max-w-2xl mx-auto p-3.5 rounded-xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-xl mb-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                The screening at <strong className="text-white font-mono">{currentShow ? formatTime(currentShow.startTime) : ''}</strong> has already started or concluded. Seat booking is closed. Please select an active upcoming screening time above.
              </span>
            </div>
          </div>
        )}

        {/* Notifications & Error banners */}
        {errorMsg && (
          <div className="relative z-20 max-w-lg mx-auto p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-2 shadow-xl mb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg('')}
              className="text-xs text-rose-300 hover:text-white px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {successMsg && (
          <div className="relative z-20 max-w-lg mx-auto p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-2 shadow-xl mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg('')}
              className="text-xs text-emerald-300 hover:text-white px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* MAIN CHAMBER: Left SeatMap Auditorium + Right Physical Ticket (Matching Image 2) */}
        <div className="relative z-10 max-w-7xl mx-auto w-full my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-4">
          {/* LEFT 7-8 COLS: Curved Auditorium & Golden Overhead Screen */}
          <div className="lg:col-span-8 flex flex-col items-center justify-center">
            <SeatMap
              seats={seats}
              selectedSeatIds={selectedSeatIds}
              onToggleSeat={handleToggleSeat}
              disabled={seatsLoading || isBooking || isCurrentShowStartedOrEnded}
              basePrice={currentShow?.basePrice || 250}
            />
          </div>

          {/* RIGHT 4-5 COLS: Authentic Physical Boarding Pass / Ticket Receipt Card (Image 2) */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <TicketPassCard
              movieTitle={movie.title}
              dateFormatted={upcomingDates[selectedDateIndex].formattedShort}
              timeFormatted={currentShow ? formatTime(currentShow.startTime) : '11:15 AM'}
              screenFormatted={screenFormatted}
              selectedSeats={selectedSeats}
              totalPrice={totalPrice}
              isHolding={isHolding}
              holdExpiresAt={holdExpiresAt}
              onHoldExpire={() => {
                setIsHolding(false);
                setHoldExpiresAt(null);
                setSelectedSeatIds([]);
                setErrorMsg('Seat hold expired. Please re-select seats.');
                loadSeats(true);
              }}
              onProceedToPay={handleProceedToCheckout}
              isProcessing={isBooking}
              isClosed={isCurrentShowStartedOrEnded}
            />
          </div>
        </div>

        {/* Bottom Bar: Back to Top prompt */}
        <div className="relative z-10 flex justify-center pt-4 pb-2">
          <button
            type="button"
            onClick={() => scrollToSection(1)}
            className="text-[10px] font-mono tracking-widest text-zinc-500 hover:text-zinc-300 uppercase transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>↑ BACK TO MOVIE OVERVIEW</span>
          </button>
        </div>
      </section>
    </div>
  );
}
