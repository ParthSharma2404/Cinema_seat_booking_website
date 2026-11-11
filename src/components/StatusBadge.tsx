import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const s = status.toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (s === 'CONFIRMED' || s === 'VALID' || s === 'SUCCESS' || s === 'COMPLETED') {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  } else if (s === 'CANCELLED' || s === 'FAILED') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200/80';
  } else if (s === 'REDEEMED' || s === 'USED') {
    styles = 'bg-slate-100 text-slate-600 border-slate-300';
  } else if (s === 'HELD' || s === 'PENDING') {
    styles = 'bg-amber-50 text-amber-700 border-amber-200/80';
  } else if (s === 'REFUNDED') {
    styles = 'bg-blue-50 text-blue-700 border-blue-200/80';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide uppercase font-mono text-[10px]',
        styles,
        className
      )}
    >
      {s.replace('_', ' ')}
    </span>
  );
}
