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
  Sun,
  UserCog,
  Mail,
  Lock,
  AtSign,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  Camera,
  Upload,
  Trash2,
  ZoomIn,
  MoveVertical,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import { UserSession } from '@/types/employee';
import { useToast } from '@/components/feedback/ToastProvider';
import { Modal } from '@/components/ui/Modal';

export interface AppNavbarProps {
  user?: UserSession | null;
  onLogout?: () => void;
  onUserUpdate?: (updatedUser: UserSession) => void;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({ user, onLogout, onUserUpdate }) => {
  const router = useRouter();
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(user || null);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [user]);

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [dbNotifications, setDbNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Edit Profile Modal States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null | undefined>(undefined);
  const [rawUploadedImage, setRawUploadedImage] = useState<string | null>(null);
  const [avatarZoom, setAvatarZoom] = useState<number>(1.0);
  const [avatarOffsetY, setAvatarOffsetY] = useState<number>(0);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
  const displayName = currentUser?.full_name && currentUser.full_name !== 'System Admin' 
    ? currentUser.full_name 
    : 'Priya Sharma';
  const firstName = displayName.split(' ')[0] || 'Priya';
  const displayRole = currentUser?.role && currentUser.role !== 'super_admin'
    ? currentUser.role.replace('_', ' ')
    : 'HR Manager';
  const displayEmail = currentUser?.email || 'priya.sharma@tarajglobalsolutions.com';

  const handleOpenEditProfile = () => {
    setProfileOpen(false);
    setEditFullName(currentUser?.full_name || displayName);
    setEditEmail(currentUser?.email || displayEmail);
    setEditUsername(currentUser?.username || '');
    setAvatarPreview(currentUser?.avatar_url || '/images/priya_sharma.jpg');
    setAvatarBase64(undefined);
    setRawUploadedImage(null);
    setAvatarZoom(1.0);
    setAvatarOffsetY(0);
    setShowPasswordChange(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setProfileError(null);
    setIsEditProfileOpen(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Please upload an image file (PNG, JPG, WebP, GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Profile photo size must not exceed 5 MB.');
      return;
    }

    setProfileError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAvatarPreview(dataUrl);
      setRawUploadedImage(dataUrl);
      setAvatarBase64(dataUrl);
      setAvatarZoom(1.0);
      setAvatarOffsetY(0);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setRawUploadedImage(null);
    setAvatarBase64('REMOVE');
    setAvatarZoom(1.0);
    setAvatarOffsetY(0);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const cropImageToSquare = (
    src: string,
    zoom: number,
    offsetYPercent: number,
    size: number = 400
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        const coverScale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
        const totalScale = coverScale * zoom;

        const drawW = img.naturalWidth * totalScale;
        const drawH = img.naturalHeight * totalScale;

        const drawX = (size - drawW) / 2;
        const shiftY = (offsetYPercent / 100) * (size / 2);
        const drawY = (size - drawH) / 2 + shiftY;

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    if (!editFullName.trim()) {
      setProfileError('Full name is required.');
      return;
    }

    if (!editEmail.trim() || !editEmail.includes('@')) {
      setProfileError('A valid email address is required.');
      return;
    }

    if (showPasswordChange) {
      if (!currentPassword) {
        setProfileError('Current password is required to change password.');
        return;
      }
      if (newPassword.length < 6) {
        setProfileError('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setProfileError('New passwords do not match.');
        return;
      }
    }

    setSavingProfile(true);
    try {
      let finalAvatarBase64 = avatarBase64;
      if (rawUploadedImage) {
        finalAvatarBase64 = await cropImageToSquare(rawUploadedImage, avatarZoom, avatarOffsetY);
      }

      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: editFullName.trim(),
          email: editEmail.trim(),
          username: editUsername.trim(),
          current_password: showPasswordChange ? currentPassword : undefined,
          new_password: showPasswordChange ? newPassword : undefined,
          avatar_base64: finalAvatarBase64,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update profile.');
      }

      const updated = json.data.user;
      setCurrentUser(updated);
      setAvatarError(false);
      onUserUpdate?.(updated);
      showToast('Profile and photo updated successfully!', 'success');
      setIsEditProfileOpen(false);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
      showToast(err.message || 'Error updating profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

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
              {!avatarError && (currentUser?.avatar_url || '/images/priya_sharma.jpg') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser?.avatar_url || '/images/priya_sharma.jpg'}
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
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-2xs">
                  {!avatarError && (currentUser?.avatar_url || '/images/priya_sharma.jpg') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentUser?.avatar_url || '/images/priya_sharma.jpg'}
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
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{displayEmail}</p>
                  <span className="inline-block mt-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    Verified {currentUser?.role === 'hr_manager' ? 'HR Manager' : currentUser?.role?.replace('_', ' ') || 'Team Member'}
                  </span>
                </div>
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

                <button
                  type="button"
                  onClick={handleOpenEditProfile}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors cursor-pointer text-left"
                >
                  <UserCog className="w-4 h-4 text-blue-500" />
                  <span>Edit Profile</span>
                </button>

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

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => {
          if (!savingProfile) setIsEditProfileOpen(false);
        }}
        title="Edit Profile"
        description="Update your personal details, profile photo, and account credentials"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
          {/* Profile Photo Uploader Section */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500 shadow-md bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt={displayName}
                    style={{
                      transform: rawUploadedImage
                        ? `scale(${avatarZoom}) translateY(${avatarOffsetY}%)`
                        : undefined,
                      transition: 'transform 0.05s ease-out',
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Quick overlay change button */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                title="Change Photo"
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Profile Photo</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Upload a photo (PNG, JPG, or WebP up to 5 MB).
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarChange}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{avatarPreview ? 'Change Photo' : 'Upload Photo'}</span>
                </button>

                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Photo Fit & Framing Controls (when new photo selected) */}
          {rawUploadedImage && (
            <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-blue-200/60 dark:border-blue-900/40">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Fit & Position in Circle
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarZoom(1.0);
                    setAvatarOffsetY(0);
                  }}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Reset Fit
                </button>
              </div>

              {/* Zoom Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
                    Zoom Photo
                  </span>
                  <span className="font-mono text-[10px]">{Math.round(avatarZoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={avatarZoom}
                  onChange={(e) => setAvatarZoom(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                />
              </div>

              {/* Vertical Position Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <MoveVertical className="w-3.5 h-3.5 text-slate-400" />
                    Move Up / Down (Pan)
                  </span>
                  <span className="font-mono text-[10px]">
                    {avatarOffsetY > 0 ? `+${avatarOffsetY}%` : `${avatarOffsetY}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-35"
                  max="35"
                  step="1"
                  value={avatarOffsetY}
                  onChange={(e) => setAvatarOffsetY(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                />
              </div>

              {/* Live Tip */}
              <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 pt-0.5">
                <Info className="w-3 h-3 text-blue-500 shrink-0" />
                <span>Adjust the sliders so your face is centered and fills ~65% of the circle preview above.</span>
              </p>
            </div>
          )}

          {/* Photo Fit Specifications Helper Card */}
          <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-2.5 text-[11px] text-slate-600 dark:text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold text-slate-800 dark:text-slate-200">Recommended Photo Fit: </span>
              <span>1:1 Square (400 × 400 px), head & shoulders centered. Your face should fill about 60%–70% of the circle with a small margin above the hair.</span>
            </div>
          </div>

          {/* Error Message */}
          {profileError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {profileError}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                placeholder="e.g. Pooja Kumari"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="hrmanager@2207.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="hrmanager@2207.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
              />
            </div>
          </div>

          {/* Password Change Toggle */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setShowPasswordChange(!showPasswordChange);
                setProfileError(null);
              }}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{showPasswordChange ? 'Cancel Password Change' : 'Change Password'}</span>
            </button>

            {showPasswordChange && (
              <div className="mt-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Security Credentials
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="text-[10px] text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-1 cursor-pointer"
                  >
                    {showPasswords ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPasswords ? 'Hide' : 'Show'} Passwords</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Confirm New Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={savingProfile}
              onClick={() => setIsEditProfileOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {savingProfile ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </header>
  );
};
