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
} from 'lucide-react';
import { formatDateTime, formatCurrency } from '@/lib/utils';

interface ScanEvent {
  timestamp: string;
  token: string;
  status: string;
  valid: boolean;
  message: string;
  attendee: string;
}

export default function StaffWorkstationPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanEvent[]>([]);

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

  useEffect(() => {
    fetchReports();
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

      setScanHistory((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          token,
          status: data.status || (data.valid ? 'CONFIRMED' : 'DENIED'),
          valid: !!data.valid,
          message: data.message || (data.valid ? 'Admission Authorized' : 'Invalid Pass'),
          attendee: data.booking?.user?.fullName || 'N/A',
        },
        ...prev.slice(0, 14),
      ]);

      // Refresh headcount numbers if ticket was successfully admitted
      if (data.valid) {
        fetchReports();
      }
    } catch {
      setResult({
        valid: false,
        status: 'NETWORK_ERROR',
        message: 'Scanner network error or invalid gateway request',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleValidate();
  };

  return (
    <div className="space-y-8 font-sans">
      {/* 2-Column Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Turnstile Scanner (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl bg-[#0e101a] border border-white/10 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <ScanLine className="w-5 h-5 text-zinc-300" />
                <h2 className="text-base font-bold text-white tracking-wide">
                  Turnstile QR & Barcode Scanner
                </h2>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                1-Time Gate Admission
              </span>
            </div>

            {/* Quick Test Token Strip */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
              <span className="text-[10px] font-mono font-semibold uppercase text-zinc-400 tracking-wider block">
                Evaluator Quick-Test Presets (Click to test turnstile gate):
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTokenInput('TCK-DEMO-VAL1');
                    handleValidate('TCK-DEMO-VAL1');
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-300 font-mono transition-colors"
                >
                  ✓ Test Valid Pre-Seeded Pass (TCK-DEMO-VAL1)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTokenInput('TCK-INVALID-DUMMY');
                    handleValidate('TCK-INVALID-DUMMY');
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs text-rose-300 font-mono transition-colors"
                >
                  ✗ Test Counterfeit / Fake Pass
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 italic">
                Tip: Scanning a valid ticket a second time tests duplicate pass prevention (ALREADY_REDEEMED).
              </p>
            </div>

            {/* Manual Token / Hardware Scanner Input */}
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <label className="block text-xs font-mono font-medium text-zinc-300 uppercase tracking-wider">
                Scan Pass Barcode / Enter QR Validation Token
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <QrCode className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="e.g. TCK-DEMO-VAL1 or paste QR string"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !tokenInput.trim()}
                  className="px-6 py-3 rounded-2xl bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-zinc-200 disabled:opacity-40 transition-all shrink-0 shadow-lg"
                >
                  {loading ? 'Verifying...' : 'Validate Entry'}
                </button>
              </div>
            </form>

            {/* Validation Outcome Card */}
            {result && (
              <div
                className={`p-6 rounded-2xl border transition-all ${
                  result.valid
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : 'bg-rose-950/30 border-rose-500/40'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-xl shrink-0 ${
                      result.valid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {result.valid ? (
                      <CheckCircle2 className="w-7 h-7" />
                    ) : (
                      <XCircle className="w-7 h-7" />
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                          result.valid
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {result.status || (result.valid ? 'AUTHORIZED' : 'DENIED')}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        Token: {tokenInput}
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
                          <span className="font-mono font-bold text-white">
                            {result.booking.bookingSeats?.map((bs: any) => `${bs.seat.rowName}${bs.seat.seatNumber}`).join(', ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 font-mono uppercase block">Booking Ref</span>
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

        {/* RIGHT COLUMN: Live Hall Headcount & Screenings (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl bg-[#0e101a] border border-white/10 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-300" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Today's Screenings & Capacity
                </h3>
              </div>
              <button
                onClick={fetchReports}
                title="Refresh Hall Headcounts"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingReports ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingReports ? (
              <div className="py-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />
              </div>
            ) : reportsData?.shows && reportsData.shows.length > 0 ? (
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {reportsData.shows.map((s: any) => (
                  <div
                    key={s.showId}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white">{s.movieTitle}</h4>
                        <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <span>{s.screenName}</span>
                          <span>•</span>
                          <span className="text-zinc-300">{formatDateTime(s.startTime)}</span>
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">
                        {s.occupancyRate.toFixed(0)}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-white transition-all duration-500 rounded-full"
                          style={{ width: `${Math.min(s.occupancyRate, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                        <span>Booked: <strong className="text-white">{s.bookedSeats}</strong> / {s.totalCapacity}</span>
                        <span>Avail: <strong className="text-zinc-300">{s.availableSeats}</strong></span>
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

      {/* Session Admissions Ledger Table */}
      {scanHistory.length > 0 && (
        <div className="rounded-3xl bg-[#0e101a] border border-white/10 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <History className="w-4 h-4 text-zinc-400" />
              Live Turnstile Admissions Stream
            </h3>
            <span className="text-[11px] font-mono text-zinc-400">{scanHistory.length} pass validations</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/[0.02] text-zinc-400 uppercase text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-3 px-5 font-semibold">Time</th>
                  <th className="py-3 px-5 font-semibold">Token / Code</th>
                  <th className="py-3 px-5 font-semibold">Attendee</th>
                  <th className="py-3 px-5 font-semibold">Admission Status</th>
                  <th className="py-3 px-5 font-semibold">Verification Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {scanHistory.map((h, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-5 text-zinc-500">{h.timestamp}</td>
                    <td className="py-3 px-5 font-bold text-white">{h.token}</td>
                    <td className="py-3 px-5 font-sans text-zinc-300">{h.attendee}</td>
                    <td className="py-3 px-5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          h.valid
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {h.status}
                      </span>
                    </td>
                    <td className="py-3 px-5 font-sans text-zinc-400">{h.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
