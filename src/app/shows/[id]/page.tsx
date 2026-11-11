'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Film,
  Calendar,
  Clock,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  CreditCard,
  RefreshCw,
  Armchair,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { SeatMap } from '@/components/SeatMap';
import { HoldTimer } from '@/components/HoldTimer';
import { SeatWithStatus } from '@/server/services/seatHoldService';
import { formatCurrency, formatDateTime, formatTime } from '@/lib/utils';

export default function ShowBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: showId } = use(params);
  const router = useRouter();

  const [show, setShow] = useState<any>(null);
  const [seats, setSeats] = useState<SeatWithStatus[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch show details and current seat occupancy
  const loadShowAndSeats = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`/api/shows/${showId}/seats`);
      if (!res.ok) {
        throw new Error('Failed to load show seats');
      }
      const data = await res.json();
      setShow(data.show);
      setSeats(data.seats);

      // Check if user already holds any seats
      const myHeldSeats = data.seats.filter((s: SeatWithStatus) => s.isHeldByMe);
      if (myHeldSeats.length > 0 && selectedSeatIds.length === 0) {
        setSelectedSeatIds(myHeldSeats.map((s: SeatWithStatus) => s.id));
        setHoldExpiresAt(myHeldSeats[0].holdExpiresAt);
        setIsHolding(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not load seating map');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadShowAndSeats();
    // Background polling every 12 seconds to keep seat status synchronized
    const interval = setInterval(() => {
      loadShowAndSeats(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [showId]);

  // Toggle seat selection
  const handleToggleSeat = (seat: SeatWithStatus) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
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
    if (selectedSeatIds.length === 0) {
      setErrorMsg('Please select at least one seat.');
      return;
    }

    try {
      setErrorMsg('');
      const res = await fetch(`/api/shows/${showId}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatIds: selectedSeatIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?redirect=/shows/${showId}`);
          return;
        }
        setErrorMsg(data.error || 'Seat conflict encountered');
        await loadShowAndSeats(true);
      } else {
        setHoldExpiresAt(data.expiresAt);
        setIsHolding(true);
        setSuccessMsg(`Seats locked for 8 minutes. Proceeding to checkout will confirm your seats.`);
        await loadShowAndSeats(true);
      }
    } catch {
      setErrorMsg('Network error locking seats.');
    }
  };

  // Proceed to confirm booking & ticket issuance
  const handleConfirmAndPay = async () => {
    if (selectedSeatIds.length === 0) return;
    setIsBooking(true);
    setErrorMsg('');

    try {
      // First ensure holds are active
      if (!isHolding) {
        const holdRes = await fetch(`/api/shows/${showId}/hold`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seatIds: selectedSeatIds }),
        });
        if (!holdRes.ok) {
          const holdErr = await holdRes.json();
          setErrorMsg(holdErr.error || 'Could not lock selected seats.');
          setIsBooking(false);
          await loadShowAndSeats(true);
          return;
        }
      }

      // Confirm Booking
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showId,
          seatIds: selectedSeatIds,
          paymentMethod: 'SIMULATED_CARD',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?redirect=/shows/${showId}`);
          return;
        }
        setErrorMsg(data.error || 'Booking failed');
        await loadShowAndSeats(true);
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
    loadShowAndSeats(true);
  };

  // Calculate pricing breakdown
  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
  const totalPrice = selectedSeats.reduce((acc, curr) => acc + curr.price, 0);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Loading luxury auditorium...</p>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="py-16 text-center space-y-4">
        <Film className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Show not found</h2>
        <Link href="/" className="text-xs text-violet-600 hover:underline">
          Return to Movies
        </Link>
      </div>
    );
  }

  const showDateFormatted = new Date(show.startTime).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32">
      {/* Top Controls */}
      <div className="flex items-center justify-between pt-1">
        <Link
          href={`/movies/${show.movie.id}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Movie</span>
        </Link>

        <button
          onClick={() => loadShowAndSeats(false)}
          className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-900 px-3 py-1 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 shadow-xs transition-colors"
        >
          <RefreshCw className="w-3 h-3 text-slate-400" />
          <span>Refresh Hall</span>
        </button>
      </div>

      {/* Luxury Cinematic Header Card */}
      <div className="relative rounded-3xl bg-white border border-slate-200/90 shadow-soft p-6 sm:p-7 overflow-hidden">
        {/* Subtle Ambient Glow Aura */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-violet-100/50 via-pink-100/20 to-transparent rounded-full filter blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-mono font-medium text-slate-400">
              <span>{showDateFormatted}</span>
              <span>•</span>
              <span className="text-slate-600">{show.screen.theatre.name}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {show.movie.title}
            </h1>

            <p className="text-xs text-slate-500">
              {show.screen.name} • {show.movie.genre}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-900 text-white shadow-xs">
                {formatTime(show.startTime)}
              </span>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                {formatCurrency(show.basePrice)}
              </span>
            </div>

            <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-violet-600">
              {show.format} AUDITORIUM
            </span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-500 font-bold text-xs">
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Minimalist Cinema Seat Canvas (With Animated Projector Rays) */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-10 shadow-soft">
        <SeatMap
          seats={seats}
          selectedSeatIds={selectedSeatIds}
          onToggleSeat={handleToggleSeat}
          disabled={isBooking}
        />
      </div>

      {/* 4. Luxury Floating Bottom Bar (Directly adapted from user's reference image) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-40">
        <div className="floating-bottom-bar-luxury rounded-full p-2.5 sm:p-3 pl-6 pr-3 flex items-center justify-between">
          {/* Left: Total Price */}
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Total:
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-none mt-0.5">
              {formatCurrency(totalPrice)}
            </div>
            {selectedSeatIds.length > 0 ? (
              <span className="text-[10px] text-violet-700 font-mono font-medium mt-0.5">
                {selectedSeatIds.length} seat(s) selected
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                Select your seats above
              </span>
            )}
          </div>

          {/* Center: Live TTL Hold Timer */}
          {isHolding && holdExpiresAt && (
            <div className="hidden sm:block">
              <HoldTimer expiresAt={holdExpiresAt} onExpire={handleHoldExpired} />
            </div>
          )}

          {/* Right: Signature Circular "BUY / PROCEED" Button (from reference design) */}
          <div className="flex items-center gap-2.5">
            {!isHolding && selectedSeatIds.length > 0 && (
              <button
                type="button"
                onClick={handleAcquireHold}
                className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
              >
                Hold (8m)
              </button>
            )}

            <button
              type="button"
              disabled={selectedSeatIds.length === 0 || isBooking}
              onClick={handleConfirmAndPay}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-900 hover:bg-violet-700 disabled:opacity-30 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg hover:shadow-glow-violet transition-all duration-200 flex flex-col items-center justify-center gap-0.5 group active:scale-95"
            >
              <span className="group-hover:scale-105 transition-transform font-mono">
                {isBooking ? '...' : 'BUY'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
