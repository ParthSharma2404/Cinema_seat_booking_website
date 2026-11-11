'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Clock, Armchair, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function AdminShowsPage() {
  const [shows, setShows] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [screens, setScreens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form fields
  const [movieId, setMovieId] = useState('');
  const [screenId, setScreenId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [basePrice, setBasePrice] = useState(300);
  const [format, setFormat] = useState('IMAX');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resShows, resMovies] = await Promise.all([
        fetch('/api/shows'),
        fetch('/api/movies'),
      ]);

      if (resShows.ok && resMovies.ok) {
        const dataShows = await resShows.json();
        const dataMovies = await resMovies.json();
        setShows(dataShows.shows || []);
        setMovies(dataMovies.movies || []);

        if (dataMovies.movies && dataMovies.movies.length > 0) {
          setMovieId(dataMovies.movies[0].id);
        }

        const screenMap = new Map();
        for (const s of dataShows.shows) {
          if (!screenMap.has(s.screen.id)) {
            screenMap.set(s.screen.id, s.screen);
          }
        }
        const scrList = Array.from(screenMap.values());
        setScreens(scrList);
        if (scrList.length > 0) {
          setScreenId(scrList[0].id);
        }
      }
    } catch {
      console.error('Failed to load shows/movies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const d = new Date();
    d.setHours(19, 0, 0, 0);
    const startIso = d.toISOString().slice(0, 16);
    setStartTime(startIso);

    const endD = new Date(d);
    endD.setHours(21, 30, 0, 0);
    setEndTime(endD.toISOString().slice(0, 16));
  }, []);

  const handleCreateShow = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setFeedback(null);

    try {
      const res = await fetch('/api/shows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId,
          screenId,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          basePrice: Number(basePrice),
          format,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to schedule show');
      } else {
        setFeedback('New showtime successfully scheduled.');
        setShowModal(false);
        await fetchData();
      }
    } catch {
      setErrorMsg('Error creating show schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-violet-400" />
            Schedules & Tier Pricing Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Acceptance Test 1: Schedule screening times, bind screens, and set base tier multipliers
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/30"
        >
          <Plus className="w-4 h-4" />
          Schedule Show
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-400 font-bold hover:text-white">
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-[#0e101a] overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
              Active Show Schedules & Multipliers
            </span>
            <span className="text-xs font-mono text-slate-500">{shows.length} shows scheduled</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] text-slate-400 uppercase font-mono text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-3 px-4 font-semibold">Movie</th>
                  <th className="py-3 px-4 font-semibold">Theatre & Screen</th>
                  <th className="py-3 px-4 font-semibold">Format</th>
                  <th className="py-3 px-4 font-semibold">Start Time</th>
                  <th className="py-3 px-4 font-semibold">Base Price</th>
                  <th className="py-3 px-4 font-semibold">Tiers (Silver / Gold / VIP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {shows.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{s.movie.title}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-300">{s.screen.theatre.name}</span>
                      <span className="text-[11px] text-slate-500 block">{s.screen.name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-600/30 text-violet-300 border border-violet-500/40">
                        {s.format}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {formatDateTime(s.startTime)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {formatCurrency(s.basePrice)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      Silver: {formatCurrency(s.basePrice)} • Gold: {formatCurrency(s.basePrice * 1.3)} • VIP: {formatCurrency(s.basePrice * 1.8)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Show Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-3xl border border-white/10 bg-[#121422] p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Schedule New Screening</h3>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateShow} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Movie</label>
                <select
                  value={movieId}
                  onChange={(e) => setMovieId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  {movies.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#121422]">
                      {m.title} ({m.durationMins}m)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Auditorium / Screen</label>
                <select
                  value={screenId}
                  onChange={(e) => setScreenId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  {screens.map((scr) => (
                    <option key={scr.id} value={scr.id} className="bg-[#121422]">
                      {scr.theatre?.name || 'Multiplex'} — {scr.name} ({scr.totalSeats} seats)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Base Price (₹)</label>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Format Tag</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="IMAX" className="bg-[#121422]">IMAX with Laser</option>
                    <option value="4K DOLBY" className="bg-[#121422]">4K Dolby Atmos</option>
                    <option value="2D" className="bg-[#121422]">Standard 2D</option>
                    <option value="3D" className="bg-[#121422]">RealD 3D</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white shadow-lg shadow-violet-600/30"
                >
                  {isSubmitting ? 'Scheduling...' : 'Save Showtime'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
