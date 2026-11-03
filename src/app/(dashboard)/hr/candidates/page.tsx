'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Loader2,
  Check,
  Play,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/components/feedback/ToastProvider';
import { Candidate } from '@/types/candidate';

type StageTabId =
  | 'all'
  | 'register_hr'
  | 'tech'
  | 'practical'
  | 'selected'
  | 'rejected';

interface StageCounts {
  all: number;
  register_hr: number;
  tech: number;
  practical: number;
  selected: number;
  rejected: number;
}

interface EditCandidateFormData {
  id: number;
  candidate_code: string;
  full_name: string;
  email: string;
  phone: string;
  department_id: number;
  position_id?: number;
  position_title?: string;
  application_status: string;
  experience_years?: string | number;
  expected_ctc?: string;
  notes?: string;
}

function CandidatesListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const tabQuery = (searchParams.get('tab') || searchParams.get('status') || searchParams.get('stage')) as StageTabId | null;
  const initialTab: StageTabId = (tabQuery && ['all', 'register_hr', 'tech', 'practical', 'selected', 'rejected'].includes(tabQuery))
    ? tabQuery
    : 'all';

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StageTabId>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [positions, setPositions] = useState<{ id: number; title: string; department_id: number }[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | undefined>(undefined);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<EditCandidateFormData | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    totalPages: 1,
    total: 0,
  });

  const [stageCounts, setStageCounts] = useState<StageCounts>({
    all: 0,
    register_hr: 0,
    tech: 0,
    practical: 0,
    selected: 0,
    rejected: 0,
  });

  // Fetch departments list
  useEffect(() => {
    async function fetchDepts() {
      try {
        const res = await fetch('/api/departments');
        const data = await res.json();
        if (data.data) {
          setDepartments(data.data);
        }
      } catch {
        setDepartments([
          { id: 1, name: 'Quality' },
          { id: 2, name: 'Development' },
          { id: 3, name: 'Management' },
          { id: 4, name: 'Sales' },
          { id: 5, name: 'HR' },
          { id: 6, name: 'Operations' },
          { id: 7, name: 'DBMS' },
          { id: 8, name: 'Email Marketing' },
        ]);
      }
    }

    async function fetchPositions() {
      try {
        const res = await fetch('/api/candidates?action=positions');
        const data = await res.json();
        if (data.data) {
          setPositions(data.data);
        }
      } catch {
        setPositions([]);
      }
    }

    fetchDepts();
    fetchPositions();
  }, []);

  // Fetch candidate applications list
  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', pagination.page.toString());
      queryParams.set('limit', pagination.limit.toString());

      if (searchQuery.trim()) {
        queryParams.set('search', searchQuery.trim());
      }
      if (selectedDeptId) {
        queryParams.set('department_id', selectedDeptId.toString());
      }
      if (activeTab !== 'all') {
        queryParams.set('status', activeTab);
      }

      const res = await fetch(`/api/candidates?${queryParams.toString()}`);
      const data = await res.json();

      if (res.ok && data.data) {
        setCandidates(data.data);
        if (data.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: data.pagination.total || 0,
            totalPages: data.pagination.totalPages || 1,
          }));
        }
        if (data.stageCounts) {
          setStageCounts({
            all: data.stageCounts.all || 0,
            register_hr: data.stageCounts.register_hr || 0,
            tech: data.stageCounts.tech || 0,
            practical: data.stageCounts.practical || 0,
            selected: data.stageCounts.selected || 0,
            rejected: data.stageCounts.rejected || 0,
          });
        }
      } else {
        throw new Error(data.message || 'Failed to fetch candidate applications');
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading candidates', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, activeTab, searchQuery, selectedDeptId, showToast]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Sync tab with URL query param on direct link or navigation
  useEffect(() => {
    const tabParam = (searchParams.get('tab') || searchParams.get('status') || searchParams.get('stage')) as StageTabId | null;
    if (tabParam && ['all', 'register_hr', 'tech', 'practical', 'selected', 'rejected'].includes(tabParam)) {
      setActiveTab((prev) => {
        if (prev !== tabParam) {
          setPagination((p) => ({ ...p, page: 1 }));
          return tabParam;
        }
        return prev;
      });
    }
  }, [searchParams]);

  // Handle Tab Switch
  const handleTabChange = (tabId: StageTabId) => {
    setActiveTab(tabId);
    setPagination((prev) => ({ ...prev, page: 1 }));
    router.replace(tabId === 'all' ? '/hr/candidates' : `/hr/candidates?tab=${tabId}`, { scroll: false });
  };

  // Open Edit Modal with candidate data
  const openEditModal = (c: Candidate) => {
    setEditingCandidate({
      id: c.id,
      candidate_code: c.candidate_code || `CAN-${String(c.id).padStart(4, '0')}`,
      full_name: c.full_name || '',
      email: c.email || '',
      phone: c.phone || '',
      department_id: c.department_id || 1,
      position_id: c.position_id || undefined,
      position_title: c.position_title || '',
      application_status: c.application_status || 'registered',
      experience_years: c.experience_years !== undefined ? c.experience_years : '',
      expected_ctc: c.expected_ctc || '',
      notes: c.notes || '',
    });
    setEditModalOpen(true);
  };

  // Submit candidate edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;

    if (!editingCandidate.full_name.trim()) {
      showToast('Candidate full name is required', 'error');
      return;
    }
    if (!editingCandidate.email.trim()) {
      showToast('Candidate email is required', 'error');
      return;
    }

    setEditSaving(true);
    try {
      const payload: any = {
        full_name: editingCandidate.full_name.trim(),
        email: editingCandidate.email.trim(),
        phone: editingCandidate.phone.trim(),
        department_id: Number(editingCandidate.department_id),
        position_id: editingCandidate.position_id ? Number(editingCandidate.position_id) : undefined,
        application_status: editingCandidate.application_status,
        experience_years:
          editingCandidate.experience_years !== ''
            ? Number(editingCandidate.experience_years)
            : undefined,
        expected_ctc: editingCandidate.expected_ctc || undefined,
        notes: editingCandidate.notes || undefined,
      };

      const res = await fetch(`/api/candidates/${editingCandidate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Candidate details updated successfully', 'success');
        setEditModalOpen(false);
        setEditingCandidate(null);
        if (payload.application_status === 'rejected') {
          setActiveTab('rejected');
          router.replace('/hr/candidates?tab=rejected', { scroll: false });
        }
        fetchCandidates();
      } else {
        throw new Error(data.error || data.message || 'Failed to update candidate');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating candidate', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  // Format Applied Date
  const formatAppliedDate = (dateStr?: string | Date) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  // Helper for Current Stage: shows which round is remaining with direct redirection
  const renderCurrentStage = (c: Candidate) => {
    const s = (c.application_status || '').toLowerCase();

    // 1. Rejected
    if (s.includes('reject')) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/50">
          Rejected
        </span>
      );
    }

    // 2. On Hold
    if (s.includes('hold')) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50">
          On Hold
        </span>
      );
    }

    // 3. Joined
    if (s.includes('joined')) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50">
          Joined
        </span>
      );
    }

    // 4. Offered
    if (s.includes('offered')) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/50">
          Offered
        </span>
      );
    }

    // Strict sequential interview round checks
    const hrDone = Boolean(
      c.hr_done ||
      (c.round_1_score !== null && c.round_1_score !== undefined && c.round_1_score !== '') ||
      (c as any).hr_interview_status === 'completed' ||
      (c as any).round_1_interview_status === 'completed'
    );

    const techDone = Boolean(
      hrDone && (
        c.tech_done ||
        (c.round_2_score !== null && c.round_2_score !== undefined && c.round_2_score !== '') ||
        (c as any).tech_interview_status === 'completed' ||
        (c as any).round_2_interview_status === 'completed'
      )
    );

    const practicalDone = Boolean(
      hrDone && techDone && (
        c.practical_done ||
        (c.round_3_score !== null && c.round_3_score !== undefined && c.round_3_score !== '') ||
        (c as any).practical_interview_status === 'completed' ||
        (c as any).round_3_interview_status === 'completed'
      )
    );

    // Step 1: If HR round is NOT completed, candidate MUST do HR round first
    if (!hrDone) {
      return (
        <Link
          href={`/hr/interviews/${c.id}?round=hr`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs hover:shadow-sm transition-all whitespace-nowrap cursor-pointer group"
          title="Conduct Round 1: HR Interview (10 Questions)"
        >
          <Play className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" />
          <span>Go for HR Round</span>
        </Link>
      );
    }

    // Step 2: If HR round is completed, but Tech round is NOT completed, candidate MUST do Tech round next
    if (!techDone) {
      return (
        <Link
          href={`/hr/interviews?candidate_id=${c.id}&schedule=true&round=tech`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold shadow-xs hover:shadow-sm transition-all whitespace-nowrap cursor-pointer group"
          title="Schedule Round 2: Technical Interview"
        >
          <Calendar className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span>Go for Tech Round</span>
        </Link>
      );
    }

    // Step 3: If BOTH HR and Tech rounds are completed, but Practical round is NOT completed -> Go for Practical round
    if (!practicalDone) {
      return (
        <Link
          href={`/hr/interviews?candidate_id=${c.id}&schedule=true&round=practical`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-xs hover:shadow-sm transition-all whitespace-nowrap cursor-pointer group"
          title="Schedule Round 3: Practical Assessment"
        >
          <Calendar className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span>Go for Practical Round</span>
        </Link>
      );
    }

    // Selected or All Done
    if (s.includes('selected')) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50">
          Selected
        </span>
      );
    }

    return (
      <Link
        href="/hr/decisions"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[11px] font-bold"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>All 3 Rounds Cleared</span>
      </Link>
    );

  };

  // Tabs configured for active interview pipeline rounds
  const tabs: { id: StageTabId; label: string; count: number }[] = [
    { id: 'all', label: 'All Candidates', count: stageCounts.all },
    { id: 'register_hr', label: 'Register (HR)', count: stageCounts.register_hr },
    { id: 'tech', label: 'Tech', count: stageCounts.tech },
    { id: 'practical', label: 'Practical', count: stageCounts.practical },
    { id: 'rejected', label: 'Rejected', count: stageCounts.rejected },
  ];

  const startRecordIndex = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endRecordIndex = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-5">
      {/* 1. Header Bar: Title and Description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Candidate Applications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage all candidate applications and their current status.
          </p>
        </div>
      </div>

      {/* 2. Stage Tabs Navigation Bar */}
      <div className="border-b border-slate-200 dark:border-slate-700/80 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-6 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`pb-3 text-xs font-semibold transition-colors relative whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className="ml-1 opacity-90">({tab.count})</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 dark:bg-blue-500 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search and Department Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, phone or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedDeptId || ''}
            onChange={(e) => setSelectedDeptId(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Main Candidates Table */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-4 font-bold">ID</th>
                <th className="py-3.5 px-4 font-bold">Name</th>
                <th className="py-3.5 px-4 font-bold">Phone</th>
                <th className="py-3.5 px-4 font-bold">Dept</th>
                <th className="py-3.5 px-4 font-bold">Role</th>
                <th className="py-3.5 px-4 font-bold">Applied Date</th>
                <th className="py-3.5 px-4 font-bold text-center">Current Stage</th>
                <th className="py-3.5 px-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Loading candidate records from database...</p>
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No candidates found matching the selected filter.
                  </td>
                </tr>
              ) : (
                candidates.map((c) => {
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300 font-mono text-xs whitespace-nowrap">
                        {c.candidate_code || `CAN-${String(c.id).padStart(4, '0')}`}
                      </td>

                      {/* Name with Email underneath (name on top, uske niche email) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <Link
                            href={`/hr/candidates/${c.id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-xs"
                          >
                            {c.full_name}
                          </Link>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                            {c.email}
                          </span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">
                        {c.phone || '—'}
                      </td>

                      {/* Dept */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap text-xs">
                        {c.department_name || 'General'}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap text-xs">
                        {c.position_title || 'Applicant'}
                      </td>

                      {/* Applied Date */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                        {formatAppliedDate(c.registered_at || c.created_at)}
                      </td>

                      {/* Current Stage */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {renderCurrentStage(c)}
                      </td>

                      {/* Action: View and Edit icons properly working */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. View Icon */}
                          <Link
                            href={`/hr/candidates/${c.id}`}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="View Full Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* 2. Edit Icon */}
                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                            title="Edit Candidate"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Bottom Pagination Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          {/* Page numbers */}
          <div className="flex items-center gap-1.5">
            {/* Prev button */}
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page <= 1}
              className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Dynamic Page Buttons */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => {
              const isCurrent = pageNum === pagination.page;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next button */}
            <button
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))
              }
              disabled={pagination.page >= pagination.totalPages}
              className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Showing count and per-page selector */}
          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
            <span>
              Showing {startRecordIndex}-{endRecordIndex} of {pagination.total}
            </span>

            {/* Per-page Selector */}
            <select
              value={pagination.limit}
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                setPagination((prev) => ({
                  ...prev,
                  limit: newLimit,
                  page: 1,
                  totalPages: Math.ceil(prev.total / newLimit) || 1,
                }));
              }}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* 6. Edit Candidate Modal */}
      {editModalOpen && editingCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Edit Candidate Details</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  {editingCandidate.candidate_code}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingCandidate(null);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleEditSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={editingCandidate.full_name}
                      onChange={(e) =>
                        setEditingCandidate({ ...editingCandidate, full_name: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={editingCandidate.email}
                        onChange={(e) =>
                          setEditingCandidate({ ...editingCandidate, email: e.target.value })
                        }
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        value={editingCandidate.phone}
                        onChange={(e) =>
                          setEditingCandidate({ ...editingCandidate, phone: e.target.value })
                        }
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Department & Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Department
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={editingCandidate.department_id}
                        onChange={(e) =>
                          setEditingCandidate({
                            ...editingCandidate,
                            department_id: Number(e.target.value),
                          })
                        }
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Job Role / Position
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={editingCandidate.position_id || ''}
                        onChange={(e) => {
                          const posId = e.target.value ? Number(e.target.value) : undefined;
                          const found = positions.find((p) => p.id === posId);
                          setEditingCandidate({
                            ...editingCandidate,
                            position_id: posId,
                            position_title: found?.title || editingCandidate.position_title,
                          });
                        }}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        <option value="">Select Role</option>
                        {positions
                          .filter(
                            (p) =>
                              !editingCandidate.department_id ||
                              p.department_id === editingCandidate.department_id
                          )
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Current Stage / Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Stage / Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingCandidate.application_status}
                    onChange={(e) =>
                      setEditingCandidate({
                        ...editingCandidate,
                        application_status: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
                  >
                    <option value="registered">Registration (Applied)</option>
                    <option value="hr_interview">HR Round</option>
                    <option value="dept_interview">Technical Round</option>
                    <option value="final_screening">Practical Round</option>
                    <option value="evaluation">In Evaluation</option>
                    <option value="selected">Selected</option>
                    <option value="offered">Offered</option>
                    <option value="joined">Joined</option>
                    <option value="on_hold">On Hold</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Experience & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={editingCandidate.experience_years}
                      onChange={(e) =>
                        setEditingCandidate({
                          ...editingCandidate,
                          experience_years: e.target.value,
                        })
                      }
                      placeholder="e.g. 2.5"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Expected CTC
                    </label>
                    <input
                      type="text"
                      value={editingCandidate.expected_ctc}
                      onChange={(e) =>
                        setEditingCandidate({
                          ...editingCandidate,
                          expected_ctc: e.target.value,
                        })
                      }
                      placeholder="e.g. 4.5 LPA"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Notes / Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={editingCandidate.notes}
                    onChange={(e) =>
                      setEditingCandidate({ ...editingCandidate, notes: e.target.value })
                    }
                    placeholder="Candidate profile or assessment remarks..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/20">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingCandidate(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {editSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CandidatesListPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-500">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs">Loading candidates directory...</p>
        </div>
      }
    >
      <CandidatesListContent />
    </Suspense>
  );
}
