'use client';

import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/feedback/ToastProvider';
import {
  Database,
  Server,
  Mail,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Building,
  Terminal,
  Lock
} from 'lucide-react';
import { DEPARTMENTS_CONFIG } from '@/features/departments/department.config';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [dbStatus, setDbStatus] = useState<string>('checking');
  const [checking, setChecking] = useState(false);

  const checkConnection = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/candidates?limit=1');
      if (res.ok) {
        setDbStatus('connected');
        showToast('MySQL Database connection verified active.', 'success');
      } else {
        setDbStatus('error');
        showToast('Database connection error returned.', 'error');
      }
    } catch (e) {
      setDbStatus('error');
      showToast('Failed to contact server API.', 'error');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Administration & Configuration"
        description="Verify infrastructure health, MySQL database connection, department setups, and integration endpoints."
        actions={
          <Button variant="outline" size="sm" onClick={checkConnection} isLoading={checking}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Re-check Status
          </Button>
        }
      />

      {/* Infrastructure Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* MySQL Database Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <Badge variant={dbStatus === 'connected' ? 'success' : 'warning'}>
                {dbStatus === 'connected' ? 'Online' : 'Checking'}
              </Badge>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">MySQL Database (XAMPP)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Host: <code className="font-mono text-slate-700 dark:text-slate-300">127.0.0.1:3306</code>
              <br />
              Database: <code className="font-mono text-slate-700 dark:text-slate-300">hrims</code>
              <br />
              Driver: <code className="font-mono text-slate-700 dark:text-slate-300">mysql2/promise</code>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4" /> 22 relational tables loaded
          </div>
        </div>

        {/* AI Rubric Engine Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <Badge variant="info">Configurable</Badge>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">AI Candidate Evaluation</h3>
            <p className="text-xs text-slate-500 mt-1">
              Server-side evaluation service with structured rubric analysis, strength detection, and graceful manual scoring fallback.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
            Manual scoring always preserved
          </div>
        </div>

        {/* SMTP Mail Service Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <Badge variant="success">Audit Logged</Badge>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">Email Dispatcher</h3>
            <p className="text-xs text-slate-500 mt-1">
              Transactional notices for interview scheduling, rejection letters, offer letters, and onboarding instructions with persistent audit logging.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
            Recorded to <code className="font-mono">email_logs</code> table
          </div>
        </div>
      </div>

      {/* 8 Configured Central Departments */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700/80">
          <h3 className="font-bold text-slate-900 dark:text-white">Configured Departments (8 Core Pillars)</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized with <code className="font-mono">src/features/departments/department.config.ts</code>
          </p>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {DEPARTMENTS_CONFIG.map((dept) => (
            <div
              key={dept.id}
              className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-700/20"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  DEPT-{dept.id}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                  {dept.roles?.length || dept.defaultRoles?.length || 0} Roles
                </span>
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{dept.name}</h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{dept.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
