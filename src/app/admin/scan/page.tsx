'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default function GateScannerPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState<any[]>([]);

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

      // Append to local session scan history
      setScanHistory((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          token,
          status: data.status,
          valid: data.valid,
          message: data.message,
          attendee: data.booking?.user?.fullName || 'N/A',
        },
        ...prev.slice(0, 19),
      ]);
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ScanLine className="w-6 h-6 text-violet-600" />
          Turnstile & Gate Entry QR Scanner
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Acceptance Test 4 demonstration: Verifies ticket validity and enforces strict single-use entry
        </p>
      </div>

      {/* Main Scanner Box */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-soft space-y-6">
        {/* Quick Test Token Presets */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2 font-mono">
            Evaluator Quick Test Tokens (Click to scan)
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setTokenInput('TCK-DEMO-VAL1');
                handleValidate('TCK-DEMO-VAL1');
              }}
              className="px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs text-emerald-800 font-mono transition-colors shadow-xs"
            >
              Test Pre-Seeded Valid Ticket (TCK-DEMO-VAL1)
            </button>
            <button
              type="button"
              onClick={() => {
                setTokenInput('TCK-DEMO-CANCELLED');
                handleValidate('TCK-DEMO-CANCELLED');
              }}
              className="px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs text-rose-800 font-mono transition-colors shadow-xs"
            >
              Test Cancelled Ticket (TCK-DEMO-CANCELLED)
            </button>
            <button
              type="button"
              onClick={() => {
                setTokenInput('TCK-NONEXISTENT-99');
                handleValidate('TCK-NONEXISTENT-99');
              }}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-600 font-mono transition-colors shadow-xs"
            >
              Test Fake Token (TCK-NONEXISTENT)
            </button>
          </div>
        </div>

        {/* Form Input */}
        <form onSubmit={handleFormSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <QrCode className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Scan or enter QR Validation Token (e.g. TCK-DEMO-VAL1 or BK-DEMO01)..."
              className="w-full pl-10 pr-4 py-3 rounded-full bg-slate-50 border border-slate-200 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-600 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
          >
            {loading ? 'Verifying...' : 'Validate Entry'}
          </button>
        </form>

        {/* Real-time Scan Result Banner */}
        {result && (
          <div
            className={`p-6 rounded-2xl border text-sm transition-all duration-300 ${
              result.valid
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : result.status === 'ALREADY_REDEEMED'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            <div className="flex items-start gap-4">
              {result.valid ? (
                <div className="p-2.5 rounded-2xl bg-emerald-600 text-white">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
              ) : result.status === 'ALREADY_REDEEMED' ? (
                <div className="p-2.5 rounded-2xl bg-rose-600 text-white">
                  <XCircle className="w-7 h-7" />
                </div>
              ) : (
                <div className="p-2.5 rounded-2xl bg-amber-600 text-white">
                  <AlertTriangle className="w-7 h-7" />
                </div>
              )}

              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded-full font-bold bg-white/80 border border-black/10">
                    {result.status}
                  </span>
                  <span className="text-base font-extrabold">{result.message}</span>
                </div>

                {/* Extended Details when found */}
                {result.booking && (
                  <div className="pt-3 border-t border-black/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="opacity-70 block text-[10px] uppercase font-mono">
                        Attendee
                      </span>
                      <span className="font-bold">{result.booking.user?.fullName}</span>
                    </div>
                    <div>
                      <span className="opacity-70 block text-[10px] uppercase font-mono">
                        Movie & Screen
                      </span>
                      <span className="font-bold">
                        {result.booking.show?.movie?.title} (
                        {result.booking.show?.screen?.name})
                      </span>
                    </div>
                    <div>
                      <span className="opacity-70 block text-[10px] uppercase font-mono">
                        Seats Validated
                      </span>
                      <span className="font-mono font-bold">
                        {result.booking.bookingSeats
                          ?.map((bs: any) => `${bs.seat.rowName}${bs.seat.seatNumber}`)
                          .join(', ')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Session Scan Log */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-soft">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5 font-mono">
          <History className="w-4 h-4 text-violet-600" />
          Recent Turnstile Scans (Session Log)
        </h3>

        {scanHistory.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center italic">
            No tickets scanned yet during this session.
          </p>
        ) : (
          <div className="space-y-2">
            {scanHistory.map((h, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-400 text-[11px]">{h.timestamp}</span>
                  <span className="font-mono text-slate-900 font-bold">{h.token}</span>
                  <span className="text-slate-500">({h.attendee})</span>
                </div>
                <span
                  className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    h.valid
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
