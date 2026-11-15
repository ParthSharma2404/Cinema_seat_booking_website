'use client';

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  ScanLine,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Film,
  Armchair,
  Users,
  Clock,
  Sparkles,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import { StaffScreeningSkeleton } from '@/components/Skeleton';

interface VerificationRecord {
  id: string;
  token: string;
  bookingReference: string;
  attendee: string;
  movieTitle: string;
  screenName: string;
  showTime: string;
  seats: string[];
  seatsCount: number;
  status: string;
  valid: boolean;
  redeemedAt: string;
  operatorEmail: string;
  message?: string;
}

export default function StaffWorkstationPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sessionFailedScans, setSessionFailedScans] = useState<VerificationRecord[]>([]);

  // Database-backed verification ledger
  const [pastVerifications, setPastVerifications] = useState<VerificationRecord[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(true);

  // Shows & Headcount data
  const [reportsData, setReportsData] = useState<any>(null);
  const [loadingReports, setLoadingReports] = useState(true);

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const res = await fetch('/api/admin/reports');
      if (res.ok) {
        const data = await res.json();
        setReportsData(data);
      }
    } catch (err) {
      console.error('Failed to load hall headcount:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchVerifications = async () => {
    try {
      setLoadingVerifications(true);
      const res = await fetch('/api/tickets/verifications?limit=50');
      if (res.ok) {
        const data = await res.json();
        setPastVerifications(data.verifications || []);
      }
    } catch (err) {
      console.error('Failed to load past verifications:', err);
    } finally {
      setLoadingVerifications(false);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchVerifications();
  }, []);

  const handleValidate = async (tokenToTest?: string) => {
    const token = (tokenToTest || tokenInput).trim();
    if (!token) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrValidationToken: token }),
      });

      const data = await res.json();
      setResult(data);

      if (data.valid) {
        fetchReports();
        fetchVerifications();
      } else {
        setSessionFailedScans((prev) => [
          {
            id: 'failed-' + Date.now(),
            token,
            bookingReference: 'N/A',
            attendee: 'Invalid / Unrecognized',
            movieTitle: 'Scan Rejected',
            screenName: 'Gate Turnstile',
            showTime: '',
            seats: [],
            seatsCount: 0,
            status: data.status || 'DENIED',
            valid: false,
            message: data.message || 'Pass invalid, expired, or already used',
            redeemedAt: new Date().toISOString(),
            operatorEmail: 'Gate Staff',
          },
          ...prev.slice(0, 9),
        ]);
      }
    } catch {
      setResult({
        valid: false,
        status: 'NETWORK_ERROR',
        message: 'Scanner network error or unreachable service',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleValidate();
  };

  const combinedHistory = [
    ...sessionFailedScans,
    ...pastVerifications,
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* 2-Column Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Ticket Scanner (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl bg-[#0d0f17]/90 border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <ScanLine className="w-5 h-5 text-[#cca255]" />
                <h2 className="text-base font-bold text-white tracking-wide uppercase">
                  Turnstile Ticket Scanner
                </h2>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                Auditorium Check-In
              </span>
            </div>

            {/* Verification Presets Strip */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
              <span className="text-[10px] font-mono font-bold uppercase text-[#cca255] tracking-wider block">
                Sample Verification Codes:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTokenInput('TCK-DEMO-VAL1');
                    handleValidate('TCK-DEMO-VAL1');
                  }}
                  className="px-4 py-1.5 rounded-full bg-[#cca255]/15 hover:bg-[#cca255]/25 border border-[#cca255]/35 text-xs text-[#f5d99b] font-mono transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3 h-3 text-[#cca255]" />
                  <span>Demo Pass: TCK-DEMO-VAL1</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTokenInput('TCK-INVALID-DUMMY');
                    handleValidate('TCK-INVALID-DUMMY');
                  }}
                  className="px-4 py-1.5 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-xs text-rose-300 font-mono transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <X className="w-3 h-3" />
                  <span>Sample Invalid Code</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans">
                Each digital pass is single-use and automatically invalidates after check-in.
              </p>
            </div>

            {/* Manual Token / Hardware Scanner Input */}
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider">
                Enter QR Pass Token or Scan Barcode
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <QrCode className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="e.g. TCK-DEMO-VAL1 or paste QR string"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-full bg-white/[0.04] border border-white/15 text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-[#cca255] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !tokenInput.trim()}
                  className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#cca255] via-[#f5d99b] to-[#cca255] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 disabled:opacity-40 transition-all shrink-0 shadow-[0_0_20px_rgba(204,162,85,0.25)] cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </span>
                  ) : (
                    'Verify Pass'
                  )}
                </button>
              </div>
            </form>

            {/* Validation Outcome Card */}
            {result && (
              <div
                className={`p-6 rounded-3xl border transition-all shadow-xl backdrop-blur-xl ${
                  result.valid
                    ? 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_24px_rgba(16,185,129,0.15)]'
                    : 'bg-rose-950/40 border-rose-500/50 shadow-[0_0_24px_rgba(244,63,94,0.15)]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-2xl shrink-0 ${
                      result.valid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {result.valid ? (
                      <CheckCircle2 className="w-7 h-7" />
                    ) : (
                      <XCircle className="w-7 h-7" />
                    )}
                  </div>

                  <div className="space-y-2.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                          result.valid
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {result.status || (result.valid ? 'AUTHORIZED' : 'DENIED')}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        Code: {tokenInput}
                      </span>
                    </div>

                    <h3
                      className={`text-base font-bold ${
                        result.valid ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {result.message}
                    </h3>

                    {result.booking && (
                      <div className="pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-zinc-400 font-mono uppercase block">Patron</span>
                          <span className="font-bold text-white">{result.booking.user?.fullName || 'Guest'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 font-mono uppercase block">Movie</span>
                          <span className="font-bold text-white">{result.booking.show?.movie?.title}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 font-mono uppercase block">Seat(s)</span>
                          <span className="font-mono font-bold text-[#f5d99b]">
                            {result.booking.bookingSeats?.map((bs: any) => `${bs.seat.rowName}${bs.seat.seatNumber}`).join(', ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 font-mono uppercase block">Reference</span>
                          <span className="font-mono text-zinc-300">{result.booking.bookingReference}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Screenings & Seating (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl bg-[#0d0f17]/90 border border-white/10 p-6 sm:p-7 shadow-2xl backdrop-blur-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-[#cca255]" />
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                  Today's Screenings &amp; Seating
                </h3>
              </div>
              <button
                onClick={fetchReports}
                title="Refresh Screenings"
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingReports ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingReports ? (
              <StaffScreeningSkeleton />
            ) : reportsData?.shows && reportsData.shows.length > 0 ? (
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {reportsData.shows.map((s: any) => (
                  <div
                    key={s.showId}
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-tight">{s.movieTitle}</h4>
                        <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <span>{s.screenName}</span>
                          <span>•</span>
                          <span className="text-zinc-300 font-mono">{formatDateTime(s.startTime)}</span>
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#f5d99b] bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                        {s.occupancyRate.toFixed(0)}%
                      </span>
                    </div>

                    {/* Progress Bar with Warm Gold Accent */}
                    <div className="space-y-1">
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#cca255] to-[#f5d99b] transition-all duration-500 rounded-full"
                          style={{ width: `${Math.min(s.occupancyRate, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                        <span>Booked: <strong className="text-white">{s.bookedSeats}</strong> / {s.totalCapacity}</span>
                        <span>Open: <strong className="text-[#f5d99b]">{s.availableSeats}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 py-6 text-center">No screenings scheduled for today.</p>
            )}
          </div>
        </div>
      </div>

      {/* Gate Verification & Check-Ins History Ledger */}
      <div className="rounded-3xl bg-[#0d0f17]/90 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-[#cca255]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Gate Verification &amp; Check-Ins History
            </h3>
            <span className="text-[10px] font-mono font-bold text-[#cca255] bg-[#cca255]/10 px-2 py-0.5 rounded-full border border-[#cca255]/20">
              Database Ledger
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-zinc-400">
              {combinedHistory.length} Recorded Check-Ins
            </span>
            <button
              onClick={() => {
                fetchVerifications();
                fetchReports();
              }}
              disabled={loadingVerifications}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-white/5 disabled:opacity-50 flex items-center gap-1.5 text-xs font-mono"
              title="Refresh ledger from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingVerifications ? 'animate-spin text-[#cca255]' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>
        </div>

        {loadingVerifications && combinedHistory.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <RefreshCw className="w-5 h-5 text-[#cca255] animate-spin mx-auto" />
            <p className="text-xs font-mono text-zinc-400">Retrieving check-in history from database...</p>
          </div>
        ) : combinedHistory.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <QrCode className="w-7 h-7 text-zinc-600 mx-auto" />
            <p className="text-xs font-mono text-zinc-300 font-semibold">No pass verifications recorded yet today.</p>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              Scanned QR passes and turnstile check-ins will be logged here automatically in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/[0.02] text-zinc-400 uppercase text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-5 font-semibold">Time</th>
                  <th className="py-3.5 px-5 font-semibold">Pass / Ref</th>
                  <th className="py-3.5 px-5 font-semibold">Patron</th>
                  <th className="py-3.5 px-5 font-semibold">Screening</th>
                  <th className="py-3.5 px-5 font-semibold">Seats</th>
                  <th className="py-3.5 px-5 font-semibold">Gate Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {combinedHistory.map((h, i) => (
                  <tr key={h.id || i} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-5 text-zinc-400 whitespace-nowrap">
                      {formatDateTime(h.redeemedAt)}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="font-bold text-white tracking-wider block">{h.token}</span>
                      {h.bookingReference && h.bookingReference !== 'N/A' && (
                        <span className="text-[10px] text-zinc-500 font-mono">#{h.bookingReference}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-sans font-medium text-zinc-200 whitespace-nowrap">
                      {h.attendee}
                    </td>
                    <td className="py-3.5 px-5 font-sans whitespace-nowrap">
                      <div className="font-medium text-white">{h.movieTitle}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{h.screenName}</div>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      {h.seats && h.seats.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {h.seats.map((seat: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[10px] font-bold border border-white/10"
                            >
                              {seat}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          h.valid
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {h.valid ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-rose-400" />}
                        {h.status || (h.valid ? 'VERIFIED' : 'DENIED')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
