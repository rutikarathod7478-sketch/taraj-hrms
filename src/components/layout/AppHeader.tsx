'use client';

import React from 'react';
import Link from 'next/link';
import { UserSession } from '@/types/employee';
import { Bell, Plus, User, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export interface AppHeaderProps {
  user?: UserSession | null;
  onLogout?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left side details */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700">
          Taraj Global Solutions
        </span>
        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
        <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
          Enterprise HRMS Recruitment Engine
        </span>
      </div>

      {/* Right side actions & profile */}
      <div className="flex items-center gap-3">
        {/* Quick candidate registration link */}
        <Link
          href="/register"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-medium px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Public Candidate Portal</span>
        </Link>

        {/* Notifications Icon */}
        <Link
          href="/notifications"
          className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
        </Link>

        {/* Profile Card */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center text-xs font-bold ring-2 ring-blue-500/20">
            {user?.full_name ? user.full_name.charAt(0) : <User className="w-4 h-4" />}
          </div>
          <div className="text-left hidden md:block">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {user?.full_name || 'HR Admin'}
              </p>
              {user?.role && (
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  ({user.role.replace('_', ' ')})
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {user?.email || 'hr@tarajglobalsolutions.com'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
