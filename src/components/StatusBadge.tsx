import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const s = status.toUpperCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';

  if (s === 'CONFIRMED' || s === 'VALID' || s === 'SUCCESS' || s === 'COMPLETED') {
    styles = 'bg-emerald-950/80 text-emerald-400 border-emerald-700/50';
  } else if (s === 'CANCELLED' || s === 'FAILED') {
    styles = 'bg-rose-950/80 text-rose-400 border-rose-700/50';
  } else if (s === 'REDEEMED' || s === 'USED') {
    styles = 'bg-indigo-950/80 text-indigo-400 border-indigo-700/50';
  } else if (s === 'HELD' || s === 'PENDING') {
    styles = 'bg-amber-950/80 text-amber-400 border-amber-700/50';
  } else if (s === 'REFUNDED') {
    styles = 'bg-blue-950/80 text-blue-400 border-blue-700/50';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide uppercase',
        styles,
        className
      )}
    >
      {s.replace('_', ' ')}
    </span>
  );
}
