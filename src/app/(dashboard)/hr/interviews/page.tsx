'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Eye,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Video,
  MapPin,
  CheckCircle2,
  Sparkles,
  X,
  Plus
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/feedback/ToastProvider';

type InterviewTab = 'all' | 'hr_round' | 'technical_round' | 'practical_round' | 'calendar_view';

interface InterviewItem {
  id: number;
  code: string;
  candidate_id: number;
  candidate: string;
  candidate_code?: string;
  department?: string;
  job_role?: string;
  round_type: string;
  round_display: string;
  scheduled_at: string;
  interviewer: string;
  mode: 'Online' | 'Onsite';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

function InterviewManagementContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const candidateIdParam = searchParams.get('candidate_id');
  const scheduleParam = searchParams.get('schedule');
  const roundParam = searchParams.get('round');

  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<InterviewTab>('all');
  const [statusFilter, setStatusFilter] = useState('');

  // Calendar State (Defaulting to October 2026 / current date)
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 9, 1)); // October 2026
  const [selectedDay, setSelectedDay] = useState<number | null>(null); // null by default so all scheduled interviews show

  // Schedule Interview Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    candidate_id: '',
    round_type: 'tech',
    department_name: '',
    mode: 'Online',
  });
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [scheduleHour, setScheduleHour] = useState('10');
  const [scheduleMinute, setScheduleMinute] = useState('00');
  const [schedulePeriod, setSchedulePeriod] = useState<'AM' | 'PM'>('AM');

  // Handle URL query parameters to auto-open Schedule Interview modal
  useEffect(() => {
    if (candidateIdParam && (scheduleParam === 'true' || scheduleParam !== null)) {
      setIsModalOpen(true);
      const cand = candidates.find((c) => String(c.id) === String(candidateIdParam));
      setScheduleData((prev) => ({
        ...prev,
        candidate_id: String(candidateIdParam),
        round_type: roundParam || 'tech',
        department_name: cand?.department_name || prev.department_name,
      }));
    }
  }, [candidateIdParam, scheduleParam, roundParam, candidates]);

  // Fetch interviews
  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab === 'hr_round') params.set('round_type', 'hr');
      if (activeTab === 'technical_round') params.set('round_type', 'department');
      if (activeTab === 'practical_round') params.set('round_type', 'final');
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/interviews?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.data) {
        setInterviews(data.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load interviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch candidate list for scheduling
  const fetchCandidates = async () => {
    try {
      const res = await fetch('/api/candidates?limit=100');
      const data = await res.json();
      if (res.ok && data.data) {
        setCandidates(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch department list
  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (res.ok && data.data) {
        setDepartments(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [activeTab, statusFilter]);

  useEffect(() => {
    fetchCandidates();
    fetchDepartments();
  }, []);

  // Filter candidates who have NOT completed or scheduled BOTH Tech and Practical rounds
  const eligibleCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // Always allow the candidate explicitly opened via URL parameter or current selection
      if (
        (candidateIdParam && String(c.id) === String(candidateIdParam)) ||
        (scheduleData.candidate_id && String(c.id) === String(scheduleData.candidate_id))
      ) {
        return true;
      }

      const status = (c.status || c.application_status || '').toLowerCase();
      if (status === 'rejected' || status === 'joined' || status.includes('join') || (c as any).is_employee || (c as any).employee_code) return false;

      const hasTechScore = c.round_2_score !== null && c.round_2_score !== undefined && c.round_2_score !== '';
      const hasPracticalScore = c.round_3_score !== null && c.round_3_score !== undefined && c.round_3_score !== '';

      const hasTechInterview = interviews.some((iv) => iv.candidate_id === c.id && iv.round_type === 'department' && iv.status !== 'cancelled');
      const hasPracticalInterview = interviews.some((iv) => iv.candidate_id === c.id && iv.round_type === 'final' && iv.status !== 'cancelled');

      const isTechDone = Boolean(hasTechScore || hasTechInterview);
      const isPracticalDone = Boolean(hasPracticalScore || hasPracticalInterview);

      // If that candidate is done/scheduled with both Tech and Practical, hide from candidate list
      if (isTechDone && isPracticalDone) return false;

      return true;
    });
  }, [candidates, interviews, candidateIdParam, scheduleData.candidate_id]);

  // Compute available rounds for selected candidate with strict sequential enforcement
  const availableRounds = useMemo(() => {
    if (!scheduleData.candidate_id) {
      return [
        { value: 'tech', label: 'Tech Round' },
        { value: 'practical', label: 'Practical Round' },
      ];
    }

    const candId = Number(scheduleData.candidate_id);
    const cand = candidates.find((c) => c.id === candId);
    if (!cand) {
      return [
        { value: 'tech', label: 'Tech Round' },
        { value: 'practical', label: 'Practical Round' },
      ];
    }

    // Step 1: HR Round completion check
    const hasHrScore = cand.round_1_score !== null && cand.round_1_score !== undefined && cand.round_1_score !== '';
    const hasHrInterview = interviews.some(
      (iv) => iv.candidate_id === cand.id && iv.round_type === 'hr' && (iv.status === 'completed' || (iv as any).total_score !== null)
    );
    const isHrDone = Boolean(cand.hr_done || hasHrScore || hasHrInterview);

    // Step 2: Tech Round completion check (only valid if HR was done)
    const hasTechScore = cand.round_2_score !== null && cand.round_2_score !== undefined && cand.round_2_score !== '';
    const hasTechInterview = interviews.some(
      (iv) => iv.candidate_id === cand.id && iv.round_type === 'department' && (iv.status === 'completed' || (iv as any).total_score !== null)
    );
    const isTechDone = Boolean(isHrDone && (cand.tech_done || hasTechScore || hasTechInterview));

    // Step 3: Practical Round completion check (only valid if HR and Tech were done)
    const hasPracticalScore = cand.round_3_score !== null && cand.round_3_score !== undefined && cand.round_3_score !== '';
    const hasPracticalInterview = interviews.some(
      (iv) => iv.candidate_id === cand.id && iv.round_type === 'final' && (iv.status === 'completed' || (iv as any).total_score !== null)
    );
    const isPracticalDone = Boolean(isHrDone && isTechDone && (cand.practical_done || hasPracticalScore || hasPracticalInterview));

    // Strict sequential rule:
    // 1. If HR round is NOT cleared -> Candidate must complete HR round first
    if (!isHrDone) {
      return [{ value: 'hr_pending', label: 'Candidate Must Complete HR Round First' }];
    }

    // 2. If HR round is cleared, but Tech round is NOT cleared -> Candidate can ONLY schedule Tech Round
    if (!isTechDone) {
      return [{ value: 'tech', label: 'Tech Round' }];
    }

    // 3. If both HR and Tech are cleared, but Practical is NOT cleared -> Candidate can schedule Practical Round
    if (!isPracticalDone) {
      return [{ value: 'practical', label: 'Practical Round' }];
    }

    return [{ value: 'all_done', label: 'All Rounds Completed' }];
  }, [scheduleData.candidate_id, candidates, interviews]);

  // When candidate is selected, automatically update department and eligible round
  const handleCandidateChange = (candId: string) => {
    const cand = candidates.find((c) => String(c.id) === candId);
    let chosenRound = 'tech';

    if (cand) {
      const hasHrScore = cand.round_1_score !== null && cand.round_1_score !== undefined && cand.round_1_score !== '';
      const hasHrInterview = interviews.some(
        (iv) => iv.candidate_id === cand.id && iv.round_type === 'hr' && (iv.status === 'completed' || (iv as any).total_score !== null)
      );
      const isHrDone = Boolean(cand.hr_done || hasHrScore || hasHrInterview);

      const hasTechScore = cand.round_2_score !== null && cand.round_2_score !== undefined && cand.round_2_score !== '';
      const hasTechInterview = interviews.some(
        (iv) => iv.candidate_id === cand.id && iv.round_type === 'department' && (iv.status === 'completed' || (iv as any).total_score !== null)
      );
      const isTechDone = Boolean(isHrDone && (cand.tech_done || hasTechScore || hasTechInterview));

      if (!isHrDone) {
        chosenRound = 'hr_pending';
      } else if (!isTechDone) {
        chosenRound = 'tech';
      } else {
        chosenRound = 'practical';
      }
    }

    setScheduleData((prev) => ({
      ...prev,
      candidate_id: candId,
      round_type: chosenRound,
      department_name: cand?.department_name || prev.department_name || (departments[0]?.name ?? ''),
    }));
  };

  // Keep round_type in sync with available options
  useEffect(() => {
    if (availableRounds.length > 0 && !availableRounds.some((r) => r.value === scheduleData.round_type)) {
      setScheduleData((prev) => ({
        ...prev,
        round_type: availableRounds[0].value,
      }));
    }
  }, [availableRounds, scheduleData.round_type]);

  // Handle Schedule submission
  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleData.candidate_id) {
      showToast('Please select a candidate', 'warning');
      return;
    }

    if (scheduleData.round_type === 'hr_pending') {
      showToast('Candidate must complete HR Round first before scheduling Technical Round', 'warning');
      return;
    }
    if (scheduleData.round_type === 'all_done') {
      showToast('Candidate has already completed all interview rounds', 'info');
      return;
    }

    setSubmitting(true);
    try {
      // Calculate 24h formatted date & time for storage
      let hour = parseInt(scheduleHour, 10);
      if (schedulePeriod === 'PM' && hour < 12) hour += 12;
      if (schedulePeriod === 'AM' && hour === 12) hour = 0;
      const hourStr = String(hour).padStart(2, '0');
      const formattedScheduledAt = `${scheduleDate} ${hourStr}:${scheduleMinute}:00`;

      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'schedule',
          candidate_id: Number(scheduleData.candidate_id),
          round: scheduleData.round_type,
          scheduled_at: formattedScheduledAt,
          department_name: scheduleData.department_name,
          mode: scheduleData.mode,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);

        // If mode is Offline, redirect immediately to the assessment workspace with department-specific questions
        if (scheduleData.mode === 'Offline') {
          const mappedRound =
            scheduleData.round_type === 'tech' || scheduleData.round_type === 'technical'
              ? 'department'
              : scheduleData.round_type === 'practical'
              ? 'final'
              : scheduleData.round_type;
          showToast('Offline interview scheduled & candidate notified via email! Launching assessment workspace...', 'success');
          router.push(`/hr/interviews/${scheduleData.candidate_id}?round=${mappedRound}`);
          return;
        }

        showToast(
          data.emailDispatched
            ? 'Online interview scheduled & invitation email dispatched to candidate!'
            : 'Online interview scheduled successfully!',
          'success'
        );
        setSelectedDay(null); // Show all interviews so new interview is visible
        setScheduleData({
          candidate_id: '',
          round_type: 'tech',
          department_name: '',
          mode: 'Online',
        });
        fetchInterviews();
        fetchCandidates();
      } else {
        throw new Error(data.error || data.message || 'Failed to schedule session');
      }
    } catch (err: any) {
      showToast(err.message || 'Error scheduling session', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Calendar calculations
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 for Sunday

  const prevMonth = () => {
    setCalendarDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCalendarDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  // Days with scheduled interviews
  const scheduledDaysSet = useMemo(() => {
    const set = new Set<number>();
    interviews.forEach((iv) => {
      if (iv.scheduled_at) {
        const d = new Date(iv.scheduled_at);
        if (d.getFullYear() === year && d.getMonth() === month) {
          set.add(d.getDate());
        }
      }
    });
    // Add default demo days if set is small
    if (set.size === 0) {
      set.add(16);
      set.add(17);
      set.add(18);
    }
    return set;
  }, [interviews, year, month]);

  // Filtered interviews by selected calendar day
  const displayedInterviews = useMemo(() => {
    if (selectedDay === null) return interviews;
    return interviews.filter((iv) => {
      if (!iv.scheduled_at) return true;
      const d = new Date(iv.scheduled_at);
      return d.getDate() === selectedDay;
    });
  }, [interviews, selectedDay]);

  // Helper to format date & time with AM / PM (e.g. 16 Oct 2026, 10:00 AM)
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '16 Oct, 10:00 AM';
    try {
      const cleanStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
      const d = new Date(cleanStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate();
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
      const yearVal = d.getFullYear();
      const timeStr = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return `${day} ${monthShort} ${yearVal}, ${timeStr}`;
    } catch {
      return dateStr || '16 Oct, 10:00 AM';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar: Title, Subtitle, and Schedule Interview Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Interview Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Coordinate, schedule, and evaluate candidate interview stages.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Schedule Interview
        </button>
      </div>

      {/* 2. Top Tabs Navigation Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-6 min-w-max">
          {[
            { id: 'all', label: 'All Interviews' },
            { id: 'hr_round', label: 'HR Round' },
            { id: 'technical_round', label: 'Technical Round' },
            { id: 'practical_round', label: 'Practical Round' },
            { id: 'calendar_view', label: 'Calendar View' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as InterviewTab)}
                className={`pb-3 text-xs font-semibold transition-colors relative whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 dark:bg-blue-500 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Split View: Left Calendar Card + Right Interviews Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Calendar Mini-Widget (4 Cols on desktop) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          {/* Calendar Header with month navigator */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={prevMonth}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {monthNames[month]} {year}
            </span>

            <button
              onClick={nextMonth}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 mb-2">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
            {/* Blank slots before the first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, index) => (
              <div key={`blank-${index}`} className="h-8 w-8" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const isSelected = selectedDay === day;
              const hasEvents = scheduledDaysSet.has(day);

              return (
                <div key={day} className="flex flex-col items-center justify-center">
                  <button
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25 ring-2 ring-blue-500/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {day}
                  </button>

                  {/* Indicator dot if day has interviews */}
                  {hasEvents && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-blue-500 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Calendar Footer Info */}
          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {selectedDay ? `Filtering by ${selectedDay} ${monthNames[month]}` : `Showing all interviews (${interviews.length})`}
            </span>
            {selectedDay !== null && (
              <button
                onClick={() => setSelectedDay(null)}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
              >
                Show All
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Interviews Data Table (8 Cols on desktop) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3.5 px-4 font-bold">ID</th>
                  <th className="py-3.5 px-4 font-bold">Candidate</th>
                  <th className="py-3.5 px-4 font-bold">Round</th>
                  <th className="py-3.5 px-4 font-bold">Date &amp; Time</th>
                  <th className="py-3.5 px-4 font-bold text-center">Mode</th>
                  <th className="py-3.5 px-4 font-bold">Interviewer</th>
                  <th className="py-3.5 px-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                      <p>Loading scheduled interviews...</p>
                    </td>
                  </tr>
                ) : displayedInterviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No interviews scheduled on the selected date or round filter.
                    </td>
                  </tr>
                ) : (
                  displayedInterviews.map((iv) => (
                    <tr
                      key={iv.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* ID */}
                      <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {iv.code}
                      </td>

                      {/* Candidate */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <Link
                          href={`/hr/candidates/${iv.candidate_id}`}
                          className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {iv.candidate}
                        </Link>
                      </td>

                      {/* Round */}
                      <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                        {iv.round_display}
                      </td>

                      {/* Date & Time */}
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium">
                        {formatDateTime(iv.scheduled_at)}
                      </td>

                      {/* Mode (placed before Interviewer) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${
                            (iv.mode || '').toLowerCase() === 'online'
                              ? 'bg-blue-50/80 text-blue-700 border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80'
                              : 'bg-emerald-50/80 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80'
                          }`}
                        >
                          {iv.mode || 'Online'}
                        </span>
                      </td>

                      {/* Interviewer */}
                      <td className="py-4 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">
                        {iv.interviewer}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/hr/candidates/${iv.candidate_id}`}
                            className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            title="View Candidate Dossier"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <Link
                            href={`/hr/interviews/${iv.candidate_id}`}
                            className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            title="Conduct & Score Interview"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Schedule Interview Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Interview"
      >
        <form onSubmit={handleScheduleInterview} className="space-y-4 text-xs">
          {/* Select Candidate */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Candidate <span className="text-red-500">*</span>
            </label>
            <select
              value={scheduleData.candidate_id}
              onChange={(e) => handleCandidateChange(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">-- Choose Candidate --</option>
              {/* If selected candidate from URL is not in eligibleCandidates, render them explicitly */}
              {scheduleData.candidate_id && !eligibleCandidates.some((c) => String(c.id) === String(scheduleData.candidate_id)) && (
                (() => {
                  const selectedCand = candidates.find((c) => String(c.id) === String(scheduleData.candidate_id));
                  if (selectedCand) {
                    const status = (selectedCand.status || selectedCand.application_status || '').toLowerCase();
                    if (status.includes('join') || (selectedCand as any).is_employee || (selectedCand as any).employee_code) return null;
                    return (
                      <option key={selectedCand.id} value={selectedCand.id}>
                        {selectedCand.full_name} ({selectedCand.candidate_code || 'CAN-' + selectedCand.id}) — [{scheduleData.round_type === 'practical' ? '3rd Round (Practical)' : '2nd Round (Technical)'}]
                      </option>
                    );
                  }
                  return null;
                })()
              )}
              {eligibleCandidates.map((c) => {
                const hasTechScore = c.round_2_score !== null && c.round_2_score !== undefined && c.round_2_score !== '';
                const hasTechInterview = interviews.some((iv) => iv.candidate_id === c.id && iv.round_type === 'department' && iv.status !== 'cancelled');
                const isTechDone = Boolean(hasTechScore || hasTechInterview);

                const hasPracticalScore = c.round_3_score !== null && c.round_3_score !== undefined && c.round_3_score !== '';
                const hasPracticalInterview = interviews.some((iv) => iv.candidate_id === c.id && iv.round_type === 'final' && iv.status !== 'cancelled');
                const isPracticalDone = Boolean(hasPracticalScore || hasPracticalInterview);

                let nextRoundNote = 'Eligible: Tech or Practical';
                if (isTechDone && !isPracticalDone) nextRoundNote = 'Tech Done • Next: Practical';
                if (isPracticalDone && !isTechDone) nextRoundNote = 'Practical Done • Next: Tech';

                return (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.candidate_code || 'CAN-' + c.id}) — [{nextRoundNote}]
                  </option>
                );
              })}
            </select>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Candidates who have finished or been scheduled for both Tech and Practical are hidden.
            </p>
          </div>

          {/* Select Round (Dynamically filtered based on completed/scheduled rounds) */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Round <span className="text-red-500">*</span>
            </label>
            <select
              value={scheduleData.round_type}
              onChange={(e) => setScheduleData({ ...scheduleData, round_type: e.target.value })}
              required
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              {availableRounds.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {availableRounds.length === 1 && (
              <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-medium">
                Candidate has already done {availableRounds[0].value === 'practical' ? 'Tech' : 'Practical'} round. Only {availableRounds[0].label} round can be scheduled.
              </p>
            )}
          </div>

          {/* Date & Time Picker with Date and 12-Hour AM/PM Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Interview Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Interview Time (AM / PM) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                {/* Hour */}
                <select
                  value={scheduleHour}
                  onChange={(e) => setScheduleHour(e.target.value)}
                  className="w-full px-2 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-center font-medium"
                >
                  {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((hr) => (
                    <option key={hr} value={hr}>
                      {hr}
                    </option>
                  ))}
                </select>

                <span className="font-bold text-slate-400">:</span>

                {/* Minute */}
                <select
                  value={scheduleMinute}
                  onChange={(e) => setScheduleMinute(e.target.value)}
                  className="w-full px-2 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-center font-medium"
                >
                  {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((min) => (
                    <option key={min} value={min}>
                      {min}
                    </option>
                  ))}
                </select>

                {/* AM / PM */}
                <select
                  value={schedulePeriod}
                  onChange={(e) => setSchedulePeriod(e.target.value as 'AM' | 'PM')}
                  className="w-20 px-2 py-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-center cursor-pointer"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>

          {/* Assigned To (Department name) */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Assigned To (Department) <span className="text-red-500">*</span>
            </label>
            <select
              value={scheduleData.department_name}
              onChange={(e) => setScheduleData({ ...scheduleData, department_name: e.target.value })}
              required
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">-- Select Department --</option>
              {departments.map((dept) => (
                <option key={dept.id || dept.code || dept.name} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Interview Mode (Online / Offline) */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Mode <span className="text-red-500">*</span>
            </label>
            <select
              value={scheduleData.mode}
              onChange={(e) => setScheduleData({ ...scheduleData, mode: e.target.value })}
              required
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>
            {scheduleData.mode === 'Offline' && (
              <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                ⚡ Offline mode: Confirming will redirect immediately to conduct the in-person assessment with department-specific questions.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting
                ? (scheduleData.mode === 'Offline' ? 'Starting Assessment...' : 'Scheduling...')
                : (scheduleData.mode === 'Offline' ? 'Confirm & Start Offline Interview' : 'Confirm Schedule')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function InterviewManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-500">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs">Loading interview management...</p>
        </div>
      }
    >
      <InterviewManagementContent />
    </Suspense>
  );
}
