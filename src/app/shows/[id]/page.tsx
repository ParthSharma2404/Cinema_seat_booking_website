'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Film,
  Calendar,
  Clock,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Armchair,
  CheckCircle2,
  Lock,
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
      setIsHolding(true);
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
        setErrorMsg(data.error || 'Failed to acquire temporary hold');
        await loadShowAndSeats(true);
      } else {
        setHoldExpiresAt(data.expiresAt);
        setSuccessMsg(`Seats locked for 8 minutes! Complete checkout before the timer expires.`);
        await loadShowAndSeats(true);
      }
    } catch {
      setErrorMsg('Network error while requesting seat hold');
    }
  };

  // Confirm booking & proceed to checkout
  const handleConfirmAndPay = async () => {
    if (selectedSeatIds.length === 0) {
      setErrorMsg('Please select at least one seat to book.');
      return;
    }

    try {
      setIsBooking(true);
      setErrorMsg('');

      // Auto-hold first if not already held
      if (!isHolding) {
        const holdRes = await fetch(`/api/shows/${showId}/hold`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seatIds: selectedSeatIds }),
        });
        if (!holdRes.ok) {
          const holdData = await holdRes.json();
          if (holdRes.status === 401) {
            router.push(`/login?redirect=/shows/${showId}`);
            return;
          }
          setErrorMsg(holdData.error || 'Seats no longer available');
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
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Loading luxury auditorium...</p>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="py-16 text-center space-y-4">
        <Film className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-lg font-bold text-white">Show not found</h2>
        <Link href="/" className="text-xs text-violet-400 hover:underline">
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
    <div className="max-w-4xl mx-auto space-y-6 pt-24 px-4 sm:px-6 pb-32 w-full">
      {/* Top Controls */}
      <div className="flex items-center justify-between pt-1">
        <Link
          href={`/movies/${show.movie.id}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Movie</span>
        </Link>

        <button
          onClick={() => loadShowAndSeats(false)}
          className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white px-3 py-1 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="w-3 h-3 text-slate-400" />
          <span>Refresh Hall</span>
        </button>
      </div>

      {/* Cinematic Header Card */}
      <div className="relative rounded-3xl bg-[#0e101a] border border-white/10 shadow-2xl p-6 sm:p-7 overflow-hidden">
        {/* Subtle Ambient Glow Aura */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-violet-600/20 via-pink-600/10 to-transparent rounded-full filter blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-mono font-medium text-slate-400">
              <span>{showDateFormatted}</span>
              <span>•</span>
              <span className="text-slate-300 font-semibold">{show.screen.theatre.name}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {show.movie.title}
            </h1>

            <p className="text-xs text-slate-400">
              {show.screen.name} • {show.movie.genre}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/10 text-white border border-white/10 shadow-xs">
                {formatTime(show.startTime)}
              </span>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-violet-600/30 text-violet-300 border border-violet-500/40">
                {formatCurrency(show.basePrice)}
              </span>
            </div>

            <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-violet-400">
              {show.format} AUDITORIUM
            </span>
          </div>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Dark Cinema Seat Canvas */}
      <div className="rounded-3xl bg-[#0e101a] border border-white/10 p-5 sm:p-10 shadow-2xl">
        <SeatMap
          seats={seats}
          selectedSeatIds={selectedSeatIds}
          onToggleSeat={handleToggleSeat}
          disabled={isBooking}
        />
      </div>

      {/* Luxury Floating Bottom Bar (Directly adapted from user's reference design) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-40">
        <div className="floating-bottom-bar-luxury rounded-full p-2.5 sm:p-3 pl-6 pr-3 flex items-center justify-between">
          {/* Left: Total Price */}
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Total:
            </span>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none mt-0.5">
              {formatCurrency(totalPrice)}
            </div>
            {selectedSeatIds.length > 0 ? (
              <span className="text-[10px] text-violet-400 font-mono font-medium mt-0.5">
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

          {/* Right: Signature Circular "BUY / PROCEED" Button */}
          <div className="flex items-center gap-2.5">
            {!isHolding && selectedSeatIds.length > 0 && (
              <button
                type="button"
                onClick={handleAcquireHold}
                className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                Hold (8m)
              </button>
            )}

            <button
              type="button"
              disabled={selectedSeatIds.length === 0 || isBooking}
              onClick={handleConfirmAndPay}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-30 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-violet-600/40 transition-all duration-200 flex flex-col items-center justify-center gap-0.5 group active:scale-95"
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
