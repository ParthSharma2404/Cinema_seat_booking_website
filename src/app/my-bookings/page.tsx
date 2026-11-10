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

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Ticket className="w-7 h-7 text-red-500" />
            My Bookings & Tickets
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review your digital passes, check status, or manage cancellations
          </p>
        </div>

        <button
          onClick={fetchBookings}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-400 font-bold">
            ✕
          </button>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-4">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Bookings Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You haven&apos;t reserved any cinema tickets yet. Explore movies and choose your seats!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
          >
            Browse Movies
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              {/* Left Details */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-red-400">
                    #{b.bookingReference}
                  </span>
                  <StatusBadge status={b.status} />
                  {b.refundStatus && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800 text-blue-300 font-mono">
                      Refund: {b.refundStatus}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white">
                  {b.show.movie.title}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-red-500" />
                    {formatDateTime(b.show.startTime)}
                  </span>
                  <span>
                    {b.show.screen.theatre.name} — {b.show.screen.name} ({b.show.format})
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs pt-1">
                  <span className="text-slate-500 font-mono">Seats:</span>
                  <div className="flex flex-wrap gap-1">
                    {b.bookingSeats.map((bs: any) => (
                      <span
                        key={bs.id}
                        className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[11px]"
                      >
                        {bs.seat.rowName}{bs.seat.seatNumber}
                      </span>
                    ))}
                  </div>
                  <span className="text-slate-500 ml-2">•</span>
                  <span className="font-bold text-emerald-400">
                    {formatCurrency(b.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Link
                  href={`/tickets/${b.bookingReference}`}
                  className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-red-400" />
                  View Ticket & QR
                </Link>

                {b.status === 'CONFIRMED' && (
                  <button
                    onClick={() => setCancellingBookingId(b.id)}
                    className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium border border-rose-800/60 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellingBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Cancel Booking & Request Refund</h3>
            </div>

            <p className="text-xs text-slate-300">
              Cancelling will immediately release your reserved seats for other customers and initiate a simulated refund.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Reason for Cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="Personal schedule conflict">Personal schedule conflict</option>
                <option value="Booked incorrect showtime/seats">Booked incorrect showtime/seats</option>
                <option value="Emergency or travel">Emergency or travel</option>
                <option value="Other reasons">Other reasons</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingBookingId(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={isSubmittingCancel}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-md shadow-rose-950"
              >
                {isSubmittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
