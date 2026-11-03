'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Award,
  Briefcase,
  ClipboardCheck,
  UserCheck,
  FileCheck,
  FileText,
  Settings,
  HelpCircle,
  LucideIcon,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAVIGATION_CONFIG } from '@/config/navigation';
import { UserSession } from '@/types/employee';

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Award,
  Briefcase,
  ClipboardCheck,
  UserCheck,
  FileCheck,
  FileText,
  HelpCircle,
  Settings,
};

export interface AppSidebarProps {
  user?: UserSession | null;
  onLogout?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ user, onLogout }) => {
  const pathname = usePathname();
  const userRole = user?.role || 'super_admin';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  return (
    <aside className="w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-800 z-40 select-none">
      {/* Brand Header */}
      <Link
        href={userRole === 'dept_manager' ? '/manager' : '/hr'}
        className="h-16 px-6 flex items-center gap-3 border-b border-slate-800 bg-slate-950 hover:bg-slate-900/80 transition-colors shrink-0"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white text-base shadow-md ring-1 ring-white/10">
          TG
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide">Taraj Global</h1>
          <p className="text-[11px] text-blue-400 font-medium">HRIMS Recruitment</p>
        </div>
      </Link>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto min-h-0">
        {NAVIGATION_CONFIG.map((section) => {
          const visibleItems = section.items.filter(
            (item) => item.roles.includes(userRole) || userRole === 'super_admin'
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              <div className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                {section.title}
              </div>
              {visibleItems.map((item) => {
                const Icon = ICON_MAP[item.iconName] || HelpCircle;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/hr' && item.href !== '/manager' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group',
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200')} />
                      <span>{item.title}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-semibold border border-blue-500/30">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User Session Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70 shrink-0">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center font-semibold text-xs text-white shrink-0">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'Admin User'}</p>
              <p className="text-[10px] text-slate-400 truncate capitalize">
                {user?.role?.replace('_', ' ') || 'Super Admin'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-2 px-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] text-slate-400">MySQL: Active</span>
          <span className="text-[11px] text-slate-600 ml-auto">v2.0</span>
        </div>
      </div>
    </aside>
  );
};
