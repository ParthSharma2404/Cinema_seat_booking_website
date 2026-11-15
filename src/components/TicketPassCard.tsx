'use client';

import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { SeatWithStatus } from '@/server/services/seatHoldService';
import { HoldTimer } from '@/components/HoldTimer';

interface TicketPassCardProps {
  movieTitle: string;
  dateFormatted: string;
  timeFormatted: string;
  screenFormatted: string;
  selectedSeats: SeatWithStatus[];
  totalPrice: number;
  isHolding: boolean;
  holdExpiresAt: string | null;
  onHoldExpire: () => void;
  onProceedToPay: () => void;
  isProcessing: boolean;
  isClosed?: boolean;
}

export function TicketPassCard({
  movieTitle,
  dateFormatted,
  timeFormatted,
  screenFormatted,
  selectedSeats,
  totalPrice,
  isHolding,
  holdExpiresAt,
  onHoldExpire,
  onProceedToPay,
  isProcessing,
  isClosed = false,
}: TicketPassCardProps) {
  // Format selected seats label (e.g. "D5 · D6")
  const seatsLabel =
    selectedSeats.length > 0
      ? selectedSeats.map((s) => `${s.rowName}${s.seatNumber}`).join(' · ')
      : 'Select seats';

  // Group seats by category for the breakdown row
  const categoryCounts: Record<string, { count: number; subtotal: number }> = {};
  for (const s of selectedSeats) {
    const catName =
      s.category === 'VIP_RECLINER' ? 'VIP' : s.category === 'GOLD' ? 'Gold' : 'Regular';
    if (!categoryCounts[catName]) {
      categoryCounts[catName] = { count: 0, subtotal: 0 };
    }
    categoryCounts[catName].count += 1;
    categoryCounts[catName].subtotal += s.price;
  }

  // Format movie title display (split if Dune: Part Two)
  const renderMovieTitle = () => {
    if (movieTitle.includes(':')) {
      const [main, sub] = movieTitle.split(':');
      return (
        <>
          <span className="block">{main.trim()}:</span>
          <span className="block text-zinc-800">{sub.trim()}</span>
        </>
      );
    }
    return <span>{movieTitle}</span>;
  };

  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[360px] bg-[#f5f1ea] text-zinc-900 rounded-[28px] p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_25px_rgba(232,200,135,0.12)] border border-white/40 flex flex-col justify-between select-none font-sans overflow-hidden">
      {/* Subtle paper grain texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* TOP SECTION: Header, Title, Date & Time */}
      <div className="relative z-10 space-y-4">
        {/* Ticket Header: CINEBOOK | ADMIT count */}
        <div className="flex items-center justify-between text-[11px] font-mono tracking-widest text-zinc-500 font-semibold uppercase">
          <span>CINEBOOK</span>
          <span>ADMIT {selectedSeats.length || 0}</span>
        </div>

        {/* Big Sans Movie Title */}
        <h3 className="font-sans text-2xl sm:text-[26px] text-zinc-950 font-bold uppercase leading-tight tracking-tight">
          {renderMovieTitle()}
        </h3>

        {/* Meta details grid: DATE | TIME | SCREEN */}
        <div className="grid grid-cols-3 gap-2 pt-1 pb-1">
          <div>
            <span className="block text-[9px] uppercase font-mono tracking-wider text-zinc-400 font-bold">
              DATE
            </span>
            <span className="text-xs font-semibold text-zinc-800">{dateFormatted}</span>
          </div>
          <div>
            <span className="block text-[9px] uppercase font-mono tracking-wider text-zinc-400 font-bold">
              TIME
            </span>
            <span className="text-xs font-semibold text-zinc-800">{timeFormatted}</span>
          </div>
          <div>
            <span className="block text-[9px] uppercase font-mono tracking-wider text-zinc-400 font-bold">
              SCREEN
            </span>
            <span className="text-xs font-semibold text-zinc-800">{screenFormatted}</span>
          </div>
        </div>
      </div>

      {/* PERFORATION NOTCH TEAR-LINE */}
      <div className="relative my-5 -mx-6 sm:-mx-7 flex items-center justify-center">
        {/* Left Cutout Circle */}
        <div className="absolute -left-3.5 w-7 h-7 rounded-full bg-[#08080a] shadow-inner" />
        {/* Dashed Perforation Line */}
        <div className="w-full border-t-2 border-dashed border-zinc-300" />
        {/* Right Cutout Circle */}
        <div className="absolute -right-3.5 w-7 h-7 rounded-full bg-[#08080a] shadow-inner" />
      </div>

      {/* BOTTOM SECTION: Seats, Tier breakdown, Total, Barcode, Pay Button */}
      <div className="relative z-10 space-y-4">
        {/* SEATS Label & Large Sans Seat Display */}
        <div>
          <span className="block text-[9px] uppercase font-mono tracking-wider text-zinc-400 font-bold mb-0.5">
            SEATS
          </span>
          <div className="font-sans text-2xl sm:text-[24px] font-bold text-zinc-950 tracking-tight leading-none min-h-[28px] flex items-center">
            {selectedSeats.length > 0 ? (
              <span>{seatsLabel}</span>
            ) : (
              <span className="text-zinc-400 text-base font-normal">Tap seats on map</span>
            )}
          </div>
        </div>

        {/* Tier subtotal row */}
        <div className="flex items-center justify-between text-xs text-zinc-600 font-sans min-h-[18px]">
          {selectedSeats.length > 0 ? (
            Object.entries(categoryCounts).map(([cat, info]) => (
              <div key={cat} className="flex items-center justify-between w-full">
                <span>
                  {cat} × {info.count}
                </span>
                <span className="font-mono text-zinc-800 font-medium">
                  {formatCurrency(info.subtotal)}
                </span>
              </div>
            ))
          ) : (
            <span className="text-zinc-400 text-[11px] font-mono">No seats selected yet</span>
          )}
        </div>

        {/* TOTAL Row */}
        <div className="pt-2 border-t border-zinc-200/80 flex items-baseline justify-between">
          <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold">
            TOTAL
          </span>
          <span className="font-sans text-2xl sm:text-3xl font-extrabold text-zinc-950 leading-none">
            {formatCurrency(totalPrice)}
          </span>
        </div>

        {/* Realistic Cinema Barcode Graphic */}
        <div className="pt-1">
          <svg viewBox="0 0 280 34" className="w-full h-8 text-zinc-950 fill-current opacity-90">
            {/* Start pattern */}
            <rect x="0" y="0" width="3" height="34" />
            <rect x="5" y="0" width="1.5" height="34" />
            <rect x="8" y="0" width="3.5" height="34" />
            {/* Pattern elements */}
            <rect x="14" y="0" width="2" height="34" />
            <rect x="18" y="0" width="5" height="34" />
            <rect x="25" y="0" width="1.5" height="34" />
            <rect x="29" y="0" width="4" height="34" />
            <rect x="35" y="0" width="2.5" height="34" />
            <rect x="40" y="0" width="6" height="34" />
            <rect x="48" y="0" width="1.5" height="34" />
            <rect x="52" y="0" width="3" height="34" />
            <rect x="57" y="0" width="4.5" height="34" />
            <rect x="64" y="0" width="2" height="34" />
            <rect x="68" y="0" width="5" height="34" />
            <rect x="75" y="0" width="1.5" height="34" />
            <rect x="79" y="0" width="3" height="34" />
            <rect x="84" y="0" width="2" height="34" />
            <rect x="88" y="0" width="6" height="34" />
            <rect x="96" y="0" width="1.5" height="34" />
            <rect x="100" y="0" width="4" height="34" />
            <rect x="106" y="0" width="2" height="34" />
            <rect x="110" y="0" width="5.5" height="34" />
            <rect x="118" y="0" width="1.5" height="34" />
            <rect x="122" y="0" width="3.5" height="34" />
            <rect x="128" y="0" width="2" height="34" />
            <rect x="132" y="0" width="5" height="34" />
            <rect x="139" y="0" width="2.5" height="34" />
            <rect x="144" y="0" width="4" height="34" />
            <rect x="150" y="0" width="1.5" height="34" />
            <rect x="154" y="0" width="6" height="34" />
            <rect x="162" y="0" width="2" height="34" />
            <rect x="166" y="0" width="4.5" height="34" />
            <rect x="173" y="0" width="1.5" height="34" />
            <rect x="177" y="0" width="3" height="34" />
            <rect x="182" y="0" width="5" height="34" />
            <rect x="189" y="0" width="2" height="34" />
            <rect x="193" y="0" width="4" height="34" />
            <rect x="199" y="0" width="1.5" height="34" />
            <rect x="203" y="0" width="6" height="34" />
            <rect x="211" y="0" width="2" height="34" />
            <rect x="215" y="0" width="3.5" height="34" />
            <rect x="221" y="0" width="1.5" height="34" />
            <rect x="225" y="0" width="5" height="34" />
            <rect x="232" y="0" width="2" height="34" />
            <rect x="236" y="0" width="4" height="34" />
            <rect x="242" y="0" width="1.5" height="34" />
            <rect x="246" y="0" width="5.5" height="34" />
            <rect x="254" y="0" width="2" height="34" />
            <rect x="258" y="0" width="3" height="34" />
            <rect x="263" y="0" width="4" height="34" />
            <rect x="269" y="0" width="1.5" height="34" />
            <rect x="273" y="0" width="3.5" height="34" />
            <rect x="278" y="0" width="2" height="34" />
          </svg>
        </div>

        {/* Black Pill Pay Button */}
        <button
          type="button"
          disabled={isClosed || selectedSeats.length === 0 || isProcessing}
          onClick={onProceedToPay}
          className={`w-full py-3.5 px-6 rounded-full font-medium text-sm transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
            isClosed
              ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed opacity-60'
              : selectedSeats.length > 0 && !isProcessing
              ? 'bg-[#121316] hover:bg-black text-[#f5f1ea] active:scale-[0.98] cursor-pointer'
              : 'bg-zinc-300 text-zinc-500 cursor-not-allowed opacity-70'
          }`}
        >
          {isClosed ? (
            <span>Screening Concluded</span>
          ) : isProcessing ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Securing Seats...
            </span>
          ) : selectedSeats.length > 0 ? (
            <span>Pay {formatCurrency(totalPrice)} →</span>
          ) : (
            <span>Select Seats to Book</span>
          )}
        </button>

        {/* Ticket Footer: HELD FOR timer | MAX 10 SEATS */}
        <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-zinc-500 pt-1">
          <div>
            {isHolding && holdExpiresAt ? (
              <span className="flex items-center gap-1 font-bold text-amber-700">
                <span>HELD FOR:</span>
                <HoldTimer expiresAt={holdExpiresAt} minimal={true} onExpire={onHoldExpire} />
              </span>
            ) : (
              <span>HOLD: 08:00</span>
            )}
          </div>
          <span>MAX 10 SEATS</span>
        </div>
      </div>
    </div>
  );
}

