'use client';

import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DEPARTMENTS_CONFIG } from '@/features/departments/department.config';

import { CandidateFilterParams } from '@/types/candidate';

export interface CandidateFiltersProps {
  // Individual props
  search?: string;
  onSearchChange?: (value: string) => void;
  departmentId?: string;
  onDepartmentChange?: (value: string) => void;
  status?: string;
  onStatusChange?: (value: string) => void;
  candidateType?: string;
  onCandidateTypeChange?: (value: string) => void;
  onReset?: () => void;

  // Object-based props
  filters?: CandidateFilterParams;
  onFilterChange?: (filters: CandidateFilterParams) => void;
  departments?: Array<{ id: number; name: string }>;
}

export const CandidateFilters: React.FC<CandidateFiltersProps> = ({
  search: propSearch,
  onSearchChange,
  departmentId: propDept,
  onDepartmentChange,
  status: propStatus,
  onStatusChange,
  candidateType: propType,
  onCandidateTypeChange,
  onReset: propReset,
  filters,
  onFilterChange,
  departments,
}) => {
  const currentSearch = filters ? filters.search || '' : propSearch || '';
  const currentDept = filters
    ? filters.department_id ? String(filters.department_id) : 'all'
    : propDept || 'all';
  const currentStatus = filters ? filters.status || 'all' : propStatus || 'all';
  const currentType = filters ? filters.candidate_type || 'all' : propType || 'all';

  const handleSearchChange = (val: string) => {
    if (onFilterChange && filters) {
      onFilterChange({ ...filters, search: val, page: 1 });
    } else if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const handleDeptChange = (val: string) => {
    if (onFilterChange && filters) {
      onFilterChange({ ...filters, department_id: val === 'all' ? undefined : val, page: 1 });
    } else if (onDepartmentChange) {
      onDepartmentChange(val);
    }
  };

  const handleStatusChange = (val: string) => {
    if (onFilterChange && filters) {
      onFilterChange({ ...filters, status: val === 'all' ? undefined : val, page: 1 });
    } else if (onStatusChange) {
      onStatusChange(val);
    }
  };

  const handleTypeChange = (val: string) => {
    if (onFilterChange && filters) {
      onFilterChange({ ...filters, candidate_type: val === 'all' ? undefined : val, page: 1 });
    } else if (onCandidateTypeChange) {
      onCandidateTypeChange(val);
    }
  };

  const handleReset = () => {
    if (onFilterChange) {
      onFilterChange({ page: 1, limit: 10 });
    } else if (propReset) {
      propReset();
    }
  };

  const deptList = departments && departments.length > 0 ? departments : DEPARTMENTS_CONFIG;
  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    ...deptList.map((d: any) => ({ value: String(d.id), label: d.name })),
  ];

  const statusOptions = [
    { value: 'all', label: 'All Application Statuses' },
    { value: 'registered', label: 'Registered' },
    { value: 'hr_interview', label: 'Round 1: HR Interview' },
    { value: 'dept_interview', label: 'Round 2: Dept Interview' },
    { value: 'final_screening', label: 'Round 3: Final Screening' },
    { value: 'evaluation', label: 'Evaluation / Review' },
    { value: 'offered', label: 'Offered' },
    { value: 'joined', label: 'Joined' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'on_hold', label: 'On Hold' },
  ];

  const typeOptions = [
    { value: 'all', label: 'All Experience Levels' },
    { value: 'Fresher', label: 'Fresher' },
    { value: 'Experienced', label: 'Experienced' },
  ];

  const hasActiveFilters = currentSearch || currentDept !== 'all' || currentStatus !== 'all' || currentType !== 'all';

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs mb-6 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input
          placeholder="Search by name, code, email, phone..."
          value={currentSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />

        <Select
          options={departmentOptions}
          value={currentDept}
          onChange={(e) => handleDeptChange(e.target.value)}
        />

        <Select
          options={statusOptions}
          value={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
        />

        <Select
          options={typeOptions}
          value={currentType}
          onChange={(e) => handleTypeChange(e.target.value)}
        />
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-500">Filtered view applied</span>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 font-medium cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset filters</span>
          </button>
        </div>
      )}
    </div>
  );
};
