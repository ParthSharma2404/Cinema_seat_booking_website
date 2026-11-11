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
        'flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-medium transition-all shadow-sm',
        isExpired
          ? 'bg-rose-50 border-rose-200 text-rose-700'
          : isExpiringSoon
          ? 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse'
          : 'bg-white border-slate-200 text-slate-700 shadow-sm',
        className
      )}
    >
      {isExpiringSoon || isExpired ? (
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
      ) : (
        <Timer className="w-3.5 h-3.5 text-violet-600" />
      )}
      <span>
        {isExpired ? 'Hold Expired' : `Locked: ${formattedTime}`}
      </span>
    </div>
  );
}
