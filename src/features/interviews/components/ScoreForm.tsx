'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

export interface ScoreFormProps {
  score: number | null | undefined;
  maxScore?: number;
  onScoreChange: (score: number) => void;
  label?: string;
  disabled?: boolean;
}

export const ScoreForm: React.FC<ScoreFormProps> = ({
  score,
  maxScore = 10,
  onScoreChange,
  label,
  disabled = false,
}) => {
  const isEvaluated = score !== null && score !== undefined;
  const displayLabel = label || `Interviewer Score (0 to ${maxScore})`;

  const getScoreRatingText = (val: number | null | undefined) => {
    if (val === null || val === undefined) return `Select score 0 to ${maxScore}`;
    if (val === 0) return `0/${maxScore} — Inadequate / Incorrect`;
    if (val === maxScore) return `${val}/${maxScore} — Full Marks / Exceptional`;
    return `${val}/${maxScore} — Partial Credit`;
  };

  const getScoreColor = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'text-slate-400';
    if (val === 0) return 'text-rose-600 dark:text-rose-400 font-bold';
    if (val <= 3) return 'text-rose-500 dark:text-rose-400';
    if (val <= 6) return 'text-amber-600 dark:text-amber-400';
    if (val <= 8) return 'text-blue-600 dark:text-blue-400';
    return 'text-emerald-600 dark:text-emerald-400 font-bold';
  };

  const scores = [0, ...Array.from({ length: maxScore }, (_, i) => i + 1)];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {displayLabel}
        </label>
        <span className={cn('text-xs font-bold', getScoreColor(score))}>
          {getScoreRatingText(score)}
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {scores.map((num) => {
          const isSelected = isEvaluated && score === num;
          return (
            <button
              key={num}
              type="button"
              disabled={disabled}
              onClick={() => onScoreChange(num)}
              className={cn(
                'w-9 h-9 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center border',
                isSelected
                  ? num === 0
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-500/30 scale-105'
                    : 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/30 scale-105'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300'
              )}
            >
              {num}
            </button>
          );
        })}
      </div>
    </div>
  );
};
