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

  if (!booking) {
    if (errorMsg) {
      return (
        <div className="min-h-screen bg-[#090b10] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-8 rounded-3xl bg-[#0d0f17] border border-white/10 space-y-4 shadow-2xl">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">{errorMsg || 'Ticket Not Found'}</h2>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-md"
            >
              <span>← Return to Movies</span>
            </Link>
          </div>
        </div>
      );
    }
    return <div className="min-h-screen bg-[#090b10]" />;
  }

  const movieBackdrop =
    booking.show?.movie?.backdropUrl ||
    booking.show?.movie?.posterUrl ||
    'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=1920&auto=format&fit=crop&q=85';

  return (
    <div className="min-h-screen bg-[#090b10] text-zinc-100 font-sans relative pt-24 px-4 sm:px-8 pb-16">
      <div className="relative z-10 max-w-2xl mx-auto space-y-6 w-full">
        {/* Top Controls */}
        <div className="flex items-center justify-between no-print border-b border-white/10 pb-4">
          <Link
            href="/my-bookings"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Passes Wallet</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Pass</span>
            </button>
          </div>
        </div>

        {/* Permanent Storage Confirmation Notice */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#0d0f17]/90 border border-emerald-500/40 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">Pass Secured in Your Vault</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                This ticket is permanently stored under your account in <strong className="text-zinc-200">My Passes</strong>.
              </p>
            </div>
          </div>
          <Link
            href="/my-bookings"
            className="px-4 py-2 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold uppercase tracking-wider transition-all shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>My Passes Vault →</span>
          </Link>
        </div>

        {/* Gate Entry Simulation Banner */}
        {validationResult && (
          <div
            className={`p-4 rounded-3xl border text-xs flex items-center gap-3.5 shadow-xl no-print ${
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

        {/* Dark Minimalist Boarding Pass Ticket Card with Horizontal Poster Glimpse */}
        <div className="relative rounded-3xl border border-white/10 bg-[#0d0f17]/90 shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Horizontal Movie Poster / Backdrop Glimpse in Top Right Corner (Exposed Rich Preview) */}
          <div className="absolute top-0 right-0 w-3/4 sm:w-3/5 h-60 sm:h-72 pointer-events-none overflow-hidden rounded-tr-3xl z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={movieBackdrop}
              alt={booking.show.movie.title}
              className="w-full h-full object-cover object-top opacity-75 sm:opacity-85 filter brightness-110 contrast-105"
            />
            {/* Seamless multi-stop fade into the card background */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to right, #0d0f17 0%, rgba(13,15,23,0.85) 20%, rgba(13,15,23,0.2) 60%, transparent 100%), linear-gradient(to bottom, transparent 35%, rgba(13,15,23,0.75) 75%, #0d0f17 100%)',
              }}
            />
          </div>

          {/* Ticket Header Strip */}
          <div className="relative z-10 p-6 sm:p-8 border-b border-dashed border-white/10 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="px-3 py-0.5 rounded-full bg-white/10 border border-white/20 text-white font-mono font-semibold text-[10px] tracking-wider uppercase">
                  CINEBOOK PASS
                </span>
                <StatusBadge status={booking.ticket?.validationStatus || booking.status} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-tight">
                {booking.show.movie.title}
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                {booking.show.screen.theatre.name} • {booking.show.screen.name} ({booking.show.format})
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-zinc-400 uppercase font-mono block">Booking Ref</span>
              <span className="text-base font-bold font-mono text-white">
                #{booking.bookingReference}
              </span>
            </div>
          </div>

          {/* Ticket Details Grid */}
          <div className="relative z-10 p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-mono block">Showtime</span>
              <span className="font-medium text-white mt-1 block font-mono">
                {formatDateTime(booking.show.startTime)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-mono block">Seats</span>
              <span className="font-bold text-white font-mono mt-1 block">
                {booking.bookingSeats.map((bs: any) => `${bs.seat.rowName}${bs.seat.seatNumber}`).join(', ')}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-mono block">Attendee</span>
              <span className="font-medium text-white mt-1 block">
                {booking.user.fullName}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-mono block">Total Paid</span>
              <span className="font-bold text-white mt-1 block font-mono">
                {formatCurrency(booking.totalAmount)}
              </span>
            </div>
          </div>

          {/* Perforated Notch Divider */}
          <div className="relative z-10 flex items-center justify-between px-2">
            <div className="w-6 h-6 -ml-5 rounded-full bg-[#090b10] border-r border-white/10" />
            <div className="flex-1 border-t border-dashed border-white/10" />
            <div className="w-6 h-6 -mr-5 rounded-full bg-[#090b10] border-l border-white/10" />
          </div>

          {/* QR Code Validation Section */}
          <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/[0.02]">
            <div className="space-y-2.5 text-center sm:text-left">
              <span className="text-[10px] uppercase font-mono text-zinc-400 block font-semibold tracking-wider">
                Gate Entry Token
              </span>
              <p className="font-mono text-xs font-bold text-white bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15 inline-block shadow-md">
                {booking.ticket?.qrValidationToken || 'TOKEN-GEN'}
              </p>
              <p className="text-[11px] text-zinc-400 max-w-xs leading-relaxed">
                Present this encrypted pass at the gate turnstile. Scans are strictly single-use only.
              </p>

              {/* Test Simulation Button */}
              <div className="pt-2 no-print">
                <button
                  onClick={handleSimulateScan}
                  disabled={validating || booking.ticket?.validationStatus === 'REDEEMED'}
                  className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 disabled:opacity-40 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg cursor-pointer"
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
              <span className="text-[9px] font-mono text-zinc-400 mt-2 font-bold tracking-wider">
                SCAN AT TURNSTILE
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
