'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Film,
  Ticket,
  BarChart3,
  ScanLine,
  ShieldAlert,
  FileCode,
  User,
  LogIn,
  LogOut,
  Sparkles,
  Menu,
  X,
  Compass,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickLoginMsg, setQuickLoginMsg] = useState('');

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleQuickLogin = async (email: string, pass: string, roleName: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      if (res.ok) {
        setQuickLoginMsg(`Switched to ${roleName}`);
        fetchSession();
        setTimeout(() => setQuickLoginMsg(''), 2500);
      }
    } catch {
      setQuickLoginMsg('Failed to switch');
    }
  };

  const navLinks = [
    { label: 'Explore & Shows', href: '/', icon: Film },
    { label: 'My Bookings', href: '/my-bookings', icon: Ticket },
  ];

  const adminLinks = [
    { label: 'Gate Turnstile', href: '/admin/scan', icon: ScanLine },
    { label: 'Reconciliation', href: '/admin', icon: BarChart3 },
    { label: 'Audit Trail', href: '/admin/audit-logs', icon: ShieldAlert },
    { label: 'Swagger API', href: '/api/docs', icon: FileCode, external: true },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-16 bg-[#0d0e17]/95 backdrop-blur-md border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-glow-violet">
            <Film className="w-4 h-4" />
          </div>
          <span className="text-base font-black tracking-tight text-white">
            CINE<span className="text-violet-400">BOOK</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Fixed Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0d0e17] border-r border-white/10 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto p-4 space-y-6">
          {/* Brand Header */}
          <div className="pt-2 px-2 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform">
                <Film className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-black tracking-tight text-white leading-none">
                  CINE<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">BOOK</span>
                </div>
                <div className="text-[10px] font-mono tracking-widest uppercase text-slate-400 mt-1 font-semibold">
                  VIP THEATRES
                </div>
              </div>
            </Link>
          </div>

          {/* Main Navigation */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">
              Menu
            </div>
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Operational & Staff Navigation */}
          <div className="space-y-1 pt-2">
            <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">
              Staff & Assessment
            </div>
            {adminLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Evaluator Fast-Track Persona Switcher */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-violet-400" />
                Quick Role Switch
              </span>
              {quickLoginMsg && (
                <span className="text-[9px] text-emerald-400 font-mono font-medium animate-pulse">
                  {quickLoginMsg}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => handleQuickLogin('customer@cinema.com', 'password123', 'Customer')}
                className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-violet-600 text-[10px] font-mono text-slate-300 hover:text-white transition-all text-center border border-white/5"
                title="Login as Alex (Customer)"
              >
                User
              </button>
              <button
                onClick={() => handleQuickLogin('staff@cinema.com', 'staff123', 'Staff')}
                className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-amber-600 text-[10px] font-mono text-slate-300 hover:text-white transition-all text-center border border-white/5"
                title="Login as Sam (Gate Staff)"
              >
                Staff
              </button>
              <button
                onClick={() => handleQuickLogin('admin@cinema.com', 'admin123', 'Admin')}
                className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-fuchsia-600 text-[10px] font-mono text-slate-300 hover:text-white transition-all text-center border border-white/5"
                title="Login as Sarah (Admin)"
              >
                Admin
              </button>
            </div>
          </div>

          {/* User Account Section at Bottom */}
          <div className="pt-4 border-t border-white/10 mt-auto">
            {loading ? (
              <div className="h-12 rounded-2xl bg-white/5 animate-pulse" />
            ) : user ? (
              <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-violet-300 font-bold text-xs shrink-0">
                    {user.fullName ? user.fullName[0] : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate leading-none">
                      {user.fullName}
                    </p>
                    <span className="text-[9px] font-mono uppercase text-violet-400 font-bold mt-1 inline-block">
                      {user.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Link
                  href="/login"
                  className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2 border border-white/10 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 text-violet-400" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/register"
                  className="w-full py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
