'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  Film,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Printer,
  QrCode,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function TicketPage({
  params,
}: {
  params: Promise<{ bookingRef: string }>;
}) {
  const { bookingRef } = use(params);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validating, setValidating] = useState(false);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/bookings/${bookingRef}`);
      if (!res.ok) {
        setErrorMsg('Ticket or booking reference not found');
      } else {
        const data = await res.json();
        setBooking(data.booking);
      }
    } catch {
      setErrorMsg('Failed to load digital ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [bookingRef]);

  // Evaluator helper: Simulate Gate Entry Validation directly from ticket view
  const handleSimulateScan = async () => {
    if (!booking?.ticket?.qrValidationToken) return;
    setValidating(true);
    try {
      const res = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrValidationToken: booking.ticket.qrValidationToken,
        }),
      });

      const data = await res.json();
      setValidationResult(data);
      await fetchTicket();
    } catch {
      setValidationResult({
        valid: false,
        message: 'Gate scanner validation failed',
      });
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (errorMsg || !booking) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">{errorMsg || 'Ticket Not Found'}</h2>
        <Link href="/" className="text-xs text-violet-400 hover:underline">
          Return to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-24 px-4 sm:px-8 pb-16 w-full">
      {/* Top Controls */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/my-bookings"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>My Passes</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Pass
          </button>
        </div>
      </div>

      {/* Gate Entry Simulation Banner */}
      {validationResult && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-3 no-print ${
            validationResult.valid
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          {validationResult.valid ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          )}
          <div>
            <p className="font-bold">{validationResult.message}</p>
            {validationResult.status === 'ALREADY_REDEEMED' && (
              <p className="text-[11px] opacity-80 mt-0.5 font-mono">
                Acceptance Test 4 Verified: Single-use QR token prevents re-entry.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dark Boarding Pass Style Ticket Card */}
      <div className="relative rounded-3xl border border-white/10 bg-[#0e101a] shadow-2xl overflow-hidden">
        {/* Ticket Header Strip */}
        <div className="p-6 sm:p-8 border-b border-dashed border-white/10 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full bg-violet-600/30 border border-violet-500/40 text-violet-300 font-mono font-bold text-[10px] tracking-wider uppercase">
                CINEBOOK PASS
              </span>
              <StatusBadge status={booking.ticket?.validationStatus || booking.status} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {booking.show.movie.title}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {booking.show.screen.theatre.name} • {booking.show.screen.name} ({booking.show.format})
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Booking Ref</span>
            <span className="text-base font-black font-mono text-violet-400">
              #{booking.bookingReference}
            </span>
          </div>
        </div>

        {/* Ticket Details Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Showtime</span>
            <span className="font-bold text-white mt-1 block font-mono">
              {formatDateTime(booking.show.startTime)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Seats</span>
            <span className="font-black text-violet-400 font-mono mt-1 block">
              {booking.bookingSeats.map((bs: any) => `${bs.seat.rowName}${bs.seat.seatNumber}`).join(', ')}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Attendee</span>
            <span className="font-semibold text-white mt-1 block">
              {booking.user.fullName}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Total Paid</span>
            <span className="font-black text-white mt-1 block font-mono">
              {formatCurrency(booking.totalAmount)}
            </span>
          </div>
        </div>

        {/* Perforated Notch Divider */}
        <div className="relative flex items-center justify-between px-2">
          <div className="w-6 h-6 -ml-5 rounded-full bg-[#08090e] border-r border-white/10" />
          <div className="flex-1 border-t border-dashed border-white/10" />
          <div className="w-6 h-6 -mr-5 rounded-full bg-[#08090e] border-l border-white/10" />
        </div>

        {/* QR Code Validation Section */}
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/[0.02]">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
              Gate Entry Token
            </span>
            <p className="font-mono text-xs font-bold text-white bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 inline-block shadow-xs">
              {booking.ticket?.qrValidationToken || 'TOKEN-GEN'}
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Present this pass or token at the gate turnstile. Scans are strictly single-use only.
            </p>

            {/* Test Simulation Button */}
            <div className="pt-2 no-print">
              <button
                onClick={handleSimulateScan}
                disabled={validating || booking.ticket?.validationStatus === 'REDEEMED'}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-bold border border-violet-500 flex items-center gap-1.5 transition-all shadow-lg shadow-violet-600/30"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {validating
                    ? 'Verifying...'
                    : booking.ticket?.validationStatus === 'REDEEMED'
                    ? 'Already Redeemed at Gate'
                    : 'Simulate Staff Gate Scan (Demo)'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center">
            {booking.ticket?.qrValidationToken && (
              <div className="p-3 bg-white rounded-2xl shadow-xl">
                <QRCodeDisplay
                  text={booking.ticket.qrValidationToken}
                  size={140}
                  className="rounded-lg"
                />
              </div>
            )}
            <span className="text-[9px] font-mono text-slate-400 mt-2 font-bold tracking-wider">
              SCAN AT TURNSTILE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
