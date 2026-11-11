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
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ScanLine className="w-6 h-6 text-violet-400" />
          Turnstile & Gate Entry QR Scanner
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Acceptance Test 4 demonstration: Verifies ticket validity and enforces strict single-use entry
        </p>
      </div>

      {/* Main Scanner Box */}
      <div className="rounded-3xl border border-white/10 bg-[#0e101a] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Quick Test Token Presets */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
            Evaluator Quick Test Tokens (Click to scan)
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setTokenInput('TCK-DEMO-VAL1');
                handleValidate('TCK-DEMO-VAL1');
              }}
              className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs text-emerald-300 font-mono transition-colors shadow-xs"
            >
              Test Pre-Seeded Valid Ticket (TCK-DEMO-VAL1)
            </button>
            <button
              type="button"
              onClick={() => {
                setTokenInput('TCK-INVALID-DUMMY');
                handleValidate('TCK-INVALID-DUMMY');
              }}
              className="px-3.5 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs text-rose-300 font-mono transition-colors shadow-xs"
            >
              Test Invalid / Fake Token
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 mb-2 uppercase tracking-wider">
              Scan or Enter Cryptographic QR Validation Token
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <QrCode className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. TCK-DEMO-VAL1"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !tokenInput.trim()}
                className="px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-violet-600/30 shrink-0"
              >
                {loading ? 'Verifying...' : 'Validate Entry'}
              </button>
            </div>
          </div>
        </form>

        {/* Scan Result Card */}
        {result && (
          <div
            className={`p-6 rounded-3xl border transition-all ${
              result.valid
                ? 'bg-emerald-950/40 border-emerald-500/50 shadow-2xl shadow-emerald-500/10'
                : 'bg-rose-950/40 border-rose-500/50 shadow-2xl shadow-rose-500/10'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-2xl ${
                  result.valid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {result.valid ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : (
                  <XCircle className="w-8 h-8" />
                )}
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                      result.valid
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {result.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Token: {tokenInput}
                  </span>
                </div>

                <h3
                  className={`text-lg font-black tracking-tight ${
                    result.valid ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {result.message}
                </h3>

                {result.booking && (
                  <div className="pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">Attendee</span>
                      <span className="font-bold text-white">{result.booking.user?.fullName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">Movie</span>
                      <span className="font-bold text-white">{result.booking.show?.movie?.title}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">Seats</span>
                      <span className="font-mono font-bold text-violet-300">
                        {result.booking.bookingSeats?.map((bs: any) => `${bs.seat.rowName}${bs.seat.seatNumber}`).join(', ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">Ref Code</span>
                      <span className="font-mono text-white">{result.booking.bookingReference}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Session History Table */}
      {scanHistory.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-[#0e101a] overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <History className="w-4 h-4 text-violet-400" />
              Live Scanner Session Audit Logs
            </h3>
            <span className="text-[11px] font-mono text-slate-400">{scanHistory.length} scan events</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] text-slate-400 uppercase font-mono text-[10px] border-b border-white/10">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Time</th>
                <th className="py-2.5 px-4 font-semibold">Token</th>
                <th className="py-2.5 px-4 font-semibold">Attendee</th>
                <th className="py-2.5 px-4 font-semibold">Gate Status</th>
                <th className="py-2.5 px-4 font-semibold">Outcome Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
              {scanHistory.map((h, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-4 text-slate-500">{h.timestamp}</td>
                  <td className="py-2.5 px-4 font-bold text-white">{h.token}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-300">{h.attendee}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        h.valid
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {h.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-400">{h.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
