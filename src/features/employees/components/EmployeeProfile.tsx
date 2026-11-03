'use client';

import React, { useState } from 'react';
import { Employee, EmployeeStatus } from '@/types/employee';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/feedback/ToastProvider';
import { User, Mail, Phone, Calendar, Briefcase, Building, ShieldCheck } from 'lucide-react';

export interface EmployeeProfileProps {
  employee: Employee;
  canEdit?: boolean;
}

export const EmployeeProfile: React.FC<EmployeeProfileProps> = ({ employee, canEdit = false }) => {
  const { success, error } = useToast();
  const [status, setStatus] = useState<EmployeeStatus>(employee.status);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const handleStatusUpdate = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: employee.id,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update employment status.');
      }
      success('Employment status updated successfully!');
    } catch (err: unknown) {
      const e = err as Error;
      error('Update Error', e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
              {employee.full_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{employee.full_name}</h2>
                <Badge status={status} />
              </div>
              <p className="text-sm text-slate-500 font-mono mt-0.5">{employee.employee_code}</p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
                {employee.position_title} • {employee.department_name}
              </p>
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-3 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 dark:border-slate-800">
              <Select
                value={status}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'probation', label: 'Probation' },
                  { value: 'notice', label: 'Notice Period' },
                  { value: 'terminated', label: 'Terminated' },
                  { value: 'resigned', label: 'Resigned' },
                ]}
                onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
              />
              <Button
                variant="primary"
                size="sm"
                isLoading={isUpdating}
                onClick={handleStatusUpdate}
              >
                Update
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          Employment & Organization Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
          <div className="flex items-start gap-3">
            <Building className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">Department</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {employee.department_name || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Briefcase className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">Designation / Role</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {employee.position_title || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">Official Join Date</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {formatDate(employee.join_date)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">Corporate Email</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {employee.email}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">Contact Number</p>
              <p className="font-semibold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                {employee.phone}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">Account Verification</p>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                Verified & Enrolled
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
