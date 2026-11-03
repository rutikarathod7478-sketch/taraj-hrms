'use client';

import React from 'react';
import { Question } from '@/types/question';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, HelpCircle, CheckCircle2 } from 'lucide-react';

export interface QuestionPanelProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  sectionName?: string;
  sectionNumber?: 'A' | 'B';
  answerText?: string;
  onAnswerTextChange?: (val: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onSaveProgress?: () => void;
  isSaving?: boolean;
  isAnswered?: boolean;
}

export const QuestionPanel: React.FC<QuestionPanelProps> = ({
  question,
  currentIndex,
  totalQuestions,
  sectionName,
  sectionNumber,
  answerText = '',
  onAnswerTextChange,
  onPrev,
  onNext,
  onSaveProgress,
  isSaving = false,
  isAnswered = false,
}) => {
  // Determine section if not passed
  const activeSectionNumber = sectionNumber || (currentIndex < 5 ? 'A' : 'B');
  const activeSectionName =
    sectionName ||
    (activeSectionNumber === 'A' ? 'Section A: HR Questions' : 'Section B: Scenario-Based Questions');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
      {/* Top Question Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Section Indicator Badge */}
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${
              activeSectionNumber === 'A'
                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
            }`}
          >
            {activeSectionName}
          </span>

          <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isAnswered && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5" /> Scored
            </span>
          )}
          <span className="text-xs text-slate-400 font-medium">Max Score: {question.max_score || 10} pts</span>
        </div>
      </div>

      {/* Question Text */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
          {question.question_text}
        </h3>

        {/* Expected Guidelines for Interviewer */}
        {question.expected_answer_guidance && (
          <div className="mt-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
              Interviewer Evaluation Guidance & Rubric:
            </p>
            <p className="leading-relaxed pl-5">{question.expected_answer_guidance}</p>
          </div>
        )}
      </div>

      {/* Candidate Live Verbal Answer / Transcript Notes */}
      {onAnswerTextChange && (
        <div className="pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            Candidate Answer / Transcript Notes
          </label>
          <textarea
            rows={3}
            value={answerText}
            onChange={(e) => onAnswerTextChange(e.target.value)}
            placeholder="Document candidate's key statements, reasoning, examples, or transcript..."
            className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 leading-relaxed resize-y"
          />
        </div>
      )}

      {/* Navigation and Save Progress Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentIndex <= 0}
          onClick={onPrev}
          icon={<ChevronLeft className="w-4 h-4" />}
        >
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {onSaveProgress && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              isLoading={isSaving}
              onClick={onSaveProgress}
            >
              Save Progress
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentIndex >= totalQuestions - 1}
            onClick={onNext}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
