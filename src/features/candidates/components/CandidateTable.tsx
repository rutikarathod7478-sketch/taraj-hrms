'use client';

import React from 'react';
import Link from 'next/link';
import { Candidate } from '@/types/candidate';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { Eye, Mic, ArrowRight } from 'lucide-react';

export interface CandidateTableProps {
  candidates: Candidate[];
  loading?: boolean;
}

export const CandidateTable: React.FC<CandidateTableProps> = ({ candidates, loading }) => {
  const columns: Column<Candidate>[] = [
    {
      key: 'candidate_code',
      header: 'Candidate / Code',
      render: (c) => (
        <div>
          <Link
            href={`/hr/candidates/${c.id}`}
            className="font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 block text-sm"
          >
            {c.full_name}
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-mono text-slate-500">{c.candidate_code}</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
              {c.candidate_type}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'position',
      header: 'Role & Dept',
      render: (c) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100 text-xs">
            {c.position_title || 'Position Pending'}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {c.department_name || 'General'}
          </p>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (c) => (
        <div className="text-xs">
          <p className="text-slate-800 dark:text-slate-200">{c.email}</p>
          <p className="text-slate-500 font-mono text-[11px]">{c.phone}</p>
        </div>
      ),
    },
    {
      key: 'rounds',
      header: 'Interview Progress',
      render: (c) => (
        <div className="flex items-center gap-1.5 text-xs">
          {/* Round 1 */}
          <span
            title="Round 1: HR"
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              c.round_1_score !== null && c.round_1_score !== undefined
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
            }`}
          >
            R1: {c.round_1_score !== null && c.round_1_score !== undefined ? `${c.round_1_score}/100` : '—'}
          </span>

          {/* Round 2 */}
          <span
            title="Round 2: Dept"
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              c.round_2_score !== null && c.round_2_score !== undefined
                ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
            }`}
          >
            R2: {c.round_2_score !== null && c.round_2_score !== undefined ? `${c.round_2_score}/10` : '—'}
          </span>

          {/* Round 3 */}
          <span
            title="Round 3: Final"
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              c.round_3_score !== null && c.round_3_score !== undefined
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
            }`}
          >
            R3: {c.round_3_score !== null && c.round_3_score !== undefined ? `${c.round_3_score}/10` : '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => <Badge status={c.application_status} size="sm" />,
    },
    {
      key: 'registered_at',
      header: 'Applied Date',
      render: (c) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {formatDate(c.registered_at || c.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={`/hr/candidates/${c.id}`}
            className="p-1.5 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="View Profile"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link
            href={`/hr/interviews/${c.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 rounded-md transition-colors"
            title="Open Interview"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Interview</span>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={candidates}
      keyExtractor={(c) => c.id}
      loading={loading}
      emptyMessage="No candidates found matching the selected criteria."
    />
  );
};
