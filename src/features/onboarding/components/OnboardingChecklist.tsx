'use client';

import React, { useState } from 'react';
import { OnboardingCandidateItem } from '@/features/onboarding/onboarding.service';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/feedback/ToastProvider';
import { CheckCircle2, ShieldCheck, UserCheck, FileText, Download, Send } from 'lucide-react';

export interface OnboardingChecklistProps {
  item: OnboardingCandidateItem;
  onRefresh?: () => void;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({ item, onRefresh }) => {
  const { success, error } = useToast();

  const initialChecklist = React.useMemo(() => {
    if (Array.isArray(item.checklist_status)) {
      const map: Record<string, boolean> = {};
      for (const doc of item.checklist_status) {
        map[doc.id] = doc.status === 'verified';
      }
      return map;
    }
    return (item.checklist_status as Record<string, boolean>) || {};
  }, [item.checklist_status]);

  const [checklist, setChecklist] = useState<Record<string, boolean>>(initialChecklist);
  const [documentsVerified, setDocumentsVerified] = useState<boolean>(item.documents_verified);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isOnboarding, setIsOnboarding] = useState<boolean>(false);
  const [joiningDate, setJoiningDate] = useState<string>(
    item.proposed_joining_date ? item.proposed_joining_date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );

  const checklistItems = [
    { key: 'idProof', label: 'Government ID Proof (Aadhaar / Passport / Voter ID)' },
    { key: 'academicCertificates', label: 'Academic Certificates (Degree / Marksheet)' },
    { key: 'relievingLetter', label: 'Previous Relieving Letter & Experience Letter' },
    { key: 'bankDetails', label: 'Bank Passbook / Cancelled Cheque for Payroll' },
    { key: 'offerSigned', label: 'Counter-Signed Offer Letter Received' },
  ];

  const handleToggle = (key: string) => {
    const next = { ...checklist, [key]: !checklist[key] };
    setChecklist(next);
  };

  const saveChecklist = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: item.candidate_id,
          checklist,
          documentsVerified,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update checklist.');
      }
      success('Onboarding checklist saved!');
      onRefresh?.();
    } catch (err: unknown) {
      const e = err as Error;
      error('Save Error', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteEnrollment = async () => {
    setIsOnboarding(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_onboarding',
          candidateId: item.candidate_id,
          confirmedJoiningDate: joiningDate,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete employee enrollment.');
      }

      success(
        'Employee Enrolled Successfully!',
        `Generated Employee Code: ${data.data?.employeeCode || 'TGS-EMP'}`
      );
      onRefresh?.();
    } catch (err: unknown) {
      const e = err as Error;
      error('Enrollment Error', e.message);
    } finally {
      setIsOnboarding(false);
    }
  };

  const downloadOfferPdf = () => {
    window.open(`/api/onboarding?action=download_offer&candidateId=${item.candidate_id}`, '_blank');
  };

  const isEnrolled = item.application_status === 'joined' || item.employee_id !== null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{item.full_name}</h3>
            <Badge status={item.application_status} size="sm" />
            <span className="text-xs font-mono text-slate-400">({item.candidate_code})</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {item.position_title} • {item.department_name} • Salary: {item.offered_salary || 'Standard'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={downloadOfferPdf}
          >
            Offer Letter PDF
          </Button>
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Document Verification Checklist
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {checklistItems.map((c) => {
            const checked = Boolean(checklist[c.key]);
            return (
              <label
                key={c.key}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                  checked
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-slate-100'
                    : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100/60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isEnrolled}
                  onChange={() => handleToggle(c.key)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-medium leading-relaxed">{c.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Verification status toggle & final enrollment */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={documentsVerified}
            disabled={isEnrolled}
            onChange={(e) => setDocumentsVerified(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
          />
          <div className="text-xs">
            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              All Onboarding Documents Verified by HR
            </span>
            <p className="text-slate-500 text-[11px]">Marks verification audit compliant in database</p>
          </div>
        </label>

        <div className="flex items-center gap-2">
          {!isEnrolled && (
            <Button variant="outline" size="sm" isLoading={isSaving} onClick={saveChecklist}>
              Save Checklist
            </Button>
          )}

          {!isEnrolled ? (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <Button
                variant="success"
                size="sm"
                isLoading={isOnboarding}
                icon={<UserCheck className="w-4 h-4" />}
                onClick={handleCompleteEnrollment}
              >
                Complete Onboarding
              </Button>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
              Official Employee Enrolled
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
