'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserCheck,
  X,
  ArrowRight,
  Sparkles,
  Briefcase,
  Bell,
  CheckCircle2
} from 'lucide-react';

export interface PopupCandidateData {
  id?: number | string;
  candidate_code?: string;
  full_name: string;
  department_name?: string;
  position_title?: string;
  email?: string;
  phone?: string;
  time?: string;
  link?: string;
}

function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.55);
  } catch {
    // Browser autoplay policy or audio unsupported
  }
}

export const CandidateRegistrationPopup: React.FC = () => {
  const router = useRouter();
  const [popupData, setPopupData] = useState<PopupCandidateData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const lastSeenIdRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger popup display
  const showPopup = (data: PopupCandidateData) => {
    // Play sound alert
    playNotificationChime();

    setPopupData(data);
    setIsVisible(true);

    // Auto-dismiss after 15 seconds
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 15000);
  };

  const handleClose = () => {
    setIsVisible(false);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
  };

  const handleReview = () => {
    handleClose();
    if (popupData?.link) {
      router.push(popupData.link);
    } else if (popupData?.candidate_code) {
      router.push(`/hr/candidates?search=${encodeURIComponent(popupData.candidate_code)}`);
    } else {
      router.push('/hr/candidates');
    }
  };

  useEffect(() => {
    // 1. Listen via BroadcastChannel (instant in same browser across tabs)
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('hr_notifications');
        channel.onmessage = (event) => {
          if (event.data?.type === 'CANDIDATE_REGISTERED' && event.data?.candidate) {
            const cand = event.data.candidate;
            showPopup({
              id: cand.id,
              candidate_code: cand.candidate_code,
              full_name: cand.full_name,
              department_name: cand.department_name || 'Assigned Department',
              position_title: cand.position_title || 'New Applicant',
              time: 'Just now',
              link: `/hr/candidates?search=${encodeURIComponent(cand.candidate_code || cand.full_name)}`,
            });
          }
        };
      } catch (e) {
        console.error('BroadcastChannel error', e);
      }
    }

    // 2. Listen via LocalStorage event (fallback for multi-tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'hr_new_candidate_registered' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.full_name) {
            showPopup({
              candidate_code: parsed.candidate_code,
              full_name: parsed.full_name,
              department_name: parsed.department_name,
              position_title: parsed.position_title,
              time: 'Just now',
              link: `/hr/candidates?search=${encodeURIComponent(parsed.candidate_code || parsed.full_name)}`,
            });
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Regular polling check from MySQL `/api/notifications`
    // Ensures notifications submitted from external devices/browsers also pop up!
    const pollNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) return;
        const json = await res.json();
        const list = json?.data?.notifications;

        if (Array.isArray(list) && list.length > 0) {
          const highestId = Math.max(...list.map((n: any) => n.id || 0));

          if (isInitialLoadRef.current) {
            // First load: just record highest existing ID so we don't spam old notifications
            lastSeenIdRef.current = highestId;
            isInitialLoadRef.current = false;
            return;
          }

          // Check if there is a newer notification than lastSeenId
          const newRegistrations = list.filter(
            (n: any) =>
              n.id > lastSeenIdRef.current &&
              (n.type === 'candidate_registration' || (n.title && n.title.includes('Candidate')))
          );

          if (newRegistrations.length > 0) {
            const newest = newRegistrations[0];
            lastSeenIdRef.current = highestId;

            // Extract candidate name from title or message
            // Message format: "Full Name (TGS-CAN-XXXX) registered for Department."
            const match = newest.message?.match(/^(.+?)\s*\((TGS-CAN-\d+)\)\s*registered for\s*(.+?)\.?$/i);
            const candName = match ? match[1] : newest.title;
            const candCode = match ? match[2] : '';
            const candDept = match ? match[3] : '';

            showPopup({
              candidate_code: candCode,
              full_name: candName || 'New Candidate',
              department_name: candDept || 'Application Received',
              time: 'Just now',
              link: newest.link || (candCode ? `/hr/candidates?search=${encodeURIComponent(candCode)}` : '/hr/candidates'),
            });
          } else {
            lastSeenIdRef.current = highestId;
          }
        }
      } catch (err) {
        // Silently catch polling errors
      }
    };

    // Initial check
    pollNotifications();

    // Poll every 4 seconds
    const interval = setInterval(pollNotifications, 4000);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  if (!isVisible || !popupData) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-blue-500/30 dark:border-blue-500/40 p-4 sm:p-5 relative overflow-hidden ring-4 ring-blue-500/10">
        {/* Decorative Top Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Live Badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/80 dark:border-blue-800/80 relative">
            <UserCheck className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/90 text-blue-700 dark:text-blue-300">
                New Candidate Applied
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {popupData.time || 'Just now'}
              </span>
            </div>
          </div>
        </div>

        {/* Candidate Details */}
        <div className="space-y-1.5 mb-4 pl-1">
          <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
            {popupData.full_name}
          </h4>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            {popupData.candidate_code && (
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px]">
                {popupData.candidate_code}
              </span>
            )}
            {popupData.department_name && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <Briefcase className="w-3 h-3 text-slate-400" />
                {popupData.department_name}
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
            Application registration form submitted successfully. Candidate is ready for HR screening review.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            onClick={handleReview}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-500/20 hover:shadow-md transition-all cursor-pointer"
          >
            <span>Review Candidate</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleClose}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
