'use client';

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  ScanLine,
  User,
  Film,
  Armchair,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default function GateScannerPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sessionFailedScans, setSessionFailedScans] = useState<any[]>([]);

  // Persistent verification & check-ins ledger from DB
  const [pastVerifications, setPastVerifications] = useState<any[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(true);

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
        fetchVerifications();
      } else {
        setSessionFailedScans((prev) => [
          {
            id: 'failed-' + Date.now(),
            token,
            bookingReference: 'N/A',
            attendee: 'Unknown / Invalid',
            movieTitle: 'Denied',
            screenName: 'Auditorium Gate',
            seats: [],
            status: data.status || 'DENIED',
            valid: false,
            message: data.message || 'Pass invalid or expired',
            redeemedAt: new Date().toISOString(),
          },
          ...prev.slice(0, 9),
        ]);
      }
    } catch {
      setResult({
        valid: false,
        status: 'ERROR',
        message: 'Scanner network error or unauthorized access',
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
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2.5 uppercase tracking-wide">
          <ScanLine className="w-5 h-5 text-[#cca255]" />
          Auditorium Ticket &amp; Pass Scanner
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Verify digital pass validity and manage turnstile entry in real time
        </p>
      </div>

      {/* Main Scanner Box */}
      <div className="rounded-3xl border border-white/10 bg-[#0d0f17]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        {/* Quick Test Token Presets */}
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
              className="px-4 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-xs text-emerald-300 font-mono transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3 h-3" />
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
        </div>

        {/* Input Bar */}
        <form onSubmit={handleFormSubmit} className="space-y-3">
          <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider">
            Enter QR Pass Token or Scan Barcode
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <QrCode className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="e.g. TCK-DEMO-VAL1"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-full bg-white/[0.04] border border-white/15 text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-[#cca255] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#cca255] via-[#f5d99b] to-[#cca255] text-black font-bold uppercase tracking-wider text-xs hover:brightness-110 disabled:opacity-40 transition-all shrink-0 shadow-[0_0_20px_rgba(204,162,85,0.25)] cursor-pointer flex items-center justify-center gap-2"
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

        {/* Scan Result Card */}
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
                    {result.status}
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
                      <span className="text-[10px] text-zinc-400 font-mono uppercase block">Attendee</span>
                      <span className="font-bold text-white">{result.booking.user?.fullName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 font-mono uppercase block">Movie</span>
                      <span className="font-bold text-white">{result.booking.show?.movie?.title}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 font-mono uppercase block">Seats</span>
                      <span className="font-mono font-bold text-[#f5d99b]">
                        {result.booking.bookingSeats?.map((bs: any) => `${bs.seat.rowName}${bs.seat.seatNumber}`).join(', ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 font-mono uppercase block">Ref Code</span>
                      <span className="font-mono text-zinc-300">{result.booking.bookingReference}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Verifications & Check-Ins History Table */}
      <div className="rounded-3xl border border-white/10 bg-[#0d0f17]/90 overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-[#cca255]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Gate Verification &amp; Pass Check-Ins Ledger
            </h3>
            <span className="text-[10px] font-mono font-bold text-[#cca255] bg-[#cca255]/10 px-2 py-0.5 rounded-full border border-[#cca255]/20">
              Database Ledger
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-zinc-400">
              {combinedHistory.length} Recorded Entries
            </span>
            <button
              onClick={() => fetchVerifications()}
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
            <p className="text-xs font-mono text-zinc-400">Loading pass check-in logs from database...</p>
          </div>
        ) : combinedHistory.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <QrCode className="w-7 h-7 text-zinc-600 mx-auto" />
            <p className="text-xs font-mono text-zinc-300 font-semibold">No pass verifications recorded yet today.</p>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              Scanned QR passes and turnstile check-ins will be logged here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/[0.02] text-zinc-400 uppercase text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-3 px-4 font-semibold">Time</th>
                  <th className="py-3 px-4 font-semibold">Token / Ref</th>
                  <th className="py-3 px-4 font-semibold">Attendee</th>
                  <th className="py-3 px-4 font-semibold">Screening / Details</th>
                  <th className="py-3 px-4 font-semibold">Gate Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {combinedHistory.map((h, i) => (
                  <tr key={h.id || i} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                      {formatDateTime(h.redeemedAt)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-white tracking-wider block">{h.token}</span>
                      {h.bookingReference && h.bookingReference !== 'N/A' && (
                        <span className="text-[10px] text-zinc-500 font-mono">#{h.bookingReference}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans text-zinc-200 whitespace-nowrap">
                      {h.attendee}
                    </td>
                    <td className="py-3 px-4 font-sans whitespace-nowrap">
                      <div className="font-medium text-white">{h.movieTitle}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {h.screenName} {h.seats && h.seats.length > 0 && `• Seats: ${h.seats.join(', ')}`}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          h.valid
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
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
