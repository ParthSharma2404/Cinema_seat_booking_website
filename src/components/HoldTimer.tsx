'use client';

import React, { useEffect, useState } from 'react';
import { Timer, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HoldTimerProps {
  expiresAt: string | Date;
  onExpire?: () => void;
  className?: string;
}

export function HoldTimer({ expiresAt, onExpire, className }: HoldTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    const target = new Date(expiresAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((target - now) / 1000));
      setSecondsRemaining(diff);

      if (diff === 0 && onExpire) {
        onExpire();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isExpiringSoon = secondsRemaining > 0 && secondsRemaining <= 120; // 2 mins
  const isExpired = secondsRemaining === 0;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-mono font-medium transition-all shadow-sm',
        isExpired
          ? 'bg-rose-950/60 border-rose-800 text-rose-300'
          : isExpiringSoon
          ? 'bg-amber-950/70 border-amber-600 text-amber-300 animate-pulse'
          : 'bg-slate-900/80 border-slate-700 text-slate-200',
        className
      )}
    >
      {isExpiringSoon || isExpired ? (
        <AlertTriangle className="w-4 h-4 text-amber-400" />
      ) : (
        <Timer className="w-4 h-4 text-cinema-accent" />
      )}
      <span>
        {isExpired ? 'Hold Expired' : `Seats Held: ${formattedTime}`}
      </span>
    </div>
  );
}
