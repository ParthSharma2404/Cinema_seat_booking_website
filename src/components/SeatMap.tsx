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
      {/* 1. Minimalist Top Legend (Matching Reference Design) */}
      <div className="flex items-center justify-center gap-7 sm:gap-10 mb-8 pb-5 border-b border-slate-100 w-full max-w-md">
        {/* Available */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-6 h-5 rounded-[6px] bg-white border border-slate-300 shadow-xs transition-transform group-hover:scale-105" />
          <span className="text-[11px] font-medium text-slate-500">Available</span>
        </div>

        {/* Taken / Booked */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-6 h-5 rounded-[6px] bg-slate-900 border border-slate-900 shadow-xs" />
          <span className="text-[11px] font-medium text-slate-500">Taken</span>
        </div>

        {/* Selected */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-6 h-5 rounded-[6px] bg-violet-600 border border-violet-500 shadow-glow-violet animate-pulse" />
          <span className="text-[11px] font-semibold text-violet-700">Selected</span>
        </div>

        {/* Held (TTL) */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-6 h-5 rounded-[6px] bg-amber-400 border border-amber-500" />
          <span className="text-[11px] font-medium text-slate-500">Held (8m)</span>
        </div>
      </div>

      {/* 2. Curved Cinema Screen with ANIMATED Projector Light Rays */}
      <div className="w-full max-w-lg mb-6 flex flex-col items-center relative">
        {/* The Screen Arch */}
        <div className="cinema-screen-arch-premium flex items-center justify-center">
          <div className="w-3/5 h-[1.5px] bg-gradient-to-r from-transparent via-violet-400 to-transparent -mt-1 opacity-70" />
        </div>

        {/* Animated Projector Light Rays Container */}
        <div className="projector-beam-container -mt-1">
          {/* Pulsing Luminous Color Cone */}
          <div className="projector-beam-light" />
          {/* Moving Projector Dust / Ray Streaks */}
          <div className="projector-ray-streaks" />
          
          {/* Screen Label inside the Beam */}
          <div className="relative z-10 mt-6 px-3.5 py-1 rounded-full bg-white/70 backdrop-blur-md border border-slate-200/60 shadow-xs">
            <span className="text-[10px] tracking-[0.28em] uppercase font-bold text-slate-600 font-mono">
              VIP HALL • SCREEN
            </span>
          </div>
        </div>
      </div>

      {/* 3. Seating Grid with 3-Column Aisle Layout (Left Wing, Center Wing, Right Wing) */}
      <div className="flex flex-col gap-3 items-center w-full max-w-3xl px-2 sm:px-4">
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
                  'relative group w-8 sm:w-9 h-7 sm:h-8 rounded-[7px] transition-all duration-200 flex items-center justify-center font-mono text-[9px] font-semibold',
                  // Selected State: Glowing Violet pill matching the reference image
                  isSelected
                    ? 'bg-violet-600 text-white shadow-glow-violet scale-105 z-10 border border-violet-500'
                    // Booked State: Matte titanium dark pill matching the reference image
                    : isBooked
                    ? 'bg-slate-900 border border-slate-900 text-slate-600 cursor-not-allowed opacity-90'
                    // Held by Others: Amber pill
                    : isHeldByOthers
                    ? 'bg-amber-400 border border-amber-500 text-amber-950 cursor-not-allowed'
                    // Available State: Clean white squircle with subtle slate border and soft hover lift
                    : 'bg-white border border-slate-300/90 text-slate-700 hover:border-violet-500 hover:text-violet-700 hover:shadow-sm hover:-translate-y-0.5 cursor-pointer'
                )}
              >
                {isBooked ? (
                  <span className="opacity-0 group-hover:opacity-100 text-[8px] text-slate-400 font-sans">✕</span>
                ) : isSelected ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : isHeldByOthers ? (
                  <Lock className="w-2.5 h-2.5 text-amber-950" />
                ) : (
                  <span className="opacity-70 group-hover:opacity-100">{seat.seatNumber}</span>
                )}

                {/* Minimalist Hover Tooltip */}
                {isClickable && (
                  <span className="absolute -top-8 px-2.5 py-1 bg-slate-900 text-white text-[10px] rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-30 font-sans">
                    {seat.rowName}{seat.seatNumber} • {formatCurrency(seat.price)}
                  </span>
                )}
              </button>
            );
          };

          return (
            <div key={rowName} className="flex items-center gap-2 sm:gap-3.5">
              {/* Row Label Left */}
              <span className="w-4 text-center font-mono font-bold text-[11px] text-slate-400">
                {rowName}
              </span>

              {/* Left Wing Cluster (Seats 1-2) */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {leftCluster.map(renderSeat)}
              </div>

              {/* Left Aisle Corridor */}
              <div className="w-4 sm:w-6 flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-slate-200" />
              </div>

              {/* Center Main Cluster (Seats 3-8) */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {centerCluster.map(renderSeat)}
              </div>

              {/* Right Aisle Corridor */}
              <div className="w-4 sm:w-6 flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-slate-200" />
              </div>

              {/* Right Wing Cluster (Seats 9-10) */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {rightCluster.map(renderSeat)}
              </div>

              {/* Row Label Right */}
              <span className="w-4 text-center font-mono font-bold text-[11px] text-slate-400">
                {rowName}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tier Multiplier Legend */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 font-mono">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          Silver: Standard
        </span>
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50/80 border border-amber-200 text-amber-800 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Gold: +30%
        </span>
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-50/80 border border-violet-200 text-violet-800 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-violet-600" />
          VIP Recliner: +80%
        </span>
      </div>
    </div>
  );
}
