'use client';

import React from 'react';
import { Armchair, Lock, Check } from 'lucide-react';
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
    <div className="w-full flex flex-col items-center select-none py-4">
      {/* Curved Screen Graphic */}
      <div className="w-full max-w-3xl mb-12 flex flex-col items-center">
        <div className="w-full cinema-screen-glow flex items-center justify-center">
          <span className="text-xs uppercase tracking-[0.3em] font-semibold text-red-400/80 -mt-6">
            All Eyes On Screen
          </span>
        </div>
        <div className="w-3/4 h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent mt-2" />
      </div>

      {/* Grid of Seats */}
      <div className="flex flex-col gap-3.5 items-center w-full max-w-4xl overflow-x-auto px-4 pb-4">
        {rows.map(([rowName, rowSeats]) => (
          <div key={rowName} className="flex items-center gap-3">
            {/* Row Letter */}
            <span className="w-6 text-center font-mono font-bold text-xs text-slate-500">
              {rowName}
            </span>

            {/* Row Seats */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {rowSeats.map((seat) => {
                const isSelected = selectedSeatIds.includes(seat.id);
                const isBooked = seat.status === 'BOOKED';
                const isHeldByOthers = seat.status === 'HELD' && !seat.isHeldByMe && !isSelected;
                const isClickable = !isBooked && !isHeldByOthers && !disabled;

                let categoryBorder = 'border-slate-700';
                if (seat.category === 'GOLD') categoryBorder = 'border-amber-600/60';
                if (seat.category === 'VIP_RECLINER') categoryBorder = 'border-purple-600/70';

                return (
                  <button
                    key={seat.id}
                    type="button"
                    disabled={!isClickable}
                    onClick={() => onToggleSeat(seat)}
                    title={`Row ${seat.rowName} Seat ${seat.seatNumber} (${seat.category}) - ${formatCurrency(seat.price)} [${seat.status}]`}
                    className={cn(
                      'relative group flex flex-col items-center justify-center rounded-lg border transition-all duration-200',
                      seat.category === 'VIP_RECLINER' ? 'w-10 sm:w-11 h-10 sm:h-11' : 'w-8 sm:w-9 h-8 sm:h-9',
                      // Status Styles
                      isSelected
                        ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/60 scale-105 z-10'
                        : isBooked
                        ? 'bg-slate-900/40 border-slate-800 text-slate-700 cursor-not-allowed opacity-40'
                        : isHeldByOthers
                        ? 'bg-amber-950/30 border-amber-800/60 text-amber-500/70 cursor-not-allowed'
                        : `bg-slate-900/80 ${categoryBorder} text-slate-300 hover:border-red-500 hover:bg-red-950/30 hover:scale-105 cursor-pointer`
                    )}
                  >
                    {isBooked ? (
                      <Lock className="w-3.5 h-3.5 text-slate-700" />
                    ) : isHeldByOthers ? (
                      <Lock className="w-3.5 h-3.5 text-amber-500/80 animate-pulse" />
                    ) : isSelected ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <>
                        <Armchair
                          className={cn(
                            'w-3.5 h-3.5',
                            seat.category === 'GOLD'
                              ? 'text-amber-400'
                              : seat.category === 'VIP_RECLINER'
                              ? 'text-purple-400'
                              : 'text-slate-400'
                          )}
                        />
                        <span className="text-[9px] font-mono leading-none mt-0.5 opacity-80">
                          {seat.seatNumber}
                        </span>
                      </>
                    )}

                    {/* Tooltip on hover */}
                    {isClickable && (
                      <span className="absolute -top-8 px-2 py-0.5 bg-slate-950 text-white text-[10px] rounded shadow-md border border-slate-800 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20">
                        {seat.rowName}{seat.seatNumber} • {formatCurrency(seat.price)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Row Letter right side */}
            <span className="w-6 text-center font-mono font-bold text-xs text-slate-500">
              {rowName}
            </span>
          </div>
        ))}
      </div>

      {/* Seat Map Legend */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 border-t border-slate-800/80 pt-6 px-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-slate-700 bg-slate-900/80" />
          <span>Silver Tier</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-amber-600/70 bg-slate-900/80" />
          <span className="text-amber-400/90">Gold Tier</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-purple-600/80 bg-slate-900/80" />
          <span className="text-purple-400/90">VIP Recliner</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-600 border border-red-500 flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-white font-medium">Selected / Held</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-950/40 border border-amber-800/60 flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-amber-500" />
          </div>
          <span>Held by Others</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-900/40 border border-slate-800 opacity-40 flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-slate-600" />
          </div>
          <span>Booked / Reserved</span>
        </div>
      </div>
    </div>
  );
}
