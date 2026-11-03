'use client';

import React from 'react';
import Link from 'next/link';
import { CandidateForm } from '@/features/candidates/components/CandidateForm';
import {
  ArrowLeft,
  ShieldCheck,
  Search,
  CheckCircle2,
  Sparkles,
  Building2,
  FileCheck2,
  Users2
} from 'lucide-react';

export default function CandidateRegisterPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Ambient Radial Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-blue-600/15 via-indigo-600/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[500px] bg-indigo-500/10 blur-[160px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:32px_32px] opacity-20 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,#000_70%,transparent_100%)]" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-white block leading-tight">
                Taraj Global Solutions
              </span>
              <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase block">
                HRIMS Careers Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>

            <Link
              href="/application-status"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600/90 hover:bg-blue-600 border border-blue-500/40 shadow-sm shadow-blue-600/30 transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track Application</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Page Container */}
      <main className="relative z-10 max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        {/* Compact Hero Header */}
        <div className="text-center mb-6 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[11px] font-bold border border-blue-500/20 mb-2.5 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Fast-Track Direct Hiring Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Candidate Application Portal
          </h1>

          <p className="mt-1 text-xs text-slate-400 font-medium">
            Taraj Global Solutions &bull; Complete the 3-step application form below
          </p>

          {/* Compact Inline Roadmap Strip */}
          <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
              <span className="w-4 h-4 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[10px] font-bold">1</span>
              HR Screening
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
              <span className="w-4 h-4 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-[10px] font-bold">2</span>
              Technical Round
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-4 h-4 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center text-[10px] font-bold">3</span>
              Practical &amp; Offer
            </span>
          </div>
        </div>

        {/* Master Step-By-Step Application Form */}
        <div className="mt-2">
          <CandidateForm isPublic={true} />
        </div>

        {/* Industry Trust & Confidentiality Footer */}
        <footer className="mt-8 text-center border-t border-slate-800/80 pt-5 pb-2 text-xs text-slate-500">
          <div className="flex flex-wrap items-center justify-center gap-5 mb-2 text-[11px] font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              100% Confidential
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              Direct Recruiter Review
            </span>
            <span className="flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-indigo-500" />
              Instant Tracking ID
            </span>
          </div>
          <p className="text-[11px] text-slate-600">
            &copy; {new Date().getFullYear()} Taraj Global Solutions. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
