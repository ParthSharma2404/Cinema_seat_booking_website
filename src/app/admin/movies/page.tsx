'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Film,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Edit3,
  Upload,
  Image as ImageIcon,
  Users,
  X,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { MovieCatalogSkeleton } from '@/components/Skeleton';

interface CastInput {
  id?: string;
  name: string;
  character: string;
  photoUrl?: string | null;
  order: number;
}

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [screens, setScreens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add / Edit Movie Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMins, setDurationMins] = useState(120);
  const [language, setLanguage] = useState('English');
  const [genre, setGenre] = useState('Sci-Fi / Action');
  const [rating, setRating] = useState('PG-13');
  const [releaseDate, setReleaseDate] = useState('2026-03-01');
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [cast, setCast] = useState<CastInput[]>([]);

  // Upload States
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingBackdrop, setUploadingBackdrop] = useState(false);
  const [uploadingCastIndex, setUploadingCastIndex] = useState<number | null>(null);

  // Hidden File Inputs Refs
  const posterFileRef = useRef<HTMLInputElement>(null);
  const backdropFileRef = useRef<HTMLInputElement>(null);
  const castFileRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Quick Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedMovieForSchedule, setSelectedMovieForSchedule] = useState<any | null>(null);
  const [schedScreenId, setSchedScreenId] = useState('');
  const [schedStartTime, setSchedStartTime] = useState('');
  const [schedEndTime, setSchedEndTime] = useState('');
  const [schedBasePrice, setSchedBasePrice] = useState(350);
  const [schedFormat, setSchedFormat] = useState('IMAX');
  const [isScheduling, setIsScheduling] = useState(false);
  const [schedError, setSchedError] = useState<string | null>(null);

  // Fetch Movies & Screens
  const fetchMoviesAndScreens = async () => {
    try {
      setLoading(true);
      const [resMovies, resScreens] = await Promise.all([
        fetch('/api/movies'),
        fetch('/api/screens'),
      ]);

      if (resMovies.ok) {
        const data = await resMovies.json();
        setMovies(data.movies || []);
      }

      if (resScreens && resScreens.ok) {
        const dataScreens = await resScreens.json();
        const scList = (dataScreens.screens || []).filter(
          (s: any) => !/test/i.test(s.theatre?.name || '')
        );
        setScreens(scList);
        if (scList.length > 0 && !schedScreenId) {
          setSchedScreenId(scList[0].id);
        }
      }
    } catch {
      console.error('Failed to load movies/screens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoviesAndScreens();
  }, []);

  // Upload file to Cloudinary via server API
  const handleUploadFile = async (file: File, folder = 'cinebook'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to upload image');
    }
    return data.url;
  };

  // Upload Poster Trigger
  const handlePosterSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const localPreview = URL.createObjectURL(file);
    setPosterUrl(localPreview);

    try {
      setUploadingPoster(true);
      const url = await handleUploadFile(file, 'cinebook/posters');
      setPosterUrl(url);
    } catch (err: any) {
      alert(err.message || 'Error uploading poster');
    } finally {
      setUploadingPoster(false);
    }
  };

  // Upload Backdrop Trigger
  const handleBackdropSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const localPreview = URL.createObjectURL(file);
    setBackdropUrl(localPreview);

    try {
      setUploadingBackdrop(true);
      const url = await handleUploadFile(file, 'cinebook/backdrops');
      setBackdropUrl(url);
    } catch (err: any) {
      alert(err.message || 'Error uploading backdrop cover');
    } finally {
      setUploadingBackdrop(false);
    }
  };

  // Upload Cast Photo Trigger
  const handleCastPhotoSelected = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const localPreview = URL.createObjectURL(file);
    setCast((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, photoUrl: localPreview } : c))
    );

    try {
      setUploadingCastIndex(idx);
      const url = await handleUploadFile(file, 'cinebook/cast');
      setCast((prev) =>
        prev.map((c, i) => (i === idx ? { ...c, photoUrl: url } : c))
      );
    } catch (err: any) {
      alert(err.message || 'Error uploading cast photo');
    } finally {
      setUploadingCastIndex(null);
    }
  };

  // Open Modal to Add New Movie
  const handleOpenAddModal = () => {
    setEditingMovieId(null);
    setTitle('');
    setDescription('');
    setDurationMins(120);
    setLanguage('English');
    setGenre('Sci-Fi / Action');
    setRating('PG-13');
    setReleaseDate('2026-03-01');
    setPosterUrl('https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800');
    setBackdropUrl('');
    setCast([
      { name: '', character: '', photoUrl: '', order: 0 },
    ]);
    setErrorMessage(null);
    setShowModal(true);
  };

  // Open Modal to Edit Existing Movie
  const handleOpenEditModal = (movie: any) => {
    setEditingMovieId(movie.id);
    setTitle(movie.title || '');
    setDescription(movie.description || '');
    setDurationMins(movie.durationMins || 120);
    setLanguage(movie.language || 'English');
    setGenre(movie.genre || 'Action');
    setRating(movie.rating || 'PG-13');
    setReleaseDate(
      movie.releaseDate ? new Date(movie.releaseDate).toISOString().slice(0, 10) : '2026-03-01'
    );
    setPosterUrl(movie.posterUrl || '');
    setBackdropUrl(movie.backdropUrl || '');

    // Format cast members
    if (movie.cast && movie.cast.length > 0) {
      setCast(
        movie.cast.map((c: any, idx: number) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          photoUrl: c.photoUrl || '',
          order: c.order ?? idx,
        }))
      );
    } else {
      setCast([{ name: '', character: '', photoUrl: '', order: 0 }]);
    }

    setErrorMessage(null);
    setShowModal(true);
  };

  // Cast Member List Handlers
  const handleAddCastMember = () => {
    setCast((prev) => [
      ...prev,
      { name: '', character: '', photoUrl: '', order: prev.length },
    ]);
  };

  const handleRemoveCastMember = (idx: number) => {
    setCast((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCastChange = (idx: number, field: keyof CastInput, value: string) => {
    setCast((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    );
  };

  // Save Movie (POST or PATCH)
  const handleSaveMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    // Filter valid cast members (must have name and character)
    const sanitizedCast = cast
      .filter((c) => c.name.trim() && c.character.trim())
      .map((c, idx) => ({
        name: c.name.trim(),
        character: c.character.trim(),
        photoUrl: c.photoUrl?.trim() || null,
        order: idx,
      }));

    const payload = {
      title: title.trim(),
      description: description.trim(),
      durationMins: Number(durationMins),
      language: language.trim(),
      genre: genre.trim(),
      rating: rating.trim(),
      releaseDate: releaseDate ? new Date(releaseDate).toISOString() : undefined,
      posterUrl: posterUrl.trim(),
      backdropUrl: backdropUrl.trim() || null,
      cast: sanitizedCast,
    };

    try {
      const url = editingMovieId ? `/api/movies/${editingMovieId}` : '/api/movies';
      const method = editingMovieId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to save movie');
      } else {
        setFeedback(
          editingMovieId
            ? `Movie "${title}" updated successfully.`
            : `Movie "${title}" added to catalog.`
        );
        setShowModal(false);
        await fetchMoviesAndScreens();
      }
    } catch {
      setErrorMessage('Network error while saving movie');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Movie
  const handleDeleteMovie = async (id: string, movieTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${movieTitle}"? This will also remove associated shows.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/movies/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFeedback(`Movie "${movieTitle}" deleted from catalog.`);
        await fetchMoviesAndScreens();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete movie');
      }
    } catch {
      alert('Error deleting movie');
    }
  };

  // Quick Schedule Showtime Modal
  const handleOpenScheduleForMovie = (movie: any) => {
    setSelectedMovieForSchedule(movie);
    setSchedError(null);
    if (screens.length > 0) setSchedScreenId(screens[0].id);

    const d = new Date();
    d.setHours(19, 30, 0, 0);
    setSchedStartTime(d.toISOString().slice(0, 16));

    const endD = new Date(d);
    endD.setMinutes(endD.getMinutes() + (movie.durationMins || 150) + 20);
    setSchedEndTime(endD.toISOString().slice(0, 16));

    setSchedBasePrice(350);
    setSchedFormat('IMAX');
    setShowScheduleModal(true);
  };

  const handleQuickSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMovieForSchedule) return;
    setIsScheduling(true);
    setSchedError(null);

    try {
      const res = await fetch('/api/shows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId: selectedMovieForSchedule.id,
          screenId: schedScreenId,
          startTime: new Date(schedStartTime).toISOString(),
          endTime: new Date(schedEndTime).toISOString(),
          basePrice: Number(schedBasePrice),
          format: schedFormat,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSchedError(data.error || 'Failed to schedule showtime');
      } else {
        setFeedback(`Screening for "${selectedMovieForSchedule.title}" successfully scheduled.`);
        setShowScheduleModal(false);
        await fetchMoviesAndScreens();
      }
    } catch {
      setSchedError('Error scheduling showtime');
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5 uppercase tracking-wide">
            <Film className="w-5 h-5 text-[#cca255]" />
            Manage Movies Catalog
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Add or edit titles, upload poster &amp; backdrop cover images to Cloudinary, and configure cast
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#cca255] via-[#f5d99b] to-[#cca255] hover:brightness-110 text-black font-bold uppercase tracking-wider text-xs transition-all shadow-[0_0_20px_rgba(204,162,85,0.25)] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Movie</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-3xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-emerald-400 font-bold hover:text-white px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <MovieCatalogSkeleton />
      ) : movies.length === 0 ? (
        <div className="p-12 text-center text-zinc-400 font-mono text-xs rounded-3xl bg-[#0d0f17]/90 border border-white/10">
          No movies found in current catalog.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {movies.map((m) => {
            const showCount = m.shows?.length || 0;
            const castCount = m.cast?.length || 0;
            return (
              <div
                key={m.id}
                className="p-4 sm:p-5 rounded-3xl border border-white/10 bg-[#0d0f17]/90 shadow-2xl backdrop-blur-xl flex flex-col justify-between gap-4 hover:border-[#cca255]/40 transition-all group"
              >
                <div className="flex gap-4 items-start">
                  <div className="w-20 aspect-[2/3] rounded-2xl overflow-hidden bg-black flex-shrink-0 border border-white/10 shadow-md relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.posterUrl} alt={m.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono text-[#cca255] uppercase font-bold tracking-wider truncate">
                        {m.genre}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white font-mono font-bold border border-white/15 shrink-0">
                        {m.rating}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white uppercase tracking-tight line-clamp-1 group-hover:text-[#f5d99b] transition-colors">
                      {m.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{m.description}</p>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-400 font-mono pt-1">
                      <span>{m.durationMins}m</span>
                      <span>•</span>
                      <span className="text-amber-200/90 font-bold">{showCount} shows</span>
                      <span>•</span>
                      <span className="text-zinc-300 font-bold">{castCount} cast</span>
                      {m.backdropUrl && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold">Cover Set</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10 gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Edit Movie Button */}
                    <button
                      onClick={() => handleOpenEditModal(m)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-[#cca255] hover:text-black text-white text-[11px] font-semibold transition-all cursor-pointer"
                      title="Edit title, poster, backdrop, and cast"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Schedule Show Button */}
                    <button
                      onClick={() => handleOpenScheduleForMovie(m)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer"
                      title="Schedule new showtime for this movie"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Schedule</span>
                    </button>

                    {/* Customer Page Preview Link */}
                    <Link
                      href={`/movies/${m.id}`}
                      target="_blank"
                      className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      title="Preview live customer movie page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <button
                    onClick={() => handleDeleteMovie(m.id, m.title)}
                    className="text-rose-400 hover:text-rose-300 p-1.5 rounded-full hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete movie"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          ADD / EDIT MOVIE MODAL (POSTER, BACKDROP, CAST)
          ======================================================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="max-w-3xl w-full my-8 rounded-3xl border border-white/10 bg-[#0d0f17] p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2">
                  <Film className="w-5 h-5 text-[#cca255]" />
                  <span>{editingMovieId ? `Edit Film: ${title}` : 'Add New Film to Catalog'}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Configure poster, backdrop cover image, release metadata, and principal cast
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveMovie} className="space-y-6">
              {/* SECTION 1: BASIC INFORMATION */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[#cca255]">
                  1. Film Details
                </h4>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Film Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Dune: Part Two"
                    className="w-full px-4 py-2.5 rounded-full bg-white/[0.04] border border-white/15 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#cca255] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Narrative Synopsis *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter storyline and narrative synopsis..."
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/15 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#cca255] transition-colors leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Duration (Mins)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={durationMins}
                      onChange={(e) => setDurationMins(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-full bg-white/[0.04] border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-[#cca255]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Rating
                    </label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-full bg-[#090b10] border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-[#cca255]"
                    >
                      <option value="PG-13">PG-13</option>
                      <option value="R">R</option>
                      <option value="PG">PG</option>
                      <option value="G">G</option>
                      <option value="NC-17">NC-17</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Genre
                    </label>
                    <input
                      type="text"
                      required
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      placeholder="e.g. Sci-Fi / Action"
                      className="w-full px-4 py-2.5 rounded-full bg-white/[0.04] border border-white/15 text-xs text-white focus:outline-none focus:border-[#cca255]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Language
                    </label>
                    <input
                      type="text"
                      required
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      placeholder="e.g. English"
                      className="w-full px-4 py-2.5 rounded-full bg-white/[0.04] border border-white/15 text-xs text-white focus:outline-none focus:border-[#cca255]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Release Date
                  </label>
                  <input
                    type="date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full bg-white/[0.04] border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-[#cca255]"
                  />
                </div>
              </div>

              {/* SECTION 2: POSTER & BACKDROP COVER (CLOUDINARY) */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[#cca255]">
                  2. Visual Artwork &amp; Background Cover
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Poster Image */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider">
                        Vertical Poster *
                      </span>
                      {uploadingPoster && (
                        <span className="text-[10px] text-amber-300 flex items-center gap-1 font-mono">
                          <Loader2 className="w-3 h-3 animate-spin" /> Uploading to Cloudinary...
                        </span>
                      )}
                    </div>

                    <div className="flex gap-3 items-center">
                      <div className="w-16 aspect-[2/3] rounded-xl overflow-hidden bg-black/50 border border-white/15 shrink-0 flex items-center justify-center">
                        {posterUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={posterUrl} alt="Poster" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-zinc-600" />
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <input
                          type="url"
                          required
                          value={posterUrl}
                          onChange={(e) => setPosterUrl(e.target.value)}
                          placeholder="Poster URL..."
                          className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-[#cca255]"
                        />

                        <div>
                          <input
                            ref={posterFileRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePosterSelected}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => posterFileRef.current?.click()}
                            disabled={uploadingPoster}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload File to Cloudinary</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Backdrop Cover Image */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider">
                        Hero Background Cover (Backdrop)
                      </span>
                      {uploadingBackdrop && (
                        <span className="text-[10px] text-amber-300 flex items-center gap-1 font-mono">
                          <Loader2 className="w-3 h-3 animate-spin" /> Uploading to Cloudinary...
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="w-full h-20 rounded-xl overflow-hidden bg-black/50 border border-white/15 flex items-center justify-center relative">
                        {backdropUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={backdropUrl}
                            alt="Backdrop"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-zinc-500 text-[11px] flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4" />
                            <span>No backdrop cover set (default theme applied)</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={backdropUrl}
                          onChange={(e) => setBackdropUrl(e.target.value)}
                          placeholder="Backdrop Cover URL (displayed on movie hero)..."
                          className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-[#cca255]"
                        />

                        <input
                          ref={backdropFileRef}
                          type="file"
                          accept="image/*"
                          onChange={handleBackdropSelected}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => backdropFileRef.current?.click()}
                          disabled={uploadingBackdrop}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-all cursor-pointer shrink-0 disabled:opacity-50"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload File</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: PRINCIPAL CAST MEMBERS */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[#cca255] flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" />
                      <span>3. Principal Cast Members ({cast.length})</span>
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Actor name and character role are required. Adding photo is optional (falls back to initials avatar).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCastMember}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#cca255]/20 hover:bg-[#cca255] hover:text-black text-[#cca255] text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Cast Member</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {cast.map((member, idx) => {
                    const initials = (member.name || '')
                      .trim()
                      .split(/\s+/)
                      .map((n) => n[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || '••';

                    const isUploadingThisPhoto = uploadingCastIndex === idx;

                    return (
                      <div
                        key={idx}
                        className="p-3 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between"
                      >
                        {/* Cast Avatar Preview */}
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-800 border border-white/20 shrink-0 flex items-center justify-center">
                          {member.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={member.photoUrl}
                              alt={member.name || 'Cast'}
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <span className="text-xs font-mono font-bold text-zinc-400">
                              {initials}
                            </span>
                          )}
                        </div>

                        {/* Name & Character Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 w-full sm:w-auto">
                          <div>
                            <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                              Actor Name *
                            </label>
                            <input
                              type="text"
                              value={member.name}
                              onChange={(e) => handleCastChange(idx, 'name', e.target.value)}
                              placeholder="e.g. Timothée Chalamet"
                              className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-[#cca255]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                              Character Role *
                            </label>
                            <input
                              type="text"
                              value={member.character}
                              onChange={(e) => handleCastChange(idx, 'character', e.target.value)}
                              placeholder="e.g. Paul Atreides"
                              className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-[#cca255]"
                            />
                          </div>
                        </div>

                        {/* Photo URL & Cloudinary Upload */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <input
                            type="url"
                            value={member.photoUrl || ''}
                            onChange={(e) => handleCastChange(idx, 'photoUrl', e.target.value)}
                            placeholder="Photo URL (optional)..."
                            className="w-full sm:w-36 px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/15 text-[11px] text-white font-mono focus:outline-none focus:border-[#cca255]"
                          />

                          <input
                            ref={(el) => {
                              castFileRefs.current[idx] = el;
                            }}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleCastPhotoSelected(idx, e)}
                            className="hidden"
                          />

                          <button
                            type="button"
                            onClick={() => castFileRefs.current[idx]?.click()}
                            disabled={isUploadingThisPhoto}
                            title="Upload photo to Cloudinary"
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                          >
                            {isUploadingThisPhoto ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveCastMember(idx)}
                            className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer shrink-0"
                            title="Remove cast member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-full border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploadingPoster || uploadingBackdrop}
                  className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black font-bold uppercase tracking-wider text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Film...</span>
                    </>
                  ) : (
                    <span>{editingMovieId ? 'Save Changes' : 'Create Film'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          QUICK SCHEDULE SHOWTIME MODAL
          ======================================================== */}
      {showScheduleModal && selectedMovieForSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="max-w-md w-full rounded-3xl border border-white/10 bg-[#0d0f17] p-7 space-y-5 shadow-2xl">
            <h3 className="text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#cca255]" />
              <span>Schedule: {selectedMovieForSchedule.title}</span>
            </h3>

            {schedError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs">
                {schedError}
              </div>
            )}

            <form onSubmit={handleQuickSchedule} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Auditorium
                </label>
                <select
                  value={schedScreenId}
                  onChange={(e) => setSchedScreenId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-[#090b10] border border-white/15 text-xs text-white focus:outline-none focus:border-[#cca255] transition-colors"
                >
                  {screens.map((scr) => (
                    <option key={scr.id} value={scr.id}>
                      {scr.name} ({scr.totalSeats} seats)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={schedStartTime}
                    onChange={(e) => setSchedStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full bg-[#090b10] border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-[#cca255]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={schedEndTime}
                    onChange={(e) => setSchedEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full bg-[#090b10] border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-[#cca255]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Base Ticket Price (₹)
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    value={schedBasePrice}
                    onChange={(e) => setSchedBasePrice(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-full bg-[#090b10] border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-[#cca255]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Format
                  </label>
                  <select
                    value={schedFormat}
                    onChange={(e) => setSchedFormat(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full bg-[#090b10] border border-white/15 text-xs text-white focus:outline-none focus:border-[#cca255]"
                  >
                    <option value="IMAX">IMAX Laser</option>
                    <option value="DOLBY_ATMOS">Dolby Atmos</option>
                    <option value="STANDARD_4K">Standard 4K</option>
                    <option value="3D">RealD 3D</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-5 py-2.5 rounded-full border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isScheduling}
                  className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black font-bold uppercase tracking-wider text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isScheduling ? 'Scheduling...' : 'Publish Showtime'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
