'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/feedback/ToastProvider';
import {
  ShieldCheck,
  User,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Briefcase,
  Search,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Invalid credentials. Please try again.');
      }

      showToast('Welcome back! Redirecting to workspace...', 'success');

      // Role based redirection
      const role = data.data?.role || data.data?.user?.role;
      if (role === 'dept_manager') {
        router.push('/manager');
      } else if (role === 'employee') {
        router.push('/employees');
      } else {
        router.push('/hr');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-950 text-white overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* 1. Ambient Background Glows & Grid Mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top Center Radiant Indigo / Blue Glow */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent blur-[120px] rounded-full" />
        {/* Bottom Right Subtle Teal/Cyan Accent */}
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[400px] bg-indigo-500/10 blur-[140px] rounded-full" />
        {/* Background Dot-Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-25 [mask-image:radial-gradient(ellipse_65%_65%_at_50%_50%,#000_60%,transparent_100%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* 2. Brand Identity Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/25 ring-4 ring-blue-500/10 mb-4 transition-transform hover:scale-105 duration-300">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Taraj HRIMS
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 font-medium">
            Sign in to access your enterprise recruitment workspace
          </p>
        </div>

        {/* 3. Luxury Glassmorphic Auth Card */}
        <div className="relative rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 p-7 sm:p-9 shadow-2xl shadow-blue-950/60 ring-1 ring-white/5 transition-all">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-xs font-semibold text-rose-300 bg-rose-950/50 border border-rose-800/70 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Username / Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="block text-xs font-bold text-slate-300 tracking-wide"
              >
                Username or Email <span className="text-blue-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-inner">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username or email"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-300 tracking-wide"
                >
                  Password <span className="text-blue-500">*</span>
                </label>
              </div>
              <div className="relative rounded-xl shadow-inner">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me row */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-500/30 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-slate-400 hover:text-slate-300 transition-colors">
                  Remember this device
                </span>
              </label>

              <span className="text-[11px] text-slate-500 font-medium">
                Encrypted & Secured
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to HRIMS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* 4. Elegant Portal Navigation Footer */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 px-2 text-xs text-slate-400">
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 hover:text-blue-400 font-medium transition-colors"
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-500" />
            <span>Candidate Registration</span>
          </Link>

          <Link
            href="/application-status"
            className="inline-flex items-center gap-1.5 hover:text-blue-400 font-medium transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-indigo-400" />
            <span>Track Application Status →</span>
          </Link>
        </div>

        {/* 5. Enterprise Security Badge */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-slate-600 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/80" />
            <span>Enterprise Grade Security • 256-Bit TLS End-to-End Encryption</span>
          </p>
        </div>
      </div>
    </div>
  );
}
