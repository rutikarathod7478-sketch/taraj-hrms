'use client';

import React from 'react';
import Link from 'next/link';
import { Employee } from '@/types/employee';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { Eye, Mail, Phone } from 'lucide-react';

export interface EmployeeTableProps {
  employees: Employee[];
  loading?: boolean;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({ employees, loading }) => {
  const columns: Column<Employee>[] = [
    {
      key: 'employee_code',
      header: 'Employee / Code',
      render: (e) => (
        <div>
          <Link
            href={`/employees/${e.id}`}
            className="font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 block text-sm"
          >
            {e.full_name}
          </Link>
          <span className="text-xs font-mono text-slate-500">{e.employee_code}</span>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department & Designation',
      render: (e) => (
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-200 text-xs">
            {e.position_title || 'Employee'}
          </p>
          <p className="text-[11px] text-slate-500">{e.department_name}</p>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (e) => (
        <div className="text-xs">
          <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Mail className="w-3 h-3 text-slate-400" />
            {e.email}
          </p>
          <p className="text-slate-500 font-mono text-[11px] flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3 text-slate-400" />
            {e.phone}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Employment Status',
      render: (e) => <Badge status={e.status} size="sm" />,
    },
    {
      key: 'join_date',
      header: 'Joining Date',
      render: (e) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {formatDate(e.join_date)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (e) => (
        <Link
          href={`/employees/${e.id}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Profile</span>
        </Link>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={employees}
      keyExtractor={(e) => e.id}
      loading={loading}
      emptyMessage="No employees found in the directory."
    />
  );
};
