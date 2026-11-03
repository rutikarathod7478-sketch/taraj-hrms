'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Send,
  UserCheck,
  CheckCircle2,
  Clock,
  X,
  FileText,
  FileCheck,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Download,
  Check,
  Calendar,
  ChevronDown,
  MoreVertical,
  AlertCircle,
  Upload,
  RotateCcw,
  ExternalLink,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/feedback/ToastProvider';
import {
  OnboardingCandidateItem,
  ChecklistDocumentItem,
  JoiningProgressSummary,
} from '@/features/onboarding/onboarding.service';

export type JoiningTab = 'joined' | 'upcoming' | 'offer_sent' | 'offer_accept';

export default function JoiningPage() {
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState<OnboardingCandidateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<JoiningTab>('joined');

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [departments, setDepartments] = useState<string[]>([]);

  // Custom Dropdowns open state & refs
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const deptRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Letter Selection Modal State (triggered by 3-dot button)
  const [letterModalOpen, setLetterModalOpen] = useState(false);
  const [letterModalCandidate, setLetterModalCandidate] = useState<OnboardingCandidateItem | null>(null);
  const [letterRecipientEmail, setLetterRecipientEmail] = useState<string>('');
  const [selectedLetterType, setSelectedLetterType] = useState<string>('offer_letter');
  const [letterCustomDropdownOpen, setLetterCustomDropdownOpen] = useState(false);
  const [letterNotes, setLetterNotes] = useState<string>('');
  const [activeRowMenuId, setActiveRowMenuId] = useState<number | null>(null);
  const [sendingLetter, setSendingLetter] = useState(false);
  const letterDropdownRef = useRef<HTMLDivElement>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Send Confirmation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmationForm, setConfirmationForm] = useState({
    candidate_id: '',
    confirmedJoiningDate: '2026-11-01',
    notes: 'Welcome to Taraj Global Solutions! Please report at 05:30 PM at The Space Business Complex, Office No 512 to 517, Grant Rd, Kharadi, Pune, Maharashtra 411014.',
  });
  const [submitting, setSubmitting] = useState(false);

  // Candidate Details / Onboarding Checklist Modal
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<OnboardingCandidateItem | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<number>(0);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [actionLoadingDocId, setActionLoadingDocId] = useState<string | null>(null);

  // Document Rejection Reason Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ documentId: string; title: string } | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [notifyCandidateOnReject, setNotifyCandidateOnReject] = useState(true);
  const [sendingRejectNotice, setSendingRejectNotice] = useState(false);
  // Candidate Letter Action Centered Popup State (Triggered by 3-Dot Icon)
  const [centerMenuCandidate, setCenterMenuCandidate] = useState<OnboardingCandidateItem | null>(null);

  // Close dropdowns and action menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (deptRef.current && !deptRef.current.contains(event.target as Node)) {
        setDeptDropdownOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
      if (letterDropdownRef.current && !letterDropdownRef.current.contains(event.target as Node)) {
        setLetterCustomDropdownOpen(false);
      }
      setActiveRowMenuId(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 4 Letter Options requested: Offer Letter, Joining Doc Mail, Appointment Letter, Joining Mail
  const letterOptions = [
    {
      id: 'offer_letter',
      label: 'Offer Letter',
      desc: 'Official offer of employment with role details and compensation terms',
      icon: FileText,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'joining_doc_mail',
      label: 'Joining Doc Mail',
      desc: 'Mandatory document checklist (ID, academic, relieving certificate)',
      icon: ShieldCheck,
      color: 'text-amber-600 dark:text-amber-400',
    },
    {
      id: 'appointment_letter',
      label: 'Appointment Letter',
      desc: 'Formal appointment agreement confirming official corporate designation',
      icon: CheckCircle2,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 'joining_mail',
      label: 'Joining Mail',
      desc: 'Day 1 instructions, reporting schedule (05:30 PM), and welcome message',
      icon: Send,
      color: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  // Fetch Joining / Onboarding candidate list and departments
  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding');
      const data = await res.json();
      if (res.ok && data.data) {
        setCandidates(data.data);

        const candDepts = Array.from(new Set(data.data.map((c: any) => c.department_name))).filter(Boolean) as string[];

        try {
          const deptRes = await fetch('/api/departments');
          const deptData = await deptRes.json();
          if (deptRes.ok && Array.isArray(deptData)) {
            const apiDepts = deptData.map((d: any) => d.name).filter(Boolean);
            const merged = Array.from(new Set([...candDepts, ...apiDepts])).sort();
            setDepartments(merged);
          } else {
            setDepartments(candDepts.sort());
          }
        } catch {
          setDepartments(candDepts.sort());
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load joining records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Format Joining Date (e.g. 22 Oct 2026)
  const formatJoiningDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Pending Date';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Pending Date';
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Pending Date';
    }
  };

  // Extract uniform YYYY-MM-DD joining date for candidate forms (Offer & Appointment)
  const getCandidateJoiningDateYMD = (cand?: OnboardingCandidateItem | null): string => {
    if (!cand) return '';
    const raw = cand.confirmed_joining_date || cand.proposed_joining_date;
    if (!raw) return '';
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return '';
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch {
      return '';
    }
  };

  // Helper for relative countdown (e.g. "In 6 days", "Tomorrow")
  const getJoiningRelativeDays = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const target = new Date(dateStr);
      if (isNaN(target.getTime())) return '';
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);
      const diffMs = target.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Joining Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays > 1 && diffDays <= 30) return `In ${diffDays} days`;
      if (diffDays > 30) {
        const months = Math.round(diffDays / 30);
        return months <= 1 ? 'Next month' : `In ${months} months`;
      }
      return '';
    } catch {
      return '';
    }
  };

  // Check if a date is upcoming in the future (Tomorrow, In 4 days, etc.)
  const isDateUpcoming = (dateStr?: string | null) => {
    if (!dateStr) return false;
    try {
      const target = new Date(dateStr);
      if (isNaN(target.getTime())) return false;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);
      const diffMs = target.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return diffDays > 0;
    } catch {
      return false;
    }
  };

  // Helper: check if a candidate has already joined (enrolled into workforce / employee_id generated)
  const isCandidateJoined = (c: OnboardingCandidateItem) => {
    return Boolean(
      c.employee_id ||
      c.application_status === 'joined' ||
      c.joining_status === 'completed'
    );
  };

  // Helper: check if a candidate is in "Offer Accept" state (accepted offer, not yet joined)
  const isCandidateOfferAccepted = (c: OnboardingCandidateItem) => {
    if (isCandidateJoined(c)) return false;
    return (
      c.offer_status === 'accepted' ||
      c.checklist_status?.offerSigned === true ||
      c.checklist_status?.offer_accepted === true
    );
  };

  // Helper: check if a candidate is in "Offer Sent" state (not accepted, not joined)
  const isCandidateOfferSent = (c: OnboardingCandidateItem) => {
    if (isCandidateJoined(c) || isCandidateOfferAccepted(c)) return false;
    return true;
  };

  // Helper: check if a candidate is in "Upcoming" state (has future joining date, not yet joined)
  const isCandidateUpcoming = (c: OnboardingCandidateItem) => {
    if (isCandidateJoined(c)) return false;
    const dateStr = c.confirmed_joining_date || c.proposed_joining_date;
    return isDateUpcoming(dateStr);
  };

  // Counts for each of the 4 tabs
  const tabCounts = useMemo(() => {
    let joined = 0;
    let upcoming = 0;
    let offer_sent = 0;
    let offer_accept = 0;

    for (const c of candidates) {
      if (isCandidateJoined(c)) {
        joined++;
      } else if (isCandidateOfferAccepted(c)) {
        offer_accept++;
      } else {
        offer_sent++;
      }

      if (isCandidateUpcoming(c)) {
        upcoming++;
      }
    }

    return { joined, upcoming, offer_sent, offer_accept };
  }, [candidates]);

  // Helper for Offer Letter Badge (Accepted, Sent, Draft)
  const getOfferLetterBadge = (cand: OnboardingCandidateItem) => {
    let badgeContent;
    if (isCandidateJoined(cand) || cand.offer_status === 'accepted' || cand.checklist_status?.offerSigned || cand.checklist_status?.offer_accepted) {
      badgeContent = (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
          Accepted
        </span>
      );
    } else if ((cand.offer_status || '').toLowerCase() === 'sent') {
      badgeContent = (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60">
          Sent
        </span>
      );
    } else {
      badgeContent = (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
          Draft / Pending
        </span>
      );
    }

    return (
      <a
        href={`/api/onboarding?action=view_offer&candidateId=${cand.candidate_id}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Click to view new Offer Letter PDF (tgs offerletter.pdf)"
        className="hover:opacity-80 transition-opacity inline-block cursor-pointer"
      >
        {badgeContent}
      </a>
    );
  };

  // Helper for Joining Confirm badge (Sent vs Pending)
  const getJoiningConfirmBadge = (cand: OnboardingCandidateItem) => {
    const isSent = Boolean(cand.confirmed_joining_date) || cand.joining_status === 'completed';

    if (isSent) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
          Sent
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
        Pending
      </span>
    );
  };

  // Helper for Status badge (Joined, Upcoming, Offer Accepted, Offer Sent, On Hold)
  const getJoiningStatusBadge = (cand: OnboardingCandidateItem) => {
    if (cand.application_status === 'on_hold') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60">
          On Hold
        </span>
      );
    }

    if (isCandidateUpcoming(cand)) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200/70 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60">
          Upcoming
        </span>
      );
    }

    if (isCandidateJoined(cand)) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
          Joined
        </span>
      );
    }

    if (isCandidateOfferAccepted(cand)) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/70 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60">
          Offer Accepted
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60">
        Offer Sent
      </span>
    );
  };

  // Filter candidates based on active tab and search/filter inputs
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // 1. Tab filter: joined, upcoming, offer_sent, offer_accept
      if (activeTab === 'joined') {
        if (!isCandidateJoined(c)) return false;
      } else if (activeTab === 'upcoming') {
        if (!isCandidateUpcoming(c)) return false;
      } else if (activeTab === 'offer_accept') {
        if (!isCandidateOfferAccepted(c)) return false;
      } else if (activeTab === 'offer_sent') {
        if (!isCandidateOfferSent(c)) return false;
      }

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = c.full_name.toLowerCase().includes(q);
        const matchesCode = c.candidate_code.toLowerCase().includes(q);
        const matchesDept = c.department_name.toLowerCase().includes(q);
        const matchesRole = (c.position_title || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesDept && !matchesRole) return false;
      }

      // 3. Department filter
      if (selectedDept !== 'All' && c.department_name !== selectedDept) {
        return false;
      }

      // 4. Status filter
      if (selectedStatus !== 'All') {
        if (selectedStatus === 'Joined' && !isCandidateJoined(c)) return false;
        if (selectedStatus === 'Upcoming' && !isCandidateUpcoming(c)) return false;
        if (selectedStatus === 'Offer Accepted' && !isCandidateOfferAccepted(c)) return false;
        if (selectedStatus === 'Offer Sent' && !isCandidateOfferSent(c)) return false;
        if (selectedStatus === 'On Hold' && c.application_status !== 'on_hold') return false;
      }

      return true;
    });
  }, [candidates, activeTab, searchQuery, selectedDept, selectedStatus]);

  // Paginated candidates
  const totalRecords = filteredCandidates.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCandidates.slice(start, start + pageSize);
  }, [filteredCandidates, currentPage, pageSize]);

  // Handle Mark Offer as Accepted
  const handleUpdateOfferStatus = async (candidateId: number, newStatus: 'sent' | 'accepted') => {
    setUpdatingStatusId(candidateId);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_offer_status',
          candidateId,
          offerStatus: newStatus,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(
          newStatus === 'accepted'
            ? 'Candidate offer marked as Accepted! Visible in Offer Accept section.'
            : 'Candidate offer status updated to Sent.',
          'success'
        );
        await fetchCandidates();
        if (selectedCandidate && selectedCandidate.candidate_id === candidateId) {
          setSelectedCandidate((prev) =>
            prev
              ? {
                  ...prev,
                  offer_status: newStatus,
                  checklist_status: { ...prev.checklist_status, offer_accepted: newStatus === 'accepted', offerSigned: newStatus === 'accepted' },
                }
              : null
          );
        }
        if (newStatus === 'accepted') {
          setActiveTab('offer_accept');
        } else {
          setActiveTab('offer_sent');
        }
        setAuditModalOpen(false);
      } else {
        throw new Error(data.message || 'Failed to update offer status');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating status', 'error');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Handle Send Joining Confirmation Submit
  const handleSendConfirmationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationForm.candidate_id) {
      showToast('Please select a candidate', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_email',
          candidateId: Number(confirmationForm.candidate_id),
          templateType: 'joining',
          confirmedJoiningDate: confirmationForm.confirmedJoiningDate,
          notes: confirmationForm.notes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Official joining confirmation email dispatched successfully via SMTP!', 'success');
        setIsModalOpen(false);
        fetchCandidates();
      } else {
        throw new Error(data.message || data.error || 'Failed to dispatch confirmation email via SMTP');
      }
    } catch (err: any) {
      showToast(err.message || 'Error sending confirmation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Letter / Mail Submit (Offer Letter, Joining Doc Mail, Appointment Letter, Joining Mail)
  const handleLetterSubmit = async () => {
    if (!letterModalCandidate) return;
    const targetEmail = (letterRecipientEmail || letterModalCandidate.email || '').trim();
    if (!targetEmail) {
      showToast('Candidate email address is required and cannot be empty.', 'warning');
      return;
    }

    setSendingLetter(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_email',
          candidateId: letterModalCandidate.candidate_id,
          recipientEmail: targetEmail,
          templateType: selectedLetterType,
          notes: letterNotes,
          confirmedJoiningDate:
            letterModalCandidate.confirmed_joining_date || letterModalCandidate.proposed_joining_date,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        let msg = `Letter notification dispatched successfully to ${targetEmail}!`;
        if (selectedLetterType === 'joining_doc_mail') {
          msg = `Employee Joining Documents Checklist email dispatched successfully to ${targetEmail}!`;
        } else if (selectedLetterType === 'offer_letter') {
          msg = `Offer Letter PDF attached and email sent successfully to ${targetEmail}!`;
        } else if (selectedLetterType === 'appointment_letter') {
          msg = `Appointment Letter PDF attached and email sent successfully to ${targetEmail}!`;
        } else if (selectedLetterType === 'joining_mail') {
          msg = `Official Joining Confirmation & welcome email dispatched successfully to candidate: ${targetEmail}!`;
        }
        showToast(msg, 'success');
        setLetterModalOpen(false);
        fetchCandidates();
      } else {
        throw new Error(data.message || data.error || 'Failed to dispatch letter notification');
      }
    } catch (err: any) {
      showToast(err.message || 'Error sending letter', 'error');
    } finally {
      setSendingLetter(false);
    }
  };

  // Convert Candidate to Full Employee (transitions candidate to Joined)
  const handleEnrollEmployee = async (cand: OnboardingCandidateItem) => {
    const isDocsVerified = Boolean(cand.progress?.allMandatoryVerified);
    let bypass = false;

    if (!isDocsVerified) {
      const confirmEnroll = window.confirm(
        `Document verification is pending (${cand.progress?.verifiedMandatory || 0}/${cand.progress?.totalMandatory || 0} mandatory verified).\n\nDo you want to approve onboarding and Mark ${cand.full_name} as Joined now?`
      );
      if (!confirmEnroll) {
        setSelectedCandidate(cand);
        setAuditModalOpen(false);
        setChecklistModalOpen(true);
        return;
      }
      bypass = true;
    }

    setEnrolling(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_onboarding',
          candidateId: cand.candidate_id,
          confirmedJoiningDate: today,
          bypassVerification: bypass,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Congratulations! ${cand.full_name} enrolled as Joined active employee.`, 'success');
        setAuditModalOpen(false);
        setChecklistModalOpen(false);
        await fetchCandidates();
        setActiveTab('joined');
      } else {
        throw new Error(data.message || data.error || 'Failed to enroll employee');
      }
    } catch (err: any) {
      showToast(err.message || 'Error enrolling employee', 'error');
    } finally {
      setEnrolling(false);
    }
  };

  // Handle Document Verification (Approve)
  const handleVerifyDocument = async (docId: string) => {
    if (!selectedCandidate) return;
    setActionLoadingDocId(docId);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_document',
          candidateId: selectedCandidate.candidate_id,
          documentId: docId,
          verifiedBy: 'HR Operations Desk',
          notifyCandidate: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Document approved & verified!', 'success');
        const updatedDocs = data.data.documents;
        const updatedProgress = data.data.progress;
        setSelectedCandidate({
          ...selectedCandidate,
          joining_documents: updatedDocs,
          progress: updatedProgress,
          documents_verified: updatedProgress.allMandatoryVerified,
        });
        fetchCandidates();
      } else {
        throw new Error(data.error || 'Failed to verify document');
      }
    } catch (err: any) {
      showToast(err.message || 'Verification error', 'error');
    } finally {
      setActionLoadingDocId(null);
    }
  };

  // Handle Document Rejection with Reason
  const handleConfirmReject = async () => {
    if (!selectedCandidate || !rejectTarget) return;
    setSendingRejectNotice(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_document',
          candidateId: selectedCandidate.candidate_id,
          documentId: rejectTarget.documentId,
          remarks: rejectRemarks || 'Please submit a clear, valid copy of this document.',
          notifyCandidate: notifyCandidateOnReject,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          notifyCandidateOnReject
            ? 'Document rejected and correction email notification dispatched to candidate.'
            : 'Document marked as Rejected with remarks.',
          'info'
        );
        const updatedDocs = data.data.documents;
        const updatedProgress = data.data.progress;
        setSelectedCandidate({
          ...selectedCandidate,
          joining_documents: updatedDocs,
          progress: updatedProgress,
          documents_verified: false,
        });
        setRejectModalOpen(false);
        setRejectTarget(null);
        setRejectRemarks('');
        fetchCandidates();
      } else {
        throw new Error(data.error || 'Failed to reject document');
      }
    } catch (err: any) {
      showToast(err.message || 'Rejection error', 'error');
    } finally {
      setSendingRejectNotice(false);
    }
  };

  // Handle Toggle Mandatory / Optional
  const handleToggleMandatory = async (docId: string, currentVal: boolean) => {
    if (!selectedCandidate) return;
    setActionLoadingDocId(docId);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_mandatory',
          candidateId: selectedCandidate.candidate_id,
          documentId: docId,
          isMandatory: !currentVal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Document set to ${!currentVal ? 'Mandatory' : 'Optional'}.`, 'success');
        const updatedDocs = data.data.documents;
        const updatedProgress = data.data.progress;
        setSelectedCandidate({
          ...selectedCandidate,
          joining_documents: updatedDocs,
          progress: updatedProgress,
          documents_verified: updatedProgress.allMandatoryVerified,
        });
        fetchCandidates();
      } else {
        throw new Error(data.error || 'Failed to update configuration');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating configuration', 'error');
    } finally {
      setActionLoadingDocId(null);
    }
  };

  // Handle Document Reset to Pending
  const handleResetDocument = async (docId: string) => {
    if (!selectedCandidate) return;
    setActionLoadingDocId(docId);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_document',
          candidateId: selectedCandidate.candidate_id,
          documentId: docId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Document reset to Pending status.', 'info');
        const updatedDocs = data.data.documents;
        const updatedProgress = data.data.progress;
        setSelectedCandidate({
          ...selectedCandidate,
          joining_documents: updatedDocs,
          progress: updatedProgress,
          documents_verified: false,
        });
        fetchCandidates();
      } else {
        throw new Error(data.error || 'Failed to reset document');
      }
    } catch (err: any) {
      showToast(err.message || 'Error resetting document', 'error');
    } finally {
      setActionLoadingDocId(null);
    }
  };

  // Handle Document File Upload
  const handleFileUpload = async (docId: string, file: File) => {
    if (!selectedCandidate) return;
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(ext)) {
      showToast('Unsupported format. Please upload PDF, JPG, JPEG, or PNG.', 'warning');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      showToast('File size exceeds maximum allowed limit of 15MB.', 'warning');
      return;
    }

    setUploadingDocId(docId);
    try {
      const formData = new FormData();
      formData.append('action', 'upload_document');
      formData.append('candidateId', String(selectedCandidate.candidate_id));
      formData.append('documentId', docId);
      formData.append('file', file);

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`${file.name} uploaded successfully!`, 'success');
        const updatedDocs = data.data.documents;
        const updatedProgress = data.data.progress;
        setSelectedCandidate({
          ...selectedCandidate,
          joining_documents: updatedDocs,
          progress: updatedProgress,
          documents_verified: updatedProgress.allMandatoryVerified,
        });
        fetchCandidates();
      } else {
        throw new Error(data.error || 'Failed to upload document');
      }
    } catch (err: any) {
      showToast(err.message || 'Upload error', 'error');
    } finally {
      setUploadingDocId(null);
    }
  };

  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  // 4 Tabs in exact requested order: Joined Candidate -> Upcoming -> Offer Sent -> Offer Accept
  const tabsConfig = [
    { id: 'joined' as JoiningTab, label: 'Joined Candidate', count: tabCounts.joined },
    { id: 'upcoming' as JoiningTab, label: 'Upcoming', count: tabCounts.upcoming },
    { id: 'offer_sent' as JoiningTab, label: 'Offer Sent', count: tabCounts.offer_sent },
    { id: 'offer_accept' as JoiningTab, label: 'Offer Accept', count: tabCounts.offer_accept },
  ];

  const hideOfferColumns = activeTab === 'joined' || activeTab === 'upcoming';

  return (
    <div className="space-y-5">
      {/* 1. Header Bar: Title and Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            7. Joining &amp; Onboarding
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Coordinate candidate offer letters, monitor upcoming joiners, and track joined employees.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all hover:shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Send Confirmation</span>
        </button>
      </div>

      {/* 2. Top Tabs Navigation Bar: Joined Candidate | Upcoming | Offer Sent | Offer Accept */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-6 min-w-max">
          {tabsConfig.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`pb-3 text-xs font-semibold transition-colors relative whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 dark:bg-blue-500 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search & Filter Bar with Beautiful, Neat Custom Dropdowns */}
      <div className="relative z-30 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
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
            placeholder="Search candidate by name, ID, role or department..."
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

        {/* Department Custom Dropdown (Crisp, High-Contrast & Beautifully Visible) */}
        <div className="relative w-full sm:w-56" ref={deptRef}>
          <button
            type="button"
            onClick={() => {
              setDeptDropdownOpen(!deptDropdownOpen);
              setStatusDropdownOpen(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer text-left"
          >
            <span className="font-semibold text-slate-500 dark:text-slate-400 shrink-0 mr-1.5">Department:</span>
            <span className="font-bold text-slate-900 dark:text-white truncate flex-1 text-right mr-1.5">
              {selectedDept === 'All' ? 'All' : selectedDept}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                deptDropdownOpen ? 'rotate-180 text-blue-500' : ''
              }`}
            />
          </button>

          {/* Elevated Popup Menu */}
          {deptDropdownOpen && (
            <div className="absolute top-full mt-1.5 right-0 w-full sm:w-60 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xl z-50 p-1.5 max-h-64 overflow-y-auto scrollbar-thin">
              <button
                type="button"
                onClick={() => {
                  setSelectedDept('All');
                  setDeptDropdownOpen(false);
                  setCurrentPage(1);
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-left transition-colors cursor-pointer ${
                  selectedDept === 'All'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>All Departments</span>
                {selectedDept === 'All' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
              </button>
              {departments.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setSelectedDept(d);
                    setDeptDropdownOpen(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-left transition-colors cursor-pointer ${
                    selectedDept === d
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{d}</span>
                  {selectedDept === d && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status Custom Dropdown (Crisp, High-Contrast & Beautifully Visible) */}
        <div className="relative w-full sm:w-52" ref={statusRef}>
          <button
            type="button"
            onClick={() => {
              setStatusDropdownOpen(!statusDropdownOpen);
              setDeptDropdownOpen(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer text-left"
          >
            <span className="font-semibold text-slate-500 dark:text-slate-400 shrink-0 mr-1.5">Status:</span>
            <span className="font-bold text-slate-900 dark:text-white truncate flex-1 text-right mr-1.5">
              {selectedStatus === 'All' ? 'All' : selectedStatus}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                statusDropdownOpen ? 'rotate-180 text-blue-500' : ''
              }`}
            />
          </button>

          {/* Elevated Popup Menu */}
          {statusDropdownOpen && (
            <div className="absolute top-full mt-1.5 right-0 w-full sm:w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xl z-50 p-1.5 max-h-64 overflow-y-auto scrollbar-thin">
              {[
                { value: 'All', label: 'All Statuses' },
                { value: 'Joined', label: 'Joined' },
                { value: 'Upcoming', label: 'Upcoming' },
                { value: 'Offer Sent', label: 'Offer Sent' },
                { value: 'Offer Accept', label: 'Offer Accept' },
                { value: 'On Hold', label: 'On Hold' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(opt.value);
                    setStatusDropdownOpen(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-left transition-colors cursor-pointer ${
                    selectedStatus === opt.value
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selectedStatus === opt.value && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                </button>
              ))}
            </div>
          )}
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
          <span>Reset</span>
        </button>
      </div>

      {/* 4. Main Joining Table */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-4 font-bold">ID</th>
                <th className="py-3.5 px-4 font-bold">Candidate</th>
                {activeTab !== 'offer_sent' && (
                  <th className="py-3.5 px-4 font-bold">Department</th>
                )}
                {activeTab === 'offer_sent' ? (
                  <th className="py-3.5 px-4 font-bold">Offer Letter</th>
                ) : (
                  !hideOfferColumns && (
                    <>
                      <th className="py-3.5 px-4 font-bold">Offer Letter</th>
                      <th className="py-3.5 px-4 font-bold text-center">Joining Confirm.</th>
                    </>
                  )
                )}
                <th className="py-3.5 px-4 font-bold text-center">Docs Checklist</th>
                <th className="py-3.5 px-4 font-bold">Joining Date</th>
                <th className="py-3.5 px-4 font-bold text-center">Status</th>
                <th className="py-3.5 px-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'offer_accept' ? 9 : 7} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Loading candidate records...</p>
                  </td>
                </tr>
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'offer_accept' ? 9 : 7} className="py-12 text-center text-slate-400">
                    No candidates found in {tabsConfig.find((t) => t.id === activeTab)?.label} matching the filters.
                  </td>
                </tr>
              ) : (
                paginatedList.map((cand) => {
                  const isSent = isCandidateOfferSent(cand);
                  const isVerified = Boolean(cand.progress?.allMandatoryVerified);

                  return (
                    <tr
                      key={cand.candidate_id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* ID */}
                      <td className="py-4 px-4 font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <span className="font-mono font-bold">
                          {cand.candidate_code || `CAN-${String(cand.candidate_id).padStart(4, '0')}`}
                        </span>
                      </td>

                      {/* Name & Role */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <Link
                            href={`/hr/candidates/${cand.candidate_id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {cand.full_name}
                          </Link>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {cand.position_title} &bull; <span className="font-semibold text-slate-600 dark:text-slate-300">{cand.candidate_type || 'Experienced'}</span>
                          </span>
                        </div>
                      </td>

                      {/* Department - hidden in Offer Sent section */}
                      {activeTab !== 'offer_sent' && (
                        <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                          {cand.department_name}
                        </td>
                      )}

                      {/* Offer Letter & Joining Confirm */}
                      {activeTab === 'offer_sent' ? (
                        <td className="py-4 px-4 whitespace-nowrap">
                          {getOfferLetterBadge(cand)}
                        </td>
                      ) : (
                        !hideOfferColumns && (
                          <>
                            <td className="py-4 px-4 whitespace-nowrap">
                              {getOfferLetterBadge(cand)}
                            </td>
                            <td className="py-4 px-4 text-center whitespace-nowrap">
                              {getJoiningConfirmBadge(cand)}
                            </td>
                          </>
                        )
                      )}

                      {/* Document Verification Checklist Badge */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCandidate(cand);
                            setChecklistModalOpen(true);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs ${
                            isVerified
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                          }`}
                          title="Open Employee Joining Documents Checklist"
                        >
                          <ShieldCheck className={`w-3.5 h-3.5 ${isVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
                          <span>
                            {isVerified
                              ? `Verified (${cand.progress?.verifiedMandatory}/${cand.progress?.totalMandatory})`
                              : `Checklist (${cand.progress?.verifiedMandatory || 0}/${cand.progress?.totalMandatory || 0})`}
                          </span>
                        </button>
                      </td>

                      {/* Joining Date */}
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatJoiningDate(cand.confirmed_joining_date || cand.proposed_joining_date)}
                          </span>
                          {/* Relative days (Tomorrow, In 4 days) shown ONLY in Upcoming / Offer tabs, NEVER in Joined Candidate */}
                          {activeTab !== 'joined' && getJoiningRelativeDays(cand.confirmed_joining_date || cand.proposed_joining_date) && (
                            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                              {getJoiningRelativeDays(cand.confirmed_joining_date || cand.proposed_joining_date)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {getJoiningStatusBadge(cand)}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* If in Offer Accept: quick action to Enroll as Employee */}
                          {activeTab === 'offer_accept' && (
                            <button
                              onClick={() => handleEnrollEmployee(cand)}
                              disabled={enrolling}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-50 ${
                                isVerified
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                              title={
                                isVerified
                                  ? 'Enroll Candidate as Active Joined Employee'
                                  : 'Mandatory documents pending verification. Click to verify first.'
                              }
                            >
                              {isVerified ? (
                                <UserCheck className="w-3.5 h-3.5" />
                              ) : (
                                <Lock className="w-3 h-3 text-amber-600" />
                              )}
                              <span>Mark Joined</span>
                            </button>
                          )}

                          {/* If in Offer Sent: Open Offer Letter Form & Appointment Letter Form */}
                          {activeTab === 'offer_sent' && (
                            <div className="flex items-center gap-1.5">
                              <a
                                href={`/api/onboarding?action=view_offer&candidateId=${cand.candidate_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200/80 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60 font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs"
                                title="View Official TGS Offer Letter (PDF: tgs offerletter.pdf)"
                              >
                                <FileText className="w-3.5 h-3.5 text-orange-600" />
                                <span>Offer Letter</span>
                              </a>
                              <a
                                href={`/api/onboarding?action=view_appointment&candidateId=${cand.candidate_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs"
                                title="View Official TGS Appointment Letter (PDF: apptgs.pdf)"
                              >
                                <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                                <span>Appointment Letter</span>
                              </a>
                            </div>
                          )}

                          {/* 1. View Details / Audit Modal Icon */}
                          <button
                            onClick={() => {
                              setSelectedCandidate(cand);
                              setAuditModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors cursor-pointer"
                            title="Candidate Joining Audit: Review stage, offer acceptance, & joining"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* 2. Send Confirmation / Instructions Email Icon */}
                          <button
                            onClick={() => {
                              setConfirmationForm({
                                candidate_id: cand.candidate_id.toString(),
                                confirmedJoiningDate: getCandidateJoiningDateYMD(cand) || '2026-11-01',
                                notes: `Reporting confirmation for ${cand.full_name} in ${cand.department_name}. Please report at corporate office.`,
                              });
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors cursor-pointer"
                            title="Send Confirmation Email via SMTP"
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          {/* 3. View Saved Offer PDF in Browser */}
                          <a
                            href={`/api/onboarding?action=view_offer&candidateId=${cand.candidate_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors cursor-pointer"
                            title="View Offer Letter PDF in Browser"
                          >
                            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </a>

                          {/* 4. Download Offer PDF Icon */}
                          <a
                            href={`/api/onboarding?action=download_offer&candidateId=${cand.candidate_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors cursor-pointer"
                            title="Download Official Offer Letter PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>

                          {/* 5. Three-Dot Action Icon: Opens Candidate Letter & Mail Centered Modal */}
                          <div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCenterMenuCandidate(cand);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Letters & Mail Actions (Offer Letter, Joining Doc Mail, Appointment Letter, Joining Mail)"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
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

          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
            {/* Showing count */}
            <span>
              Showing {startRecord}-{endRecord} of {totalRecords}
            </span>

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

      {/* 6. Send Joining Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Send Joining Confirmation"
      >
        <form onSubmit={handleSendConfirmationSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Candidate <span className="text-red-500">*</span>
            </label>
            <select
              value={confirmationForm.candidate_id}
              onChange={(e) =>
                setConfirmationForm({ ...confirmationForm, candidate_id: e.target.value })
              }
              required
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">-- Choose Candidate --</option>
              {candidates.map((c) => (
                <option key={c.candidate_id} value={c.candidate_id}>
                  {c.full_name} ({c.candidate_code}) — {c.department_name} ({c.position_title})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirmed Joining Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={confirmationForm.confirmedJoiningDate}
              onChange={(e) =>
                setConfirmationForm({ ...confirmationForm, confirmedJoiningDate: e.target.value })
              }
              required
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reporting &amp; Orientation Instructions
            </label>
            <textarea
              rows={3}
              value={confirmationForm.notes}
              onChange={(e) =>
                setConfirmationForm({ ...confirmationForm, notes: e.target.value })
              }
              required
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
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
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Dispatching via SMTP...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Confirmation Email</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* 6.5. Candidate Joining Audit Modal (Triggered by Eye Icon) */}
      <Modal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        title={`Candidate Joining Audit: ${selectedCandidate?.full_name || 'Candidate'}`}
      >
        <div className="space-y-4 text-xs">
          {/* Card 1: Candidate Details */}
          <div className="p-4 bg-slate-900/90 dark:bg-slate-950/80 border border-slate-800 rounded-2xl text-slate-300 shadow-xs">
            <div className="grid grid-cols-2 gap-y-3.5 gap-x-4">
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">Candidate Name</span>
                <span className="font-bold text-slate-100 text-sm">{selectedCandidate?.full_name}</span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">Candidate ID</span>
                <span className="font-bold font-mono text-blue-400 text-sm">{selectedCandidate?.candidate_code}</span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">Department</span>
                <span className="font-bold text-slate-100 text-xs">{selectedCandidate?.department_name}</span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">Designation</span>
                <span className="font-bold text-slate-100 text-xs">{selectedCandidate?.position_title}</span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">Proposed Joining Date</span>
                <span className="font-bold text-slate-100 text-xs">{formatJoiningDate(selectedCandidate?.proposed_joining_date)}</span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">Confirmed Joining Date</span>
                <span className="font-bold text-blue-400 text-xs">{formatJoiningDate(selectedCandidate?.confirmed_joining_date || selectedCandidate?.proposed_joining_date)}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Current Recruitment & Joining Stage */}
          <div className="p-4 bg-slate-900/60 dark:bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
            <div>
              <span className="block text-[11px] text-slate-400 font-semibold mb-1.5">
                Current Recruitment &amp; Joining Stage
              </span>
              <div>
                {selectedCandidate && isCandidateJoined(selectedCandidate) ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Joined
                  </span>
                ) : selectedCandidate && isCandidateOfferAccepted(selectedCandidate) ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    Offer Accepted
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">
                    Offer Sent
                  </span>
                )}
              </div>
            </div>

            {/* In Offer Sent stage: show 'Mark Offer Accepted' button. In Offer Accepted stage: this button is removed */}
            {selectedCandidate && !isCandidateJoined(selectedCandidate) && !isCandidateOfferAccepted(selectedCandidate) && (
              <div>
                <button
                  type="button"
                  onClick={() => handleUpdateOfferStatus(selectedCandidate.candidate_id, 'accepted')}
                  disabled={updatingStatusId === selectedCandidate.candidate_id}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-all shadow-md shadow-emerald-500/20"
                  title="Mark candidate offer as Accepted"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{updatingStatusId === selectedCandidate.candidate_id ? 'Marking...' : 'Mark Offer Accepted'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Card 3: Pre-Joining Verification Status */}
          <div className="p-3.5 bg-emerald-950/20 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Pre-Joining Verification Status</span>
            </div>
            <div>
              {selectedCandidate?.progress?.allMandatoryVerified ? (
                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                  Documents Cleared
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuditModalOpen(false);
                    setChecklistModalOpen(true);
                  }}
                  className="text-amber-400 hover:text-amber-300 font-bold text-xs underline cursor-pointer flex items-center gap-1"
                  title="Open full 35-item document checklist"
                >
                  <span>Verification Pending ({selectedCandidate?.progress?.verifiedMandatory || 0}/{selectedCandidate?.progress?.totalMandatory || 0})</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-800">
            {/* Left Action Links */}
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <a
                href={`/api/onboarding?action=view_offer&candidateId=${selectedCandidate?.candidate_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-orange-500 hover:text-orange-400 font-semibold cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-orange-500" />
                <span>Offer Letter (PDF)</span>
              </a>

              <a
                href={`/api/onboarding?action=view_appointment&candidateId=${selectedCandidate?.candidate_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Appointment Letter (PDF)</span>
              </a>

              <a
                href={`/api/onboarding?action=view_offer&candidateId=${selectedCandidate?.candidate_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-slate-300 hover:text-white font-semibold cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>View Offer PDF</span>
              </a>

              <a
                href={`/api/onboarding?action=view_appointment&candidateId=${selectedCandidate?.candidate_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>View Appt PDF</span>
              </a>

              <a
                href={`/api/onboarding?action=download_offer&candidateId=${selectedCandidate?.candidate_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>

            {/* Right Buttons: Close & Stage Action Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAuditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
              >
                Close
              </button>

              {/* In Offer Sent: Keep ONLY 'Mark Offer Accepted' (replaces Mark as Joined) */}
              {selectedCandidate && !isCandidateJoined(selectedCandidate) && !isCandidateOfferAccepted(selectedCandidate) && (
                <button
                  type="button"
                  onClick={() => handleUpdateOfferStatus(selectedCandidate.candidate_id, 'accepted')}
                  disabled={updatingStatusId === selectedCandidate.candidate_id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 transition-all"
                  title="Mark candidate offer as Accepted"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{updatingStatusId === selectedCandidate.candidate_id ? 'Marking...' : 'Mark Offer Accepted'}</span>
                </button>
              )}

              {/* In Offer Accepted: Keep ONLY 'Mark as Joined' (Mark Offer Accepted is removed) */}
              {selectedCandidate && !isCandidateJoined(selectedCandidate) && isCandidateOfferAccepted(selectedCandidate) && (
                <button
                  type="button"
                  onClick={() => handleEnrollEmployee(selectedCandidate)}
                  disabled={enrolling}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 transition-all"
                  title="Complete onboarding and activate official employee profile"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{enrolling ? 'Enrolling...' : 'Mark as Joined'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* 7. Comprehensive Employee Joining Documents Checklist & Verification Modal */}
      <Modal
        isOpen={checklistModalOpen}
        onClose={() => setChecklistModalOpen(false)}
        title={`Employee Joining Documents Checklist: ${selectedCandidate?.full_name}`}
      >
        <div className="space-y-4 text-xs max-h-[80vh] overflow-y-auto scrollbar-thin pr-1">
          {/* Candidate Profile Header Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-black text-sm">
                  {selectedCandidate?.full_name?.charAt(0) || 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {selectedCandidate?.full_name}
                    </h3>
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      {selectedCandidate?.candidate_code}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      {selectedCandidate?.candidate_type || 'Experienced'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedCandidate?.position_title} &bull; {selectedCandidate?.department_name} &bull; Proposed Joining: {formatJoiningDate(selectedCandidate?.proposed_joining_date)}
                  </p>
                </div>
              </div>

              {/* Quick action: Dispatch Document Checklist Email */}
              <button
                type="button"
                onClick={() => {
                  if (selectedCandidate) {
                    setLetterModalCandidate(selectedCandidate);
                    setLetterRecipientEmail(selectedCandidate.email || '');
                    setSelectedLetterType('joining_doc_mail');
                    setLetterModalOpen(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-xs shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
                title="Send Document Checklist Email to Candidate"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Send Document Checklist Mail</span>
              </button>
            </div>

            {/* Overall Document Completion Status Bar */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className={`w-4 h-4 ${selectedCandidate?.progress?.allMandatoryVerified ? 'text-emerald-500' : 'text-blue-500'}`} />
                  Overall Document Completion Status
                </span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">
                  {selectedCandidate?.progress?.verifiedMandatory || 0} / {selectedCandidate?.progress?.totalMandatory || 0} Mandatory Verified ({selectedCandidate?.progress?.percentComplete || 0}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    selectedCandidate?.progress?.allMandatoryVerified
                      ? 'bg-emerald-500'
                      : (selectedCandidate?.progress?.percentComplete || 0) > 50
                      ? 'bg-blue-600'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${selectedCandidate?.progress?.percentComplete || 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-slate-500">
                  {selectedCandidate?.progress?.allMandatoryVerified ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> All mandatory onboarding documents verified! Ready for Appointment Letter.
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Onboarding completion locked until all mandatory documents are verified.
                    </span>
                  )}
                </span>
                <span className="text-slate-400 text-[10px]">
                  Submitted: {selectedCandidate?.progress?.totalSubmitted || 0} &bull; Pending: {selectedCandidate?.progress?.totalPending || 0} &bull; Rejected: {selectedCandidate?.progress?.totalRejected || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Category Filter Pills (All 6 Categories) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 0, label: 'All Documents', count: selectedCandidate?.joining_documents?.length || 35 },
              { id: 1, label: '1. Identity & Address', count: 5 },
              { id: 2, label: '2. Educational', count: 6 },
              { id: 3, label: '3. Previous Employment', count: 6 },
              { id: 4, label: '4. Bank & Payroll', count: 4 },
              { id: 5, label: '5. Info & Forms', count: 9 },
              { id: 6, label: '6. Other Documents', count: 5 },
            ].map((cat) => {
              const isActive = activeCategoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Document Checklist Items List */}
          <div className="space-y-2.5">
            {selectedCandidate?.joining_documents
              ?.filter((doc) => activeCategoryFilter === 0 || doc.categoryId === activeCategoryFilter)
              .map((doc) => {
                const isActionLoading = actionLoadingDocId === doc.id;
                const isUploading = uploadingDocId === doc.id;
                const isFresherExempt = (selectedCandidate?.candidate_type || '').toLowerCase() === 'fresher' && doc.experiencedOnly;

                // Status colors
                const statusStyles = {
                  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
                  submitted: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
                  rejected: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
                  pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
                };

                return (
                  <div
                    key={doc.id}
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-2 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          {doc.status === 'verified' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : doc.status === 'rejected' ? (
                            <X className="w-4 h-4 text-rose-600 shrink-0" />
                          ) : doc.status === 'submitted' ? (
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white text-xs">
                              {doc.title}
                            </span>

                            {/* Mandatory / Optional interactive configuration pill */}
                            <button
                              type="button"
                              onClick={() => handleToggleMandatory(doc.id, doc.isMandatory)}
                              disabled={isActionLoading}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors border ${
                                doc.isMandatory
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                              title="Click to toggle Mandatory vs Optional"
                            >
                              {doc.isMandatory ? 'Mandatory' : 'Optional'}
                            </button>

                            {/* Fresher exemption badge */}
                            {isFresherExempt && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                Exempt (Fresher)
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Category: {doc.category}
                          </p>
                        </div>
                      </div>

                      {/* Right: Verification Status & Actions */}
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border capitalize shrink-0 ${
                            statusStyles[doc.status] || statusStyles.pending
                          }`}
                        >
                          {doc.status}
                        </span>

                        {/* Document File / View link if uploaded */}
                        {doc.filePath && (
                          <a
                            href={`/api/onboarding?action=view_document&filePath=${encodeURIComponent(doc.filePath)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold text-xs cursor-pointer shadow-2xs shrink-0"
                            title="View / Download Uploaded Document"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>View</span>
                          </a>
                        )}

                        {/* Upload file button with hidden input */}
                        <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-xs cursor-pointer shadow-2xs shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={isUploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(doc.id, file);
                            }}
                            className="hidden"
                          />
                        </label>

                        {/* Approve / Verify Button */}
                        <button
                          type="button"
                          disabled={isActionLoading || doc.status === 'verified'}
                          onClick={() => handleVerifyDocument(doc.id)}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 disabled:opacity-40 cursor-pointer shadow-2xs"
                          title="Verify / Approve this document"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        </button>

                        {/* Reject Button (opens reason modal) */}
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => {
                            setRejectTarget({ documentId: doc.id, title: doc.title });
                            setRejectRemarks('');
                            setNotifyCandidateOnReject(true);
                            setRejectModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 cursor-pointer shadow-2xs"
                          title="Reject document with reason"
                        >
                          <X className="w-3.5 h-3.5 text-rose-600" />
                        </button>

                        {/* Reset Button */}
                        {doc.status !== 'pending' && (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleResetDocument(doc.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                            title="Reset to Pending"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Metadata: Uploaded date, file size, or Rejection remarks */}
                    {(doc.originalFileName || doc.uploadedAt || doc.remarks || doc.verifiedAt) && (
                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                        <div className="flex items-center gap-2">
                          {doc.originalFileName && (
                            <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-xs">
                              File: {doc.originalFileName}
                            </span>
                          )}
                          {doc.uploadedAt && (
                            <span>&bull; Uploaded: {new Date(doc.uploadedAt).toLocaleDateString('en-GB')}</span>
                          )}
                          {doc.verifiedAt && doc.status === 'verified' && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              &bull; Verified: {new Date(doc.verifiedAt).toLocaleDateString('en-GB')} ({doc.verifiedBy || 'HR'})
                            </span>
                          )}
                        </div>

                        {doc.status === 'rejected' && doc.remarks && (
                          <div className="w-full text-rose-600 dark:text-rose-400 font-medium bg-rose-50/60 dark:bg-rose-950/30 px-2 py-1 rounded border border-rose-200/60 dark:border-rose-800/40">
                            <strong>Rejection Reason:</strong> {doc.remarks}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Modal Bottom Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <a
                href={`/api/onboarding?action=view_offer&candidateId=${selectedCandidate?.candidate_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 text-xs font-semibold cursor-pointer"
                title="View Offer Letter PDF in Browser"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>View Offer PDF</span>
              </a>
              <a
                href={`/api/onboarding?action=view_appointment&candidateId=${selectedCandidate?.candidate_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 text-xs font-semibold cursor-pointer ml-2"
                title="View Appointment Letter PDF in Browser"
              >
                <FileCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>View Appointment PDF</span>
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setChecklistModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer text-xs"
              >
                Close Checklist
              </button>

              {selectedCandidate && !isCandidateJoined(selectedCandidate) && (
                <button
                  type="button"
                  onClick={() => handleEnrollEmployee(selectedCandidate)}
                  disabled={enrolling || !selectedCandidate.progress?.allMandatoryVerified}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold shadow-xs cursor-pointer text-xs transition-all ${
                    selectedCandidate.progress?.allMandatoryVerified
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed opacity-75'
                  }`}
                  title={
                    selectedCandidate.progress?.allMandatoryVerified
                      ? 'Complete onboarding and activate employee profile'
                      : 'All configured mandatory documents must be verified first'
                  }
                >
                  {selectedCandidate.progress?.allMandatoryVerified ? (
                    <UserCheck className="w-4 h-4" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span>
                    {enrolling
                      ? 'Enrolling...'
                      : selectedCandidate.progress?.allMandatoryVerified
                      ? 'Mark as Joined'
                      : `Verification Incomplete (${selectedCandidate.progress?.verifiedMandatory || 0}/${selectedCandidate.progress?.totalMandatory || 0})`}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* 7.5 Centered Popup Menu (Triggered by 3-Dot Icon) */}
      {centerMenuCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setCenterMenuCandidate(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl p-5 space-y-4 text-left animate-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base shadow-2xs">
                  {centerMenuCandidate.full_name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                    {centerMenuCandidate.full_name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    {centerMenuCandidate.position_title} &bull; <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{centerMenuCandidate.candidate_code}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCenterMenuCandidate(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Subtitle with Recipient Email */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Recipient Email:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono truncate max-w-[220px]">
                {centerMenuCandidate.email || 'No email provided'}
              </span>
            </div>

            {/* 4 Options Grid */}
            <div className="space-y-2">
              {letterOptions.map((opt) => {
                const IconComp = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      const cand = centerMenuCandidate;
                      setLetterModalCandidate(cand);
                      setLetterRecipientEmail(cand.email || '');
                      setSelectedLetterType(opt.id);
                      if (opt.id === 'joining_mail') {
                        setLetterNotes(
                          `Welcome to Taraj Global Solutions! Please report at 05:30 PM on your confirmed joining date (${formatJoiningDate(cand.confirmed_joining_date || cand.proposed_joining_date)}) at The Space Business Complex, Office No 512 to 517, Grant Rd, Kharadi, Pune, Maharashtra 411014.`
                        );
                      }
                      setCenterMenuCandidate(null);
                      setLetterModalOpen(true);
                    }}
                    className="w-full p-3 rounded-xl text-left transition-all flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-xs cursor-pointer group"
                  >
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform shrink-0">
                      <IconComp className={`w-4 h-4 ${opt.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          Select &rarr;
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-snug mt-0.5">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 8. Candidate Letter Selection & Send Modal (Triggered by 3-Dot Icon) */}
      <Modal
        isOpen={letterModalOpen}
        onClose={() => {
          if (!sendingLetter) setLetterModalOpen(false);
        }}
        title="Candidate Letter & Mail Notification"
      >
        <div className="space-y-4 text-xs">
          {/* Candidate Profile Info */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Candidate Information
            </label>
            <div className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-black text-xs">
                  {letterModalCandidate?.full_name?.charAt(0) || 'C'}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-xs">
                    {letterModalCandidate?.full_name}
                  </p>
                  <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                    {letterModalCandidate?.position_title} &bull; {letterModalCandidate?.department_name}
                  </p>
                </div>
              </div>
              <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {letterModalCandidate?.candidate_code || `CAN-${letterModalCandidate?.candidate_id}`}
              </span>
            </div>
          </div>

          {/* Candidate Email Verification Field (Ensures correct email before sending) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Candidate Recipient Email <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                ✓ Recipient Verification
              </span>
            </div>
            <input
              type="email"
              value={letterRecipientEmail}
              onChange={(e) => setLetterRecipientEmail(e.target.value)}
              required
              placeholder="candidate@example.com"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Verify that this email address is correct. The selected letter notification will be sent directly to this candidate.
            </p>
          </div>

          {/* Select Letter Dropdown */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Letter / Mail Type <span className="text-red-500">*</span>
            </label>

            <div className="relative" ref={letterDropdownRef}>
              <button
                type="button"
                onClick={() => setLetterCustomDropdownOpen(!letterCustomDropdownOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs cursor-pointer text-left"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <span>
                    {letterOptions.find((opt) => opt.id === selectedLetterType)?.label || 'Select Letter'}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    letterCustomDropdownOpen ? 'rotate-180 text-blue-500' : ''
                  }`}
                />
              </button>

              {/* Elevated Dropdown Menu: offer letter, joining doc mail, appointment letter, joining mail */}
              {letterCustomDropdownOpen && (
                <div className="absolute top-full mt-1.5 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 p-1.5 space-y-1">
                  {letterOptions.map((opt) => {
                    const isSelected = selectedLetterType === opt.id;
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedLetterType(opt.id);
                          setLetterCustomDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2.5 rounded-lg text-left transition-colors flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <IconComp className={`w-4 h-4 ${opt.color} shrink-0`} />
                          <div className="flex flex-col">
                            <span className="font-semibold">{opt.label}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                              {opt.desc}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* If Joining Doc Mail is selected, show Employee Joining Documents Checklist preview & Appointment Letter callout */}
          {selectedLetterType === 'joining_doc_mail' && (
            <div className="space-y-3 pt-1">
              {/* Checklist Content Preview */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 max-h-56 overflow-y-auto scrollbar-thin">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    Employee Joining Documents Checklist Preview
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                    Taraj Global Solutions
                  </span>
                </div>
                <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">1. Identity and Address Proof</p>
                    <p className="text-slate-500">Aadhaar Card, PAN Card, Passport, Driving Licence or Voter ID, Current Address Proof</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">2. Educational Documents</p>
                    <p className="text-slate-500">SSC (10th), HSC (12th), Graduation Mark Sheets, Graduation Degree Certificate / Provisional, Diploma, Certifications</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      3. Previous Employment Documents <span className="font-normal text-amber-600 italic">(*Required only for experienced candidates*)</span>
                    </p>
                    <p className="text-slate-500">Offer / Appointment Letter, Relieving Letter, Experience Certificate, Last 3 Months Salary Slips, Previous Employment Details, UAN / PF</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">4. Bank and Payroll Documents</p>
                    <p className="text-slate-500">Bank Account Details, Cancelled Cheque / Bank Passbook Copy, PAN for Payroll, UAN / PF</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">5. Employee Information and Company Forms</p>
                    <p className="text-slate-500">Information Form, Emergency Contact Form, Signed Offer Letter Acceptance, Policies Ack, NDA, IT Asset Form, BGV Consent, Declaration</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">6. Other Documents</p>
                    <p className="text-slate-500">Passport-Size Photo, Medical Fitness Certificate, BGV Documents, Benefit Nomination Forms, Additional HR Docs</p>
                  </div>
                </div>
              </div>

              {/* Call-out for Appointment Letter Issuance */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-blue-900 dark:text-blue-300 leading-relaxed">
                  <p className="font-bold">Next Steps for Appointment Letter Issuance:</p>
                  <p className="mt-0.5">
                    This email instructs the candidate to submit the required soft copies <strong>as soon as possible</strong> via email reply or candidate portal.
                    <strong> After verification of their submitted documents, Taraj Global Solutions will officially issue and send their Appointment Letter.</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* If Offer Letter is selected */}
          {selectedLetterType === 'offer_letter' && letterModalCandidate && (
            <div className="pt-1 space-y-2">
              <a
                href={`/api/onboarding?action=view_offer&candidateId=${letterModalCandidate.candidate_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
              >
                <FileText className="w-4 h-4 text-white" />
                <span>View Official Offer Letter (PDF: tgs offerletter.pdf)</span>
              </a>
              <a
                href={`/offer-letter-form.html?candidate_id=${letterModalCandidate.candidate_id}&name=${encodeURIComponent(letterModalCandidate.full_name)}&email=${encodeURIComponent(letterRecipientEmail || letterModalCandidate.email || '')}&designation=${encodeURIComponent(letterModalCandidate.position_title || '')}&department=${encodeURIComponent(letterModalCandidate.department_name || '')}&joining_date=${encodeURIComponent(getCandidateJoiningDateYMD(letterModalCandidate))}&ctc=${encodeURIComponent(letterModalCandidate.offered_salary || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
              >
                <span>Open Interactive Editor / Form</span>
              </a>
            </div>
          )}

          {/* If Appointment Letter is selected */}
          {selectedLetterType === 'appointment_letter' && letterModalCandidate && (
            <div className="pt-1 space-y-2">
              <a
                href={`/api/onboarding?action=view_appointment&candidateId=${letterModalCandidate.candidate_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
              >
                <FileCheck className="w-4 h-4 text-white" />
                <span>View Official Appointment Letter (PDF: apptgs.pdf)</span>
              </a>
              <a
                href={`/appointment-letter-form.html?candidate_id=${letterModalCandidate.candidate_id}&name=${encodeURIComponent(letterModalCandidate.full_name)}&email=${encodeURIComponent(letterRecipientEmail || letterModalCandidate.email || '')}&designation=${encodeURIComponent(letterModalCandidate.position_title || '')}&department=${encodeURIComponent(letterModalCandidate.department_name || '')}&joining_date=${encodeURIComponent(getCandidateJoiningDateYMD(letterModalCandidate))}&ctc=${encodeURIComponent(letterModalCandidate.offered_salary || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
              >
                <span>Open Interactive Editor / Form</span>
              </a>
            </div>
          )}

          {/* If Joining Mail is selected */}
          {selectedLetterType === 'joining_mail' && letterModalCandidate && (
            <div className="space-y-3 pt-1">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200 dark:border-emerald-800/60">
                  <span className="font-bold text-emerald-950 dark:text-emerald-300 text-xs flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Official Joining Mail Preview
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                    Taraj Global Solutions
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400">Date of Joining:</span>{' '}
                    <strong className="text-slate-900 dark:text-white">
                      {formatJoiningDate(letterModalCandidate.confirmed_joining_date || letterModalCandidate.proposed_joining_date)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Reporting Time:</span>{' '}
                    <strong className="text-slate-900 dark:text-white">05:30 PM</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Location:</span>{' '}
                    <span>The Space Business Complex, Office No 512 to 517, Grant Rd, Kharadi, Pune, Maharashtra 411014</span>
                  </div>
                  <div className="col-span-2 text-slate-500 dark:text-slate-400 text-[10.5px]">
                    Includes Day 1 orientation schedule, instructions to bring original documents, and welcome message.
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Orientation / Reporting Instructions
                </label>
                <textarea
                  rows={2}
                  value={letterNotes}
                  onChange={(e) => setLetterNotes(e.target.value)}
                  placeholder="e.g. Please report at 05:30 PM with original documents for verification."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                />
              </div>
            </div>
          )}

          {/* Action Buttons: Cancel and Send Mail */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={sendingLetter}
              onClick={() => setLetterModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={sendingLetter}
              onClick={handleLetterSubmit}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {sendingLetter ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Dispatching to {letterRecipientEmail || 'Candidate'}...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {selectedLetterType === 'joining_doc_mail'
                      ? 'Send Joining Doc Mail'
                      : selectedLetterType === 'offer_letter'
                      ? 'Send Offer Letter Mail'
                      : selectedLetterType === 'appointment_letter'
                      ? 'Send Appointment Letter Mail'
                      : selectedLetterType === 'joining_mail'
                      ? 'Send Joining Mail'
                      : 'Send Mail'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* 9. Document Rejection Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => {
          if (!sendingRejectNotice) setRejectModalOpen(false);
        }}
        title={`Reject Document: ${rejectTarget?.title}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason / Remarks for Rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              placeholder="e.g. Scanned copy is illegible/blurry, document is expired, or missing side..."
              required
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyCandidateOnReject}
              onChange={(e) => setNotifyCandidateOnReject(e.target.checked)}
              className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Send correction request email notification to candidate ({selectedCandidate?.email})
            </span>
          </label>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={sendingRejectNotice}
              onClick={() => setRejectModalOpen(false)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={sendingRejectNotice}
              onClick={handleConfirmReject}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {sendingRejectNotice ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Rejecting...</span>
                </>
              ) : (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>Confirm Rejection</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
