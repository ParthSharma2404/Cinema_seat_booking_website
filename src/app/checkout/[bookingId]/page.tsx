'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  CheckCircle,
  ShieldCheck,
  AlertCircle,
  Film,
  Calendar,
  Clock,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

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

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Booking Not Found</h2>
        <Link href="/" className="text-xs text-violet-400 hover:underline">
          Return to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div>
        <span className="text-xs uppercase font-mono text-violet-400 tracking-wider font-semibold">
          Checkout Step 2 of 2
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
          Complete Your Reservation
        </h1>
        <p className="text-xs text-slate-400">
          Sandboxed payment gateway simulation (No real bank details or credentials needed)
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Left Side: Payment Form */}
        <div className="md:col-span-3 rounded-3xl border border-white/10 bg-[#0e101a] p-6 space-y-6 shadow-2xl">
          {/* Method tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'SIMULATED_CARD', label: 'Credit Card', icon: CreditCard },
                { id: 'SIMULATED_UPI', label: 'UPI / QR', icon: Zap },
                { id: 'SANDBOX_WALLET', label: 'Sandbox Wallet', icon: ShieldCheck },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`p-3 rounded-2xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-colors ${
                    paymentMethod === m.id
                      ? 'bg-violet-600/30 border-violet-500 text-violet-300 shadow-md'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <m.icon className="w-4 h-4" />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Test Scenario Simulator */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block font-mono">
              Evaluator Test Scenario
            </span>
            <p className="text-[11px] text-slate-400">
              Select simulation outcome to test success/failure flows:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScenario('SUCCESS')}
                className={`py-1.5 px-2 rounded-xl text-xs font-medium border ${
                  scenario === 'SUCCESS'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                ✓ Success
              </button>
              <button
                type="button"
                onClick={() => setScenario('FAILED')}
                className={`py-1.5 px-2 rounded-xl text-xs font-medium border ${
                  scenario === 'FAILED'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                ✕ Decline
              </button>
              <button
                type="button"
                onClick={() => setScenario('TIMEOUT')}
                className={`py-1.5 px-2 rounded-xl text-xs font-medium border ${
                  scenario === 'TIMEOUT'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                ⏱ Timeout
              </button>
            </div>
          </div>

          <form onSubmit={handleSimulatePayment} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Simulated Card Number
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Expiry
                </label>
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  CVV
                </label>
                <input
                  type="text"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>{processing ? 'Processing Settlement...' : `Pay ${formatCurrency(booking.totalAmount)}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Side: Order Summary */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-3xl border border-white/10 bg-[#0e101a] p-6 space-y-4 shadow-2xl">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold border-b border-white/10 pb-3">
              Order Summary
            </h3>

            <div>
              <span className="text-[10px] text-violet-400 font-mono font-bold uppercase block">
                {booking.show.format} Auditorium
              </span>
              <h4 className="text-base font-black text-white">
                {booking.show.movie.title}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {booking.show.screen.theatre.name} — {booking.show.screen.name}
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-white/10">
              <div className="flex justify-between">
                <span>Date & Time</span>
                <span className="font-mono text-white">{formatDateTime(booking.show.startTime)}</span>
              </div>
              <div className="flex justify-between">
                <span>Reserved Seats</span>
                <span className="font-mono font-bold text-violet-300">
                  {booking.bookingSeats?.map((bs: any) => `${bs.seat.rowName}${bs.seat.seatNumber}`).join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Seat Count</span>
                <span className="text-white">{booking.bookingSeats?.length || 0} tickets</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300">Total Settlement</span>
              <span className="text-xl font-black text-white font-mono">
                {formatCurrency(booking.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
