'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/feedback/ToastProvider';
import { Award, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export interface ScoreCandidateData {
  id: number;
  name: string;
  code?: string;
  department?: string;
  job_role?: string;
  hr_score?: string | null;
  tech_score?: string | null;
  practical_score?: string | null;
  overall_score?: string | null;
}

interface ScoreMarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: ScoreCandidateData | null;
  initialRound?: 'hr' | 'department' | 'final';
  onSuccess: () => void;
}

export const ScoreMarksModal: React.FC<ScoreMarksModalProps> = ({
  isOpen,
  onClose,
  candidate,
  initialRound = 'hr',
  onSuccess,
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedRound, setSelectedRound] = useState<'hr' | 'department' | 'final'>(initialRound);
  const [score, setScore] = useState<string>('8.0');
  const [maxScore, setMaxScore] = useState<string>('10');
  const [recommendation, setRecommendation] = useState<'recommended' | 'hold' | 'rejected'>('recommended');
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialRound) {
      setSelectedRound(initialRound);
    }
  }, [initialRound, isOpen]);

  useEffect(() => {
    if (candidate) {
      if (selectedRound === 'hr') {
        setScore(candidate.hr_score || '8.0');
        setRemarks(candidate.hr_score ? 'HR Round evaluation updated.' : 'Candidate demonstrated good communication and organizational fit.');
      } else if (selectedRound === 'department') {
        setScore(candidate.tech_score || '7.5');
        setRemarks(candidate.tech_score ? 'Technical assessment evaluation updated.' : 'Technical competence verified in core domain and problem solving.');
      } else {
        setScore(candidate.practical_score || '8.0');
        setRemarks(candidate.practical_score ? 'Practical assessment evaluation updated.' : 'Hands-on practical test and scenario execution completed.');
      }
    }
  }, [candidate, selectedRound]);

  if (!candidate) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numScore = parseFloat(score);
    const numMax = parseFloat(maxScore) || 10;

    if (isNaN(numScore) || numScore < 0 || numScore > numMax) {
      showToast(`Please enter a valid score between 0 and ${numMax}.`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_score',
          candidate_id: candidate.id,
          round: selectedRound,
          score: numScore,
          max_score: numMax,
          recommendation,
          interviewer_summary: remarks || `${selectedRound.toUpperCase()} round score recorded: ${numScore}/${numMax}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record interview score');
      }

      const roundTitle = selectedRound === 'hr' ? 'HR Round' : selectedRound === 'department' ? 'Technical Round' : 'Practical Round';
      if (recommendation === 'rejected') {
        showToast(
          `${candidate.name} has been marked as REJECTED in ${roundTitle}. Moving to Candidates Rejected section...`,
          'info'
        );
        onSuccess();
        onClose();
        router.push('/hr/candidates?tab=rejected');
        return;
      }

      showToast(
        `${roundTitle} score of ${numScore}/${numMax} recorded for ${candidate.name}! Evaluation updated.`,
        'success'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Error recording marks', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record / Edit Interview Round Marks"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Candidate Summary Card */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                {candidate.code || `CAN-${String(candidate.id).padStart(4, '0')}`}
              </span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {candidate.name}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {candidate.department || 'General'} • {candidate.job_role || 'Applicant'}
              </p>
            </div>
            {candidate.overall_score && candidate.overall_score !== '—' && (
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Overall</span>
                <div className="text-base font-black text-blue-600 dark:text-blue-400">
                  {candidate.overall_score}/10
                </div>
              </div>
            )}
          </div>

          {/* Current 3-Round Status Pills */}
          <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className={`p-1.5 rounded-lg border ${candidate.hr_score ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}>
              <div className="font-semibold">HR Round</div>
              <div className="font-bold text-[11px]">{candidate.hr_score ? `${candidate.hr_score}/10` : 'Pending'}</div>
            </div>
            <div className={`p-1.5 rounded-lg border ${candidate.tech_score ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}>
              <div className="font-semibold">Technical</div>
              <div className="font-bold text-[11px]">{candidate.tech_score ? `${candidate.tech_score}/10` : 'Pending'}</div>
            </div>
            <div className={`p-1.5 rounded-lg border ${candidate.practical_score ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}>
              <div className="font-semibold">Practical</div>
              <div className="font-bold text-[11px]">{candidate.practical_score ? `${candidate.practical_score}/10` : 'Pending'}</div>
            </div>
          </div>
        </div>

        {/* Round Selection Tabs */}
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Select Round to Evaluate / Score <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'hr', label: 'HR Round', desc: 'Round 1' },
              { id: 'department', label: 'Technical', desc: 'Round 2' },
              { id: 'final', label: 'Practical', desc: 'Round 3' },
            ].map((tab) => {
              const isSelected = selectedRound === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedRound(tab.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 border-blue-400 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-700 shadow-2xs ring-2 ring-blue-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="text-[10px] font-medium opacity-70">{tab.desc}</div>
                  <div className="font-bold text-xs">{tab.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Score & Max Score Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Score Obtained <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max={maxScore}
              required
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="e.g. 8.5"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Maximum Score
            </label>
            <input
              type="number"
              step="1"
              min="1"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Recommendation Radios */}
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Round Recommendation <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'recommended', label: 'Pass / Next Round', color: 'emerald' },
              { id: 'hold', label: 'On Hold', color: 'amber' },
              { id: 'rejected', label: 'Reject', color: 'rose' },
            ].map((opt) => {
              const isSelected = recommendation === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRecommendation(opt.id as any)}
                  className={`py-2 px-2.5 rounded-lg border text-center font-bold text-xs transition-all ${
                    isSelected
                      ? opt.id === 'recommended'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : opt.id === 'hold'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Remarks / Feedback */}
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            Interviewer Remarks & Assessment Notes
          </label>
          <textarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add detailed feedback on candidate performance, knowledge, communication, etc."
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={submitting}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Save & Update Evaluation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
