'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Users, Calendar, Award, ArrowRight, Play, CheckCircle2, Clock } from 'lucide-react';

export default function ManagerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [managerUser, setManagerUser] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        const user = userData.data;
        setManagerUser(user);

        const deptId = user?.department_id || '';
        const [candRes, ivRes] = await Promise.all([
          fetch(`/api/candidates?department_id=${deptId}&limit=10`),
          fetch(`/api/interviews?round_type=dept_round&limit=10`),
        ]);

        const candData = await candRes.json();
        const ivData = await ivRes.json();

        if (candData.data) setCandidates(candData.data);
        if (ivData.data) setInterviews(ivData.data);
      } catch (err) {
        console.error('Error loading manager dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${managerUser?.department_name || 'Department'} Technical Assessment`}
        description="Review departmental candidates, conduct technical interviews, record question-by-question scoring and provide committee recommendations."
        actions={
          <Link href="/manager/interviews">
            <Button variant="primary" size="sm">
              <Calendar className="w-4 h-4 mr-1.5" /> Interview Queue
            </Button>
          </Link>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Department Candidates</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {loading ? <Skeleton className="h-8 w-12" /> : candidates.length}
            </h3>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">Assigned for evaluation</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending R2 Interviews</p>
            <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {loading ? <Skeleton className="h-8 w-12" /> : interviews.filter(i => i.status !== 'completed').length}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Awaiting technical scoring</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Assessments</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {loading ? <Skeleton className="h-8 w-12" /> : interviews.filter(i => i.status === 'completed').length}
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">Submitted to committee</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Department Interview Queue */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Assigned Technical Interviews (Round 2)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Department-specific technical questions, rubric scoring, and voice recording</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading interview queue...</div>
          ) : interviews.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              No technical interviews currently scheduled for this department.
            </div>
          ) : (
            interviews.map((iv) => (
              <div
                key={iv.id}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {iv.candidate_name || `Candidate #${iv.candidate_id}`}
                  </h4>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Scheduled: {iv.scheduled_at ? new Date(iv.scheduled_at).toLocaleString() : 'Date Pending'}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={iv.status === 'completed' ? 'success' : 'warning'} size="sm">
                    {iv.status?.toUpperCase()}
                  </Badge>
                  <Link href={`/hr/interviews/${iv.id}`}>
                    <Button variant="primary" size="sm">
                      <Play className="w-3.5 h-3.5 mr-1" /> Conduct Interview
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
