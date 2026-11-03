'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { OnboardingChecklist } from '@/features/onboarding/components/OnboardingChecklist';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/feedback/ToastProvider';
import { OnboardingCandidateItem } from '@/features/onboarding/onboarding.service';
import { FileCheck, UserPlus, Users, Award, FileText } from 'lucide-react';

export default function OnboardingPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<OnboardingCandidateItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOnboardingCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding');
      const data = await res.json();
      if (res.ok && data.data) {
        setItems(data.data);
      } else {
        throw new Error(data.message || 'Failed to load onboarding candidates');
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading onboarding records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboardingCandidates();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Onboarding & Offer Generation"
        description="Verify candidate credentials, generate PDF offer letters, complete pre-joining checklist, and convert approved candidates into active employees."
        actions={
          <div className="flex gap-2">
            <Link href="/hr/decisions">
              <Button variant="outline" size="sm">
                <Award className="w-4 h-4 mr-1.5" /> Hiring Decisions
              </Button>
            </Link>
            <Link href="/employees">
              <Button variant="primary" size="sm">
                <Users className="w-4 h-4 mr-1.5" /> Workforce Directory
              </Button>
            </Link>
          </div>
        }
      />

      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          Loading onboarding candidate queue...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-8 shadow-sm">
          <EmptyState
            title="No Candidates in Onboarding"
            description="When the hiring committee selects a candidate, they will automatically appear here for document verification, offer letter generation, and employee onboarding."
            actionLabel="View Candidate Decisions"
            onAction={() => {
              window.location.href = '/hr/decisions';
            }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <OnboardingChecklist
              key={item.candidate_id}
              item={item}
              onRefresh={fetchOnboardingCandidates}
            />
          ))}
        </div>
      )}
    </div>
  );
}
