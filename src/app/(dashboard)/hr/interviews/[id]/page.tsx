'use client';

import React, { use, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { InterviewWorkspace } from '@/features/interviews/components/InterviewWorkspace';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/feedback/ToastProvider';
import { ArrowLeft, Award, Sparkles } from 'lucide-react';
import { InterviewRoundType } from '@/types/question';

function InterviewWorkspaceContent({ interviewId }: { interviewId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRound = (searchParams.get('round') || '').toLowerCase();
  const requestedRound: InterviewRoundType =
    rawRound === 'tech' || rawRound === 'technical' || rawRound === 'department'
      ? 'department'
      : rawRound === 'practical' || rawRound === 'final'
      ? 'final'
      : 'hr';
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<any>(null);
  const [initialRound, setInitialRound] = useState<InterviewRoundType>(requestedRound);

  useEffect(() => {
    async function loadInterviewSession() {
      setLoading(true);
      try {
        // 1. Try to load candidate directly using the ID (as /hr/candidates links with candidate ID)
        let foundCandidate = null;
        try {
          const candRes = await fetch(`/api/candidates/${interviewId}`);
          if (candRes.ok) {
            const candJson = await candRes.json();
            if (candJson.data) {
              foundCandidate = candJson.data;
            }
          }
        } catch {
          // ignore error and try interview endpoint
        }

        let targetCand = foundCandidate;
        let mappedRound: InterviewRoundType = requestedRound;

        if (!targetCand) {
          // 2. Fallback to load via interview session endpoint
          const res = await fetch(`/api/interviews/${interviewId}`);
          const data = await res.json();

          if (!res.ok || !data.data) {
            throw new Error(data.message || 'Interview session not found');
          }

          const iv = data.data.interview;
          if (!rawRound && iv?.round_type) {
            if (iv.round_type === 'dept_round' || iv.round_type === 'department') {
              mappedRound = 'department';
            } else if (iv.round_type === 'final_round' || iv.round_type === 'final') {
              mappedRound = 'final';
            }
          }

          const candidateId = iv?.candidate_id || data.data.candidate_id;
          if (candidateId) {
            const candRes2 = await fetch(`/api/candidates/${candidateId}`);
            const candData2 = await candRes2.json();
            if (candRes2.ok && candData2.data) {
              targetCand = candData2.data;
            }
          }
        }

        if (targetCand) {
          setCandidate(targetCand);

          // Enforce strict sequential round flow
          const isHrDone = Boolean(
            targetCand.hr_done ||
            (targetCand.round_1_score !== null && targetCand.round_1_score !== undefined && targetCand.round_1_score !== '') ||
            targetCand.round_1_interview_status === 'completed'
          );
          const isTechDone = Boolean(
            isHrDone && (
              targetCand.tech_done ||
              (targetCand.round_2_score !== null && targetCand.round_2_score !== undefined && targetCand.round_2_score !== '') ||
              targetCand.round_2_interview_status === 'completed'
            )
          );

          if (mappedRound === 'final') {
            if (!isHrDone) {
              showToast('Candidate must complete HR Round first before Practical Round.', 'warning');
              mappedRound = 'hr';
            } else if (!isTechDone) {
              showToast('Candidate must complete Technical Round first before Practical Round.', 'warning');
              mappedRound = 'department';
            }
          } else if (mappedRound === 'department') {
            if (!isHrDone) {
              showToast('Candidate must complete HR Round first before Technical Round.', 'warning');
              mappedRound = 'hr';
            }
          }

          setInitialRound(mappedRound);
        } else {
          throw new Error('Failed to load candidate information');
        }
      } catch (err: any) {
        showToast(err.message || 'Error loading interview workspace', 'error');
      } finally {
        setLoading(false);
      }
    }

    loadInterviewSession();
  }, [interviewId, requestedRound, showToast]);

  const handleRoundComplete = () => {
    showToast('Interview round recorded successfully!', 'success');
    if (requestedRound === 'final' || initialRound === 'final') {
      router.push('/hr/decisions');
    } else {
      router.push('/hr/candidates');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/hr/candidates"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Candidate Directory
        </Link>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-medium">Loading interview workspace and rubric questions...</p>
        </div>
      ) : !candidate ? (
        <div className="p-16 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Candidate record could not be found.</p>
          <Link href="/hr/candidates" className="mt-3 inline-block text-xs font-semibold text-blue-600 hover:underline">
            Return to Candidates
          </Link>
        </div>
      ) : (
        <InterviewWorkspace
          candidate={candidate}
          initialRound={initialRound}
          onRoundComplete={handleRoundComplete}
        />
      )}
    </div>
  );
}

export default function InterviewWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const interviewId = resolvedParams.id;

  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">Initializing interview session...</p>
        </div>
      }
    >
      <InterviewWorkspaceContent interviewId={interviewId} />
    </Suspense>
  );
}
