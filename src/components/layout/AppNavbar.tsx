'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  MoreVertical,
  User,
  Settings,
  LogOut,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Briefcase,
  Users,
  Award,
  Moon,
  Sun
} from 'lucide-react';
import { UserSession } from '@/types/employee';

export interface AppNavbarProps {
  user?: UserSession | null;
  onLogout?: () => void;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({ user, onLogout }) => {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [dbNotifications, setDbNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchLiveNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          setDbNotifications(json.data.notifications || []);
          setUnreadCount(json.data.unreadCount || 0);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchLiveNotifications();
    const interval = setInterval(fetchLiveNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      setUnreadCount(0);
      setDbNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchFocused(false);
      router.push(`/hr/candidates?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark');
    }
  };

  // Match design screenshot: Priya Sharma | HR Manager
  const displayName = user?.full_name && user.full_name !== 'System Admin' 
    ? user.full_name 
    : 'Priya Sharma';
  const firstName = displayName.split(' ')[0] || 'Priya';
  const displayRole = user?.role && user.role !== 'super_admin'
    ? user.role.replace('_', ' ')
    : 'HR Manager';
  const displayEmail = user?.email || 'priya.sharma@tarajglobalsolutions.com';

  const getGreetingData = () => {
    // US Eastern Time (America/New_York)
    let hour = new Date().getHours();
    try {
      const usHourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        hour12: false,
      }).format(new Date());
      const parsed = parseInt(usHourStr, 10);
      if (!isNaN(parsed)) {
        hour = parsed;
      }
    } catch {}

    if (hour >= 5 && hour < 12) {
      return { greeting: 'Good morning', emoji: '☀️' };
    }
    if (hour >= 12 && hour < 17) {
      return { greeting: 'Good afternoon', emoji: '🌤️' };
    }
    if (hour >= 17 && hour < 22) {
      return { greeting: 'Good evening', emoji: '🌆' };
    }
    return { greeting: 'Good night', emoji: '🌙' };
  };

  const greetingInfo = getGreetingData();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* 1. Left Section: User Greeting in US Time (Replaces Search Bar) */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 dark:border-blue-400/20 flex items-center justify-center text-base shrink-0 select-none shadow-2xs">
          {greetingInfo.emoji}
        </div>
        <div className="flex items-center">
          <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {greetingInfo.greeting} {firstName}
          </span>
        </div>
      </div>


      {/* 2. Right Section: Notifications Bell & User Profile */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 bg-blue-600 text-[9px] font-black text-white rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-sm animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </button>

          {/* Notifications Flyout */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs max-h-80 overflow-y-auto">
                {dbNotifications.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    No recent notifications
                  </div>
                ) : (
                  dbNotifications.slice(0, 6).map((n) => {
                    const isRegistration = n.type === 'candidate_registration' || (n.title && n.title.includes('Candidate'));
                    return (
                      <Link
                        key={n.id}
                        href={n.link || '/hr/candidates'}
                        onClick={() => setNotificationsOpen(false)}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-colors ${
                          !n.is_read
                            ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/60 hover:bg-slate-100'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isRegistration
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-blue-500/10 text-blue-600'
                          }`}
                        >
                          {isRegistration ? <Sparkles className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] truncate">
                              {n.title}
                            </p>
                            {!n.is_read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 ml-1" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <Link
                  href="/hr/candidates"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View All Candidates Pipeline →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile matching the screenshot layout */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer group"
          >
            {/* User Avatar Image with Fallback */}
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-2xs">
              {!avatarError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/images/priya_sharma.jpg"
                  alt={displayName}
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name & Subtitle */}
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {displayName}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize leading-tight mt-0.5">
                {displayRole}
              </p>
            </div>

            {/* Kebab Icon (3 vertical dots) */}
            <div className="p-1 text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300">
              <MoreVertical className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* User Profile Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{displayName}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{displayEmail}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  Verified HR Manager
                </span>
              </div>

              <div className="py-1">
                <Link
                  href="/hr"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>HR Dashboard</span>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Account Settings</span>
                </Link>

                <button
                  onClick={toggleDarkMode}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-400" />}
                    <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Toggle</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
