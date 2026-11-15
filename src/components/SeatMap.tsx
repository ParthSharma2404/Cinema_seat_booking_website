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
  basePrice?: number;
}

export function SeatMap({
  seats,
  selectedSeatIds,
  onToggleSeat,
  disabled,
  basePrice = 250,
}: SeatMapProps) {
  // Group seats by rowName (A, B, C, etc.)
  const rows = React.useMemo(() => {
    // If no seats loaded yet, supply standard 8-row (A to H) 10-seat default grid as non-interactive skeleton placeholders
    if (!seats || seats.length === 0) {
      const generated: SeatWithStatus[] = [];
      const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      for (const row of rowLetters) {
        const cat =
          row === 'G' || row === 'H'
            ? 'VIP_RECLINER'
            : row === 'C' || row === 'D' || row === 'E' || row === 'F'
            ? 'GOLD'
            : 'SILVER';
        const mult = cat === 'VIP_RECLINER' ? 1.8 : cat === 'GOLD' ? 1.3 : 1.0;
        for (let num = 1; num <= 10; num++) {
          generated.push({
            id: `skeleton-${row}-${num}`,
            rowName: row,
            seatNumber: num,
            category: cat,
            price: Math.round(basePrice * mult),
            status: 'AVAILABLE',
            isHeldByMe: false,
            holdExpiresAt: null,
          });
        }
      }
      return groupRows(generated);
    }
    return groupRows(seats);
  }, [seats, basePrice]);

  function groupRows(seatList: SeatWithStatus[]) {
    const map = new Map<string, SeatWithStatus[]>();
    for (const seat of seatList) {
      if (!map.has(seat.rowName)) {
        map.set(seat.rowName, []);
      }
      map.get(seat.rowName)!.push(seat);
    }
    for (const [, list] of map.entries()) {
      list.sort((a, b) => a.seatNumber - b.seatNumber);
    }
    return Array.from(map.entries()).sort(([rowA], [rowB]) => rowA.localeCompare(rowB));
  }

  // Dynamic tier prices for the legend
  const silverSeat = seats?.find((s) => s.category === 'SILVER');
  const goldSeat = seats?.find((s) => s.category === 'GOLD');
  const vipSeat = seats?.find((s) => s.category === 'VIP_RECLINER');

  const regularPrice = silverSeat ? silverSeat.price : basePrice;
  const goldPrice = goldSeat ? goldSeat.price : Math.round(basePrice * 1.3);
  const vipPrice = vipSeat ? vipSeat.price : Math.round(basePrice * 1.8);

  return (
    <div className="w-full flex flex-col items-center select-none font-sans relative">
      {/* 1. CINEMA SCREEN: Glowing curved neon arc with luminous downward projection beam */}
      <div className="w-full max-w-xl mb-6 sm:mb-8 flex flex-col items-center relative pt-2">
        {/* Ambient Projector Light Beam spreading onto theater floor */}
        <div
          className="absolute -top-4 inset-x-8 h-40 pointer-events-none opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245, 215, 150, 0.22) 0%, rgba(212, 175, 55, 0.08) 45%, transparent 75%)',
          }}
        />

        <svg viewBox="0 0 540 48" className="w-full h-9 sm:h-10 overflow-visible relative z-10">
          <defs>
            <linearGradient id="screenArcGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#cca255" stopOpacity="0.2" />
              <stop offset="20%" stopColor="#f7e1ad" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#fff8e7" stopOpacity="1" />
              <stop offset="80%" stopColor="#f7e1ad" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#cca255" stopOpacity="0.2" />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Diffused outer aura */}
          <path
            d="M 20,38 Q 270,12 520,38"
            fill="none"
            stroke="url(#screenArcGlow)"
            strokeWidth="6"
            opacity="0.4"
            filter="url(#softGlow)"
          />

          {/* Crisp, ultra-refined illuminated golden arc line */}
          <path
            d="M 20,38 Q 270,12 520,38"
            fill="none"
            stroke="url(#screenArcGlow)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>

        {/* Refined SCREEN Badge */}
        <div className="flex items-center gap-2 -mt-1 z-10">
          <span className="h-px w-6 bg-gradient-to-r from-transparent to-[#e2be78]/60" />
          <span className="text-[10px] tracking-[0.45em] uppercase text-[#f5d99b] font-mono font-bold drop-shadow-[0_0_8px_rgba(245,215,150,0.6)]">
            SCREEN
          </span>
          <span className="h-px w-6 bg-gradient-to-l from-transparent to-[#e2be78]/60" />
        </div>
      </div>

      {/* 2. CONCENTRIC AMPHITHEATER SEATING CHAMBER */}
      <div className="relative w-full max-w-2xl px-2 sm:px-6 py-2">
        {/* Soft trapezoidal acoustic guide lines with subtle floor lighting */}
        <svg
          viewBox="0 0 600 320"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
          preserveAspectRatio="none"
        >
          <line x1="50" y1="0" x2="20" y2="320" stroke="#cca255" strokeWidth="1" strokeDasharray="3 4" />
          <line x1="550" y1="0" x2="580" y2="320" stroke="#cca255" strokeWidth="1" strokeDasharray="3 4" />
        </svg>

        {/* Rows Container */}
        <div className="flex flex-col gap-2.5 sm:gap-3 items-center w-full relative z-10">
          {rows.map(([rowName, rowSeats], rowIdx) => {
            const leftCluster = rowSeats.filter((s) => s.seatNumber <= 2);
            const centerCluster = rowSeats.filter((s) => s.seatNumber > 2 && s.seatNumber <= 8);
            const rightCluster = rowSeats.filter((s) => s.seatNumber > 8);

            const isVipRow = rowName === 'G' || rowName === 'H';
            const isGoldRow = rowName === 'C' || rowName === 'D' || rowName === 'E' || rowName === 'F';

            // Progressive perspective scale from Row A (front) to Row H (back)
            const perspectiveWidthClass =
              rowIdx === 0
                ? 'max-w-[91%]'
                : rowIdx === 1
                ? 'max-w-[92%]'
                : rowIdx === 2
                ? 'max-w-[93.5%]'
                : rowIdx === 3
                ? 'max-w-[95%]'
                : rowIdx === 4
                ? 'max-w-[96.5%]'
                : rowIdx === 5
                ? 'max-w-[98%]'
                : 'max-w-[100%]';

            const renderSeat = (seat: SeatWithStatus, curveOffset = '0px', rotateDeg = '0deg') => {
              const isSkeleton = seat.id.startsWith('skeleton-') || seat.id.startsWith('temp-');
              const isBooked = seat.status === 'BOOKED';
              const isHeldByOthers = seat.status === 'HELD' && !seat.isHeldByMe;
              const isSelected = selectedSeatIds.includes(seat.id) && !isHeldByOthers && !isBooked;
              const isClickable = !isSkeleton && !isBooked && !isHeldByOthers && !disabled;

              const isVipSeat = seat.category === 'VIP_RECLINER';
              const isGoldSeat = seat.category === 'GOLD';

              return (
                <button
                  key={seat.id}
                  type="button"
                  disabled={!isClickable}
                  onClick={() => {
                    if (!isClickable) return;
                    onToggleSeat(seat);
                  }}
                  style={{
                    transform: isSelected
                      ? `translateY(${curveOffset}) scale(1.12)`
                      : `translateY(${curveOffset}) rotate(${rotateDeg})`,
                  }}
                  title={
                    isSkeleton
                      ? 'Loading live seat availability...'
                      : `Row ${seat.rowName} Seat ${seat.seatNumber} (${seat.category}) - ${formatCurrency(seat.price)}`
                  }
                  className={cn(
                    'relative group w-7 sm:w-8 h-7 sm:h-8 rounded-t-[8px] rounded-b-[4px] transition-all duration-150 flex items-center justify-center select-none text-[10px] font-mono font-bold shadow-md',
                    isSkeleton && 'opacity-30 animate-pulse bg-white/[0.04] border border-white/5 cursor-wait pointer-events-none',
                    !isClickable && !isSkeleton && 'cursor-not-allowed',
                    isClickable && 'cursor-pointer hover:scale-105 active:scale-95',

                    // SELECTED STATE: Luminous pearl-gold capsule with deep contrast and bright golden halo
                    isSelected &&
                      'bg-gradient-to-b from-[#ffffff] via-[#fff4d6] to-[#f4d48f] text-zinc-950 font-black border-2 border-[#ffe8a3] shadow-[0_0_22px_rgba(255,215,120,0.95),0_0_8px_rgba(255,255,255,0.9)] z-20',

                    // BOOKED STATE: Muted dark slate with subtle '✕'
                    !isSelected && !isSkeleton && isBooked &&
                      'bg-[#12141a]/60 border border-white/[0.06] text-zinc-600 opacity-25',

                    // HELD BY OTHERS:
                    !isSelected && !isSkeleton && !isBooked && isHeldByOthers &&
                      'bg-amber-950/60 border border-amber-500/70 text-amber-300',

                    // 1. VIP RECLINER: Royal amethyst velvet with rich glowing border
                    !isSelected && !isSkeleton && !isBooked && !isHeldByOthers && isVipSeat &&
                      'bg-gradient-to-b from-[#352054] to-[#201333] hover:from-[#43296a] hover:to-[#281840] border border-[#7d4eb8] hover:border-[#b184f5] text-[#d6bbfb] shadow-[0_3px_8px_rgba(0,0,0,0.6)]',

                    // 2. GOLD TIER: Rich metallic bronze/amber with warm gold sheen
                    !isSelected && !isSkeleton && !isBooked && !isHeldByOthers && isGoldSeat &&
                      'bg-gradient-to-b from-[#382b17] to-[#231a0e] hover:from-[#47361e] hover:to-[#2e2212] border border-[#85652b] hover:border-[#cca255] text-[#f2d89f] shadow-[0_3px_8px_rgba(0,0,0,0.6)]',

                    // 3. REGULAR TIER: Crisp slate-indigo armchair with clear contrast
                    !isSelected && !isSkeleton && !isBooked && !isHeldByOthers && !isGoldSeat && !isVipSeat &&
                      'bg-gradient-to-b from-[#242b3d] to-[#181d29] hover:from-[#2d364c] hover:to-[#1e2433] border border-[#3d4863] hover:border-[#63759e] text-slate-200 shadow-[0_3px_8px_rgba(0,0,0,0.6)]'
                  )}
                >
                  {/* Subtle top cushion highlight border */}
                  {!isSelected && !isBooked && (
                    <span className="absolute top-0 inset-x-1 h-[1.5px] bg-white/20 rounded-t-full pointer-events-none" />
                  )}

                  {isBooked ? (
                    <span className="text-[8px] opacity-40">✕</span>
                  ) : isHeldByOthers ? (
                    <Lock className="w-2.5 h-2.5 text-amber-400" />
                  ) : isSelected ? (
                    <span className="text-zinc-950 font-black text-[10px]">{seat.seatNumber}</span>
                  ) : (
                    <span className="text-[9px] font-mono font-medium opacity-75 group-hover:opacity-100 transition-opacity">
                      {seat.seatNumber}
                    </span>
                  )}

                  {/* Interactive Seat Tooltip */}
                  {isClickable && (
                    <span className="absolute -top-7 px-2 py-0.5 bg-zinc-950/95 border border-[#cca255]/40 text-white text-[9px] rounded-md shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-30 font-mono">
                      {seat.rowName}{seat.seatNumber} • {formatCurrency(seat.price)}
                    </span>
                  )}
                </button>
              );
            };

            return (
              <div
                key={rowName}
                className={cn('flex items-center gap-2 sm:gap-2.5 w-full justify-center transition-all', perspectiveWidthClass)}
              >
                {/* Row Label Left with glowing badge */}
                <span className="w-5 text-center font-mono text-[11px] font-bold text-[#cca255] drop-shadow-[0_0_4px_rgba(204,162,85,0.4)]">
                  {rowName}
                </span>

                {/* Left Cluster (Seats 1-2) with gentle amphitheater angle */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {leftCluster.map((s, idx) =>
                    renderSeat(s, `${idx * 1.2}px`, '3deg')
                  )}
                </div>

                {/* Left Aisle with soft glowing runner dot */}
                <div className="w-4 sm:w-5 flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-[#cca255]/30" />
                </div>

                {/* Center Cluster (Seats 3-8) curved concentrically towards the screen */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {centerCluster.map((s, idx) => {
                    // Center curve calculation: parabolic arc toward screen
                    const curveY =
                      idx === 2 || idx === 3
                        ? '-4px'
                        : idx === 1 || idx === 4
                        ? '-2.5px'
                        : '-0.5px';
                    return renderSeat(s, curveY, '0deg');
                  })}
                </div>

                {/* Right Aisle with soft glowing runner dot */}
                <div className="w-4 sm:w-5 flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-[#cca255]/30" />
                </div>

                {/* Right Cluster (Seats 9-10) with gentle amphitheater angle */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {rightCluster.map((s, idx) =>
                    renderSeat(s, `${(1 - idx) * 1.2}px`, '-3deg')
                  )}
                </div>

                {/* Row Label Right with glowing badge */}
                <span className="w-5 text-center font-mono text-[11px] font-bold text-[#cca255] drop-shadow-[0_0_4px_rgba(204,162,85,0.4)]">
                  {rowName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. VIBRANT, LUXURIOUS SEAT LEGEND WITH PRICING PILLS */}
      <div className="mt-8 pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs text-zinc-300 font-sans">
        {/* Regular Tier */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10">
          <span className="w-3.5 h-3.5 rounded-[4px] bg-gradient-to-b from-[#242b3d] to-[#181d29] border border-[#3d4863]" />
          <span className="font-medium text-slate-200">Regular • {formatCurrency(regularPrice)}</span>
        </div>

        {/* Gold Tier */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10">
          <span className="w-3.5 h-3.5 rounded-[4px] bg-gradient-to-b from-[#382b17] to-[#231a0e] border border-[#85652b]" />
          <span className="font-medium text-[#f2d89f]">Gold • {formatCurrency(goldPrice)}</span>
        </div>

        {/* VIP Recliner */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10">
          <span className="w-3.5 h-3.5 rounded-[4px] bg-gradient-to-b from-[#352054] to-[#201333] border border-[#7d4eb8]" />
          <span className="font-medium text-[#d6bbfb]">VIP Recliner • {formatCurrency(vipPrice)}</span>
        </div>

        {/* Selected */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-[#cca255]/40 shadow-[0_0_12px_rgba(204,162,85,0.15)]">
          <span className="w-3.5 h-3.5 rounded-[4px] bg-gradient-to-b from-[#ffffff] to-[#f4d48f] border border-[#ffe8a3] shadow-[0_0_8px_rgba(255,215,120,0.8)]" />
          <span className="font-bold text-[#f7e1ad]">Selected</span>
        </div>

        {/* Booked */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 opacity-60">
          <span className="w-3.5 h-3.5 rounded-[4px] bg-[#12141a] border border-white/10 flex items-center justify-center text-[7px] text-zinc-500">✕</span>
          <span className="text-zinc-400">Booked</span>
        </div>
      </div>
    </div>
  );
}
