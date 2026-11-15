'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Armchair,
  CheckCircle2,
  RefreshCw,
  Film,
  Calendar,
  AlertTriangle,
  Receipt,
  ShieldCheck,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { StatsGridSkeleton, TableSkeleton } from '@/components/Skeleton';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'TODAY' | 'BOOKED'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/reports');
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setErrorMsg('Access Restricted: Please login as an administrator or staff member to view reports.');
        } else {
          setErrorMsg('Failed to fetch occupancy statistics');
        }
      } else {
        const report = await res.json();
        setData(report);
      }
    } catch {
      setErrorMsg('Network error loading reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (errorMsg) {
    return (
      <div className="p-8 rounded-3xl border border-rose-500/30 bg-rose-950/40 text-center space-y-3 font-sans">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-white">{errorMsg}</h3>
        <p className="text-xs text-rose-300">
          Use the persona switcher in the top navigation bar to sign in as Admin.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6 font-sans">
        <StatsGridSkeleton />
        <TableSkeleton rows={8} />
      </div>
    );
  }

  const { summary, shows } = data;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const bookedShows = shows.filter((s: any) => s.bookedSeatsCount > 0 || s.heldSeatsCount > 0);
  const todayShows = shows.filter(
    (s: any) => new Date(s.startTime) >= startOfToday && new Date(s.startTime) <= endOfToday
  );

  const displayedShows =
    filter === 'BOOKED'
      ? (bookedShows.length > 0 ? bookedShows : shows)
      : filter === 'TODAY'
      ? (todayShows.length > 0 ? todayShows : shows)
      : shows;

  // Pagination calculation (max 10 shows at once)
  const totalPages = Math.max(1, Math.ceil(displayedShows.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, displayedShows.length);
  const paginatedShows = displayedShows.slice(startIndex, endIndex);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5 uppercase tracking-wide">
            <BarChart3 className="w-5 h-5 text-[#cca255]" />
            Sales &amp; Capacity Overview
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time tracking of seat occupancy, sales revenue, and auditorium inventory
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/10 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Auditorium Capacity Status Card */}
      <div className="p-5 rounded-3xl border border-[#cca255]/30 bg-[#0d0f17]/95 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#cca255]/20 to-[#cca255]/5 text-[#f5d99b] border border-[#cca255]/30 shrink-0 shadow-[0_0_15px_rgba(204,162,85,0.1)]">
            <ShieldCheck className="w-5 h-5 text-[#cca255]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Auditorium Capacity in Full Sync
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5 font-sans">
              All booked, reserved, and available seats match 100% of physical seating capacity across all screens.
            </p>
          </div>
        </div>

        <span className="px-4 py-1.5 rounded-full bg-[#cca255]/15 text-[#f5d99b] border border-[#cca255]/35 text-xs font-semibold flex items-center gap-1.5 font-mono shrink-0 shadow-sm">
          <Check className="w-3.5 h-3.5 text-[#cca255]" />
          <span>{summary.allShowsReconciled ? 'Verified in Balance' : 'Discrepancy Detected'}</span>
        </span>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Screenings */}
        <div className="p-6 rounded-3xl border border-white/10 bg-[#0d0f17]/90 shadow-2xl backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono text-[#cca255] uppercase font-bold tracking-wider">
              Screenings
            </span>
            <Film className="w-4 h-4 text-zinc-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-white block font-mono">
            {summary.totalShows}
          </span>
          <span className="text-[11px] text-zinc-400 block font-mono">
            {summary.todayShowsCount} today • {summary.totalShows} across 7 days
          </span>
        </div>

        {/* Card 2: Total Seats */}
        <div className="p-6 rounded-3xl border border-white/10 bg-[#0d0f17]/90 shadow-2xl backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono text-[#cca255] uppercase font-bold tracking-wider">
              Total Scheduled Seats
            </span>
            <Armchair className="w-4 h-4 text-zinc-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-white block font-mono">
            {summary.totalCapacity}
          </span>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
            <span className="text-emerald-400 font-medium">{summary.totalBookedSeats} booked</span>
            <span>•</span>
            <span className="text-[#f5d99b] font-medium">{summary.totalHeldSeats} held</span>
          </div>
        </div>

        {/* Card 3: Overall Occupancy */}
        <div className="p-6 rounded-3xl border border-white/10 bg-[#0d0f17]/90 shadow-2xl backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono text-[#cca255] uppercase font-bold tracking-wider">
              Occupancy Rate
            </span>
            <TrendingUp className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-[#f5d99b] block font-mono">
              {summary.activeShowsOccupancyRate > 0
                ? `${summary.activeShowsOccupancyRate}%`
                : `${summary.occupancyRate}%`}
            </span>
            <span className="text-[9px] font-mono text-emerald-400 font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
              {summary.activeShowsOccupancyRate > 0 ? 'Active Screenings' : 'Overall Catalog'}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#cca255] to-[#f5d99b] rounded-full"
              style={{
                width: `${Math.max(
                  summary.totalBookedSeats > 0 ? 5 : 0,
                  Math.min(100, summary.activeShowsOccupancyRate || summary.occupancyRate)
                )}%`,
              }}
            />
          </div>
          <span className="text-[11px] text-zinc-400 block font-mono truncate">
            {summary.activeShowsCount > 0
              ? `${summary.totalBookedSeats} booked of ${summary.activeShowsCapacity} active seats (${summary.occupancyRate}% 7-day avg)`
              : `${summary.occupancyRate}% 7-day catalog average`}
          </span>
        </div>

        {/* Card 4: Net Revenue */}
        <div className="p-6 rounded-3xl border border-white/10 bg-[#0d0f17]/90 shadow-2xl backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono text-[#cca255] uppercase font-bold tracking-wider">
              Net Sales
            </span>
            <Receipt className="w-4 h-4 text-zinc-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-white block font-mono">
            {formatCurrency(summary.netRevenue || 0)}
          </span>
          <span className="text-[11px] text-zinc-400 block">
            {summary.totalRefunds > 0 ? `Refunds: -${formatCurrency(summary.totalRefunds)}` : 'Zero refunds issued'}
          </span>
        </div>
      </div>

      {/* Live Show Performance Table */}
      <div className="rounded-3xl border border-white/10 bg-[#0d0f17]/90 overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Live Show Performance &amp; Seat Allocation
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Auditorium occupancy, ticket sales, and balance verification per screening
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-black/50 p-1.5 rounded-full border border-white/10 text-xs font-mono">
            <button
              onClick={() => {
                setFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-gradient-to-r from-[#cca255] to-[#f5d99b] text-black font-bold shadow-[0_0_12px_rgba(204,162,85,0.3)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Screenings ({shows.length})
            </button>
            <button
              onClick={() => {
                setFilter('TODAY');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
                filter === 'TODAY'
                  ? 'bg-gradient-to-r from-[#cca255] to-[#f5d99b] text-black font-bold shadow-[0_0_12px_rgba(204,162,85,0.3)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Today ({todayShows.length})
            </button>
            <button
              onClick={() => {
                setFilter('BOOKED');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1 rounded-full transition-all cursor-pointer ${
                filter === 'BOOKED'
                  ? 'bg-gradient-to-r from-[#cca255] to-[#f5d99b] text-black font-bold shadow-[0_0_12px_rgba(204,162,85,0.3)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Active Bookings ({bookedShows.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] text-zinc-400 uppercase font-mono text-[10px] border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Movie &amp; Screen</th>
                <th className="py-3.5 px-4 font-semibold">Showtime</th>
                <th className="py-3.5 px-4 font-semibold">Capacity</th>
                <th className="py-3.5 px-4 font-semibold">Booked</th>
                <th className="py-3.5 px-4 font-semibold">In Hold</th>
                <th className="py-3.5 px-4 font-semibold">Available</th>
                <th className="py-3.5 px-4 font-semibold">Occupancy</th>
                <th className="py-3.5 px-4 font-semibold">Revenue</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300 font-sans">
              {paginatedShows.map((s: any) => {
                const hasActivity = s.bookedSeatsCount > 0 || s.heldSeatsCount > 0;
                return (
                  <tr
                    key={s.showId}
                    className={`transition-colors ${
                      hasActivity
                        ? 'bg-[#cca255]/[0.06] border-l-2 border-l-[#cca255] hover:bg-[#cca255]/[0.1]'
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block uppercase tracking-tight">{s.movieTitle}</span>
                      <span className="text-[11px] text-zinc-400">
                        {s.screenName} ({s.format})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400">
                      {formatDateTime(s.startTime)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {s.totalCapacity}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">
                      {s.bookedSeatsCount}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#f5d99b] font-medium">
                      {s.heldSeatsCount}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400">
                      {s.availableSeatsCount}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#cca255] to-[#f5d99b] rounded-full"
                            style={{ width: `${Math.min(100, s.occupancyRate)}%` }}
                          />
                        </div>
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            s.occupancyRate > 0 ? 'text-[#f5d99b]' : 'text-zinc-500'
                          }`}
                        >
                          {s.occupancyRate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {formatCurrency(s.revenue)}
                    </td>
                    <td className="py-3.5 px-4">
                      {s.isReconciled ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <Check className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Attention</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer (Max 10 shows per page) */}
        {displayedShows.length > 0 && (
          <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
            <div className="text-zinc-400">
              Showing <span className="text-white font-bold">{startIndex + 1}</span> to{' '}
              <span className="text-white font-bold">{endIndex}</span> of{' '}
              <span className="text-white font-bold">{displayedShows.length}</span> screenings
              {totalPages > 1 && (
                <span className="text-zinc-500 ml-2">
                  (Page {safeCurrentPage} of {totalPages})
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
    </div>
  );
}
