'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Eye,
  Mail,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/feedback/ToastProvider';
import { Employee } from '@/types/employee';

export default function EmployeesListPage() {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);

  // Profile Modal State
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch departments
  useEffect(() => {
    async function fetchDepts() {
      try {
        const res = await fetch('/api/departments');
        const data = await res.json();
        if (data.data) {
          setDepartments(data.data);
        }
      } catch {
        setDepartments([
          { id: 1, name: 'Quality' },
          { id: 2, name: 'Development' },
          { id: 3, name: 'Management' },
          { id: 4, name: 'Sales' },
          { id: 5, name: 'HR' },
          { id: 6, name: 'Operations' },
          { id: 7, name: 'DBMS' },
          { id: 8, name: 'Email Marketing' },
        ]);
      }
    }
    fetchDepts();
  }, []);

  // Fetch active employees who gave interviews and joined
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedDeptId) params.set('department_id', selectedDeptId);

      const res = await fetch(`/api/employees?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.data) {
        setEmployees(data.data);
      } else {
        throw new Error(data.error || 'Failed to load employees list');
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading employee directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [selectedDeptId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmployees();
  };

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Status filter
      if (selectedStatus !== 'All') {
        const s = (emp.status || '').toLowerCase();
        if (selectedStatus === 'Active' && s !== 'active') return false;
        if (selectedStatus === 'Joined' && s !== 'joined' && s !== 'active') return false;
      }

      // Search query client-side refinement
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = emp.full_name?.toLowerCase().includes(q);
        const matchesCode = emp.employee_code?.toLowerCase().includes(q);
        const matchesEmail = emp.email?.toLowerCase().includes(q);
        const matchesDept = emp.department_name?.toLowerCase().includes(q);
        const matchesRole = emp.position_title?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesEmail && !matchesDept && !matchesRole) {
          return false;
        }
      }

      return true;
    });
  }, [employees, searchQuery, selectedStatus]);

  // Paginated records
  const totalRecords = filteredEmployees.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  // Format joining date (e.g. 10 Oct 2026)
  const formatEmployeeJoinDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Active';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Active';
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Active';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar: Title and Subtitle */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Employee Directory
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Personnel actively working in the organization after successfully completing interview rounds.
        </p>
      </div>

      {/* 2. Main Employees Table */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-4 font-bold">Name</th>
                <th className="py-3.5 px-4 font-bold">Phone</th>
                <th className="py-3.5 px-4 font-bold">Department</th>
                <th className="py-3.5 px-4 font-bold">Job Role</th>
                <th className="py-3.5 px-4 font-bold">Joined Date</th>
                <th className="py-3.5 px-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Loading active workforce records...</p>
                  </td>
                </tr>
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No active employees found.
                  </td>
                </tr>
              ) : (
                paginatedList.map((emp) => {
                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Name with Email underneath */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {emp.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <button
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setIsModalOpen(true);
                              }}
                              className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                            >
                              {emp.full_name}
                            </button>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                              {emp.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium">
                        {emp.phone || '—'}
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {emp.department_name || 'General'}
                        </span>
                      </td>

                      {/* Job Role */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                        {emp.position_title || 'Active Employee'}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatEmployeeJoinDate(emp.join_date)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors cursor-pointer"
                            title="View Employee Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a
                            href={`mailto:${emp.email}`}
                            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Send Email"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Bar matching other pages */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                  currentPage === i + 1
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-medium">
            <span>
              Showing {totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords}
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              10 / page
            </span>
          </div>
        </div>
      </div>

      {/* 6. Employee Details Modal */}
      {selectedEmployee && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Employee Record: ${selectedEmployee.full_name}`}
        >
          <div className="space-y-5">
            {/* Top Profile Card */}
            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-blue-100 dark:border-slate-700">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                {selectedEmployee.full_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {selectedEmployee.full_name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    {selectedEmployee.employee_code}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {selectedEmployee.position_title}
                  </span>
                </div>
              </div>
            </div>

            {/* Employment & Interview Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <p className="text-[11px] text-slate-400 font-medium">Department</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedEmployee.department_name}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <p className="text-[11px] text-slate-400 font-medium">Joining Date</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {formatEmployeeJoinDate(selectedEmployee.join_date)}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <p className="text-[11px] text-slate-400 font-medium">Employment Status</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Active (Joined)
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <p className="text-[11px] text-slate-400 font-medium">Interview Evaluation</p>
                <p className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  {selectedEmployee.round_3_score ? '3 Rounds Cleared' : 'Interview Cleared'}
                </p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email Address</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedEmployee.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Contact Number</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedEmployee.phone}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
              <a
                href={`mailto:${selectedEmployee.email}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Email</span>
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
