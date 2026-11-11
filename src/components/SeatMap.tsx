'use client';

import React from 'react';
import { Lock, Check } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { SeatWithStatus } from '@/server/services/seatHoldService';

interface SeatMapProps {
  seats: SeatWithStatus[];
  selectedSeatIds: string[];
  onToggleSeat: (seat: SeatWithStatus) => void;
  disabled?: boolean;
}

export function SeatMap({ seats, selectedSeatIds, onToggleSeat, disabled }: SeatMapProps) {
  // Group seats by rowName (A, B, C, etc.)
  const rows = React.useMemo(() => {
    const map = new Map<string, SeatWithStatus[]>();
    for (const seat of seats) {
      if (!map.has(seat.rowName)) {
        map.set(seat.rowName, []);
      }
      map.get(seat.rowName)!.push(seat);
    }
    // Sort seats in each row by seatNumber
    for (const [, list] of map.entries()) {
      list.sort((a, b) => a.seatNumber - b.seatNumber);
    }
    return Array.from(map.entries()).sort(([rowA], [rowB]) => rowA.localeCompare(rowB));
  }, [seats]);

  return (
    <div className="w-full flex flex-col items-center select-none py-2">
      {/* 1. Minimalist Top Legend (Directly styled like the reference design) */}
      <div className="flex items-center justify-center gap-8 mb-8 pb-4 border-b border-slate-100 w-full max-w-sm">
        {/* Available */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-5 h-4 rounded-[5px] bg-white border border-slate-300 shadow-sm" />
          <span className="text-[11px] font-medium text-slate-500">Available</span>
        </div>

        {/* Taken / Booked */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-5 h-4 rounded-[5px] bg-slate-800 border border-slate-900 shadow-xs" />
          <span className="text-[11px] font-medium text-slate-500">Taken</span>
        </div>

        {/* Selected */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-5 h-4 rounded-[5px] bg-violet-600 border border-violet-500 shadow-glow-violet" />
          <span className="text-[11px] font-medium text-slate-700 font-semibold">Selected</span>
        </div>

        {/* Held (TTL) */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-5 h-4 rounded-[5px] bg-amber-400 border border-amber-500" />
          <span className="text-[11px] font-medium text-slate-500">Held</span>
        </div>
      </div>

      {/* 2. Curved Cinema Screen with Downward Ambient Beam (Inspired by Reference) */}
      <div className="w-full max-w-md mb-8 flex flex-col items-center relative">
        <div className="cinema-screen-glow-light">
          <div className="cinema-screen-arch" />
          <div className="cinema-screen-beam" />
        </div>
        <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-slate-400 mt-2 z-10">
          VIP HALL • SCREEN
        </span>
      </div>

      {/* 3. Seating Grid with 3-Column Aisle Partition (Left Wing, Center, Right Wing) */}
      <div className="flex flex-col gap-2.5 items-center w-full max-w-2xl px-2">
        {rows.map(([rowName, rowSeats]) => {
          // Partition row into Left (seats 1-2), Center (seats 3-8), Right (seats 9-10)
          const leftCluster = rowSeats.filter((s) => s.seatNumber <= 2);
          const centerCluster = rowSeats.filter((s) => s.seatNumber > 2 && s.seatNumber <= 8);
          const rightCluster = rowSeats.filter((s) => s.seatNumber > 8);

          const renderSeat = (seat: SeatWithStatus) => {
            const isSelected = selectedSeatIds.includes(seat.id);
            const isBooked = seat.status === 'BOOKED';
            const isHeldByOthers = seat.status === 'HELD' && !seat.isHeldByMe && !isSelected;
            const isClickable = !isBooked && !isHeldByOthers && !disabled;

            return (
              <button
                key={seat.id}
                type="button"
                disabled={!isClickable}
                onClick={() => onToggleSeat(seat)}
                title={`Row ${seat.rowName} Seat ${seat.seatNumber} (${seat.category}) - ${formatCurrency(seat.price)}`}
                className={cn(
                  'relative group w-7 sm:w-8 h-6 sm:h-7 rounded-[6px] transition-all duration-150 flex items-center justify-center font-mono text-[9px] font-semibold',
                  // Selected State (Glowing Violet squircle, matching the reference image)
                  isSelected
                    ? 'bg-violet-600 text-white shadow-glow-violet scale-105 z-10 border border-violet-500'
                    // Booked / Taken State (Dark minimalist squircle, matching reference image)
                    : isBooked
                    ? 'bg-slate-800 border border-slate-900 text-slate-500 cursor-not-allowed opacity-90'
                    // Held by Others
                    : isHeldByOthers
                    ? 'bg-amber-400 border border-amber-500 text-amber-950 cursor-not-allowed'
                    // Available State (Clean white squircle with delicate border)
                    : 'bg-white border border-slate-300 text-slate-600 hover:border-violet-500 hover:shadow-sm hover:scale-105 cursor-pointer'
                )}
              >
                {isBooked ? (
                  <span className="opacity-0 group-hover:opacity-100 text-[8px] text-slate-400">✕</span>
                ) : isSelected ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : isHeldByOthers ? (
                  <Lock className="w-2.5 h-2.5 text-amber-900" />
                ) : (
                  <span className="opacity-60 group-hover:opacity-100">{seat.seatNumber}</span>
                )}

                {/* Light Minimalist Hover Tooltip */}
                {isClickable && (
                  <span className="absolute -top-7 px-2 py-0.5 bg-slate-900 text-white text-[10px] rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-30 font-sans">
                    {seat.rowName}{seat.seatNumber} • {formatCurrency(seat.price)}
                  </span>
                )}
              </button>
            );
          };

          return (
            <div key={rowName} className="flex items-center gap-2 sm:gap-3">
              {/* Row Label Left */}
              <span className="w-4 text-center font-mono font-semibold text-[10px] text-slate-400">
                {rowName}
              </span>

              {/* Left Wing Cluster */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {leftCluster.map(renderSeat)}
              </div>

              {/* Aisle Spacer 1 */}
              <div className="w-3 sm:w-5" />

              {/* Center Cluster */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {centerCluster.map(renderSeat)}
              </div>

              {/* Aisle Spacer 2 */}
              <div className="w-3 sm:w-5" />

              {/* Right Wing Cluster */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {rightCluster.map(renderSeat)}
              </div>

              {/* Row Label Right */}
              <span className="w-4 text-center font-mono font-semibold text-[10px] text-slate-400">
                {rowName}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tier Price Tags */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 font-mono">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          Silver: Base
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Gold: +30%
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-800">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          VIP Recliner: +80%
        </span>
      </div>
    </div>
  );
}
