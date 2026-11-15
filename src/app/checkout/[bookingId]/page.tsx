'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Zap,
  ChevronLeft,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { CheckoutSkeleton } from '@/components/Skeleton';

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = use(params);
  const router = useRouter();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('SIMULATED_CARD');
  const [scenario, setScenario] = useState<'SUCCESS' | 'FAILED' | 'TIMEOUT'>('SUCCESS');
  const [errorMsg, setErrorMsg] = useState('');

  // Form mock fields
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        if (!res.ok) {
          setErrorMsg('Booking not found');
        } else {
          const data = await res.json();
          setBooking(data.booking);
        }
      } catch {
        setErrorMsg('Failed to load checkout details');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setProcessing(true);

    try {
      if (scenario === 'FAILED') {
        setTimeout(() => {
          setErrorMsg('Simulated Payment Declined: Insufficient test funds or transaction rejected by mock gateway.');
          setProcessing(false);
        }, 1000);
        return;
      }

      if (scenario === 'TIMEOUT') {
        setTimeout(() => {
          setErrorMsg('Simulated Gateway Timeout: The payment network did not respond in time. Please try again.');
          setProcessing(false);
        }, 1500);
        return;
      }

      // Success Scenario: simulate 1s latency then redirect to ticket
      setTimeout(() => {
        setProcessing(false);
        router.push(`/tickets/${booking.bookingReference}`);
      }, 1000);
    } catch {
      setErrorMsg('Payment simulation failed.');
      setProcessing(false);
    }
  };

  if (!booking) {
    if (errorMsg) {
      return (
        <div className="min-h-screen bg-[#090b10] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-8 rounded-3xl bg-[#0d0f17] border border-white/10 space-y-4 shadow-2xl">
            <AlertCircle className="w-12 h-12 text-zinc-500 mx-auto" />
            <h2 className="text-xl font-sans font-bold text-white uppercase tracking-tight">{errorMsg || 'Booking Not Found'}</h2>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-md"
            >
              <span>← Return to Movies</span>
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#090b10] text-zinc-100 font-sans relative pt-24 pb-20 px-4 sm:px-8 lg:px-12">
        <div className="max-w-5xl mx-auto relative z-10">
          <CheckoutSkeleton />
        </div>
      </div>
    );
  }

  const seatsList = booking.bookingSeats?.map((bs: any) => `${bs.seat.rowName}${bs.seat.seatNumber}`).join(' · ');
  const movieBackdrop =
    booking.show?.movie?.backdropUrl ||
    booking.show?.movie?.posterUrl ||
    'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=1920&auto=format&fit=crop&q=85';
  const returnMovieUrl = booking.show?.movieId ? `/movies/${booking.show.movieId}?showId=${booking.showId}` : '/';

  return (
    <div className="min-h-screen bg-[#090b10] text-zinc-100 font-sans select-none relative pt-24 pb-20 px-4 sm:px-8 lg:px-12">
      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        {/* Minimalist Navigation Header */}
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
              Payment will finalize and confirm your digital tickets.
            </p>
          </div>

          <Link
            href={returnMovieUrl}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/15 bg-white/[0.05] hover:bg-white/10 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Change Seats</span>
          </Link>
        </div>

        {/* Global Error Notice */}
        {errorMsg && (
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

        {/* 2-Column Checkout Layout */}
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
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-white/40 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-white/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                      CVV Code
                    </label>
                    <input
                      type="text"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-white/40 transition-colors"
                    />
                  </div>
                </div>

                {/* Primary Settle Button (Crisp Home Page Solid White Button) */}
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full mt-2 py-3.5 px-6 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xl"
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Processing Settlement...</span>
                    </span>
                  ) : (
                    <>
                      <span>Pay {formatCurrency(booking.totalAmount)} &amp; Issue Pass</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT 5 COLS: Minimalist Pass Recap Card with Horizontal Artwork Glimpse */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative rounded-3xl border border-white/10 bg-[#0d0f17]/90 p-6 sm:p-7 space-y-5 shadow-xl backdrop-blur-xl overflow-hidden">
              {/* Horizontal Movie Poster / Backdrop Glimpse in Top Right Corner (Exposed Rich Preview) */}
              <div className="absolute top-0 right-0 w-2/3 sm:w-3/5 h-44 pointer-events-none overflow-hidden rounded-tr-3xl z-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={movieBackdrop}
                  alt={booking.show.movie.title}
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

              {/* Header (relative z-10) */}
              <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">
                  PASS SUMMARY
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  REF: #{booking.bookingReference}
                </span>
              </div>

              {/* Movie & Screen Info (relative z-10) */}
              <div className="relative z-10 space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-white/10 text-white border border-white/20 inline-block mb-1">
                  {booking.show.format}
                </span>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">
                  {booking.show.movie.title}
                </h3>
                <p className="text-xs text-zinc-400 font-sans">
                  {booking.show.screen.theatre.name} • {booking.show.screen.name}
                </p>
              </div>

              {/* Details Breakdown (relative z-10) */}
              <div className="relative z-10 space-y-2.5 text-xs text-zinc-400 pt-3 border-t border-white/10 font-sans">
                <div className="flex justify-between items-center">
                  <span>Screening Time</span>
                  <span className="font-mono text-white font-medium">
                    {formatDateTime(booking.show.startTime)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Assigned Seats</span>
                  <span className="font-mono font-bold text-white">
                    {seatsList || 'No seats'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Ticket Quantity</span>
                  <span className="text-white font-medium">
                    {booking.bookingSeats?.length || 0} Passes
                  </span>
                </div>
              </div>

              {/* Total Settlement Banner (relative z-10) */}
              <div className="relative z-10 pt-3.5 border-t border-white/10 flex justify-between items-baseline">
                <span className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                  Total Settlement
                </span>
                <span className="text-2xl font-bold text-white font-mono leading-none">
                  {formatCurrency(booking.totalAmount)}
                </span>
              </div>

              {/* Security Note (relative z-10) */}
              <div className="relative z-10 pt-2 flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                <span>Encrypted digital pass issued immediately upon settlement</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
