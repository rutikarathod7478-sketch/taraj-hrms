'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/feedback/ToastProvider';
import { Play, Calendar, User, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ManagerInterviewsPage() {
  const { showToast } = useToast();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignedInterviews() {
      setLoading(true);
      try {
        const res = await fetch('/api/interviews?round_type=dept_round');
        const data = await res.json();
        if (res.ok && data.data) {
          setInterviews(data.data);
        }
      } catch (err: any) {
        showToast(err.message || 'Error loading interviews', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchAssignedInterviews();
  }, [showToast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/manager"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Manager Dashboard
        </Link>
      </div>

      <PageHeader
        title="Department Technical Assessment Queue"
        description="Assigned candidates for Round 2 technical assessment, coding, system design, or practical evaluations."
      />

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading interview queue...</div>
        ) : interviews.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No technical interviews currently pending for your department.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {interviews.map((iv) => (
              <div
                key={iv.id}
                className="p-5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                      IV-00{iv.id}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      {iv.candidate_name || `Candidate #${iv.candidate_id}`}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {iv.scheduled_at ? new Date(iv.scheduled_at).toLocaleString() : 'Date Pending'}
                    </span>
                    <span>•</span>
                    <span>Round 2 — Technical Assessment</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {iv.score !== null && iv.score !== undefined ? (
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Score: <span className="text-blue-600 dark:text-blue-400">{iv.score}/10</span>
                    </div>
                  ) : null}

                  <Badge variant={iv.status === 'completed' ? 'success' : 'warning'}>
                    {iv.status?.toUpperCase()}
                  </Badge>

                  <Link href={`/hr/interviews/${iv.id}`}>
                    <Button variant="primary" size="sm">
                      <Play className="w-3.5 h-3.5 mr-1" />
                      {iv.status === 'completed' ? 'Review Workspace' : 'Conduct Interview'}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
