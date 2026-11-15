'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  Zap,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { HoldTimer } from '@/components/HoldTimer';
import { CheckoutSkeleton } from '@/components/Skeleton';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showId = searchParams.get('showId');
  const seatsParam = searchParams.get('seats'); // Comma-separated seat IDs

  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('SIMULATED_CARD');
  const [scenario, setScenario] = useState<'SUCCESS' | 'FAILED' | 'TIMEOUT'>('SUCCESS');
  const [errorMsg, setErrorMsg] = useState('');

  // Form mock fields
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');

  useEffect(() => {
    if (!showId || !seatsParam) {
      setErrorMsg('No show or seats selected for checkout.');
      setLoading(false);
      return;
    }

    const requestedSeatIds = seatsParam.split(',').filter(Boolean);

    const loadShowAndHold = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/shows/${showId}/seats`);
        if (!res.ok) {
          throw new Error('Failed to load show seats');
        }
        const data = await res.json();
        setShow(data.show);

        // Filter the requested seats
        const matchedSeats = data.seats.filter((s: any) =>
          requestedSeatIds.includes(s.id)
        );

        if (matchedSeats.length === 0) {
          throw new Error('Selected seats could not be found');
        }

        // Verify that the current user actually holds these seats
        const myHeld = matchedSeats.filter((s: any) => s.isHeldByMe);
        if (myHeld.length === 0) {
          setIsExpired(true);
          setErrorMsg(
            'Your 8-minute reservation has expired or was claimed by another customer. Please select available seats again.'
          );
          setSelectedSeats(matchedSeats);
          return;
        }

        setSelectedSeats(myHeld);
        setHoldExpiresAt(myHeld[0].holdExpiresAt);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load checkout details');
      } finally {
        setLoading(false);
      }
    };

    loadShowAndHold();
  }, [showId, seatsParam]);

  const handleHoldExpired = () => {
    setIsExpired(true);
    setErrorMsg(
      'Your 8-minute reservation window has expired. The seats have been released back to other cinema guests.'
    );
  };

  // Release hold and cleanly return to the unified Movie Details & Seating page
  const handleCancelAndRelease = async () => {
    if (showId && selectedSeats.length > 0) {
      try {
        await fetch(`/api/shows/${showId}/hold`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seatIds: selectedSeats.map((s) => s.id) }),
        });
      } catch {
        // ignore
      }
    }
    const movieId = show?.movieId || show?.movie?.id;
    if (movieId) {
      router.push(`/movies/${movieId}?showId=${showId}`);
    } else {
      router.push('/');
    }
  };

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired) {
      setErrorMsg('Reservation expired. Please select seats again.');
      return;
    }

    setErrorMsg('');
    setProcessing(true);

    try {
      if (scenario === 'FAILED') {
        setTimeout(() => {
          setErrorMsg(
            'Simulated Payment Declined: Insufficient test funds or transaction rejected by mock gateway.'
          );
          setProcessing(false);
        }, 1000);
        return;
      }

      if (scenario === 'TIMEOUT') {
        setTimeout(() => {
          setErrorMsg(
            'Simulated Gateway Timeout: The payment network did not respond in time. Please try again.'
          );
          setProcessing(false);
        }, 1500);
        return;
      }

      // SUCCESS SCENARIO: Call POST /api/bookings ONLY NOW upon actual payment submission!
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showId,
          seatIds: selectedSeats.map((s) => s.id),
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Payment failed to confirm booking.');
        setProcessing(false);
        return;
      }

      // Booking officially CONFIRMED! WebSocket broadcast already fired by API route.
      router.push(`/tickets/${data.booking.bookingReference}`);
    } catch {
      setErrorMsg('Payment network error. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090b10] text-zinc-100 font-sans relative pt-24 pb-20 px-4 sm:px-8 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <CheckoutSkeleton />
        </div>
      </div>
    );
  }

  const movieId = show?.movieId || show?.movie?.id;
  const returnUrl = movieId ? `/movies/${movieId}?showId=${showId}` : '/';

  if (!show || selectedSeats.length === 0) {
    return (
      <div className="min-h-screen bg-[#090b10] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0d0f17] border border-white/10 space-y-4 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-zinc-500 mx-auto" />
          <h2 className="text-xl font-sans font-bold text-white uppercase tracking-tight">
            {errorMsg || 'No Reservation Found'}
          </h2>
          <p className="text-xs text-zinc-400">
            Please select your seats on the movie schedule to start your reservation.
          </p>
          <Link
            href={returnUrl}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-md cursor-pointer"
          >
            <span>← Return to Movie</span>
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = selectedSeats.reduce((acc, s) => acc + (s.price || 0), 0);
  const bookingFee = Math.round(subtotal * 0.08); // 8% fee
  const totalAmount = subtotal + bookingFee;

  const movieBackdrop =
    show.movie?.backdropUrl ||
    show.movie?.posterUrl ||
    'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=1920&auto=format&fit=crop&q=85';

  return (
    <div className="min-h-screen bg-[#090b10] text-zinc-100 font-sans select-none relative pt-24 pb-20 px-4 sm:px-8 lg:px-12">
      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        {/* Minimalist Navigation Header (Matching Home Page Style) */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-zinc-400 font-semibold">
              <span>CHECKOUT</span>
              <span>•</span>
              <span>CONFIRM &amp; PAY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight uppercase leading-none">
              Complete Reservation
            </h1>
            <p className="text-xs text-zinc-400">
              Your seats are temporarily locked. Payment will finalize and confirm your tickets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Hold Timer */}
            {holdExpiresAt && !isExpired && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-[11px] font-mono text-zinc-300">Lock:</span>
                <HoldTimer expiresAt={holdExpiresAt} onExpire={handleHoldExpired} />
              </div>
            )}

            {/* Change Seats Button -> Directs back to Movie Page */}
            <button
              type="button"
              onClick={handleCancelAndRelease}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/15 bg-white/[0.05] hover:bg-white/10 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Change Seats</span>
            </button>
          </div>
        </div>

        {/* Expired Warning Banner */}
        {isExpired && (
          <div className="p-4 rounded-2xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{errorMsg || 'Your 8-minute reservation has expired.'}</span>
            </div>
            <button
              type="button"
              onClick={() => router.push(returnUrl)}
              className="px-4 py-1.5 rounded-full bg-white text-black font-bold text-xs uppercase cursor-pointer hover:bg-zinc-200 transition-colors"
            >
              Select New Seats
            </button>
          </div>
        )}

        {/* Global Error Notice */}
        {errorMsg && !isExpired && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              className="text-xs text-rose-300 hover:text-white px-2 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 2-Column Minimalist Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 7 COLS: Minimalist Payment Gateway */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[#0d0f17]/90 p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-xl">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-mono font-semibold text-zinc-300 uppercase tracking-wider mb-2.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'SIMULATED_CARD', label: 'Credit Card', icon: CreditCard },
                    { id: 'SIMULATED_UPI', label: 'UPI / QR', icon: Zap },
                    { id: 'SANDBOX_WALLET', label: 'Vault Wallet', icon: ShieldCheck },
                  ].map((m) => {
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-3.5 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white/10 border-white text-white shadow-md'
                            : 'bg-white/[0.02] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        <m.icon className="w-4 h-4" />
                        <span className="tracking-wide">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Simulation Test Scenarios (Minimalist Pills) */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
                <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider block">
                  Simulated Gateway Outcome
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setScenario('SUCCESS')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold font-mono border transition-all cursor-pointer ${
                      scenario === 'SUCCESS'
                        ? 'bg-white/10 border-emerald-500/70 text-emerald-300 shadow-sm'
                        : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    ✓ Success
                  </button>
                  <button
                    type="button"
                    onClick={() => setScenario('FAILED')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold font-mono border transition-all cursor-pointer ${
                      scenario === 'FAILED'
                        ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 shadow-sm'
                        : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    ✕ Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => setScenario('TIMEOUT')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold font-mono border transition-all cursor-pointer ${
                      scenario === 'TIMEOUT'
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm'
                        : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    ⏱ Timeout
                  </button>
                </div>
              </div>

              {/* Payment Details Form */}
              <form onSubmit={handleSimulatePayment} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      disabled={isExpired || processing}
                      className="w-full px-4 py-3 rounded-xl bg-[#090b10] border border-white/10 text-sm font-mono text-white tracking-widest focus:outline-none focus:border-white/40 transition-colors disabled:opacity-50"
                    />
                    <CreditCard className="w-4 h-4 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      disabled={isExpired || processing}
                      className="w-full px-4 py-3 rounded-xl bg-[#090b10] border border-white/10 text-sm font-mono text-white text-center focus:outline-none focus:border-white/40 transition-colors disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                      Security Code
                    </label>
                    <input
                      type="text"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      disabled={isExpired || processing}
                      className="w-full px-4 py-3 rounded-xl bg-[#090b10] border border-white/10 text-sm font-mono text-white text-center focus:outline-none focus:border-white/40 transition-colors disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Primary CTA (Crisp Home Page Solid White Button) */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={processing || isExpired}
                    className="w-full py-3.5 rounded-full bg-white hover:bg-zinc-200 active:scale-[0.99] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {processing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Authorizing &amp; Confirming...</span>
                      </>
                    ) : isExpired ? (
                      <span>Hold Expired - Choose Seats Again</span>
                    ) : (
                      <>
                        <span>Confirm &amp; Pay {formatCurrency(totalAmount)}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Security Footer */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                <span>Simulated Secure Gateway • Test Environment</span>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: Minimalist Reservation Summary with Horizontal Artwork Glimpse */}
          <div className="lg:col-span-5 space-y-6">
            <div className="relative rounded-3xl border border-white/10 bg-[#0d0f17]/90 p-6 sm:p-7 space-y-6 shadow-xl backdrop-blur-xl overflow-hidden">
              {/* Horizontal Movie Poster / Backdrop Glimpse in Top Right Corner (Exposed Rich Preview) */}
              <div className="absolute top-0 right-0 w-2/3 sm:w-3/5 h-48 pointer-events-none overflow-hidden rounded-tr-3xl z-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={movieBackdrop}
                  alt={show.movie.title}
                  className="w-full h-full object-cover object-top opacity-70 filter brightness-110 contrast-105"
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(to right, #0d0f17 0%, rgba(13,15,23,0.8) 25%, transparent 80%), linear-gradient(to bottom, transparent 30%, rgba(13,15,23,0.8) 75%, #0d0f17 100%)',
                  }}
                />
              </div>

              {/* Title & Metadata (relative z-10) */}
              <div className="relative z-10">
                <span className="text-[10px] font-mono font-semibold tracking-widest uppercase text-zinc-400 block mb-1">
                  Ticket Summary
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight uppercase">
                  {show.movie.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {show.screen.name} • {show.format} • {show.screen.theatre.name}
                </p>
                <p className="text-xs font-mono text-zinc-400 mt-0.5">
                  {formatDateTime(show.startTime)}
                </p>
              </div>

              {/* Selected Seats Chips */}
              <div className="relative z-10 space-y-2 pt-2 border-t border-white/10">
                <span className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider block">
                  Reserved Seats ({selectedSeats.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((seat) => (
                    <span
                      key={seat.id}
                      className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs font-mono font-semibold text-white"
                    >
                      {seat.rowName}{seat.seatNumber} ({seat.category}) • {formatCurrency(seat.price)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="relative z-10 space-y-2 pt-4 border-t border-white/10 text-xs font-mono">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Tickets Subtotal</span>
                  <span className="text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Convenience Fee &amp; Tax (8%)</span>
                  <span className="text-white">{formatCurrency(bookingFee)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-white pt-3 border-t border-white/10">
                  <span className="uppercase font-sans font-semibold">Total Payable</span>
                  <span className="text-white font-mono text-base">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              {/* 8-minute Hold Guarantee notice */}
              <div className="relative z-10 p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 text-[11px] text-zinc-400 space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-300 font-semibold font-mono">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>8-Minute Reservation Guarantee</span>
                </div>
                <p className="text-[10px] leading-relaxed text-zinc-400">
                  Seats are locked for your checkout session. If you change seats or time runs out, they are instantly released.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090b10] text-zinc-100 font-sans relative pt-24 pb-20 px-4 sm:px-8 lg:px-12">
          <div className="max-w-5xl mx-auto">
            <CheckoutSkeleton />
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
