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
        <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Booking Not Found</h2>
        <Link href="/" className="text-xs text-violet-600 hover:underline">
          Return to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div>
        <span className="text-xs uppercase font-mono text-violet-600 tracking-wider font-semibold">
          Checkout Step 2 of 2
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Complete Your Reservation
        </h1>
        <p className="text-xs text-slate-500">
          Sandboxed payment gateway simulation (No real bank details or credentials needed)
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Left Side: Payment Form */}
        <div className="md:col-span-3 rounded-3xl border border-slate-200/90 bg-white p-6 space-y-6 shadow-soft">
          {/* Method tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
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
                      ? 'bg-violet-50 border-violet-600 text-violet-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <m.icon className="w-4 h-4" />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Test Scenario Simulator */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block font-mono">
              Evaluator Test Scenario
            </span>
            <p className="text-[11px] text-slate-500">
              Select simulation outcome to test success/failure flows:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScenario('SUCCESS')}
                className={`py-1.5 px-2 rounded-full text-xs font-medium border ${
                  scenario === 'SUCCESS'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                ✓ Success
              </button>
              <button
                type="button"
                onClick={() => setScenario('FAILED')}
                className={`py-1.5 px-2 rounded-full text-xs font-medium border ${
                  scenario === 'FAILED'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 font-bold'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                ✕ Decline
              </button>
              <button
                type="button"
                onClick={() => setScenario('TIMEOUT')}
                className={`py-1.5 px-2 rounded-full text-xs font-medium border ${
                  scenario === 'TIMEOUT'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 font-bold'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                ⏱ Timeout
              </button>
            </div>
          </div>

          <form onSubmit={handleSimulatePayment} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Simulated Card Number
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:border-violet-600 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Expiry Date
                </label>
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:border-violet-600 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  CVV
                </label>
                <input
                  type="password"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:border-violet-600 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full py-3 px-4 rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {processing ? 'Processing Settlement...' : `Pay ${formatCurrency(booking.totalAmount)}`}
            </button>
          </form>
        </div>

        {/* Right Side: Order Summary */}
        <div className="md:col-span-2 rounded-3xl border border-slate-200/90 bg-white p-6 space-y-4 shadow-soft h-fit">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 font-mono">
            Booking Summary
          </h3>

          <div>
            <span className="text-[10px] text-slate-400 uppercase block font-mono">Reference</span>
            <span className="text-sm font-mono font-bold text-violet-700">
              #{booking.bookingReference}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase block font-mono">Movie</span>
            <span className="text-sm font-bold text-slate-900">
              {booking.show.movie.title}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase block font-mono">Screen & Format</span>
            <span className="text-xs text-slate-600">
              {booking.show.screen.theatre.name} — {booking.show.screen.name} ({booking.show.format})
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase block font-mono">Showtime</span>
            <span className="text-xs text-slate-600">
              {formatDateTime(booking.show.startTime)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase block font-mono">Allocated Seats</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {booking.bookingSeats.map((bs: any) => (
                <span
                  key={bs.id}
                  className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-800"
                >
                  {bs.seat.rowName}{bs.seat.seatNumber}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Total Payable</span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {formatCurrency(booking.totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
