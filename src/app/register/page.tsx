'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Film, UserPlus, Lock, Mail, User, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'CUSTOMER' | 'STAFF'>('CUSTOMER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: cleanName, email: cleanEmail, password, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        window.dispatchEvent(new Event('auth-changed'));
        window.location.href = '/';
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-zinc-100 font-sans relative pt-28 pb-16 px-4">
      {/* Ambient Cinema Aura */}
      <div
        className="pointer-events-none absolute top-0 inset-x-0 h-96 z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(204, 162, 85, 0.12) 0%, rgba(13, 15, 23, 0.4) 60%, transparent 100%)',
        }}
      />

      <div className="relative z-10 max-w-md mx-auto">
        <div className="rounded-3xl border border-[#cca255]/25 bg-[#0d0f17]/95 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#cca255]/20 to-[#cca255]/5 border border-[#cca255]/30 text-[#cca255] items-center justify-center mb-3 shadow-[0_0_20px_rgba(204,162,85,0.2)]">
              <Film className="w-7 h-7 text-[#cca255]" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Create an Account</h1>
            <p className="text-xs text-zinc-400 mt-1 font-sans">
              Join CineBook to reserve seats and access turnstile passes
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-white/[0.04] border border-white/15 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#cca255] focus:ring-1 focus:ring-[#cca255]/40 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex@example.com"
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
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-11 pr-11 py-3 rounded-full bg-white/[0.04] border border-white/15 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#cca255] focus:ring-1 focus:ring-[#cca255]/40 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Account Persona
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('CUSTOMER')}
                  className={`py-2 px-3 rounded-full border text-xs font-semibold font-mono transition-all cursor-pointer ${
                    role === 'CUSTOMER'
                      ? 'bg-gradient-to-r from-[#cca255] to-[#f5d99b] text-black font-bold shadow-[0_0_12px_rgba(204,162,85,0.25)] border-[#cca255]'
                      : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('STAFF')}
                  className={`py-2 px-3 rounded-full border text-xs font-semibold font-mono transition-all cursor-pointer ${
                    role === 'STAFF'
                      ? 'bg-gradient-to-r from-[#cca255] to-[#f5d99b] text-black font-bold shadow-[0_0_12px_rgba(204,162,85,0.25)] border-[#cca255]'
                      : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  Gate Staff
                </button>
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
                  <span>Creating Account...</span>
                </span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Register</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-zinc-400">
            Already have an account?{' '}
            <Link href="/login" className="text-[#f5d99b] hover:text-white font-semibold underline underline-offset-4">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
