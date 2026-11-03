'use client';

import React, { useState, useEffect } from 'react';
import { Candidate } from '@/types/candidate';
import { Button } from '@/components/ui/Button';
import {
  X,
  ArrowRight,
  Building2,
  User,
  Calendar,
  Clock,
  Video,
  FileText,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export interface SecondRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  hrRoundScore: number;
  percentageScore: number;
  onSubmitSecondRound: (secondRoundData: {
    department_id: number;
    department_name: string;
    role: string;
    interviewer: string;
    mode: string;
    scheduled_at: string;
    notes: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

interface DepartmentOption {
  id: number;
  name: string;
  defaultManager: string;
  defaultRole: string;
}

const DEPARTMENTS: DepartmentOption[] = [
  { id: 1, name: 'Quality', defaultManager: 'Emily Davis (QA / Tech Lead)', defaultRole: 'QA Test Engineer' },
  { id: 2, name: 'Development', defaultManager: 'Sarah Jenkins (Senior Dev Manager)', defaultRole: 'Software Developer' },
  { id: 3, name: 'Management', defaultManager: 'David Kumar (Operations & Management Lead)', defaultRole: 'Associate Project Manager' },
  { id: 4, name: 'Sales', defaultManager: 'Rajesh Sharma (VP Sales)', defaultRole: 'Business Development Executive' },
  { id: 5, name: 'HR', defaultManager: 'Pooja Kumari (HR Lead)', defaultRole: 'HR Executive' },
  { id: 6, name: 'Operations', defaultManager: 'Vikram Malhotra (Operations Manager)', defaultRole: 'IT Operations Specialist' },
  { id: 7, name: 'DBMS', defaultManager: 'Anand Verma (Database Architect)', defaultRole: 'Database Administrator' },
  { id: 8, name: 'Email Marketing', defaultManager: 'Neha Gupta (Marketing Lead)', defaultRole: 'Email Marketing Specialist' },
];

export const SecondRoundModal: React.FC<SecondRoundModalProps> = ({
  isOpen,
  onClose,
  candidate,
  hrRoundScore,
  percentageScore,
  onSubmitSecondRound,
  isLoading = false,
}) => {
  // Find initial department
  const initialDept = DEPARTMENTS.find(
    (d) => d.id === candidate.department_id || d.name.toLowerCase() === (candidate.department_name || '').toLowerCase()
  ) || DEPARTMENTS[1]; // default to Development

  const [selectedDeptId, setSelectedDeptId] = useState<number>(initialDept.id);
  const [role, setRole] = useState<string>(candidate.position_title || initialDept.defaultRole);
  const [interviewer, setInterviewer] = useState<string>(initialDept.defaultManager);
  const [mode, setMode] = useState<string>('Online');

  // Tomorrow's date formatted as YYYY-MM-DD
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [scheduledDate, setScheduledDate] = useState<string>(defaultDateStr);
  const [scheduledTime, setScheduledTime] = useState<string>('10:00');
  const [notes, setNotes] = useState<string>(
    `Candidate cleared Round 1 (HR Screening) with score ${hrRoundScore}/100 (${percentageScore}%). Recommended for technical / department evaluation.`
  );

  // Sync state if candidate or department changes
  useEffect(() => {
    const dept = DEPARTMENTS.find((d) => d.id === selectedDeptId);
    if (dept) {
      setInterviewer(dept.defaultManager);
      if (!candidate.position_title) {
        setRole(dept.defaultRole);
      }
    }
  }, [selectedDeptId, candidate.position_title]);

  if (!isOpen) return null;

  const currentDept = DEPARTMENTS.find((d) => d.id === selectedDeptId) || DEPARTMENTS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedScheduledAt = `${scheduledDate} ${scheduledTime}:00`;

    await onSubmitSecondRound({
      department_id: selectedDeptId,
      department_name: currentDept.name,
      role: role.trim() || currentDept.defaultRole,
      interviewer: interviewer.trim() || currentDept.defaultManager,
      mode,
      scheduled_at: formattedScheduledAt,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-transparent dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Advance to Second Round
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Schedule Technical / Department Round for{' '}
                <strong className="text-slate-800 dark:text-slate-200">{candidate.full_name}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* HR Round Results Badge */}
        <div className="px-5 py-3 bg-blue-50/50 dark:bg-blue-950/30 border-b border-blue-100/60 dark:border-blue-900/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              ✓ HR Round Cleared
            </span>
            <span className="text-slate-600 dark:text-slate-300">
              Score: <strong className="font-bold text-slate-900 dark:text-white">{hrRoundScore} / 100</strong> ({percentageScore}%)
            </span>
          </div>
          <span className="text-slate-500 font-mono text-[11px]">ID: {candidate.candidate_code || `CAN-${candidate.id}`}</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Department Selection (Core Requirement) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Select Department for Second Round <span className="text-rose-500">*</span></span>
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none transition-all shadow-2xs"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} Department (Lead: {dept.defaultManager})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              The candidate will be evaluated by this department in Round 2.
            </p>
          </div>

          {/* Role and Interviewer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Job Role / Designation</span>
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Software Developer"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Assigned Interviewer</span>
              </label>
              <input
                type="text"
                value={interviewer}
                onChange={(e) => setInterviewer(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Mode, Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-slate-400" />
                <span>Interview Mode</span>
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
              >
                <option value="Online">Online (Google Meet)</option>
                <option value="Offline">Offline (In-Person)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Time</span>
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* HR Handover Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>HR Round Evaluation Notes &amp; Handover</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Candidate feedback, communication score, and specific areas for the technical interviewer to assess..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              icon={<CheckCircle2 className="w-4 h-4" />}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
            >
              Submit &amp; Schedule Second Round
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
