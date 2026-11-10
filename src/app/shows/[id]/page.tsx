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
} from 'lucide-react';
import { SeatMap } from '@/components/SeatMap';
import { HoldTimer } from '@/components/HoldTimer';
import { SeatWithStatus } from '@/server/services/seatHoldService';
import { formatCurrency, formatDateTime } from '@/lib/utils';

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
        setErrorMsg('Maximum 10 seats allowed per booking transaction.');
        return;
      }
      setSelectedSeatIds((prev) => [...prev, seat.id]);
    }
  };

  // Acquire or refresh temporary seat hold with TTL
  const handleAcquireHold = async () => {
    if (selectedSeatIds.length === 0) {
      setErrorMsg('Please select at least one seat to reserve.');
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
        setSuccessMsg(`Temporary hold acquired! Your seats are locked for 8 minutes.`);
        await loadShowAndSeats(true);
      }
    } catch {
      setErrorMsg('Network error while locking seats. Please retry.');
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
        // Redirect to booking checkout / confirmation page
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
    setErrorMsg('Your temporary seat hold has expired. The seats have been released.');
    loadShowAndSeats(true);
  };

  // Calculate pricing breakdown
  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
  const totalPrice = selectedSeats.reduce((acc, curr) => acc + curr.price, 0);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading seat layout and availability...</p>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="py-16 text-center space-y-4">
        <Film className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-lg font-bold text-white">Show not found</h2>
        <Link href="/" className="text-xs text-red-400 hover:underline">
          Return to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Live Refresh */}
      <div className="flex items-center justify-between">
        <Link
          href={`/movies/${show.movie.id}`}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {show.movie.title}
        </Link>

        <button
          onClick={() => loadShowAndSeats(false)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-3 py-1 rounded-lg border border-slate-800 bg-slate-900/60"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Availability
        </button>
      </div>

      {/* Show Details Strip */}
      <div className="p-4 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-400 text-[10px] font-bold">
              {show.format}
            </span>
            <span className="text-xs text-slate-400">{show.screen.theatre.name} • {show.screen.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {show.movie.title}
          </h1>
          <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-red-500" />
              {formatDateTime(show.startTime)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-red-500" />
              {show.movie.durationMins} mins
            </span>
          </div>
        </div>

        {/* Live Hold Timer Widget */}
        {isHolding && holdExpiresAt && (
          <div className="flex flex-col items-end gap-1">
            <HoldTimer expiresAt={holdExpiresAt} onExpire={handleHoldExpired} />
            <span className="text-[10px] text-slate-500 font-mono">
              Protected against double-booking
            </span>
          </div>
        )}
      </div>

      {/* Error & Conflict Alert Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg('')}
            className="text-rose-400 hover:text-rose-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Banner */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Interactive Cinema Seat Map */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 sm:p-8 backdrop-blur-md shadow-2xl">
        <SeatMap
          seats={seats}
          selectedSeatIds={selectedSeatIds}
          onToggleSeat={handleToggleSeat}
          disabled={isBooking}
        />
      </div>

      {/* Bottom Sticky Booking Action Bar */}
      <div className="sticky bottom-4 z-40 p-4 rounded-2xl border border-slate-800 bg-slate-950/95 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-red-500">
            <Armchair className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">
                {selectedSeatIds.length} Seat(s) Selected
              </span>
              {selectedSeats.length > 0 && (
                <span className="text-[11px] font-mono text-red-400">
                  ({selectedSeats.map((s) => `${s.rowName}${s.seatNumber}`).join(', ')})
                </span>
              )}
            </div>
            <div className="text-xl font-extrabold text-white mt-0.5">
              {formatCurrency(totalPrice)}
              <span className="text-xs text-slate-400 font-normal ml-2">incl. taxes</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!isHolding ? (
            <button
              type="button"
              disabled={selectedSeatIds.length === 0}
              onClick={handleAcquireHold}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-xs font-medium text-slate-200 transition-colors"
            >
              Lock Seats (8m Hold)
            </button>
          ) : (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              Seats Locked
            </span>
          )}

          <button
            type="button"
            disabled={selectedSeatIds.length === 0 || isBooking}
            onClick={handleConfirmAndPay}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-lg shadow-red-950 flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            {isBooking ? 'Securing Seats...' : 'Proceed to Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
}
