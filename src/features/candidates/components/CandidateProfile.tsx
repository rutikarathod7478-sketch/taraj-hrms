'use client';

import React from 'react';
import Link from 'next/link';
import { Candidate } from '@/types/candidate';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  FileText,
  Mic,
  Award,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export interface CandidateProfileProps {
  candidate: Candidate;
  onEdit?: () => void;
  onStatusChange?: (status: string) => void;
  onScheduleInterview?: (round: string) => void;
}

export const CandidateProfile: React.FC<CandidateProfileProps> = ({
  candidate,
  onEdit,
  onStatusChange,
  onScheduleInterview,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Profile Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
              {candidate.full_name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{candidate.full_name}</h2>
                <Badge status={candidate.application_status} />
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                  {candidate.candidate_code}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                {candidate.position_title || 'Position'} • {candidate.department_name || 'Department'}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.phone}
                </span>
                {candidate.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {candidate.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {candidate.resume_file_path && (
              <a
                href={candidate.resume_file_path}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>View CV / Resume</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}

            <Link href={`/hr/interviews/${candidate.id}`}>
              <Button variant="primary" size="sm" icon={<Mic className="w-3.5 h-3.5" />}>
                Interview Workspace
              </Button>
            </Link>

            <Link href={`/hr/decisions`}>
              <Button variant="outline" size="sm" icon={<Award className="w-3.5 h-3.5" />}>
                Decisions
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Details & Recruitment Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal & Academic/Experience Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Professional Credentials Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-500" />
              Professional & Academic Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-400">Candidate Type</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{candidate.candidate_type}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Total Experience</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {candidate.experience_years > 0 ? `${candidate.experience_years} Years` : 'Fresher'}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Highest Qualification</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {candidate.qualification || 'Not Specified'}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">College / Institution</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {candidate.college_or_institution || '—'}
                </p>
              </div>

              {candidate.candidate_type === 'Experienced' && (
                <>
                  <div>
                    <p className="text-xs text-slate-400">Current / Previous Company</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {candidate.current_employer || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Notice Period</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {candidate.notice_period ? `${candidate.notice_period} Days` : 'Immediate / Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Current CTC</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {formatCurrency(candidate.current_ctc)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Expected CTC</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {formatCurrency(candidate.expected_ctc)}
                    </p>
                  </div>
                </>
              )}
            </div>

            {candidate.notes && (
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-400 mb-1">Registration Notes / Remarks</p>
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  {candidate.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Multi-Round Scores & Evaluation Card */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-500" />
              Interview Rounds
            </h3>

            {/* Overall Score Meter */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900 mb-5 text-center">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Consolidated Performance Index
              </p>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {candidate.overall_percentage !== null && candidate.overall_percentage !== undefined
                  ? `${candidate.overall_percentage}%`
                  : 'Pending'}
              </div>
            </div>

            <div className="space-y-3">
              {/* Round 1: Common HR Screening */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Round 1: Common HR Screening</p>
                    <p className="text-[11px] text-slate-500">Culture fit, communication & scenario assessment</p>
                  </div>
                  <div className="text-right">
                    {candidate.round_1_score !== null && candidate.round_1_score !== undefined ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                        {candidate.round_1_score} / 100 ({candidate.round_1_score}%)
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {candidate.round_1_interview_status === 'scheduled'
                          ? 'Scheduled'
                          : candidate.round_1_interview_status === 'in_progress'
                          ? 'In Progress'
                          : 'Not Started'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Round 1 Metadata (Interviewer, Date, Remarks) */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 text-[11px] space-y-1 text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                      {candidate.round_1_score !== null || candidate.round_1_interview_status === 'completed'
                        ? 'Completed'
                        : candidate.round_1_interview_status === 'in_progress'
                        ? 'In Progress'
                        : candidate.round_1_interview_status === 'scheduled'
                        ? 'Scheduled'
                        : 'Not Started'}
                    </span>
                  </div>
                  {candidate.round_1_interviewer_name && (
                    <div className="flex items-center justify-between">
                      <span>Interviewer:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {candidate.round_1_interviewer_name}
                      </span>
                    </div>
                  )}
                  {candidate.round_1_completed_at && (
                    <div className="flex items-center justify-between">
                      <span>Completed On:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatDate(candidate.round_1_completed_at)}
                      </span>
                    </div>
                  )}
                  {candidate.round_1_summary && (
                    <div className="mt-1 p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 italic">
                      "{candidate.round_1_summary}"
                    </div>
                  )}
                </div>

                <div className="pt-1 flex justify-end">
                  <Link
                    href={
                      candidate.round_1_interview_id
                        ? `/hr/interviews/${candidate.round_1_interview_id}`
                        : `/hr/interviews?candidate_id=${candidate.id}&round=hr`
                    }
                  >
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      Open Round 1 Details
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Round 2 */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Round 2: Dept Technical</p>
                  <p className="text-[11px] text-slate-500">Domain-specific assessment</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300">
                    {candidate.round_2_score !== null && candidate.round_2_score !== undefined
                      ? `${candidate.round_2_score}/10`
                      : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Round 3 */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Round 3: Final Screening</p>
                  <p className="text-[11px] text-slate-500">Executive decision & offer</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300">
                    {candidate.round_3_score !== null && candidate.round_3_score !== undefined
                      ? `${candidate.round_3_score}/10`
                      : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
              <span>Applied On:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {formatDate(candidate.registered_at || candidate.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
