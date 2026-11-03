'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { CandidateProfile } from '@/features/candidates/components/CandidateProfile';
import { useToast } from '@/components/feedback/ToastProvider';
import { ArrowLeft, Calendar, Award, UserCheck } from 'lucide-react';

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const candidateId = resolvedParams.id;
  const router = useRouter();
  const { showToast } = useToast();

  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCandidate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/candidates/${candidateId}`);
      const data = await res.json();
      if (res.ok && data.data) {
        setCandidate(data.data);
      } else {
        throw new Error(data.message || 'Candidate not found');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load candidate', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidate();
  }, [candidateId]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Candidate status updated to ${newStatus}`, 'success');
        if (newStatus === 'rejected') {
          router.push('/hr/candidates?tab=rejected');
          return;
        }
        fetchCandidate();
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating status', 'error');
    }
  };

  const handleScheduleInterview = (round: string) => {
    router.push(`/hr/interviews?candidate_id=${candidateId}&round=${round}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/hr/candidates"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Candidate Directory
        </Link>
        <div className="flex gap-2">
          <Link href="/hr/decisions">
            <Button variant="outline" size="sm">
              <Award className="w-4 h-4 mr-1.5" /> Committee Decisions
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          Loading candidate record...
        </div>
      ) : !candidate ? (
        <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          Candidate record not found.
        </div>
      ) : (
        <CandidateProfile
          candidate={candidate}
          onStatusChange={handleStatusChange}
          onScheduleInterview={handleScheduleInterview}
        />
      )}
    </div>
  );
}
