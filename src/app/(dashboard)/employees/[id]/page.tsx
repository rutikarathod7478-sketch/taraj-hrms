'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmployeeProfile } from '@/features/employees/components/EmployeeProfile';
import { useToast } from '@/components/feedback/ToastProvider';
import { ArrowLeft, Users } from 'lucide-react';
import { Employee } from '@/types/employee';

export default function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const employeeId = resolvedParams.id;
  const { showToast } = useToast();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEmployee() {
      setLoading(true);
      try {
        const res = await fetch(`/api/employees?id=${employeeId}`);
        const data = await res.json();
        if (res.ok && data.data && data.data.length > 0) {
          setEmployee(data.data[0]);
        } else {
          throw new Error(data.message || 'Employee record not found');
        }
      } catch (err: any) {
        showToast(err.message || 'Error loading employee details', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadEmployee();
  }, [employeeId, showToast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/employees"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Employee Directory
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          Loading employee profile...
        </div>
      ) : !employee ? (
        <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          Employee profile not found.
        </div>
      ) : (
        <EmployeeProfile employee={employee} canEdit={true} />
      )}
    </div>
  );
}
