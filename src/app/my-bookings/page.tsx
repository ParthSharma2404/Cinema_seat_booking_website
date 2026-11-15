'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Ticket,
  Film,
  Calendar,
  Clock,
  QrCode,
  XCircle,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Personal schedule conflict');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/bookings/user');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login?redirect=/my-bookings');
          return;
        }
        setErrorMsg('Failed to load your booking history');
      } else {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch {
      setErrorMsg('Network error loading bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleConfirmCancel = async () => {
    if (!cancellingBookingId) return;
    setIsSubmittingCancel(true);
    try {
      const res = await fetch(`/api/bookings/${cancellingBookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to cancel booking');
      } else {
        setFeedback(`Booking #${data.booking.bookingReference} cancelled. Simulated refund settled.`);
        setCancellingBookingId(null);
        await fetchBookings();
      }
    } catch {
      alert('Error processing cancellation');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-zinc-100 font-sans relative pt-24 px-4 sm:px-8 pb-16">
      <div className="relative z-10 space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight uppercase flex items-center gap-3">
              <Ticket className="w-7 h-7 text-white" />
              <span>My Passes &amp; Bookings</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Review your reserved digital boarding passes, check status, or manage cancellations
            </p>
          </div>

          <button
            onClick={fetchBookings}
            className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/10 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {feedback && (
          <div className="p-4 rounded-3xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedback}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-emerald-400 font-bold hover:text-white px-2">
              ✕
            </button>
          </div>
        )}

        {bookings.length === 0 && !loading ? (
          <div className="text-center py-20 bg-[#0d0f17]/90 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl space-y-4">
            <Ticket className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-white uppercase tracking-tight">No Bookings Found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              You haven&apos;t reserved any cinema tickets yet. Explore movies and choose your seats!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold uppercase tracking-wider shadow-xl transition-all cursor-pointer"
            >
              <span>Browse Movies</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const movieBackdrop =
                b.show.movie?.backdropUrl ||
                b.show.movie?.posterUrl ||
                'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=1920&auto=format&fit=crop&q=85';

              return (
                <div
                  key={b.id}
                  className="relative p-6 sm:p-7 rounded-3xl border border-white/10 bg-[#0d0f17]/90 hover:border-white/25 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl backdrop-blur-xl overflow-hidden group"
                >
                  {/* Horizontal Movie Poster / Backdrop Glimpse in Top Right Corner (Exposed Rich Preview) */}
                  <div className="absolute top-0 right-0 w-1/2 sm:w-5/12 md:w-2/5 h-full pointer-events-none overflow-hidden rounded-tr-3xl rounded-br-3xl z-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={movieBackdrop}
                      alt={b.show.movie.title}
                      className="w-full h-full object-cover object-top opacity-65 group-hover:opacity-85 transition-opacity duration-300 filter brightness-110 contrast-105"
                    />
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(to right, #0d0f17 0%, rgba(13,15,23,0.7) 25%, transparent 75%), linear-gradient(to left, rgba(13,15,23,0.45) 0%, transparent 40%), linear-gradient(to top, #0d0f17 0%, transparent 35%)',
                      }}
                    />
                  </div>

                  {/* Left Details */}
                  <div className="space-y-2.5 flex-1 relative z-10">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-semibold text-white bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                        #{b.bookingReference}
                      </span>
                      <StatusBadge status={b.status} />
                      {b.refundStatus && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono">
                          Refund: {b.refundStatus}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">
                      {b.show.movie.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="font-mono text-zinc-300">{formatDateTime(b.show.startTime)}</span>
                      </span>
                      <span>
                        {b.show.screen.theatre.name} • {b.show.screen.name} ({b.show.format})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs pt-1">
                      <span className="text-zinc-500 font-mono text-[11px]">Seats:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {b.bookingSeats.map((bs: any) => (
                          <span
                            key={bs.id}
                            className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white font-mono text-[11px] font-semibold"
                          >
                            {bs.seat.rowName}{bs.seat.seatNumber}
                          </span>
                        ))}
                      </div>
                      <span className="text-zinc-600 ml-1">•</span>
                      <span className="font-bold text-white font-mono text-sm">
                        {formatCurrency(b.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
                    <Link
                      href={`/tickets/${b.bookingReference}`}
                      className="flex-1 md:flex-none px-5 py-3 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>View Pass &amp; QR</span>
                    </Link>

                    {b.status === 'CONFIRMED' && (
                      <button
                        onClick={() => setCancellingBookingId(b.id)}
                        className="flex-1 md:flex-none px-4.5 py-3 rounded-full bg-[#0d0f17]/95 hover:bg-rose-950/90 text-rose-300 hover:text-white text-xs font-bold border border-rose-500/60 hover:border-rose-400 flex items-center justify-center gap-2 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.6)] backdrop-blur-md cursor-pointer"
                      >
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="tracking-wide">Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cancellation Modal */}
        {cancellingBookingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="max-w-md w-full rounded-3xl border border-white/10 bg-[#0d0f17] p-7 space-y-5 shadow-2xl">
              <div className="flex items-center gap-2.5 text-rose-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-white uppercase tracking-tight">Cancel Booking & Refund</h3>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Cancelling immediately releases your reserved seats for other customers and settles a simulated refund.
              </p>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Reason for Cancellation
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-[#090b10] border border-white/15 text-xs text-white focus:outline-none focus:border-[#cca255] transition-colors"
                >
                  <option value="Personal schedule conflict" className="bg-[#090b10]">Personal schedule conflict</option>
                  <option value="Booked incorrect showtime/seats" className="bg-[#090b10]">Booked incorrect showtime/seats</option>
                  <option value="Emergency or travel" className="bg-[#090b10]">Emergency or travel</option>
                  <option value="Other reasons" className="bg-[#090b10]">Other reasons</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setCancellingBookingId(null)}
                  className="px-5 py-2.5 rounded-full border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  disabled={isSubmittingCancel}
                  onClick={handleConfirmCancel}
                  className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCancel ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
