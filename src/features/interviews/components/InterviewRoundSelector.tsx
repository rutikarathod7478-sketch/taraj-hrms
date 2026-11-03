'use client';

import React from 'react';
import { InterviewRoundType } from '@/types/question';
import { INTERVIEW_ROUNDS } from '@/config/interview-rounds';
import { cn } from '@/lib/utils';
import { UserCheck, Briefcase, Award } from 'lucide-react';

export interface InterviewRoundSelectorProps {
  currentRound: InterviewRoundType;
  onSelectRound: (round: InterviewRoundType) => void;
  completedRounds?: Record<InterviewRoundType, boolean>;
}

export const InterviewRoundSelector: React.FC<InterviewRoundSelectorProps> = ({
  currentRound,
  onSelectRound,
  completedRounds = { hr: false, department: false, final: false },
}) => {
  const roundIcons = {
    hr: UserCheck,
    department: Briefcase,
    final: Award,
  };

  const rounds: InterviewRoundType[] = ['hr', 'department', 'final'];

  return (
    <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl flex flex-wrap gap-1.5 border border-slate-200 dark:border-slate-700/80 mb-6">
      {rounds.map((key) => {
        const config = INTERVIEW_ROUNDS[key];
        const Icon = roundIcons[key];
        const isCurrent = currentRound === key;
        const isCompleted = completedRounds[key];

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelectRound(key)}
            className={cn(
              'flex-1 min-w-[200px] flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
              isCurrent
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
            )}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                  isCurrent
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-bold">{config.shortName}</p>
                <p className="text-[10px] text-slate-400 font-normal">Weight: {config.weightPercentage}%</p>
              </div>
            </div>

            {isCompleted && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                Completed
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
