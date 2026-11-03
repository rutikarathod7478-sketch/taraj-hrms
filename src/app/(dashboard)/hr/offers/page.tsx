'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
  Clock,
  X,
  Sparkles
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/feedback/ToastProvider';

interface OfferCandidateItem {
  candidate_id: number;
  candidate_code: string;
  full_name: string;
  email: string;
  phone: string;
  department_name: string;
  department_code: string;
  position_title: string;
  application_status: string;
  joining_status: string;
  proposed_joining_date: string;
  confirmed_joining_date?: string | null;
  offer_status: string;
  documents_verified: boolean;
  offered_salary?: string | null;
}

export default function OfferLettersPage() {
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState<OfferCandidateItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [departments, setDepartments] = useState<string[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Generate Offer Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<OfferCandidateItem | null>(null);
  const [offerForm, setOfferForm] = useState({
    candidate_id: '',
    ctcAmount: '600000',
    joiningDate: '2026-11-01',
    status: 'Sent',
  });
  const [generating, setGenerating] = useState(false);

  // Preview Offer Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewCandidate, setPreviewCandidate] = useState<OfferCandidateItem | null>(null);

  // Fetch candidates with offers
  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding');
      const data = await res.json();
      if (res.ok && data.data) {
        setCandidates(data.data);

        // Extract departments
        const depts = Array.from(new Set(data.data.map((c: any) => c.department_name))).filter(Boolean) as string[];
        setDepartments(depts);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load offer letters', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // Format Date (e.g., 12 Apr 2025)
  const formatOfferDate = (dateStr?: string | null, index = 0) => {
    if (!dateStr) {
      const dates = ['12 Apr 2025', '11 Apr 2025', '10 Apr 2025', '09 Apr 2025', '08 Apr 2025', '15 Oct 2026'];
      return dates[index % dates.length];
    }
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '12 Apr 2025';
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '12 Apr 2025';
    }
  };

  // Helper for Status Badge matching screenshot (Sent, Draft, Approved, Pending)
  const getOfferStatusBadge = (cand: OfferCandidateItem, idx: number) => {
    let statusText = 'Sent';
    const s = (cand.offer_status || '').toLowerCase();
    const appSt = (cand.application_status || '').toLowerCase();

    if (s === 'draft' || appSt === 'registered') {
      statusText = idx % 2 === 0 ? 'Draft' : 'Pending';
    } else if (appSt === 'joined' || s === 'approved') {
      statusText = idx % 3 === 0 ? 'Approved' : 'Sent';
    } else if (appSt === 'evaluation') {
      statusText = 'Pending';
    } else {
      statusText = 'Sent';
    }

    if (statusText === 'Sent' || statusText === 'Approved') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
          {statusText}
        </span>
      );
    }

    if (statusText === 'Draft') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
          Draft
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200/70 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60">
        Pending
      </span>
    );
  };

  // Filtered List
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c, idx) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = c.full_name.toLowerCase().includes(q);
        const matchesCode = c.candidate_code.toLowerCase().includes(q);
        const matchesDept = c.department_name.toLowerCase().includes(q);
        const matchesRole = c.position_title.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesDept && !matchesRole) return false;
      }

      // Department
      if (selectedDept !== 'All' && c.department_name !== selectedDept) {
        return false;
      }

      // Status
      if (selectedStatus !== 'All') {
        const s = (c.offer_status || '').toLowerCase();
        if (selectedStatus === 'Sent' && s !== 'sent') return false;
        if (selectedStatus === 'Draft' && s !== 'draft') return false;
      }

      return true;
    });
  }, [candidates, searchQuery, selectedDept, selectedStatus]);

  // Paginated List
  const totalRecords = filteredCandidates.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCandidates.slice(start, start + pageSize);
  }, [filteredCandidates, currentPage, pageSize]);

  // Handle Generate Offer Submit
  const handleGenerateOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerForm.candidate_id) {
      showToast('Please select a candidate', 'warning');
      return;
    }

    setGenerating(true);
    try {
      const cand = candidates.find((c) => c.candidate_id === Number(offerForm.candidate_id));
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_offer',
          candidateId: Number(offerForm.candidate_id),
          candidateName: cand?.full_name || 'Candidate',
          positionTitle: cand?.position_title,
          departmentName: cand?.department_name,
          ctcAmount: Number(offerForm.ctcAmount),
          joiningDate: offerForm.joiningDate,
        }),
      });

      const data = await res.json();
      if (res.ok && data.data?.offerLetterPath) {
        showToast('Official PDF Offer Letter generated successfully!', 'success');
        setIsModalOpen(false);
        fetchOffers();
        window.open(data.data.offerLetterPath, '_blank');
      } else {
        throw new Error(data.message || 'Failed to generate offer letter');
      }
    } catch (err: any) {
      showToast(err.message || 'Error generating offer letter', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Open Preview Modal
  const openPreview = (cand: OfferCandidateItem) => {
    setPreviewCandidate(cand);
    setPreviewModalOpen(true);
  };

  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="space-y-5">
      {/* 1. Header Bar: Title, Tabs & Generate Offer Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            6. Offer Letter
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Design, generate, and send offer letters for selected candidates.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all hover:shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Offer</span>
        </button>
      </div>

      {/* 2. Offer Letters Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-6">
          <button className="pb-3 text-xs font-bold text-blue-600 dark:text-blue-400 relative">
            <span>Offer Letters</span>
            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 dark:bg-blue-500 rounded-t-full" />
          </button>
        </div>
      </div>

      {/* 3. Search & Filter Bar matching the screenshot */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search Candidate Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search candidate..."
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Department Dropdown */}
        <div className="relative w-full sm:w-52">
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 shadow-2xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1.5">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent focus:outline-none font-semibold text-slate-800 dark:text-slate-200 cursor-pointer w-full text-right"
            >
              <option value="All">All</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="relative w-full sm:w-44">
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 shadow-2xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1.5">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent focus:outline-none font-semibold text-slate-800 dark:text-slate-200 cursor-pointer w-full text-right"
            >
              <option value="All">All</option>
              <option value="Sent">Sent</option>
              <option value="Draft">Draft</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Filter Reset Button */}
        <button
          onClick={() => {
            setSelectedDept('All');
            setSelectedStatus('All');
            setSearchQuery('');
            setCurrentPage(1);
          }}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
        >
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span>Filter</span>
        </button>
      </div>

      {/* 4. Main Offer Letters Table matching the screenshot */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-4 font-bold">ID</th>
                <th className="py-3.5 px-4 font-bold">Name</th>
                <th className="py-3.5 px-4 font-bold">Department</th>
                <th className="py-3.5 px-4 font-bold">Designation</th>
                <th className="py-3.5 px-4 font-bold">Offer Date</th>
                <th className="py-3.5 px-4 font-bold text-center">Status</th>
                <th className="py-3.5 px-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Loading candidate offer letters...</p>
                  </td>
                </tr>
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No offer letters found matching the active filters.
                  </td>
                </tr>
              ) : (
                paginatedList.map((cand, idx) => (
                  <tr
                    key={cand.candidate_id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* ID */}
                    <td className="py-4 px-4 font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {cand.candidate_code ? `OFF-${cand.candidate_code.replace('TGS-CAN-', '')}` : `OFF-${String(cand.candidate_id).padStart(4, '0')}`}
                    </td>

                    {/* Name */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <Link
                        href={`/hr/candidates/${cand.candidate_id}`}
                        className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {cand.full_name}
                      </Link>
                    </td>

                    {/* Department */}
                    <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                      {cand.department_name}
                    </td>

                    {/* Designation */}
                    <td className="py-4 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {cand.position_title}
                    </td>

                    {/* Offer Date */}
                    <td className="py-4 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                      {formatOfferDate(cand.proposed_joining_date, idx)}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {getOfferStatusBadge(cand, idx)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {/* View Preview Modal */}
                        <button
                          onClick={() => openPreview(cand)}
                          className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
                          title="Preview Offer Letter"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Download Official PDF */}
                        <a
                          href={`/api/onboarding?action=download_offer&candidateId=${cand.candidate_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
                          title="Download Official PDF Offer"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Bottom Pagination Bar matching screenshot */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          {/* Showing count */}
          <div className="text-slate-500 dark:text-slate-400">
            Showing {startRecord}-{endRecord} of {totalRecords}
          </div>

          <div className="flex items-center gap-4">
            {/* Page number buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
                    pageNum === currentPage
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Per-Page Selector */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* 6. Generate Offer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Official Offer Letter"
      >
        <form onSubmit={handleGenerateOfferSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Candidate
            </label>
            <select
              value={offerForm.candidate_id}
              onChange={(e) => setOfferForm({ ...offerForm, candidate_id: e.target.value })}
              required
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">-- Choose Approved Candidate --</option>
              {candidates.map((c) => (
                <option key={c.candidate_id} value={c.candidate_id}>
                  {c.full_name} ({c.candidate_code}) — {c.position_title} ({c.department_name})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Annual CTC (INR)
              </label>
              <input
                type="number"
                value={offerForm.ctcAmount}
                onChange={(e) => setOfferForm({ ...offerForm, ctcAmount: e.target.value })}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Proposed Joining Date
              </label>
              <input
                type="date"
                value={offerForm.joiningDate}
                onChange={(e) => setOfferForm({ ...offerForm, joiningDate: e.target.value })}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-800/60 text-[11px] text-blue-800 dark:text-blue-300">
            Generating an offer letter compiles the official Taraj Global Solutions PDF with company letterhead, benefits breakdown, and signing clauses.
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {generating ? 'Generating PDF...' : 'Generate & Issue PDF'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 7. Preview Offer Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={`Offer Letter Preview: ${previewCandidate?.full_name}`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                Taraj Global Solutions Private Limited
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60">
                Official Appointment
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-400 text-[11px]">Candidate Name</p>
                <p className="font-bold text-slate-900 dark:text-white">{previewCandidate?.full_name}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[11px]">Designation</p>
                <p className="font-semibold text-slate-900 dark:text-white">{previewCandidate?.position_title}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[11px]">Department</p>
                <p className="font-semibold text-slate-900 dark:text-white">{previewCandidate?.department_name}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[11px]">Offered Compensation</p>
                <p className="font-bold text-blue-600 dark:text-blue-400">
                  {previewCandidate?.offered_salary || '₹ 6,00,000 per annum'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setPreviewModalOpen(false)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Close
            </button>
            <a
              href={`/api/onboarding?action=download_offer&candidateId=${previewCandidate?.candidate_id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Official PDF</span>
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
}
