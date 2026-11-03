'use client';

import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

export interface InterviewTimerProps {
  initialSeconds?: number;
  timeLimitSeconds?: number;
  onTimeChange?: (seconds: number) => void;
  autoStart?: boolean;
}

export const InterviewTimer: React.FC<InterviewTimerProps> = ({
  initialSeconds = 0,
  timeLimitSeconds = 120,
  onTimeChange,
  autoStart = false,
}) => {
  const [seconds, setSeconds] = useState<number>(initialSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(autoStart);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          onTimeChange?.(next);
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, onTimeChange]);

  const isOvertime = timeLimitSeconds > 0 && seconds > timeLimitSeconds;

  return (
    <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-1.5">
        <Timer className={`w-4 h-4 ${isOvertime ? 'text-rose-500 animate-pulse' : 'text-blue-500'}`} />
        <span
          className={`font-mono text-sm font-bold ${
            isOvertime ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'
          }`}
        >
          {formatDuration(seconds)}
        </span>
        {timeLimitSeconds > 0 && (
          <span className="text-[11px] text-slate-400">/ {formatDuration(timeLimitSeconds)}</span>
        )}
      </div>

      <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setIsRunning(!isRunning)}
          className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title={isRunning ? 'Pause Timer' : 'Start Timer'}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsRunning(false);
            setSeconds(0);
            onTimeChange?.(0);
          }}
          className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Reset Timer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
