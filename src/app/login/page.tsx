'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Film, LogIn, Lock, Mail, ShieldAlert, UserCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { AuthCardSkeleton } from '@/components/Skeleton';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid email or password. Please verify your credentials.');
      } else {
        // Dispatch auth-changed so top navbar and other listeners update immediately
        window.dispatchEvent(new Event('auth-changed'));

        // Full browser navigation to guarantee fresh session and cookie headers
        const target =
          data.user.role === 'ADMIN'
            ? '/admin'
            : data.user.role === 'STAFF'
            ? '/staff'
            : redirectUrl || '/';
        window.location.href = target;
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
    <div className="rounded-3xl border border-[#cca255]/25 bg-[#0d0f17]/95 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl font-sans relative overflow-hidden">
      <div className="text-center mb-8">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#cca255]/20 to-[#cca255]/5 border border-[#cca255]/30 text-[#cca255] items-center justify-center mb-3 shadow-[0_0_20px_rgba(204,162,85,0.2)]">
          <Film className="w-7 h-7 text-[#cca255]" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Sign In to CineBook</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Access your bookings, seat reservations, or cinema management
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Evaluator Fast-Fill Credentials */}
      <div className="mb-6 p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
        <span className="text-[10px] font-mono font-bold text-[#cca255] uppercase tracking-wider block">
          Evaluator 1-Click Fast Credentials
        </span>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => fillCredentials('customer@cinema.com', 'password123')}
            className="py-2 px-2.5 rounded-full bg-white/[0.04] hover:bg-[#cca255]/15 text-zinc-300 hover:text-[#f5d99b] border border-white/10 hover:border-[#cca255]/40 text-[11px] font-mono text-center transition-all cursor-pointer"
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => fillCredentials('staff@cinema.com', 'staff123')}
            className="py-2 px-2.5 rounded-full bg-white/[0.04] hover:bg-[#cca255]/15 text-zinc-300 hover:text-[#f5d99b] border border-white/10 hover:border-[#cca255]/40 text-[11px] font-mono text-center transition-all cursor-pointer"
          >
            Gate Staff
          </button>
          <button
            type="button"
            onClick={() => fillCredentials('admin@cinema.com', 'admin123')}
            className="py-2 px-2.5 rounded-full bg-white/[0.04] hover:bg-[#cca255]/15 text-zinc-300 hover:text-[#f5d99b] border border-white/10 hover:border-[#cca255]/40 text-[11px] font-mono text-center transition-all cursor-pointer"
          >
            Admin
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. customer@cinema.com"
              className="w-full pl-11 pr-4 py-3 rounded-full bg-white/[0.04] border border-white/15 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#cca255] focus:ring-1 focus:ring-[#cca255]/40 transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] font-mono text-[#f5d99b] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              {showPassword ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hide</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Show</span>
                </>
              )}
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-11 py-3 rounded-full bg-white/[0.04] border border-white/15 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#cca255] focus:ring-1 focus:ring-[#cca255]/40 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3.5 rounded-full bg-gradient-to-r from-[#cca255] via-[#f5d99b] to-[#cca255] hover:brightness-110 text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(204,162,85,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>Authenticating...</span>
            </span>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-zinc-400">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-[#f5d99b] hover:text-white font-semibold underline underline-offset-4">
          Register here
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#090b10] text-zinc-100 font-sans relative pt-28 pb-16 px-4">
      {/* Ambient Cinema Aura */}
      <div
        className="pointer-events-none absolute top-0 inset-x-0 h-96 z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(204, 162, 85, 0.16) 0%, rgba(13, 15, 23, 0.4) 60%, transparent 100%)',
        }}
      />

      <div className="relative z-10 max-w-md mx-auto">
        <Suspense fallback={<AuthCardSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
