'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { SeatWithStatus } from '@/server/services/seatHoldService';

interface SeatMapProps {
  seats: SeatWithStatus[];
  selectedSeatIds: string[];
  onToggleSeat: (seat: SeatWithStatus) => void;
  disabled?: boolean;
}

// Custom Armchair Icon directly powered by the user's uploaded asset (/seat-icon.png)
export function ArmchairSeat({
  className,
  status = 'AVAILABLE',
  isSelected = false,
}: {
  className?: string;
  status?: 'AVAILABLE' | 'HELD' | 'BOOKED';
  isSelected?: boolean;
}) {
  return (
    <span
      className={cn(
        'seat-armchair-icon pointer-events-none',
        className,
        isSelected
          ? 'text-[#d4af37] filter drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]'
          : status === 'BOOKED'
          ? 'text-zinc-700 opacity-35'
          : status === 'HELD'
          ? 'text-amber-400 filter drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]'
          : 'text-zinc-200 group-hover:text-white group-hover:filter group-hover:drop-shadow-[0_0_7px_rgba(255,255,255,0.6)]'
      )}
    />
  );
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
    <div className="w-full flex flex-col items-center select-none py-2 font-sans">
      {/* 1. Minimalist Top Legend with Luxury Armchair Icons */}
      <div className="flex items-center justify-center gap-7 sm:gap-10 mb-8 pb-5 border-b border-white/10 w-full max-w-md">
        {/* Available */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-6 h-6">
            <ArmchairSeat status="AVAILABLE" className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-sans font-medium text-zinc-400">Available</span>
        </div>

        {/* Taken / Booked */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-6 h-6">
            <ArmchairSeat status="BOOKED" className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-sans font-medium text-zinc-500">Taken</span>
        </div>

        {/* Selected */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-6 h-6">
            <ArmchairSeat status="AVAILABLE" isSelected={true} className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-sans font-bold text-[#d4af37]">Selected</span>
        </div>

        {/* Held (TTL) */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-6 h-6">
            <ArmchairSeat status="HELD" className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-sans font-medium text-amber-400">Held (8m)</span>
        </div>
      </div>

      {/* 2. Top-Down Contained Curved Screen with Active Movie Display & Projector Cone */}
      <div className="w-full max-w-lg mb-8 flex flex-col items-center relative overflow-hidden">
        <div className="cinema-screen-housing">
          {/* Glint traversing the curved glass */}
          <div className="cinema-screen-glint" />

          {/* Curved Cinema Screen Edge */}
          <div className="cinema-screen-arch flex items-center justify-center">
            {/* Active Moving Film Surface */}
            <div className="cinema-film-display-surface" />
            <div className="cinema-scanlines" />
            <div className="w-2/3 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent -mt-2 opacity-95 z-30" />
          </div>

          {/* Realistic Downward Projector Light Cone (Strictly Contained) */}
          <div className="cinema-projector-light-cone">
            <div className="cinema-scanlines opacity-40" />

            {/* Centered Cinema Screen Badge */}
            <div className="relative z-10 px-3.5 py-1 rounded-full bg-[#0b0d18]/90 backdrop-blur-md border border-white/15 shadow-xl flex items-center gap-1.5 -mt-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] tracking-[0.25em] uppercase font-bold text-slate-200 font-mono">
                SCREEN • 4K LASER PROJECTION
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Seating Grid with 3-Column Aisle Layout (Left Wing, Center Wing, Right Wing) */}
      <div className="flex flex-col gap-3.5 sm:gap-4 items-center w-full max-w-3xl px-2 sm:px-4">
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
                  'relative group w-8 sm:w-10 h-8 sm:h-10 transition-all duration-200 flex items-center justify-center select-none',
                  !isClickable ? 'cursor-not-allowed' : 'cursor-pointer',
                  isSelected && 'scale-115 z-10',
                  isClickable && 'hover:scale-110 active:scale-95'
                )}
              >
                {/* The Custom Armchair Graphic */}
                <ArmchairSeat
                  status={seat.status}
                  isSelected={isSelected}
                  className="w-full h-full"
                />

                {/* Seat Number in the Cushion */}
                <span
                  className={cn(
                    'absolute font-mono text-[8px] sm:text-[9px] font-bold pointer-events-none mt-1.5 transition-colors',
                    isSelected
                      ? 'text-zinc-950 font-black'
                      : isBooked
                      ? 'text-zinc-600 opacity-60'
                      : isHeldByOthers
                      ? 'text-zinc-950 font-black'
                      : 'text-zinc-400 group-hover:text-white'
                  )}
                >
                  {isBooked ? (
                    '✕'
                  ) : isHeldByOthers ? (
                    <Lock className="w-2.5 h-2.5 text-zinc-950" />
                  ) : (
                    seat.seatNumber
                  )}
                </span>

                {/* Minimalist Hover Tooltip */}
                {isClickable && (
                  <span className="absolute -top-8 px-2.5 py-1 bg-[#10121d] text-white border border-white/15 text-[10px] rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-30 font-sans font-medium">
                    {seat.rowName}{seat.seatNumber} • {formatCurrency(seat.price)}
                  </span>
                )}
              </button>
            );
          };

          return (
            <div key={rowName} className="flex items-center gap-2 sm:gap-4 w-full justify-center">
              {/* Row Label Left */}
              <span className="w-4 text-center font-mono text-xs font-bold text-zinc-500">
                {rowName}
              </span>

              {/* Left Wing (Seats 1-2) */}
              <div className="flex items-center gap-1 sm:gap-2">
                {leftCluster.map(renderSeat)}
              </div>

              {/* Aisle Spacer */}
              <div className="w-2 sm:w-4 flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-white/15" />
              </div>

              {/* Center Wing (Seats 3-8) */}
              <div className="flex items-center gap-1 sm:gap-2">
                {centerCluster.map(renderSeat)}
              </div>

              {/* Aisle Spacer */}
              <div className="w-2 sm:w-4 flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-white/15" />
              </div>

              {/* Right Wing (Seats 9-10) */}
              <div className="flex items-center gap-1 sm:gap-2">
                {rightCluster.map(renderSeat)}
              </div>

              {/* Row Label Right */}
              <span className="w-4 text-center font-mono text-xs font-bold text-zinc-500">
                {rowName}
              </span>
            </div>
          );
        })}
      </div>

      {/* 4. Pricing Tiers Pill Legend with Armchair Icons */}
      <div className="mt-8 pt-5 border-t border-white/10 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-sans text-zinc-400">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10">
          <span className="w-4 h-4">
            <ArmchairSeat status="AVAILABLE" className="w-4 h-4" />
          </span>
          <span>Silver: Base</span>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10">
          <span className="w-4 h-4">
            <ArmchairSeat status="AVAILABLE" isSelected={true} className="w-4 h-4" />
          </span>
          <span className="text-[#d4af37] font-semibold">Gold: +30%</span>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10">
          <span className="w-4 h-4">
            <span className="seat-armchair-icon text-violet-400 w-4 h-4" />
          </span>
          <span className="text-violet-400 font-semibold">VIP Recliner: +80%</span>
        </div>
      </div>
    </div>
  );
}
