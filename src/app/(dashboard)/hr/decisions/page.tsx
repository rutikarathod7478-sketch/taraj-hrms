'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Award,
  Users,
  Mic,
  Volume2,
  ExternalLink,
  Calendar,
  UserCheck,
  FileText,
  Mail,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/feedback/ToastProvider';
import { ScoreMarksModal, ScoreCandidateData } from '@/components/interview/ScoreMarksModal';
import { formatDate, formatDuration } from '@/lib/utils';

type ResultsTab =
  | 'all'
  | 'hr_round'
  | 'technical_round'
  | 'practical_round';

interface EvaluationItem {
  id: number;
  code: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  job_role: string;
  hr_done: boolean;
  tech_done: boolean;
  practical_done: boolean;
  completed_rounds_count?: number;
  incomplete_rounds_count?: number;
  completed_rounds?: string[];
  hr_score: string | null;
  tech_score: string | null;
  practical_score: string | null;
  overall_score: string;
  overall_percentage: string | null;
  remaining_rounds?: string[];
  result: 'Hire' | 'Hold' | 'Reject' | 'Pending' | '—';
  hiring_decision?: string | null;
  application_status: string;
}

export default function InterviewResultsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ResultsTab>('all');

  // Decision Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<EvaluationItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [decisionAction, setDecisionAction] = useState<'hire' | 'reject' | 'hold'>('hire');
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  // Score Modal State
  const [scoringCandidate, setScoringCandidate] = useState<ScoreCandidateData | null>(null);
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [scoringRound, setScoringRound] = useState<'hr' | 'department' | 'final'>('hr');
  const [sendingMailId, setSendingMailId] = useState<number | null>(null);

  // Interview Recordings Modal State
  const [recordingsCandidate, setRecordingsCandidate] = useState<EvaluationItem | null>(null);
  const [recordingsModalOpen, setRecordingsModalOpen] = useState(false);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [recordingsData, setRecordingsData] = useState<{
    candidate: any;
    interviews: any[];
    rounds: {
      round_type: string;
      round_title: string;
      interview: any;
      answers: any[];
      recordings: any[];
    }[];
  } | null>(null);
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<'all' | 'hr' | 'department' | 'final'>('all');

  // Open Recordings Modal
  const openRecordingsModal = async (item: EvaluationItem) => {
    setRecordingsCandidate(item);
    setRecordingsModalOpen(true);
    setRecordingsLoading(true);
    setSelectedRoundFilter('all');
    try {
      const res = await fetch(`/api/interviews/recordings?candidate_id=${item.id}`);
      const data = await res.json();
      if (res.ok && data.data) {
        setRecordingsData(data.data);
      } else {
        setRecordingsData(null);
      }
    } catch {
      setRecordingsData(null);
    } finally {
      setRecordingsLoading(false);
    }
  };

  // Fetch Evaluations
  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/interviews/evaluations');
      const data = await res.json();
      if (res.ok && data.data) {
        setEvaluations(data.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load evaluation results', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  // Filtered evaluations based on active tab - In 'all' shows all candidates matching /hr/candidates
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((item) => {
      if (activeTab === 'hr_round') return item.hr_done;
      if (activeTab === 'technical_round') return item.tech_done;
      if (activeTab === 'practical_round') return item.practical_done;
      return true; // Show all candidates
    });
  }, [evaluations, activeTab]);

  // Open Decision Modal
  const openDecisionModal = (item: EvaluationItem) => {
    setSelectedCandidate(item);
    setDecisionAction(
      item.result === 'Reject'
        ? 'reject'
        : item.result === 'Hold'
        ? 'hold'
        : 'hire'
    );
    setRemarks(`Hiring evaluation decision for ${item.name}. Overall Score: ${item.overall_score}/10.`);
    setModalOpen(true);
  };

  // Open Score Marks Modal
  const openScoreModal = (item: EvaluationItem, roundToScore?: 'hr' | 'department' | 'final') => {
    let targetRound: 'hr' | 'department' | 'final' = roundToScore || 'hr';
    if (!roundToScore) {
      if (!item.hr_done) {
        targetRound = 'hr';
      } else if (!item.tech_done) {
        targetRound = 'department';
      } else {
        targetRound = 'final';
      }
    }

    setScoringRound(targetRound);
    setScoringCandidate({
      id: item.id,
      name: item.name,
      code: item.code,
      department: item.department,
      job_role: item.job_role,
      hr_score: item.hr_score,
      tech_score: item.tech_score,
      practical_score: item.practical_score,
      overall_score: item.overall_score,
    });
    setScoreModalOpen(true);
  };

  // Submit Hiring Decision
  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    setProcessing(true);
    try {
      let targetStatus = 'offered';
      let apiDecision: 'selected' | 'rejected' | 'on_hold' = 'selected';
      if (decisionAction === 'reject') {
        targetStatus = 'rejected';
        apiDecision = 'rejected';
      }
      if (decisionAction === 'hold') {
        targetStatus = 'on_hold';
        apiDecision = 'on_hold';
      }

      // Record formal decision in hiring_decisions & draft joining_records (and send email if hire/reject)
      const ivRes = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'decision',
          candidate_id: selectedCandidate.id,
          decision: apiDecision,
          decision_notes: remarks,
        }),
      });
      const ivData = await ivRes.json();

      const res = await fetch(`/api/candidates/${selectedCandidate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          notes: remarks,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setModalOpen(false);
        const label = decisionAction === 'hire' ? 'Hire / Offer' : decisionAction === 'hold' ? 'Hold' : 'Reject';
        let emailNote = '';
        if (decisionAction === 'hire') {
          emailNote = ivData?.email_sent
            ? ' Selection email sent to candidate.'
            : ' Selection recorded (email logged).';
        } else if (decisionAction === 'reject') {
          emailNote = ivData?.email_sent
            ? ' Rejection email sent to candidate.'
            : ' Rejection recorded (email logged).';
        } else {
          emailNote = ' (No email sent)';
        }
        showToast(
          `Decision for ${selectedCandidate.name} recorded as ${label}!${emailNote}`,
          'success'
        );
        await fetchEvaluations();
      } else {
        throw new Error(data.message || 'Failed to record decision');
      }
    } catch (err: any) {
      showToast(err.message || 'Error processing decision', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Dispatch 3-Rounds Marks Email via SMTP to Candidate
  const handleSendMarksEmail = async (candidate: EvaluationItem) => {
    setSendingMailId(candidate.id);
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_marks_email',
          candidate_id: candidate.id,
          force: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          `3-Rounds marks email sent to ${candidate.email}!`,
          'success'
        );
      } else {
        throw new Error(data.error || 'Failed to dispatch marks email');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to send marks email', 'error');
    } finally {
      setSendingMailId(null);
    }
  };

  const tabs: { id: ResultsTab; label: string; count: number }[] = [
    { id: 'all', label: 'All Results', count: evaluations.length },
    { id: 'hr_round', label: 'HR Round', count: evaluations.filter((e) => e.hr_done).length },
    { id: 'technical_round', label: 'Technical Round', count: evaluations.filter((e) => e.tech_done).length },
    { id: 'practical_round', label: 'Practical Round', count: evaluations.filter((e) => e.practical_done).length },
  ];

  return (
    <div className="space-y-5">
      {/* 1. Header Bar: Title and Subtitle underneath */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Interview Results & Final Evaluation
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Consolidated scores across HR, Technical, and Practical interview rounds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/hr/candidates"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Go to Candidates Directory</span>
          </Link>
        </div>
      </div>

      {/* 2. Horizontal Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-6 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ResultsTab)}
                className={`pb-3 text-xs font-semibold transition-colors relative whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className="ml-1 opacity-80">({tab.count})</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 dark:bg-blue-500 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Results Data Table */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 pl-4 pr-1 font-bold w-56">Candidate</th>
                <th className="py-3.5 pl-1 pr-4 font-bold">Department & Role</th>
                <th className="py-3.5 px-4 font-bold">Round Scores</th>
                <th className="py-3.5 px-4 font-bold">All Rounds</th>
                <th className="py-3.5 px-4 font-bold text-center">Overall</th>
                <th className="py-3.5 px-4 font-bold text-center">Result</th>
                <th className="py-3.5 px-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Loading candidate evaluation results...</p>
                  </td>
                </tr>
              ) : filteredEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No interview evaluation records found.
                  </td>
                </tr>
              ) : (
                filteredEvaluations.map((item) => {
                  const completedCount = item.completed_rounds_count ?? ((item.hr_done ? 1 : 0) + (item.tech_done ? 1 : 0) + (item.practical_done ? 1 : 0));
                  const incompleteCount = item.incomplete_rounds_count ?? (3 - completedCount);
                  const allDone = completedCount === 3;
                  const remainingRounds = item.remaining_rounds || [];

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Name with Code & Email below */}
                      <td className="py-4 pl-4 pr-1 whitespace-nowrap w-56">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                            {item.code}
                          </span>
                          <Link
                            href={`/hr/candidates/${item.id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-xs mt-0.5"
                          >
                            {item.name}
                          </Link>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                            {item.email}
                          </span>
                        </div>
                      </td>

                      {/* Department & Role */}
                      <td className="py-4 pl-1 pr-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-slate-800 dark:text-slate-200 font-bold">
                            {item.department}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.job_role}
                          </span>
                        </div>
                      </td>

                      {/* Score (Per round score + overall) */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 dark:text-slate-500 w-14">HR:</span>
                            <span className={`font-semibold ${item.hr_score ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                              {item.hr_score ? `${item.hr_score}/10` : '—'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 dark:text-slate-500 w-14">Tech:</span>
                            <span className={`font-semibold ${item.tech_score ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                              {item.tech_score ? `${item.tech_score}/10` : '—'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 dark:text-slate-500 w-14">Practical:</span>
                            <span className={`font-semibold ${item.practical_score ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                              {item.practical_score ? `${item.practical_score}/10` : '—'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Incomplete / Remaining Rounds */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {allDone ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> All Done
                          </span>
                        ) : (
                          /* Vertical one-by-one rounds for candidates with pending rounds */
                          <div className="flex flex-col gap-1 text-[11px]">
                            {/* HR */}
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 w-fit ${
                                item.hr_done
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                              }`}
                              title={item.hr_done ? 'HR Round: Completed' : 'HR Round: Incomplete'}
                            >
                              {item.hr_done ? (
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <XCircle className="w-2.5 h-2.5 text-rose-500 dark:text-rose-400" />
                              )}
                              HR
                            </span>

                            {/* Tech */}
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 w-fit ${
                                item.tech_done
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                              }`}
                              title={item.tech_done ? 'Technical Round: Completed' : 'Technical Round: Incomplete'}
                            >
                              {item.tech_done ? (
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <XCircle className="w-2.5 h-2.5 text-rose-500 dark:text-rose-400" />
                              )}
                              Tech
                            </span>

                            {/* Pract */}
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 w-fit ${
                                item.practical_done
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                              }`}
                              title={item.practical_done ? 'Practical Round: Completed' : 'Practical Round: Incomplete'}
                            >
                              {item.practical_done ? (
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <XCircle className="w-2.5 h-2.5 text-rose-500 dark:text-rose-400" />
                              )}
                              Pract
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Overall Score */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {item.overall_score && item.overall_score !== '—' ? (
                          <div className="flex flex-col items-center">
                            <span className="font-black text-sm text-slate-900 dark:text-white">
                              {item.overall_score}/10
                            </span>
                            {item.overall_percentage && (
                              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                                {Number(item.overall_percentage).toFixed(0)}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">—</span>
                        )}
                      </td>

                      {/* Result */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {item.result === '—' ? (
                          <span className="text-slate-400 font-medium">—</span>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                              item.result === 'Hire'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                                : item.result === 'Reject'
                                ? 'bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60'
                                : item.result === 'Hold'
                                ? 'bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            }`}
                          >
                            {item.result}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {allDone ? (
                            <>
                              {/* 1. View Interview Rounds & Recordings */}
                              <button
                                type="button"
                                onClick={() => openRecordingsModal(item)}
                                className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
                                title="View Interview Rounds & Recordings"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* 2. Record Final Hiring Decision */}
                              <button
                                type="button"
                                onClick={() => openDecisionModal(item)}
                                className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
                                title="Record Final Hiring Decision (Hire / Hold / Reject)"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              {/* 1. Quick Record / Edit Marks Modal */}
                              <button
                                type="button"
                                onClick={() => openScoreModal(item)}
                                className="p-1.5 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors cursor-pointer"
                                title="Record / Edit Interview Marks"
                              >
                                <Award className="w-4 h-4" />
                              </button>

                              {/* 2. View Interview Rounds & Recordings */}
                              <button
                                type="button"
                                onClick={() => openRecordingsModal(item)}
                                className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
                                title="View Interview Rounds & Recordings"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* 3. Send 3-Rounds Marks Email (When all 3 rounds are completed) */}
                              {item.practical_done && (
                                <button
                                  type="button"
                                  onClick={() => handleSendMarksEmail(item)}
                                  disabled={sendingMailId === item.id}
                                  className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                                  title="Send 3-Rounds Marks Email to Candidate (SMTP)"
                                >
                                  {sendingMailId === item.id ? (
                                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Mail className="w-4 h-4" />
                                  )}
                                </button>
                              )}

                              {/* 4. Record Decision */}
                              <button
                                type="button"
                                onClick={() => openDecisionModal(item)}
                                className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
                                title="Record Final Hiring Decision (Hire / Hold / Reject)"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Decision & Evaluation Remarks Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Evaluation Decision: ${selectedCandidate?.name}`}
      >
        <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400">Candidate Code:</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedCandidate?.code}</p>
              </div>
              <div>
                <span className="text-slate-400">Department:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedCandidate?.department}</p>
              </div>
              <div>
                <span className="text-slate-400">Job Role:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedCandidate?.job_role}</p>
              </div>
              <div>
                <span className="text-slate-400">Overall Score:</span>
                <p className="font-black text-blue-600 dark:text-blue-400">{selectedCandidate?.overall_score}/10</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Hiring Decision <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDecisionAction('hire')}
                className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                  decisionAction === 'hire'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Hire / Offer
              </button>
              <button
                type="button"
                onClick={() => setDecisionAction('hold')}
                className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                  decisionAction === 'hold'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Hold
              </button>
              <button
                type="button"
                onClick={() => setDecisionAction('reject')}
                className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                  decisionAction === 'reject'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Reject
              </button>
            </div>
            {decisionAction === 'hire' && (
              <p className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                Official Selection notification email will be sent automatically to the candidate via SMTP.
              </p>
            )}
            {decisionAction === 'reject' && (
              <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                Official Rejection notification email with feedback will be sent automatically to the candidate via SMTP.
              </p>
            )}
            {decisionAction === 'hold' && (
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <span>Candidate will be placed on hold. No email notification will be dispatched.</span>
              </p>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Decision Justification & Remarks
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide comments regarding hiring rationale, salary offer, team placement..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {processing ? 'Recording...' : 'Confirm Decision'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. Direct Score Marks Modal */}
      <ScoreMarksModal
        isOpen={scoreModalOpen}
        onClose={() => setScoreModalOpen(false)}
        candidate={scoringCandidate}
        initialRound={scoringRound}
        onSuccess={fetchEvaluations}
      />

      {/* 6. Candidate Interview Recordings & Rounds Modal */}
      <Modal
        isOpen={recordingsModalOpen}
        onClose={() => setRecordingsModalOpen(false)}
        title={`Candidate Profile & Interview Rounds: ${recordingsCandidate?.name || ''}`}
        maxWidth="4xl"
      >
        {recordingsLoading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="inline-block w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs">Loading candidate profile and interview round evaluations...</p>
          </div>
        ) : recordingsCandidate ? (
          (() => {
            const cand = recordingsData?.candidate || {};

            return (
              <div className="space-y-4 text-xs">
                {/* 1. Candidate Complete Information Panel */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  {/* Top Bar: Name, Code, Overall Score & Result */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-700/70">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                          {cand.candidate_code || recordingsCandidate.code}
                        </span>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                          {cand.full_name || recordingsCandidate.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {cand.department_name || recordingsCandidate.department} • {cand.position_title || recordingsCandidate.job_role}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Overall Evaluation</span>
                        <p className="font-black text-base text-slate-900 dark:text-white leading-tight">
                          {recordingsCandidate.overall_score}/10
                          {recordingsCandidate.overall_percentage && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold ml-1.5">
                              ({Number(recordingsCandidate.overall_percentage).toFixed(0)}%)
                            </span>
                          )}
                        </p>
                      </div>
                      {recordingsCandidate.result === '—' ? (
                        <span className="text-slate-400 font-medium text-sm">—</span>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                            recordingsCandidate.result === 'Hire'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : recordingsCandidate.result === 'Reject'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                              : recordingsCandidate.result === 'Hold'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}
                        >
                          {recordingsCandidate.result}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Complete Information Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Email Address</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={cand.email || recordingsCandidate.email}>
                        {cand.email || recordingsCandidate.email}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Phone Number</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {cand.phone || recordingsCandidate.phone || '—'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Candidate Type</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {cand.candidate_type || '—'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Total Experience</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {cand.experience_years > 0 ? `${cand.experience_years} Years` : cand.candidate_type === 'Fresher' ? 'Fresher' : '—'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Highest Qualification</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={cand.qualification || '—'}>
                        {cand.qualification || '—'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">College / Institution</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={cand.college_or_institution || '—'}>
                        {cand.college_or_institution || '—'}
                      </p>
                    </div>

                    {cand.candidate_type === 'Experienced' && (
                      <>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Current Employer</span>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={cand.current_employer || '—'}>
                            {cand.current_employer || '—'}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Notice Period</span>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {cand.notice_period ? `${cand.notice_period} Days` : '—'}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Current / Expected CTC</span>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {cand.current_ctc || '—'} / {cand.expected_ctc || '—'}
                          </p>
                        </div>
                      </>
                    )}

                    {cand.date_of_birth && (
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Date of Birth</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatDate(cand.date_of_birth)}
                        </p>
                      </div>
                    )}

                    {cand.graduation_year && (
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Graduation Year</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {cand.graduation_year}
                        </p>
                      </div>
                    )}

                    {cand.address && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 block font-medium">Location / Address</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={cand.address}>
                          {cand.address}
                        </p>
                      </div>
                    )}

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Application Status</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                        {cand.application_status || recordingsCandidate.application_status}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Applied Date</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {cand.registered_at ? formatDate(cand.registered_at) : cand.created_at ? formatDate(cand.created_at) : '—'}
                      </p>
                    </div>

                    {cand.resume_file_path && (
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">CV / Resume</span>
                        <a
                          href={cand.resume_file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline mt-0.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Resume</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. All Rounds Section — Only Marks and Audio Recordings (NO QUESTIONS) */}
                <div className="space-y-3 max-h-[48vh] overflow-y-auto pr-1">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-blue-500" />
                      All Interview Rounds — Marks & Recordings
                    </h4>
                  </div>

                  {recordingsData?.rounds?.map((rnd: any) => {
                    const iv = rnd.interview;
                    const isCompleted = Boolean(
                      iv?.status === 'completed' ||
                      (rnd.recordings && rnd.recordings.length > 0) ||
                      (rnd.round_type === 'hr' ? recordingsCandidate.hr_done : rnd.round_type === 'department' ? recordingsCandidate.tech_done : recordingsCandidate.practical_done)
                    );

                    const roundScore =
                      iv?.total_score !== null && iv?.total_score !== undefined
                        ? `${iv.total_score} / ${iv.maximum_score || 10}`
                        : (rnd.round_type === 'hr' ? recordingsCandidate.hr_score : rnd.round_type === 'department' ? recordingsCandidate.tech_score : recordingsCandidate.practical_score)
                        ? `${rnd.round_type === 'hr' ? recordingsCandidate.hr_score : rnd.round_type === 'department' ? recordingsCandidate.tech_score : recordingsCandidate.practical_score}/10`
                        : 'Pending';

                    const hasRecordings = rnd.recordings && rnd.recordings.length > 0;

                    return (
                      <div
                        key={rnd.round_type}
                        className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-2.5"
                      >
                        {/* Round Header: Title, Marks, Status */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                          <div>
                            <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                              {rnd.round_title}
                            </h5>
                            {iv?.interviewer_name && (
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Interviewer: <span className="font-semibold text-slate-700 dark:text-slate-300">{iv.interviewer_name}</span>
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Round Marks */}
                            <span className="font-bold text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              Marks: {roundScore}
                            </span>

                            {/* Round Status */}
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                <Clock className="w-3 h-3" /> Not Completed
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Interviewer Remarks / Notes */}
                        {iv?.interviewer_summary && (
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-600 dark:text-slate-400 italic border border-slate-100 dark:border-slate-800">
                            "{iv.interviewer_summary}"
                          </div>
                        )}

                        {/* Audio Recordings Players (NO QUESTIONS) */}
                        {hasRecordings ? (
                          <div className="space-y-2 pt-1">
                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <Volume2 className="w-3.5 h-3.5 text-blue-500" />
                              Voice Recording{rnd.recordings.length > 1 ? 's' : ''} ({rnd.recordings.length})
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {rnd.recordings.map((rec: any, idx: number) => (
                                <div
                                  key={rec.url || idx}
                                  className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5"
                                >
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                      {rec.original_filename || `Recording ${idx + 1}`}
                                    </span>
                                    {rec.duration_seconds > 0 && (
                                      <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                        {formatDuration(rec.duration_seconds)}
                                      </span>
                                    )}
                                  </div>
                                  <audio
                                    controls
                                    src={rec.url}
                                    className="w-full h-8"
                                    preload="metadata"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800 text-slate-400 text-[11px] flex items-center gap-2">
                            <Mic className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {isCompleted
                                ? 'Round marks evaluated directly. No voice audio recording file attached for this round.'
                                : 'Candidate has not started this interview round yet.'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    href={`/hr/candidates/${recordingsCandidate.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                    <span>Open Full Candidate Dossier</span>
                  </Link>

                  <div className="flex items-center gap-2">
                    {recordingsCandidate.practical_done && (
                      <button
                        type="button"
                        onClick={() => handleSendMarksEmail(recordingsCandidate)}
                        disabled={sendingMailId === recordingsCandidate.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 font-bold text-xs transition-colors cursor-pointer"
                        title="Send 3-Rounds Marks Email to Candidate registered email"
                      >
                        {sendingMailId === recordingsCandidate.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        )}
                        <span>Send Marks Mail (SMTP)</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setRecordingsModalOpen(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRecordingsModalOpen(false);
                        openDecisionModal(recordingsCandidate);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Record Decision
                    </button>
                  </div>
                </div>
              </div>
            );
          })()
        ) : null}
      </Modal>
    </div>
  );
}
