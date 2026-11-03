import React from 'react';
import { cn } from '@/lib/utils';
import { CandidateStatus } from '@/types/candidate';
import { InterviewStatus } from '@/types/interview';
import { EmployeeStatus } from '@/types/employee';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'purple' | 'cyan' | 'info';
  size?: 'sm' | 'md' | 'lg';
  status?: CandidateStatus | InterviewStatus | EmployeeStatus | string;
  className?: string;
}

const STATUS_MAP: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  // Candidate application status
  registered: { label: 'Registered', variant: 'neutral' },
  hr_interview: { label: 'HR Interview', variant: 'primary' },
  dept_interview: { label: 'Dept Interview', variant: 'cyan' },
  final_screening: { label: 'Final Screening', variant: 'purple' },
  evaluation: { label: 'In Evaluation', variant: 'warning' },
  offered: { label: 'Offered', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
  on_hold: { label: 'On Hold', variant: 'warning' },
  joined: { label: 'Joined', variant: 'success' },

  // Interview status
  scheduled: { label: 'Scheduled', variant: 'primary' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },

  // Employee status
  active: { label: 'Active', variant: 'success' },
  probation: { label: 'Probation', variant: 'warning' },
  notice: { label: 'Notice Period', variant: 'danger' },
  terminated: { label: 'Terminated', variant: 'danger' },
  resigned: { label: 'Resigned', variant: 'neutral' },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  size = 'md',
  status,
  className,
}) => {
  let mappedVariant = variant || (status && STATUS_MAP[status]?.variant) || 'neutral';
  let label = children;

  if (status && STATUS_MAP[status]) {
    label = label || STATUS_MAP[status].label;
  }

  const variants = {
    primary: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    info: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-xs font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border transition-colors',
        variants[mappedVariant || 'neutral'],
        sizes[size],
        className
      )}
    >
      {label}
    </span>
  );
};
