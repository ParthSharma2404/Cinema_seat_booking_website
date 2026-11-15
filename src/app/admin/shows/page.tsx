'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  Armchair,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit3,
  SlidersHorizontal,
  Layers,
  Tv,
  RefreshCw,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { TableSkeleton, AuditoriumLayoutSkeleton } from '@/components/Skeleton';

interface Movie {
  id: string;
  title: string;
  durationMins: number;
  posterUrl: string;
}

interface ScreenSeat {
  id: string;
  screenId: string;
  rowName: string;
  seatNumber: number;
  category: 'SILVER' | 'GOLD' | 'VIP_RECLINER';
  priceMultiplier: number;
}

interface Screen {
  id: string;
  name: string;
  totalSeats: number;
  theatre?: { name: string; city: string };
  seats?: ScreenSeat[];
  _count?: { seats: number; shows: number };
}

interface Show {
  id: string;
  movieId: string;
  screenId: string;
  startTime: string;
  endTime: string;
  basePrice: number;
  format: string;
  movie: Movie;
  screen: Screen;
}

export default function AdminShowsPage() {
  const [activeTab, setActiveTab] = useState<'shows' | 'screens'>('shows');

  // Core Data
  const [shows, setShows] = useState<Show[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tab 1: Shows Filters
  const [filterMovieId, setFilterMovieId] = useState<string>('ALL');
  const [filterScreenId, setFilterScreenId] = useState<string>('ALL');
  const [filterDateRange, setFilterDateRange] = useState<'ALL' | 'TODAY' | 'UPCOMING'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Tab 1: Create / Edit Show Modal
  const [showModal, setShowModal] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [movieId, setMovieId] = useState('');
  const [screenId, setScreenId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [basePrice, setBasePrice] = useState(300);
  const [format, setFormat] = useState('IMAX');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tab 1: Batch Deletion Selection State
  const [selectedShowIds, setSelectedShowIds] = useState<Set<string>>(new Set());
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // Tab 2: Auditorium Layout Editor States
  const [selectedScreenId, setSelectedScreenId] = useState<string>('');
  const [screenDetail, setScreenDetail] = useState<Screen | null>(null);
  const [loadingScreenDetail, setLoadingScreenDetail] = useState(false);
  const [editedSeats, setEditedSeats] = useState<Record<string, { category: 'SILVER' | 'GOLD' | 'VIP_RECLINER'; priceMultiplier: number }>>({});
  const [multiplierSilver, setMultiplierSilver] = useState(1.0);
  const [multiplierGold, setMultiplierGold] = useState(1.3);
  const [multiplierVip, setMultiplierVip] = useState(1.8);
  const [isSavingLayout, setIsSavingLayout] = useState(false);

  // Tab 2: Add New Auditorium Modal
  const [showAddScreenModal, setShowAddScreenModal] = useState(false);
  const [newScreenName, setNewScreenName] = useState('');
  const [newScreenRows, setNewScreenRows] = useState(8);
  const [newScreenSeatsPerRow, setNewScreenSeatsPerRow] = useState(10);
  const [isCreatingScreen, setIsCreatingScreen] = useState(false);

  // Initial Data Fetch
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resShows, resMovies, resScreens] = await Promise.all([
        fetch('/api/shows?all=true'),
        fetch('/api/movies'),
        fetch('/api/screens'),
      ]);

      if (resShows.ok && resMovies.ok) {
        const dataShows = await resShows.json();
        const dataMovies = await resMovies.json();
        setShows(dataShows.shows || []);
        const filteredMovies = (dataMovies.movies || []).filter(
          (m: any) => !/test movie/i.test(m.title)
        );
        setMovies(filteredMovies);

        if (filteredMovies.length > 0 && !movieId) {
          setMovieId(filteredMovies[0].id);
        }
      }

      if (resScreens && resScreens.ok) {
        const dataScreens = await resScreens.json();
        const scrList = (dataScreens.screens || []).filter(
          (s: any) => !/test/i.test(s.theatre?.name || '')
        );
        setScreens(scrList);
        if (scrList.length > 0) {
          if (!screenId) setScreenId(scrList[0].id);
          if (!selectedScreenId) setSelectedScreenId(scrList[0].id);
        }
      }
    } catch {
      console.error('Failed to load shows/movies/screens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Default time: today 7:00 PM
    const d = new Date();
    d.setHours(19, 0, 0, 0);
    const startIso = d.toISOString().slice(0, 16);
    setStartTime(startIso);

    const endD = new Date(d);
    endD.setHours(21, 45, 0, 0);
    setEndTime(endD.toISOString().slice(0, 16));
  }, []);

  // Fetch full details of the selected screen for Tab 2 layout editor
  const fetchScreenDetail = async (id: string) => {
    if (!id) return;
    try {
      setLoadingScreenDetail(true);
      const res = await fetch(`/api/screens/${id}`);
      if (res.ok) {
        const data = await res.json();
        setScreenDetail(data.screen);

        // Prepopulate editedSeats cache
        const seatMap: Record<string, { category: 'SILVER' | 'GOLD' | 'VIP_RECLINER'; priceMultiplier: number }> = {};
        let vipMult = 1.8;
        let goldMult = 1.3;
        let silverMult = 1.0;

        (data.screen.seats || []).forEach((st: ScreenSeat) => {
          seatMap[st.id] = {
            category: st.category,
            priceMultiplier: st.priceMultiplier,
          };
          if (st.category === 'VIP_RECLINER') vipMult = st.priceMultiplier;
          if (st.category === 'GOLD') goldMult = st.priceMultiplier;
          if (st.category === 'SILVER') silverMult = st.priceMultiplier;
        });

        setEditedSeats(seatMap);
        setMultiplierVip(vipMult);
        setMultiplierGold(goldMult);
        setMultiplierSilver(silverMult);
      }
    } catch {
      console.error('Failed to load screen layout details');
    } finally {
      setLoadingScreenDetail(false);
    }
  };

  useEffect(() => {
    if (selectedScreenId) {
      fetchScreenDetail(selectedScreenId);
    }
  }, [selectedScreenId]);

  // Open modal to schedule a new show
  const handleOpenScheduleModal = () => {
    setEditingShow(null);
    setErrorMsg(null);
    if (movies.length > 0) setMovieId(movies[0].id);
    if (screens.length > 0) setScreenId(screens[0].id);

    const d = new Date();
    d.setHours(19, 30, 0, 0);
    setStartTime(d.toISOString().slice(0, 16));
    const endD = new Date(d);
    endD.setHours(22, 15, 0, 0);
    setEndTime(endD.toISOString().slice(0, 16));

    setBasePrice(350);
    setFormat('IMAX');
    setShowModal(true);
  };

  // Open modal to edit an existing show
  const handleOpenEditModal = (show: Show) => {
    setEditingShow(show);
    setErrorMsg(null);
    setMovieId(show.movieId);
    setScreenId(show.screenId);

    const startLocal = new Date(show.startTime).toISOString().slice(0, 16);
    const endLocal = new Date(show.endTime).toISOString().slice(0, 16);
    setStartTime(startLocal);
    setEndTime(endLocal);
    setBasePrice(show.basePrice);
    setFormat(show.format);
    setShowModal(true);
  };

  // Submit show create or update
  const handleSubmitShow = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setFeedback(null);

    try {
      const payload = {
        movieId,
        screenId,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        basePrice: Number(basePrice),
        format,
      };

      const endpoint = editingShow ? `/api/shows/${editingShow.id}` : '/api/shows';
      const method = editingShow ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to save showtime');
      } else {
        setFeedback(
          editingShow
            ? `Screening updated for "${data.show?.movie?.title || 'Movie'}" successfully.`
            : 'New screening successfully scheduled and published live.'
        );
        setShowModal(false);
        await fetchData();
      }
    } catch {
      setErrorMsg('Error communicating with server while saving showtime');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a show
  const handleDeleteShow = async (showId: string, movieTitle: string, showTimeStr: string) => {
    if (!confirm(`Are you sure you want to remove the screening for "${movieTitle}" at ${formatDateTime(showTimeStr)}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/shows/${showId}`, { method: 'DELETE' });
      if (res.ok) {
        setFeedback(`Screening for "${movieTitle}" removed successfully.`);
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete show');
      }
    } catch {
      alert('Error deleting show');
    }
  };

  // Toggle selection for a single show
  const handleToggleSelectShow = (id: string) => {
    setSelectedShowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMovieId, filterScreenId, filterDateRange]);

  // Filter shows based on user selections
  const filteredShows = useMemo(() => {
    return shows.filter((s) => {
      if (filterMovieId !== 'ALL' && s.movieId !== filterMovieId) return false;
      if (filterScreenId !== 'ALL' && s.screenId !== filterScreenId) return false;

      if (filterDateRange === 'TODAY') {
        const showD = new Date(s.startTime);
        const today = new Date();
        return (
          showD.getDate() === today.getDate() &&
          showD.getMonth() === today.getMonth() &&
          showD.getFullYear() === today.getFullYear()
        );
      }
      if (filterDateRange === 'UPCOMING') {
        return new Date(s.startTime).getTime() >= Date.now();
      }
      return true;
    });
  }, [shows, filterMovieId, filterScreenId, filterDateRange]);

  // Pagination calculations (max 10 shows per page)
  const totalPages = Math.max(1, Math.ceil(filteredShows.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, filteredShows.length);
  const paginatedShows = filteredShows.slice(startIndex, endIndex);

  // Selection helpers for current page vs all filtered
  const pageShowIds = paginatedShows.map((s) => s.id);
  const isAllPageSelected =
    pageShowIds.length > 0 && pageShowIds.every((id) => selectedShowIds.has(id));

  // Toggle select shows on current page
  const handleToggleSelectAll = () => {
    if (pageShowIds.length === 0) return;
    setSelectedShowIds((prev) => {
      const next = new Set(prev);
      if (isAllPageSelected) {
        pageShowIds.forEach((id) => next.delete(id));
      } else {
        pageShowIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedShowIds(new Set(filteredShows.map((s) => s.id)));
  };

  // Batch delete all selected shows
  const handleBatchDeleteShows = async () => {
    if (selectedShowIds.size === 0) return;
    const count = selectedShowIds.size;
    if (!confirm(`Are you sure you want to delete ${count} selected screening slot(s)? All associated bookings and seat holds will be removed.`)) {
      return;
    }

    setIsBatchDeleting(true);
    setFeedback(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/shows', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showIds: Array.from(selectedShowIds) }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to delete selected screenings');
      } else {
        setFeedback(`Successfully removed ${count} screening slot(s).`);
        setSelectedShowIds(new Set());
        await fetchData();
      }
    } catch {
      setErrorMsg('Network error while deleting selected screenings');
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // Tab 2: Auditorium Layout Actions
  // Cycle single seat tier: SILVER -> GOLD -> VIP_RECLINER -> SILVER
  const handleToggleSeatCategory = (seatId: string) => {
    setEditedSeats((prev) => {
      const current = prev[seatId] || { category: 'SILVER', priceMultiplier: 1.0 };
      let nextCat: 'SILVER' | 'GOLD' | 'VIP_RECLINER' = 'GOLD';
      let nextMult = multiplierGold;

      if (current.category === 'SILVER') {
        nextCat = 'GOLD';
        nextMult = multiplierGold;
      } else if (current.category === 'GOLD') {
        nextCat = 'VIP_RECLINER';
        nextMult = multiplierVip;
      } else {
        nextCat = 'SILVER';
        nextMult = multiplierSilver;
      }

      return {
        ...prev,
        [seatId]: { category: nextCat, priceMultiplier: nextMult },
      };
    });
  };

  // Set category for an entire row at once
  const handleSetRowCategory = (rowName: string, category: 'SILVER' | 'GOLD' | 'VIP_RECLINER') => {
    if (!screenDetail?.seats) return;
    const mult =
      category === 'VIP_RECLINER'
        ? multiplierVip
        : category === 'GOLD'
        ? multiplierGold
        : multiplierSilver;

    setEditedSeats((prev) => {
      const updated = { ...prev };
      screenDetail.seats?.forEach((st) => {
        if (st.rowName === rowName) {
          updated[st.id] = { category, priceMultiplier: mult };
        }
      });
      return updated;
    });
  };

  // Reset layout to standard preset: Front 2 Silver, Middle 4 Gold, Back 2 VIP
  const handleResetToStandardPreset = () => {
    if (!screenDetail?.seats) return;
    const distinctRows = Array.from(new Set(screenDetail.seats.map((s) => s.rowName))).sort();

    setEditedSeats((prev) => {
      const updated = { ...prev };
      screenDetail.seats?.forEach((st) => {
        const rIdx = distinctRows.indexOf(st.rowName);
        let cat: 'SILVER' | 'GOLD' | 'VIP_RECLINER' = 'GOLD';
        let mult = multiplierGold;

        if (rIdx < 2) {
          cat = 'SILVER';
          mult = multiplierSilver;
        } else if (rIdx >= distinctRows.length - 2) {
          cat = 'VIP_RECLINER';
          mult = multiplierVip;
        }

        updated[st.id] = { category: cat, priceMultiplier: mult };
      });
      return updated;
    });
  };

  // Save layout changes to database
  const handleSaveLayout = async () => {
    if (!selectedScreenId || !screenDetail) return;
    setIsSavingLayout(true);
    setFeedback(null);
    setErrorMsg(null);

    try {
      const seatUpdates = Object.entries(editedSeats).map(([id, val]) => ({
        id,
        category: val.category,
        priceMultiplier:
          val.category === 'VIP_RECLINER'
            ? multiplierVip
            : val.category === 'GOLD'
            ? multiplierGold
            : multiplierSilver,
      }));

      const res = await fetch(`/api/screens/${selectedScreenId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatUpdates,
          tierMultipliers: {
            SILVER: Number(multiplierSilver),
            GOLD: Number(multiplierGold),
            VIP_RECLINER: Number(multiplierVip),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update auditorium seating layout');
      } else {
        setFeedback(`Seating layout for "${screenDetail.name}" successfully updated in real time.`);
        await fetchScreenDetail(selectedScreenId);
      }
    } catch {
      setErrorMsg('Error saving seating layout');
    } finally {
      setIsSavingLayout(false);
    }
  };

  // Create new auditorium
  const handleCreateAuditorium = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScreenName.trim()) return;
    setIsCreatingScreen(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/screens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newScreenName.trim(),
          rowCount: Number(newScreenRows),
          seatsPerRow: Number(newScreenSeatsPerRow),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create auditorium');
      } else {
        setFeedback(`Auditorium "${data.screen.name}" created with ${data.screen.totalSeats} seats.`);
        setShowAddScreenModal(false);
        setNewScreenName('');
        await fetchData();
        if (data.screen?.id) {
          setSelectedScreenId(data.screen.id);
        }
      }
    } catch {
      setErrorMsg('Error creating auditorium');
    } finally {
      setIsCreatingScreen(false);
    }
  };

  // Group seats by rowName for visual matrix in Tab 2
  const groupedScreenRows = useMemo(() => {
    if (!screenDetail?.seats) return [];
    const map = new Map<string, ScreenSeat[]>();
    for (const seat of screenDetail.seats) {
      if (!map.has(seat.rowName)) map.set(seat.rowName, []);
      map.get(seat.rowName)!.push(seat);
    }
    for (const [, list] of map.entries()) {
      list.sort((a, b) => a.seatNumber - b.seatNumber);
    }
    return Array.from(map.entries()).sort(([rowA], [rowB]) => rowA.localeCompare(rowB));
  }, [screenDetail]);

  // Compute live count of VIP, Gold, and Silver seats based on editedSeats
  const liveTierStats = useMemo(() => {
    if (!screenDetail?.seats) return { silver: 0, gold: 0, vip: 0, total: 0 };
    let silver = 0;
    let gold = 0;
    let vip = 0;

    screenDetail.seats.forEach((s) => {
      const cur = editedSeats[s.id]?.category || s.category;
      if (cur === 'VIP_RECLINER') vip++;
      else if (cur === 'GOLD') gold++;
      else silver++;
    });

    return {
      silver,
      gold,
      vip,
      total: screenDetail.seats.length,
    };
  }, [screenDetail, editedSeats]);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header & Sub-Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5 uppercase tracking-wide">
            <SlidersHorizontal className="w-5 h-5 text-[#cca255]" />
            Operations &amp; Seating Layout Manager
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Schedule screening times, adjust ticket base prices, and configure auditorium seating layouts in real time
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-[#090b10] p-1 rounded-full border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('shows')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'shows'
                ? 'bg-[#cca255] text-black font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Screenings &amp; Dates ({shows.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('screens')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'screens'
                ? 'bg-[#cca255] text-black font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Armchair className="w-3.5 h-3.5" />
            <span>Auditorium Layouts ({screens.length})</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div className="p-4 rounded-3xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-400 font-bold hover:text-white px-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-3xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 font-bold hover:text-white px-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================
          TAB 1: SHOWTIMES & DATES MANAGEMENT
          ======================================================== */}
      {activeTab === 'shows' && (
        <div className="space-y-5">
          {/* Action & Filter Toolbar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-3xl bg-[#0d0f17]/90 border border-white/10 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filter Movie */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase text-zinc-400 font-bold">Movie:</span>
                <select
                  value={filterMovieId}
                  onChange={(e) => setFilterMovieId(e.target.value)}
                  className="px-3 py-1.5 rounded-full bg-[#090b10] border border-white/15 text-xs text-white focus:outline-none focus:border-[#cca255]"
                >
                  <option value="ALL">All Movies ({movies.length})</option>
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Screen */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase text-zinc-400 font-bold">Screen:</span>
                <select
                  value={filterScreenId}
                  onChange={(e) => setFilterScreenId(e.target.value)}
                  className="px-3 py-1.5 rounded-full bg-[#090b10] border border-white/15 text-xs text-white focus:outline-none focus:border-[#cca255]"
                >
                  <option value="ALL">All Auditoriums ({screens.length})</option>
                  {screens.map((scr) => (
                    <option key={scr.id} value={scr.id}>
                      {scr.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Date Range */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase text-zinc-400 font-bold">Date:</span>
                <select
                  value={filterDateRange}
                  onChange={(e: any) => setFilterDateRange(e.target.value)}
                  className="px-3 py-1.5 rounded-full bg-[#090b10] border border-white/15 text-xs text-white focus:outline-none focus:border-[#cca255]"
                >
                  <option value="ALL">All Dates</option>
                  <option value="TODAY">Today Only</option>
                  <option value="UPCOMING">Upcoming Only</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleOpenScheduleModal}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#cca255] via-[#f5d99b] to-[#cca255] hover:brightness-110 text-black font-bold uppercase tracking-wider text-xs transition-all shadow-[0_0_20px_rgba(204,162,85,0.25)] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Showtime</span>
            </button>
          </div>

          {/* Shows Table */}
          {loading ? (
            <TableSkeleton rows={8} />
          ) : filteredShows.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 font-mono text-xs rounded-3xl bg-[#0d0f17]/90 border border-white/10">
              No showtimes match the current filter. Click "+ Schedule Showtime" to add one.
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-[#0d0f17]/90 overflow-hidden shadow-2xl backdrop-blur-xl">
              <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider">
                    Active Screenings Schedule
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    Showing {filteredShows.length === 0 ? 0 : startIndex + 1} - {endIndex} of {filteredShows.length} shows
                    {filteredShows.length !== shows.length && ` (filtered from ${shows.length})`}
                  </span>
                </div>

                {/* Batch Action Toolbar when 1+ showtimes selected */}
                {selectedShowIds.size > 0 && (
                  <div className="flex flex-wrap items-center gap-2.5 bg-rose-950/70 border border-rose-500/40 px-3.5 py-1.5 rounded-full shadow-lg">
                    <span className="text-xs font-mono text-rose-200 font-bold">
                      {selectedShowIds.size} selected
                    </span>
                    {selectedShowIds.size < filteredShows.length && (
                      <button
                        type="button"
                        onClick={handleSelectAllFiltered}
                        className="text-[11px] font-mono text-amber-300 hover:text-amber-200 underline cursor-pointer px-1"
                      >
                        Select all {filteredShows.length}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleBatchDeleteShows}
                      disabled={isBatchDeleting}
                      className="px-3.5 py-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isBatchDeleting ? 'Removing...' : `Delete Selected (${selectedShowIds.size})`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedShowIds(new Set())}
                      className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer px-1"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-white/[0.02] text-zinc-400 uppercase font-mono text-[10px] border-b border-white/10">
                    <tr>
                      <th className="py-3.5 px-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={isAllPageSelected}
                          onChange={handleToggleSelectAll}
                          aria-label="Select all screenings on this page"
                          className="w-4 h-4 rounded border-white/20 bg-black/40 text-[#cca255] accent-[#cca255] cursor-pointer"
                        />
                      </th>
                      <th className="py-3.5 px-5 font-semibold">Movie</th>
                      <th className="py-3.5 px-5 font-semibold">Auditorium &amp; Format</th>
                      <th className="py-3.5 px-5 font-semibold">Date &amp; Showtime</th>
                      <th className="py-3.5 px-5 font-semibold">Base Price</th>
                      <th className="py-3.5 px-5 font-semibold">Seat Tier Pricing (Silver / Gold / VIP)</th>
                      <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    {paginatedShows.map((s) => {
                      const isSelected = selectedShowIds.has(s.id);
                      return (
                        <tr
                          key={s.id}
                          className={`hover:bg-white/[0.04] transition-colors group ${
                            isSelected ? 'bg-[#cca255]/10 border-l-2 border-l-[#cca255]' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectShow(s.id)}
                              aria-label={`Select showtime for ${s.movie.title}`}
                              className="w-4 h-4 rounded border-white/20 bg-black/40 text-[#cca255] accent-[#cca255] cursor-pointer"
                            />
                          </td>
                          <td className="py-3.5 px-5 font-bold text-white uppercase tracking-tight">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-white group-hover:text-[#f5d99b] transition-colors">
                                {s.movie.title}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="text-zinc-200 font-semibold block">{s.screen.name}</span>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#cca255]/15 text-[#cca255] border border-[#cca255]/30 uppercase">
                              {s.format}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 font-mono">
                            <span className="text-white font-bold block">{formatDateTime(s.startTime)}</span>
                            <span className="text-[11px] text-zinc-400 block">Ends at {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </td>
                          <td className="py-3.5 px-5 font-mono font-bold text-white text-sm">
                            {formatCurrency(s.basePrice)}
                          </td>
                          <td className="py-3.5 px-5 font-mono text-[11px] text-zinc-400">
                            <span className="text-slate-300 font-semibold">Silver: {formatCurrency(s.basePrice)}</span> •{' '}
                            <span className="text-[#f2d89f] font-semibold">Gold: {formatCurrency(s.basePrice * 1.3)}</span> •{' '}
                            <span className="text-[#d6bbfb] font-bold">VIP: {formatCurrency(s.basePrice * 1.8)}</span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditModal(s)}
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                                title="Edit showtime and pricing"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteShow(s.id, s.movie.title, s.startTime)}
                                className="p-2 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
                                title="Delete screening"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer (Max 10 shows per page) */}
              {filteredShows.length > 0 && (
                <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                  <div className="text-zinc-400">
                    Showing <span className="text-white font-bold">{startIndex + 1}</span> to{' '}
                    <span className="text-white font-bold">{endIndex}</span> of{' '}
                    <span className="text-white font-bold">{filteredShows.length}</span> shows
                    {filteredShows.length !== shows.length && (
                      <span className="text-zinc-500 ml-1">
                        (filtered from {shows.length})
                      </span>
                    )}
                    {totalPages > 1 && (
                      <span className="text-zinc-500 ml-2">
                        • Page {safeCurrentPage} of {totalPages}
                      </span>
                    )}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={safeCurrentPage === 1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Prev</span>
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                        if (
                          totalPages > 7 &&
                          p !== 1 &&
                          p !== totalPages &&
                          Math.abs(p - safeCurrentPage) > 1
                        ) {
                          if (p === 2 || p === totalPages - 1) {
                            return (
                              <span key={p} className="px-1 text-zinc-600 select-none">
                                ...
                              </span>
                            );
                          }
                          return null;
                        }

                        const isActive = p === safeCurrentPage;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setCurrentPage(p)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                              isActive
                                ? 'bg-gradient-to-r from-[#cca255] to-[#f5d99b] text-black shadow-[0_0_10px_rgba(204,162,85,0.3)]'
                                : 'bg-white/[0.04] border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safeCurrentPage === totalPages}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: AUDITORIUM & SEATING LAYOUT MANAGER
          ======================================================== */}
      {activeTab === 'screens' && (
        <div className="space-y-6">
          {/* Screen Selector Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#0d0f17]/90 border border-white/10 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase text-zinc-400 mr-2">Auditorium:</span>
              {screens.map((scr) => (
                <button
                  key={scr.id}
                  onClick={() => setSelectedScreenId(scr.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    selectedScreenId === scr.id
                      ? 'bg-gradient-to-r from-[#cca255] to-[#f5d99b] text-black font-bold shadow-lg'
                      : 'bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {scr.name} ({scr.totalSeats} seats)
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddScreenModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider text-xs border border-white/15 transition-all shadow-md cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Auditorium</span>
            </button>
          </div>

          {loadingScreenDetail ? (
            <AuditoriumLayoutSkeleton />
          ) : screenDetail ? (
            <div className="space-y-6">
              {/* Auditorium Capacity & Tier Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-3xl bg-[#0d0f17]/90 border border-white/10">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">Total Capacity</span>
                  <div className="text-2xl font-black text-white font-mono mt-1">{liveTierStats.total}</div>
                  <span className="text-[11px] text-zinc-500 font-mono block mt-0.5">Physical Seats</span>
                </div>

                <div className="p-4 rounded-3xl bg-[#0d0f17]/90 border border-[#7d4eb8]/30 bg-gradient-to-br from-[#352054]/20 to-transparent">
                  <span className="text-[10px] font-mono text-[#d6bbfb] uppercase font-bold block">VIP Recliner Tier</span>
                  <div className="text-2xl font-black text-[#d6bbfb] font-mono mt-1">{liveTierStats.vip} seats</div>
                  <span className="text-[11px] text-purple-300/70 font-mono block mt-0.5">{multiplierVip}x multiplier</span>
                </div>

                <div className="p-4 rounded-3xl bg-[#0d0f17]/90 border border-[#85652b]/30 bg-gradient-to-br from-[#382b17]/20 to-transparent">
                  <span className="text-[10px] font-mono text-[#f2d89f] uppercase font-bold block">Gold Tier</span>
                  <div className="text-2xl font-black text-[#f2d89f] font-mono mt-1">{liveTierStats.gold} seats</div>
                  <span className="text-[11px] text-amber-300/70 font-mono block mt-0.5">{multiplierGold}x multiplier</span>
                </div>

                <div className="p-4 rounded-3xl bg-[#0d0f17]/90 border border-slate-700/40 bg-gradient-to-br from-[#242b3d]/20 to-transparent">
                  <span className="text-[10px] font-mono text-slate-300 uppercase font-bold block">Silver Tier</span>
                  <div className="text-2xl font-black text-slate-200 font-mono mt-1">{liveTierStats.silver} seats</div>
                  <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{multiplierSilver}x multiplier</span>
                </div>
              </div>

              {/* Tier Multipliers Customization Bar */}
              <div className="p-5 rounded-3xl bg-[#0d0f17]/90 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Auditorium Multiplier Matrix
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Adjust ticket price scaling multipliers applied to the base price for each seating tier
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-300 font-bold">Silver:</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.5"
                      max="3.0"
                      value={multiplierSilver}
                      onChange={(e) => setMultiplierSilver(Number(e.target.value))}
                      className="w-16 px-2.5 py-1 rounded-lg bg-[#090b10] border border-white/15 text-xs text-white font-mono text-center focus:outline-none focus:border-[#cca255]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#f2d89f] font-bold">Gold:</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.5"
                      max="3.0"
                      value={multiplierGold}
                      onChange={(e) => setMultiplierGold(Number(e.target.value))}
                      className="w-16 px-2.5 py-1 rounded-lg bg-[#090b10] border border-white/15 text-xs text-white font-mono text-center focus:outline-none focus:border-[#cca255]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#d6bbfb] font-bold">VIP:</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.5"
                      max="3.0"
                      value={multiplierVip}
                      onChange={(e) => setMultiplierVip(Number(e.target.value))}
                      className="w-16 px-2.5 py-1 rounded-lg bg-[#090b10] border border-white/15 text-xs text-white font-mono text-center focus:outline-none focus:border-[#cca255]"
                    />
                  </div>
                </div>
              </div>

              {/* The Interactive Visual Seating Chamber Editor */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#0d0f17]/90 border border-white/10 shadow-2xl flex flex-col items-center select-none relative overflow-hidden">
                {/* Visual Screen Arc at Top */}
                <div className="w-full max-w-lg mb-8 flex flex-col items-center relative pt-2">
                  <svg viewBox="0 0 540 48" className="w-full h-8 sm:h-9 overflow-visible relative z-10">
                    <defs>
                      <linearGradient id="adminScreenArc" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#cca255" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="#fff8e7" stopOpacity="1" />
                        <stop offset="100%" stopColor="#cca255" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>
                    <path d="M 20,38 Q 270,14 520,38" fill="none" stroke="url(#adminScreenArc)" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <div className="flex items-center gap-2 -mt-1">
                    <span className="h-px w-6 bg-gradient-to-r from-transparent to-[#cca255]" />
                    <span className="text-[9px] tracking-[0.45em] uppercase text-[#f5d99b] font-mono font-bold">
                      PROJECTION SCREEN
                    </span>
                    <span className="h-px w-6 bg-gradient-to-l from-transparent to-[#cca255]" />
                  </div>
                </div>

                {/* Instructions Hint */}
                <div className="w-full max-w-2xl mb-6 p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-wrap items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>💡 Tip: Click any row button to bulk-assign, or click individual seats to cycle tiers.</span>
                  <button
                    onClick={handleResetToStandardPreset}
                    className="text-[#cca255] hover:text-white underline font-bold cursor-pointer"
                  >
                    Reset to Standard Preset
                  </button>
                </div>

                {/* Rows & Seats Layout */}
                <div className="flex flex-col gap-3 w-full max-w-3xl items-center">
                  {groupedScreenRows.map(([rowName, rowSeats]) => {
                    const leftCluster = rowSeats.filter((s) => s.seatNumber <= 2);
                    const centerCluster = rowSeats.filter((s) => s.seatNumber > 2 && s.seatNumber <= 8);
                    const rightCluster = rowSeats.filter((s) => s.seatNumber > 8);

                    const renderAdminSeat = (st: ScreenSeat) => {
                      const cur = editedSeats[st.id] || { category: st.category, priceMultiplier: st.priceMultiplier };
                      const isVip = cur.category === 'VIP_RECLINER';
                      const isGold = cur.category === 'GOLD';

                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleToggleSeatCategory(st.id)}
                          title={`Row ${st.rowName} Seat ${st.seatNumber} • ${cur.category} (${cur.priceMultiplier}x) — Click to cycle tier`}
                          className={`w-7 sm:w-8 h-7 sm:h-8 rounded-t-md rounded-b-sm font-mono text-[9px] font-bold transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer shadow-md ${
                            isVip
                              ? 'bg-gradient-to-b from-[#43296a] to-[#201333] border border-[#a272e6] text-[#d6bbfb] shadow-[0_0_8px_rgba(162,114,230,0.3)]'
                              : isGold
                              ? 'bg-gradient-to-b from-[#47361e] to-[#231a0e] border border-[#cca255] text-[#f2d89f] shadow-[0_0_8px_rgba(204,162,85,0.3)]'
                              : 'bg-gradient-to-b from-[#2d364c] to-[#181d29] border border-[#4d5e82] text-slate-200'
                          }`}
                        >
                          {st.seatNumber}
                        </button>
                      );
                    };

                    return (
                      <div key={rowName} className="flex items-center gap-3 sm:gap-4 w-full justify-center">
                        {/* Row Label */}
                        <span className="w-5 text-center font-mono text-xs font-bold text-[#cca255]">
                          {rowName}
                        </span>

                        {/* Batch Row Category Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSetRowCategory(rowName, 'SILVER')}
                            className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-colors"
                            title="Set entire row to Silver"
                          >
                            SILVER
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetRowCategory(rowName, 'GOLD')}
                            className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-amber-950/60 hover:bg-amber-900/60 text-amber-200 border border-amber-600/60 transition-colors"
                            title="Set entire row to Gold"
                          >
                            GOLD
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetRowCategory(rowName, 'VIP_RECLINER')}
                            className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 border border-purple-600/60 transition-colors"
                            title="Set entire row to VIP Recliner"
                          >
                            VIP
                          </button>
                        </div>

                        {/* Left Cluster (Seats 1-2) */}
                        <div className="flex items-center gap-1.5">
                          {leftCluster.map((st) => renderAdminSeat(st))}
                        </div>

                        {/* Aisle */}
                        <div className="w-3 flex items-center justify-center">
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                        </div>

                        {/* Center Cluster (Seats 3-8) */}
                        <div className="flex items-center gap-1.5">
                          {centerCluster.map((st) => renderAdminSeat(st))}
                        </div>

                        {/* Aisle */}
                        <div className="w-3 flex items-center justify-center">
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                        </div>

                        {/* Right Cluster (Seats 9-10) */}
                        <div className="flex items-center gap-1.5">
                          {rightCluster.map((st) => renderAdminSeat(st))}
                        </div>

                        {/* Row Label Right */}
                        <span className="w-5 text-center font-mono text-xs font-bold text-[#cca255]">
                          {rowName}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Legend & Save Controls */}
                <div className="mt-8 pt-6 border-t border-white/10 w-full flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded bg-gradient-to-b from-[#2d364c] to-[#181d29] border border-[#4d5e82]" />
                      <span className="text-slate-300">Silver ({multiplierSilver}x)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded bg-gradient-to-b from-[#47361e] to-[#231a0e] border border-[#cca255]" />
                      <span className="text-[#f2d89f]">Gold ({multiplierGold}x)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded bg-gradient-to-b from-[#43296a] to-[#201333] border border-[#a272e6]" />
                      <span className="text-[#d6bbfb]">VIP Recliner ({multiplierVip}x)</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveLayout}
                    disabled={isSavingLayout}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#cca255] via-[#f5d99b] to-[#cca255] hover:brightness-110 text-black font-bold uppercase tracking-wider text-xs transition-all shadow-[0_0_20px_rgba(204,162,85,0.25)] cursor-pointer disabled:opacity-50"
                  >
                    {isSavingLayout ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Layout...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Save Layout Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ========================================================
          MODAL 1: SCHEDULE / EDIT SHOWTIME
          ======================================================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="max-w-md w-full rounded-3xl border border-white/10 bg-[#0d0f17] p-7 space-y-5 shadow-2xl">
            <h3 className="text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#cca255]" />
              <span>{editingShow ? 'Edit Scheduled Screening' : 'Schedule New Screening'}</span>
            </h3>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitShow} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Movie
                </label>
                <select
                  value={movieId}
                  onChange={(e) => setMovieId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-[#090b10] border border-white/15 text-xs text-white focus:outline-none focus:border-[#cca255] transition-colors"
                >
                  {movies.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#090b10]">
                      {m.title} ({m.durationMins}m)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Auditorium / Screen
                </label>
                <select
                  value={screenId}
                  onChange={(e) => setScreenId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-[#090b10] border border-white/15 text-xs text-white focus:outline-none focus:border-[#cca255] transition-colors"
                >
                  {screens.map((scr) => (
                    <option key={scr.id} value={scr.id} className="bg-[#090b10]">
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
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full bg-[#090b10] border border-white/15 text-xs text-white focus:outline-none focus:border-[#cca255] transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full bg-[#090b10] border border-white/15 text-xs text-white focus:outline-none focus:border-[#cca255] transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Base Price (₹)
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-full bg-[#090b10] border border-white/15 text-xs text-white focus:outline-none focus:border-[#cca255] transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full bg-[#090b10] border border-white/15 text-xs text-white focus:outline-none focus:border-[#cca255] transition-colors"
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
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-full border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black font-bold uppercase tracking-wider text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingShow ? 'Save Changes' : 'Schedule Showtime'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: ADD NEW AUDITORIUM
          ======================================================== */}
      {showAddScreenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="max-w-md w-full rounded-3xl border border-white/10 bg-[#0d0f17] p-7 space-y-5 shadow-2xl">
            <h3 className="text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <Armchair className="w-4 h-4 text-[#cca255]" />
              <span>Add New Cinema Auditorium</span>
            </h3>

            <form onSubmit={handleCreateAuditorium} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Auditorium Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Screen 3 - 4DX Dynamic"
                  value={newScreenName}
                  onChange={(e) => setNewScreenName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-[#090b10] border border-white/15 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#cca255] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Row Count (A through J)
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    value={newScreenRows}
                    onChange={(e) => setNewScreenRows(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-full bg-[#090b10] border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-[#cca255]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Seats Per Row
                  </label>
                  <input
                    type="number"
                    min="4"
                    max="14"
                    value={newScreenSeatsPerRow}
                    onChange={(e) => setNewScreenSeatsPerRow(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-full bg-[#090b10] border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-[#cca255]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-zinc-400 font-mono">
                Will generate <span className="text-white font-bold">{newScreenRows * newScreenSeatsPerRow} seats</span> with tiered Silver, Gold, and VIP Recliner categories.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddScreenModal(false)}
                  className="px-5 py-2.5 rounded-full border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingScreen}
                  className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black font-bold uppercase tracking-wider text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreatingScreen ? 'Creating...' : 'Create Auditorium'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
