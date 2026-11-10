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

        // Extract distinct screens from shows or movies
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

    // Default start time: today at 7pm
    const d = new Date();
    d.setHours(19, 0, 0, 0);
    const startIso = d.toISOString().slice(0, 16);
    setStartTime(startIso);

    d.setHours(21, 45, 0, 0);
    const endIso = d.toISOString().slice(0, 16);
    setEndTime(endIso);
  }, []);

  const handleCreateShow = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    setErrorMsg(null);

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
        setFeedback(`Show scheduled successfully!`);
        setShowModal(false);
        await fetchData();
      }
    } catch {
      setErrorMsg('Error scheduling show');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-red-500" />
            Schedules & Showtime Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure showtimes, set tier base pricing, and prevent screen scheduling collisions
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-md shadow-red-950"
        >
          <Plus className="w-4 h-4" />
          Schedule New Show
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-400 font-bold">
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 font-bold">
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Movie</th>
                  <th className="py-3 px-4">Screen & Theatre</th>
                  <th className="py-3 px-4">Show Date & Time</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Base Pricing</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {shows.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {s.movie.title}
                    </td>
                    <td className="py-3.5 px-4">
                      {s.screen.theatre.name} — {s.screen.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {formatDateTime(s.startTime)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 text-[10px] font-bold border border-red-800 font-mono">
                        {s.format}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {formatCurrency(s.basePrice)}
                    </td>
                    <td className="py-3.5 px-4">
                      <a
                        href={`/shows/${s.id}`}
                        target="_blank"
                        className="text-xs text-red-400 hover:text-red-300 underline"
                      >
                        Open Seat Map →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Schedule New Show</h3>

            <form onSubmit={handleCreateShow} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Select Movie
                </label>
                <select
                  value={movieId}
                  onChange={(e) => setMovieId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.durationMins}m)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Select Screen
                </label>
                <select
                  value={screenId}
                  onChange={(e) => setScreenId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  {screens.map((scr) => (
                    <option key={scr.id} value={scr.id}>
                      {scr.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Base Price (INR)
                  </label>
                  <input
                    type="number"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="IMAX">IMAX</option>
                    <option value="2D">2D</option>
                    <option value="3D">3D</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-md shadow-red-950"
                >
                  {isSubmitting ? 'Scheduling...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
