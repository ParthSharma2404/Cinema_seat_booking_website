'use client';

import React, { useEffect, useState } from 'react';
import { Film, Plus, Trash2, Clock, Star, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMins, setDurationMins] = useState(120);
  const [language, setLanguage] = useState('English');
  const [genre, setGenre] = useState('Sci-Fi / Action');
  const [posterUrl, setPosterUrl] = useState('https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800');
  const [rating, setRating] = useState('PG-13');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/movies');
      if (res.ok) {
        const data = await res.json();
        setMovies(data.movies || []);
      }
    } catch {
      console.error('Failed to load movies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          durationMins: Number(durationMins),
          language,
          genre,
          posterUrl,
          rating,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to create movie');
      } else {
        setFeedback(`Movie "${title}" added to catalog.`);
        setShowModal(false);
        setTitle('');
        setDescription('');
        await fetchMovies();
      }
    } catch {
      alert('Error saving movie');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMovie = async (id: string, movieTitle: string) => {
    if (!confirm(`Are you sure you want to remove "${movieTitle}"?`)) return;

    try {
      const res = await fetch(`/api/movies/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFeedback(`Movie "${movieTitle}" deleted.`);
        await fetchMovies();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch {
      alert('Error deleting movie');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Film className="w-6 h-6 text-violet-400" />
            Manage Movies Catalog
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Add new titles, edit cinema catalog metadata, and configure active releases
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/30"
        >
          <Plus className="w-4 h-4" />
          Add New Movie
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {movies.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-3xl border border-white/10 bg-[#0e101a] shadow-xl flex gap-4 items-start hover:border-violet-500/30 transition-all"
            >
              <div className="w-20 aspect-[2/3] rounded-2xl overflow-hidden bg-black flex-shrink-0 border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.posterUrl} alt={m.title} className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-violet-400 uppercase font-bold">
                    {m.genre}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white font-bold border border-white/10">
                    {m.rating}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white line-clamp-1">{m.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{m.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-slate-400">
                  <span>{m.durationMins} mins</span>
                  <button
                    onClick={() => handleDeleteMovie(m.id, m.title)}
                    className="text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                    title="Delete movie"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Movie Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-3xl border border-white/10 bg-[#121422] p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Add New Movie</h3>

            <form onSubmit={handleCreateMovie} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Gladiator II"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Synopsis</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief synopsis..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    value={durationMins}
                    onChange={(e) => setDurationMins(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rating</label>
                  <input
                    type="text"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Genre</label>
                  <input
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Language</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Poster Image URL</label>
                <input
                  type="url"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-violet-500"
                />
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
                  {isSubmitting ? 'Saving...' : 'Create Title'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
