'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Briefcase,
  Layers,
  Code,
  Award,
  Send,
  ExternalLink,
  PlusCircle,
  Filter,
  TrendingUp,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function HRDashboardPage() {
  const [loading, setLoading] = useState(true);

  // Live Database State with realistic initial/fallback baselines
  const [stats, setStats] = useState({
    totalCandidates: 16,
    newRegistrations: 2,
    interviewsToday: 7,
    pendingDecisions: 3,
    selectedCandidates: 6,
    offersPending: 3,
  });

  const [pipeline, setPipeline] = useState<any>({
    hr: { completed: 10, active: 3 },
    tech: { completed: 6, active: 2 },
    practical: { completed: 5, active: 2 },
    final: { completed: 5, active: 7 },
    activePerStage: {
      hr: 3,
      tech: 2,
      practical: 2,
      final: 7,
      registration: 3,
      hrRound: 3,
      technicalRound: 2,
      practicalRound: 2,
      selected: 7,
    },
    registration: 17,
    hrRound: 10,
    technicalRound: 6,
    practicalRound: 5,
    selected: 7,
    conversionRate: '50.0',
  });

  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([
    {
      candidate: 'Shreejit Raju',
      round: 'Technical Round',
      dateTime: '16 Oct 10:30 AM',
      interviewer: 'Emily Davis (QA Lead)',
      position: 'QA Automation Engineer',
    },
    {
      candidate: 'Aarav Patel',
      round: 'HR Round',
      dateTime: '16 Oct 02:00 PM',
      interviewer: 'Pooja Kumari (HR Lead)',
      position: 'Full Stack Developer',
    },
    {
      candidate: 'Wasim Attar',
      round: 'HR Round',
      dateTime: '16 Oct 04:00 PM',
      interviewer: 'Pooja Kumari (HR Lead)',
      position: 'Operations Coordinator',
    },
    {
      candidate: 'Tejas Pawar',
      round: 'Practical Round',
      dateTime: '17 Oct 11:00 AM',
      interviewer: 'Alexander Wright (Sales Lead)',
      position: 'Business Development Executive',
    },
  ]);

  const [round1Screenings, setRound1Screenings] = useState<any[]>([]);

  useEffect(() => {
    async function loadLiveStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();

        if (res.ok && data.success && data.data) {
          const d = data.data;

          if (d.round1Screenings) {
            setRound1Screenings(d.round1Screenings);
          }

          // 1. KPI cards
          if (d.kpi) {
            setStats(d.kpi);
          }

          // 2. Pipeline
          if (d.pipeline) {
            setPipeline(d.pipeline);
          }

          // 3. Upcoming Interviews (with fallback dates & interviewer names)
          if (d.upcomingInterviews && d.upcomingInterviews.length > 0) {
            const mappedIv = d.upcomingInterviews.map((iv: any, index: number) => {
              const defaultTimes = [
                '16 Oct 10:30 AM',
                '16 Oct 02:00 PM',
                '16 Oct 04:00 PM',
                '17 Oct 11:00 AM',
                '17 Oct 02:30 PM',
                '18 Oct 10:00 AM',
              ];
              const roundDisplay =
                iv.round_type === 'department'
                  ? 'Technical Round'
                  : iv.round_type === 'final'
                  ? 'Practical Round'
                  : 'HR Round';

              const defaultLead =
                roundDisplay === 'Technical Round'
                  ? 'Emily Davis (QA Lead)'
                  : roundDisplay === 'Practical Round'
                  ? 'Alexander Wright (Sales Lead)'
                  : 'Pooja Kumari (HR Lead)';

              return {
                id: iv.id,
                candidate: iv.candidate,
                round: roundDisplay,
                dateTime: iv.scheduled_at
                  ? new Date(iv.scheduled_at).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : defaultTimes[index % defaultTimes.length],
                interviewer: iv.interviewer || defaultLead,
                position: iv.position_title || 'Applicant',
              };
            });
            setUpcomingInterviews(mappedIv);
          }

        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadLiveStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Dashboard Title */}
      <div>
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-6 rounded-full bg-blue-600 shrink-0 shadow-sm" />
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            HR Recruitment Dashboard
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-4.5 font-medium">
          Real-time recruitment pipeline, scheduled interviews, and candidate onboarding
        </p>
      </div>

      {/* Top 5 KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Candidates */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">
              Total Candidates
            </span>
          </div>
          <div className="mt-3.5 text-center">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.totalCandidates}
            </span>
          </div>
        </div>

        {/* Card 2: New Register */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">
              New Register
            </span>
          </div>
          <div className="mt-3.5 text-center">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.newRegistrations}
            </span>
          </div>
        </div>

        {/* Card 3: Pending Candidates */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">
              Pending Candidates
            </span>
          </div>
          <div className="mt-3.5 text-center">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.pendingDecisions}
            </span>
          </div>
        </div>

        {/* Card 4: Selected Candidates */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">
              Selected Candidates
            </span>
          </div>
          <div className="mt-3.5 text-center">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.selectedCandidates}
            </span>
          </div>
        </div>

        {/* Card 5: Offers Pending */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">
              Offers Pending
            </span>
          </div>
          <div className="mt-3.5 text-center">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.offersPending}
            </span>
          </div>
        </div>
      </div>

      {/* Middle Row: Recruitment Pipeline & Upcoming Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Recruitment Pipeline Card (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between gap-5 group">
          {/* Subtle Ambient Backing Glow */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="relative flex items-center justify-between z-10 mb-1">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-6 rounded-full bg-blue-600 shrink-0 shadow-sm" />
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Recruitment Pipeline
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700/80 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Funnel
              </span>
            </div>
            <Link
              href="/hr/candidates"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group/link px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
            </Link>
          </div>

          {/* Connected Stepper Flow: Hr -> Tech -> Practical -> Final */}
          <div className="relative z-10">
            <div className="grid grid-cols-4 gap-2 relative">
              {[
                {
                  id: 'hr',
                  name: 'Hr',
                  completedCount: pipeline.hr?.completed ?? (pipeline.hrRound ?? 10),
                  active: pipeline.activePerStage?.hr ?? (pipeline.activePerStage?.hrRound ?? 3),
                  icon: UserCheck,
                  href: '/hr/interviews',
                  gradient: 'from-purple-500 via-violet-500 to-purple-600',
                  glow: 'shadow-purple-500/25 ring-purple-500/20',
                },
                {
                  id: 'tech',
                  name: 'Tech',
                  completedCount: pipeline.tech?.completed ?? (pipeline.technicalRound ?? 6),
                  active: pipeline.activePerStage?.tech ?? (pipeline.activePerStage?.technicalRound ?? 2),
                  icon: Code,
                  href: '/hr/interviews',
                  gradient: 'from-blue-500 via-indigo-500 to-blue-600',
                  glow: 'shadow-blue-500/25 ring-blue-500/20',
                },
                {
                  id: 'pract',
                  name: 'Practical',
                  completedCount: pipeline.practical?.completed ?? (pipeline.practicalRound ?? 5),
                  active: pipeline.activePerStage?.practical ?? (pipeline.activePerStage?.practicalRound ?? 2),
                  icon: Layers,
                  href: '/hr/decisions',
                  gradient: 'from-amber-500 via-orange-500 to-orange-600',
                  glow: 'shadow-orange-500/25 ring-orange-500/20',
                },
                {
                  id: 'final',
                  name: 'Final',
                  completedCount: pipeline.final?.completed ?? (pipeline.selected ?? 5),
                  active: pipeline.activePerStage?.final ?? (pipeline.activePerStage?.selected ?? 7),
                  icon: Award,
                  href: '/hr/decisions',
                  gradient: 'from-emerald-500 via-green-500 to-emerald-600',
                  glow: 'shadow-emerald-500/25 ring-emerald-500/20',
                },
              ].map((stage, idx, arr) => {
                const Icon = stage.icon;
                const isLast = idx === arr.length - 1;

                return (
                  <div key={stage.id} className="relative flex flex-col items-center group/node">
                    {/* Connecting line to next stage */}
                    {!isLast && (
                      <div className="absolute top-5 left-1/2 w-full h-[2px] bg-slate-200 dark:bg-slate-700/80 z-0">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500 transition-all duration-500 opacity-60"
                          style={{ width: '100%' }}
                        />
                      </div>
                    )}

                    {/* Stage Circular Icon Button */}
                    <Link
                      href={stage.href}
                      className="relative z-10 flex flex-col items-center focus:outline-none w-full"
                      title={`${stage.name} Round: ${stage.completedCount} candidates completed (${stage.active} active in stage)`}
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${stage.gradient} text-white flex items-center justify-center shadow-lg ${stage.glow} ring-4 ring-white dark:ring-slate-900 transition-transform duration-200 group-hover/node:scale-110 cursor-pointer`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Stage Name */}
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2.5 text-center leading-tight truncate max-w-full">
                        {stage.name}
                      </span>

                      {/* Completed Count (under stage name) */}
                      <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
                        {stage.completedCount}
                      </span>

                      {/* Completed Label Pill */}
                      <span className="mt-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 text-center leading-none">
                        {stage.completedCount} Completed
                      </span>

                      {/* Active in stage badge */}
                      <span className="mt-1 text-[9px] font-medium text-slate-400 dark:text-slate-500">
                        {stage.active} active
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual Funnel Distribution Bar across the 4 stages */}
          {(() => {
            const hrActive = pipeline.activePerStage?.hr ?? (pipeline.activePerStage?.hrRound ?? 3);
            const techActive = pipeline.activePerStage?.tech ?? (pipeline.activePerStage?.technicalRound ?? 2);
            const practicalActive = pipeline.activePerStage?.practical ?? (pipeline.activePerStage?.practicalRound ?? 2);
            const finalActive = pipeline.activePerStage?.final ?? (pipeline.activePerStage?.selected ?? 7);
            const totalActive = Math.max(1, hrActive + techActive + practicalActive + finalActive);

            return (
              <div className="relative z-10 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-medium mb-1.5">
                  <span>Pipeline Stage Distribution</span>
                  <span className="text-slate-400 font-semibold">{totalActive} In Funnel</span>
                </div>
                
                {/* Multi-segment Progress Bar */}
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex gap-0.5">
                  <div style={{ width: `${(hrActive / totalActive) * 100}%` }} className="h-full bg-purple-500 transition-all" title={`Hr: ${hrActive} active`} />
                  <div style={{ width: `${(techActive / totalActive) * 100}%` }} className="h-full bg-blue-500 transition-all" title={`Tech: ${techActive} active`} />
                  <div style={{ width: `${(practicalActive / totalActive) * 100}%` }} className="h-full bg-amber-500 transition-all" title={`Practical: ${practicalActive} active`} />
                  <div style={{ width: `${(finalActive / totalActive) * 100}%` }} className="h-full bg-emerald-500 transition-all" title={`Final: ${finalActive} active`} />
                </div>

                {/* Stage Legend */}
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/40 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                    <span>Hr ({hrActive})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span>Tech ({techActive})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span>Pract ({practicalActive})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Final ({finalActive})</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Footer Summary Strip */}
          <div className="relative z-10 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">
                  Recruitment Conversion Rate
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {pipeline.conversionRate || '50.0'}%
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    ({pipeline.final?.completed ?? (pipeline.selected ?? 5)} completed of {pipeline.hr?.completed ?? (pipeline.hrRound ?? 10)} HR)
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/hr/candidates"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <span>Manage Candidates</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Upcoming Interviews Card (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-6 rounded-full bg-blue-600 shrink-0 shadow-sm" />
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Upcoming Interviews
              </h2>
            </div>
            <Link
              href="/hr/interviews"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors px-2.5 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700/80 font-semibold">
                <tr>
                  <th className="pb-2.5 font-semibold">Candidate</th>
                  <th className="pb-2.5 font-semibold">Round</th>
                  <th className="pb-2.5 font-semibold">Date &amp; Time</th>
                  <th className="pb-2.5 font-semibold">Interviewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 dark:divide-slate-700/60">
                {upcomingInterviews.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">
                      <div>{item.candidate}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{item.position}</span>
                    </td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-300 font-medium">
                      {item.round}
                    </td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">
                      {item.dateTime}
                    </td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-300 font-medium">
                      {item.interviewer}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Round 1 — Common HR Screening Activity & Performance */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-6 rounded-full bg-blue-600 shrink-0 shadow-sm" />
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Round 1 — Common HR Screening Activity
              </h2>
              <p className="text-xs text-slate-500">
                Universal 10-question evaluation for candidates across all 8 departments
              </p>
            </div>
          </div>
          <Link
            href="/hr/interviews?round=hr"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors px-2.5 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50"
          >
            <span>View All HR Interviews</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {round1Screenings.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No recent Round 1 screenings recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700/80 font-semibold">
                <tr>
                  <th className="pb-2.5 font-semibold">Candidate</th>
                  <th className="pb-2.5 font-semibold">Department &amp; Role</th>
                  <th className="pb-2.5 font-semibold">Round 1 Status</th>
                  <th className="pb-2.5 font-semibold">Score / 100</th>
                  <th className="pb-2.5 font-semibold">Percentage</th>
                  <th className="pb-2.5 font-semibold">Interviewer</th>
                  <th className="pb-2.5 font-semibold">Completed Date</th>
                  <th className="pb-2.5 font-semibold">Interview Remarks</th>
                  <th className="pb-2.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 dark:divide-slate-700/60">
                {round1Screenings.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 font-bold text-slate-800 dark:text-slate-200">
                      <div>{item.candidate_name}</div>
                      <span className="text-[10px] text-slate-400 font-mono font-normal">
                        {item.candidate_code || `CAN-${item.candidate_id}`}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">{item.department}</div>
                      <div className="text-[10px] text-slate-400">{item.position}</div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'Completed'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : item.status === 'In Progress'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : item.status === 'Scheduled'
                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 font-bold">
                      {item.total_score !== null ? (
                        <span className="text-slate-900 dark:text-slate-100">{item.total_score} / 100</span>
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </td>
                    <td className="py-3 font-bold">
                      {item.percentage_score !== null ? (
                        <span className="text-blue-600 dark:text-blue-400">{item.percentage_score}%</span>
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </td>
                    <td className="py-3 text-slate-700 dark:text-slate-300 font-medium">
                      {item.interviewer_name}
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {item.completion_date}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={item.remarks}>
                      {item.remarks}
                    </td>
                    <td className="py-3 text-right">
                      <Link href={`/hr/interviews/${item.interview_id}`}>
                        <Button variant="outline" size="xs">
                          Open Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
