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
  const [posterUrl, setPosterUrl] = useState('https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800');
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
        setFeedback(`Movie "${title}" created successfully!`);
        setShowModal(false);
        setTitle('');
        setDescription('');
        await fetchMovies();
      }
    } catch {
      alert('Error creating movie');
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
        const err = await res.json();
        alert(err.error || 'Failed to delete movie');
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
            <Film className="w-6 h-6 text-red-500" />
            Manage Movies Catalog
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Add new titles, edit cinema catalog metadata, and configure active releases
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-md shadow-red-950"
        >
          <Plus className="w-4 h-4" />
          Add New Movie
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

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {movies.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 flex gap-4 items-start"
            >
              <div className="w-20 aspect-[2/3] rounded-lg overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.posterUrl} alt={m.title} className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-red-400 uppercase font-semibold">
                    {m.genre}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-bold">
                    {m.rating}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white line-clamp-1">{m.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{m.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                  <span>{m.durationMins} mins</span>
                  <button
                    onClick={() => handleDeleteMovie(m.id, m.title)}
                    className="text-rose-400 hover:text-rose-300 p-1 rounded"
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
          <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Add New Movie</h3>

            <form onSubmit={handleCreateMovie} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Gladiator II"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Movie synopsis..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    required
                    value={durationMins}
                    onChange={(e) => setDurationMins(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Rating</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="PG-13">PG-13</option>
                    <option value="R">R</option>
                    <option value="PG">PG</option>
                    <option value="U/A">U/A</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Genre</label>
                  <input
                    type="text"
                    required
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Language</label>
                  <input
                    type="text"
                    required
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Poster URL</label>
                <input
                  type="url"
                  required
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                />
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
                  {isSubmitting ? 'Saving...' : 'Save Movie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
