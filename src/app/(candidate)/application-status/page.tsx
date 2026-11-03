'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/feedback/ToastProvider';
import { Search, ArrowLeft, CheckCircle2, Clock, Calendar, AlertCircle, FileCheck, Award, Building, User } from 'lucide-react';

export default function ApplicationStatusPage() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidate, setCandidate] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      showToast('Please enter your candidate code or email address', 'warning');
      return;
    }

    setLoading(true);
    setSearched(true);
    setCandidate(null);

    try {
      const res = await fetch(`/api/candidates?search=${encodeURIComponent(searchQuery.trim())}&limit=1`);
      const data = await res.json();

      if (res.ok && data.data && data.data.length > 0) {
        // Fetch full candidate details
        const found = data.data[0];
        const detailRes = await fetch(`/api/candidates/${found.id}`);
        const detailData = await detailRes.json();
        if (detailRes.ok && detailData.data) {
          setCandidate(detailData.data);
        } else {
          setCandidate(found);
        }
      } else {
        setCandidate(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Error fetching status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'selected':
      case 'joined':
      case 'offer_accepted':
        return 'success';
      case 'rejected':
      case 'offer_declined':
        return 'danger';
      case 'hr_round':
      case 'dept_round':
      case 'final_round':
      case 'screening':
        return 'info';
      default:
        return 'warning';
    }
  };

  const stages = [
    { key: 'applied', label: 'Application Submitted' },
    { key: 'hr_round', label: 'HR Screening (R1)' },
    { key: 'dept_round', label: 'Technical Assessment (R2)' },
    { key: 'final_round', label: 'Final Screening (R3)' },
    { key: 'decision', label: 'Hiring Decision' },
    { key: 'onboarding', label: 'Onboarding & Joining' },
  ];

  const getStageStep = (status: string) => {
    switch (status) {
      case 'applied':
      case 'screening':
        return 1;
      case 'hr_round':
        return 2;
      case 'dept_round':
        return 3;
      case 'final_round':
        return 4;
      case 'selected':
      case 'rejected':
      case 'offer_released':
        return 5;
      case 'onboarding':
      case 'offer_accepted':
      case 'joined':
        return 6;
      default:
        return 1;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Home
        </Link>

        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Track Application Status
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Enter your Candidate ID (e.g. <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">CAN-2024-001</span>) or registered email address.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mt-6 flex gap-2 max-w-lg mx-auto">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="CAN-2024-001 or name@example.com"
            className="flex-1"
          />
          <Button type="submit" variant="primary" isLoading={loading}>
            <Search className="w-4 h-4 mr-1.5" /> Search
          </Button>
        </form>
      </div>

      <div className="max-w-3xl mx-auto">
        {loading && (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-center animate-pulse">
            <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-700 rounded mx-auto mb-4"></div>
            <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-700/60 rounded mx-auto mb-6"></div>
            <div className="h-20 bg-slate-50 dark:bg-slate-700/30 rounded-xl"></div>
          </div>
        )}

        {!loading && searched && !candidate && (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Application Not Found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              We couldn't locate any application matching "{searchQuery}". Please verify the candidate ID or email address entered.
            </p>
            <div className="mt-6">
              <Link href="/register">
                <Button variant="outline" size="sm">
                  Submit a New Application
                </Button>
              </Link>
            </div>
          </div>
        )}

        {!loading && candidate && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header info */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {candidate.candidate_code || `CAN-${candidate.id}`}
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {candidate.first_name} {candidate.last_name}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>{candidate.email}</span>
                  <span>•</span>
                  <span>{candidate.department_name || 'General'}</span>
                  <span>•</span>
                  <span>{candidate.position_title || 'Applicant'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(candidate.status)} size="lg">
                  {candidate.status?.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Stepper Progression */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
                Recruitment Stage Progression
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {stages.map((stg, idx) => {
                  const currentStep = getStageStep(candidate.status);
                  const isDone = currentStep > idx + 1;
                  const isCurrent = currentStep === idx + 1;

                  return (
                    <div
                      key={stg.key}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 font-semibold'
                          : isDone
                          ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full mx-auto mb-1.5 flex items-center justify-center text-xs font-bold">
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                              isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {idx + 1}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] leading-tight block">{stg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Completed Interviews & Evaluations */}
            <div className="p-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Evaluation History &amp; Records
              </h4>

              {candidate.interviews && candidate.interviews.length > 0 ? (
                <div className="space-y-3">
                  {candidate.interviews.map((iv: any) => (
                    <div
                      key={iv.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 bg-slate-50/30 dark:bg-slate-800/30"
                    >
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                          {iv.round_type?.replace(/_/g, ' ').toUpperCase()} INTERVIEW
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Conducted on {iv.interview_date ? new Date(iv.interview_date).toLocaleDateString() : 'Scheduled'}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {iv.score !== null && iv.score !== undefined && (
                          <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            Score: <span className="text-blue-600 dark:text-blue-400">{iv.score}/10</span>
                          </div>
                        )}
                        <Badge
                          variant={
                            iv.status === 'completed' || iv.status === 'passed'
                              ? 'success'
                              : iv.status === 'in_progress'
                              ? 'info'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {iv.status?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500 py-3 text-center bg-slate-50 dark:bg-slate-700/20 rounded-xl">
                  Your application is currently in preliminary review. Our talent team will notify you via email when an interview round is scheduled.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
