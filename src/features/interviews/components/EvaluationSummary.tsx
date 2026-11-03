'use client';

import React from 'react';
import { Candidate } from '@/types/candidate';
import { CandidateEvaluation, HiringDecision } from '@/types/evaluation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Award, CheckCircle, XCircle, Clock, Sparkles } from 'lucide-react';

export interface EvaluationSummaryProps {
  candidate: Candidate;
  evaluation?: CandidateEvaluation | null;
  decision?: HiringDecision | null;
  onMakeDecision?: (decision: 'selected' | 'rejected' | 'on_hold') => void;
  isLoading?: boolean;
}

export const EvaluationSummary: React.FC<EvaluationSummaryProps> = ({
  candidate,
  evaluation,
  decision,
  onMakeDecision,
  isLoading = false,
}) => {
  const percentage = evaluation?.overall_percentage ?? candidate.overall_percentage ?? 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Consolidated 3-Round Evaluation Summary
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Recruitment evaluation index and hiring decision for {candidate.full_name}
          </p>
        </div>

        {decision && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Current Decision:</span>
            <Badge status={decision.decision === 'selected' ? 'offered' : decision.decision} />
          </div>
        )}
      </div>

      {/* 3 Rounds Score Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Round 1 */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-center">
          <p className="text-xs font-semibold text-slate-500">Round 1: Common HR</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {candidate.round_1_score !== null && candidate.round_1_score !== undefined
              ? `${candidate.round_1_score}/100`
              : '—'}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Weight: 25%</p>
        </div>

        {/* Round 2 */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-center">
          <p className="text-xs font-semibold text-slate-500">Round 2: Dept Technical</p>
          <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
            {candidate.round_2_score !== null && candidate.round_2_score !== undefined
              ? `${candidate.round_2_score}/10`
              : '—'}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Weight: 45%</p>
        </div>

        {/* Round 3 */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-center">
          <p className="text-xs font-semibold text-slate-500">Round 3: Final Screening</p>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {candidate.round_3_score !== null && candidate.round_3_score !== undefined
              ? `${candidate.round_3_score}/10`
              : '—'}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Weight: 30%</p>
        </div>
      </div>

      {/* Aggregate Score Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">
            Overall Candidate Score
          </p>
          <div className="text-4xl font-black mt-1">{percentage}%</div>
          <p className="text-xs text-blue-100/90 mt-1">
            {Number(percentage) >= 70
              ? 'Meets hiring threshold for Taraj Global Solutions'
              : 'Below target benchmark (70% minimum threshold)'}
          </p>
        </div>

        <div className="text-right sm:border-l sm:border-white/20 sm:pl-6">
          <p className="text-xs text-blue-100">Status</p>
          <p className="text-lg font-bold capitalize mt-0.5">
            {candidate.application_status.replace('_', ' ')}
          </p>
        </div>
      </div>

      {/* Decision Buttons */}
      {onMakeDecision && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
            Hiring Committee Decision
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="success"
              size="sm"
              isLoading={isLoading}
              icon={<CheckCircle className="w-4 h-4" />}
              onClick={() => onMakeDecision('selected')}
            >
              Approve & Offer
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isLoading}
              icon={<Clock className="w-4 h-4" />}
              onClick={() => onMakeDecision('on_hold')}
            >
              Put On Hold
            </Button>

            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isLoading}
              icon={<XCircle className="w-4 h-4" />}
              onClick={() => onMakeDecision('rejected')}
            >
              Reject Candidate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
