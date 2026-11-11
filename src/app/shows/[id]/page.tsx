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
        setSuccessMsg(`Seats locked for 8 minutes!`);
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
        // Redirect to booking checkout
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
        <p className="text-xs text-slate-400 font-mono">Loading seat layout...</p>
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
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28">
      {/* Top Header (Inspired directly by the reference image's header) */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href={`/movies/${show.movie.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </Link>

        <button
          onClick={() => loadShowAndSeats(false)}
          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 px-2.5 py-1 rounded-full border border-slate-200 bg-white shadow-xs"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Movie Info Header Strip (matching the reference image layout) */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-soft flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono text-slate-400 block">
            {showDateFormatted} • {show.screen.theatre.name}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            {show.movie.title}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {show.screen.name} • {show.movie.genre}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {formatTime(show.startTime)}
            </span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
              {formatCurrency(show.basePrice)}
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">
            {show.format} EDITION
          </span>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 shadow-xs">
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
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Minimalist Cinema Seat Canvas (Matching the reference design) */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-4 sm:p-8 shadow-soft">
        <SeatMap
          seats={seats}
          selectedSeatIds={selectedSeatIds}
          onToggleSeat={handleToggleSeat}
          disabled={isBooking}
        />
      </div>

      {/* 4. Signature Floating Bottom Bar (Directly adapted from the reference image) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-40">
        <div className="floating-bottom-bar rounded-full p-2.5 sm:p-3 pl-6 pr-3 flex items-center justify-between">
          {/* Left: Total Price */}
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 leading-none">
              Total:
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {formatCurrency(totalPrice)}
            </div>
            {selectedSeatIds.length > 0 && (
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedSeatIds.length} seat(s) selected
              </span>
            )}
          </div>

          {/* Center: Live TTL Hold Timer */}
          {isHolding && holdExpiresAt && (
            <div className="hidden sm:block">
              <HoldTimer expiresAt={holdExpiresAt} onExpire={handleHoldExpired} />
            </div>
          )}

          {/* Right: Signature Circular "BUY / PROCEED" Button (as in reference image) */}
          <div className="flex items-center gap-2">
            {!isHolding && selectedSeatIds.length > 0 && (
              <button
                type="button"
                onClick={handleAcquireHold}
                className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
              >
                Hold
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
