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
        'flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono font-bold transition-all shadow-md',
        isExpired
          ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
          : isExpiringSoon
          ? 'bg-amber-950/60 border-amber-400/50 text-amber-300 animate-pulse'
          : 'bg-white/10 border-white/15 text-violet-300',
        className
      )}
    >
      {isExpiringSoon || isExpired ? (
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
      ) : (
        <Timer className="w-3.5 h-3.5 text-violet-400" />
      )}
      <span>
        {isExpired ? 'Hold Expired' : `Locked: ${formattedTime}`}
      </span>
    </div>
  );
}
