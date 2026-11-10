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

      // Success Scenario: simulate 1s network latency then redirect to ticket
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
      <div className="py-20 flex justify-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Booking Not Found</h2>
        <Link href="/" className="text-xs text-red-400 hover:underline">
          Return to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div>
        <span className="text-xs uppercase font-mono text-red-400 tracking-wider">
          Step 2 of 2: Simulated Settlement
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
          Complete Your Reservation
        </h1>
        <p className="text-xs text-slate-400">
          Sandboxed payment gateway simulation (No real bank details or credentials needed)
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Left Side: Payment Form */}
        <div className="md:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6 backdrop-blur-md">
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
                  className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-colors ${
                    paymentMethod === m.id
                      ? 'bg-red-950/70 border-red-600 text-red-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <m.icon className="w-4 h-4" />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Test Scenario Simulator */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
              Evaluator Test Scenario
            </span>
            <p className="text-[11px] text-slate-400">
              Select simulation outcome to test success/failure flows:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScenario('SUCCESS')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border ${
                  scenario === 'SUCCESS'
                    ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                ✓ Success
              </button>
              <button
                type="button"
                onClick={() => setScenario('FAILED')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border ${
                  scenario === 'FAILED'
                    ? 'bg-rose-950 border-rose-600 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                ✕ Decline
              </button>
              <button
                type="button"
                onClick={() => setScenario('TIMEOUT')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border ${
                  scenario === 'TIMEOUT'
                    ? 'bg-amber-950 border-amber-600 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Expiry Date
                </label>
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  CVV
                </label>
                <input
                  type="password"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-lg shadow-red-950 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {processing ? 'Processing Simulated Settlement...' : `Pay ${formatCurrency(booking.totalAmount)}`}
            </button>
          </form>
        </div>

        {/* Right Side: Order Summary */}
        <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 backdrop-blur-md h-fit">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
            Booking Summary
          </h3>

          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-mono">Reference</span>
            <span className="text-sm font-mono font-bold text-red-400">
              #{booking.bookingReference}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-mono">Movie</span>
            <span className="text-sm font-semibold text-white">
              {booking.show.movie.title}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-mono">Screen & Format</span>
            <span className="text-xs text-slate-300">
              {booking.show.screen.theatre.name} — {booking.show.screen.name} ({booking.show.format})
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-mono">Showtime</span>
            <span className="text-xs text-slate-300">
              {formatDateTime(booking.show.startTime)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-mono">Allocated Seats</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {booking.bookingSeats.map((bs: any) => (
                <span
                  key={bs.id}
                  className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200"
                >
                  {bs.seat.rowName}{bs.seat.seatNumber} ({bs.seat.category})
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Total Payable</span>
            <span className="text-xl font-extrabold text-emerald-400">
              {formatCurrency(booking.totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
