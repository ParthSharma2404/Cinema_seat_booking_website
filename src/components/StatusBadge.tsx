import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const s = status.toUpperCase();

  let styles = 'bg-white/10 text-slate-300 border-white/10';

  if (s === 'CONFIRMED' || s === 'VALID' || s === 'SUCCESS' || s === 'COMPLETED') {
    styles = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  } else if (s === 'CANCELLED' || s === 'FAILED') {
    styles = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  } else if (s === 'REDEEMED' || s === 'USED') {
    styles = 'bg-slate-700/40 text-slate-400 border-slate-600/40';
  } else if (s === 'HELD' || s === 'PENDING') {
    styles = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  } else if (s === 'REFUNDED') {
    styles = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full font-bold border tracking-wider uppercase font-mono text-[10px]',
        styles,
        className
      )}
    >
      {s.replace('_', ' ')}
    </span>
  );
}
