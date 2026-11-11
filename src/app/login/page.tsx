'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Film, LogIn, Lock, Mail, ShieldAlert, UserCheck, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to login');
      } else {
        if (data.user.role === 'ADMIN' || data.user.role === 'STAFF') {
          router.push('/admin');
        } else {
          router.push(redirectUrl);
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-soft">
      <div className="text-center mb-8">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-slate-900 text-white items-center justify-center mb-3 shadow-sm">
          <Film className="w-5 h-5 text-violet-300" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In to CineBook</h1>
        <p className="text-xs text-slate-500 mt-1">
          Access your bookings, seat holds, or staff control panel
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-600 focus:bg-white transition-all shadow-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-600 focus:bg-white transition-all shadow-xs"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <LogIn className="w-3.5 h-3.5" />
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {/* Demo Credentials Quick-Fill for Reviewers */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3 font-mono">
          Demo Credentials (Click to prefill)
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fillCredentials('customer@cinema.com', 'password123')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] text-slate-700 text-center transition-colors shadow-xs"
          >
            <UserCheck className="w-3.5 h-3.5 mx-auto mb-1 text-blue-600" />
            Customer
          </button>
          <button
            type="button"
            onClick={() => fillCredentials('staff@cinema.com', 'staff123')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] text-slate-700 text-center transition-colors shadow-xs"
          >
            <ShieldAlert className="w-3.5 h-3.5 mx-auto mb-1 text-amber-600" />
            Staff
          </button>
          <button
            type="button"
            onClick={() => fillCredentials('admin@cinema.com', 'admin123')}
            className="p-2.5 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-[11px] text-violet-800 text-center transition-colors shadow-xs"
          >
            <ShieldAlert className="w-3.5 h-3.5 mx-auto mb-1 text-violet-600" />
            Admin
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-violet-600 hover:text-violet-700 font-semibold">
          Register here
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs">Loading form...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
