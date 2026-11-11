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
      {/* 1. Minimalist Top Legend */}
      <div className="flex items-center justify-center gap-7 sm:gap-10 mb-8 pb-5 border-b border-white/10 w-full max-w-md">
        {/* Available */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-6 h-5 rounded-[6px] bg-white border border-white/20 shadow-sm transition-transform group-hover:scale-105" />
          <span className="text-[11px] font-medium text-slate-400">Available</span>
        </div>

        {/* Taken / Booked */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-6 h-5 rounded-[6px] bg-[#1a1c2e] border border-white/5" />
          <span className="text-[11px] font-medium text-slate-500">Taken</span>
        </div>

        {/* Selected */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-6 h-5 rounded-[6px] bg-violet-600 border border-violet-400 shadow-lg shadow-violet-600/40" />
          <span className="text-[11px] font-semibold text-violet-400">Selected</span>
        </div>

        {/* Held (TTL) */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-6 h-5 rounded-[6px] bg-amber-400 border border-amber-300" />
          <span className="text-[11px] font-medium text-amber-400">Held (8m)</span>
        </div>
      </div>

      {/* 2. Top-Down Curved Screen with HORIZONTALLY SWEEPING LIGHT AURORA */}
      <div className="w-full max-w-lg mb-8 flex flex-col items-center relative overflow-visible">
        {/* Projector Lens Hotspot gliding along the curved screen */}
        <div className="screen-lens-hotspot" />

        {/* The Curved Screen Arch */}
        <div className="cinema-screen-arch-premium flex items-center justify-center">
          <div className="w-2/3 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent -mt-1 opacity-90" />
        </div>

        {/* Organic Light Field (Sweeps Left <-> Right as seen from the top of the hall) */}
        <div className="auditorium-ambient-field -mt-1">
          {/* Sweeping Aurora Layer 1 (Electric Violet / Magenta) */}
          <div className="ambient-aurora-layer1" />
          {/* Sweeping Aurora Layer 2 (Cyan / Deep Violet) */}
          <div className="ambient-aurora-layer2" />
          {/* Horizontal Caustic Highlight Beam */}
          <div className="screen-caustic-beam" />
          
          {/* Floating Minimalist Hall Badge */}
          <div className="relative z-10 mt-6 px-4 py-1.5 rounded-full bg-[#111322]/90 backdrop-blur-md border border-white/10 shadow-lg flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-slate-200 font-mono">
              VIP HALL • SCREEN
            </span>
          </div>
        </div>
      </div>

      {/* 3. Seating Grid with 3-Column Aisle Layout (Left Wing, Center Wing, Right Wing) */}
      <div className="flex flex-col gap-3 items-center w-full max-w-3xl px-2 sm:px-4">
        {rows.map(([rowName, rowSeats]) => {
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
                  'relative group w-8 sm:w-9 h-7 sm:h-8 rounded-[7px] transition-all duration-200 flex items-center justify-center font-mono text-[9px] font-bold',
                  isSelected
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/50 scale-105 z-10 border border-violet-400'
                    : isBooked
                    ? 'bg-[#1a1c2e] border border-white/5 text-slate-600 cursor-not-allowed opacity-60'
                    : isHeldByOthers
                    ? 'bg-amber-400 border border-amber-300 text-slate-950 cursor-not-allowed shadow-md shadow-amber-500/20'
                    : 'bg-white text-slate-900 border border-white/20 hover:bg-violet-100 hover:border-violet-400 hover:scale-105 cursor-pointer shadow-sm'
                )}
              >
                {isBooked ? (
                  <span className="opacity-0 group-hover:opacity-100 text-[8px] text-slate-500 font-sans">✕</span>
                ) : isSelected ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : isHeldByOthers ? (
                  <Lock className="w-2.5 h-2.5 text-slate-950" />
                ) : (
                  <span className="opacity-80 group-hover:opacity-100">{seat.seatNumber}</span>
                )}

                {/* Minimalist Hover Tooltip */}
                {isClickable && (
                  <span className="absolute -top-8 px-2.5 py-1 bg-[#161828] text-white border border-white/10 text-[10px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-30 font-sans font-medium">
                    {seat.rowName}{seat.seatNumber} • {formatCurrency(seat.price)}
                  </span>
                )}
              </button>
            );
          };

          return (
            <div key={rowName} className="flex items-center gap-2 sm:gap-4 w-full justify-center">
              {/* Row Label Left */}
              <span className="w-4 text-center font-mono text-xs font-bold text-slate-500">
                {rowName}
              </span>

              {/* Left Wing (Seats 1-2) */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {leftCluster.map(renderSeat)}
              </div>

              {/* Aisle Spacer */}
              <div className="w-2 sm:w-4 flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-white/10" />
              </div>

              {/* Center Wing (Seats 3-8) */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {centerCluster.map(renderSeat)}
              </div>

              {/* Aisle Spacer */}
              <div className="w-2 sm:w-4 flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-white/10" />
              </div>

              {/* Right Wing (Seats 9-10) */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {rightCluster.map(renderSeat)}
              </div>

              {/* Row Label Right */}
              <span className="w-4 text-center font-mono text-xs font-bold text-slate-500">
                {rowName}
              </span>
            </div>
          );
        })}
      </div>

      {/* 4. Pricing Tiers Pill Legend */}
      <div className="mt-8 pt-5 border-t border-white/10 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span>Silver: Base</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="text-amber-400 font-semibold">Gold: +30%</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
          <span className="text-violet-400 font-semibold">VIP Recliner: +80%</span>
        </div>
      </div>
    </div>
  );
}
