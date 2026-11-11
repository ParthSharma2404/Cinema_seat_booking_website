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
  ShieldCheck,
  ChevronRight,
  Layers,
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
  const [switchingRole, setSwitchingRole] = useState('');

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
      setSwitchingRole(roleName);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      if (res.ok) {
        await fetchSession();
        setTimeout(() => setSwitchingRole(''), 1500);
      }
    } catch {
      setSwitchingRole('');
    }
  };

  const navLinks = [
    { label: 'Explore & Shows', href: '/', icon: Film, badge: 'NOW PLAYING' },
    { label: 'My Bookings', href: '/my-bookings', icon: Ticket, badge: null },
  ];

  const adminLinks = [
    { label: 'Gate Turnstile', href: '/admin/scan', icon: ScanLine, badge: 'SCANNER' },
    { label: 'Reconciliation', href: '/admin', icon: BarChart3, badge: 'REPORTS' },
    { label: 'Audit Trail', href: '/admin/audit-logs', icon: ShieldAlert, badge: null },
    { label: 'Swagger API', href: '/api/docs', icon: FileCode, external: true, badge: 'v3.0' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Top App Bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-16 bg-[#0a0b14]/95 backdrop-blur-xl border-b border-white/[0.08]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
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
          className="md:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-md"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Luxury Fixed Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a0b14] border-r border-white/[0.08] flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Subtle Ambient Radial Glow Behind Header */}
        <div className="absolute top-0 left-0 w-64 h-48 bg-gradient-to-b from-violet-600/15 via-fuchsia-600/5 to-transparent rounded-full filter blur-3xl pointer-events-none" />

        <div className="flex flex-col h-full overflow-y-auto p-4 space-y-6 relative z-10">
          {/* Brand Header */}
          <div className="pt-2 px-2">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-indigo-600 p-[1px] shadow-lg shadow-violet-600/30 group-hover:shadow-violet-600/50 transition-all">
                  <div className="w-full h-full rounded-2xl bg-[#0d0e1a] flex items-center justify-center">
                    <Film className="w-5 h-5 text-violet-400 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0a0b14]" />
              </div>

              <div>
                <div className="text-lg font-black tracking-tight text-white leading-none flex items-center gap-1">
                  <span>CINE</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                    BOOK
                  </span>
                </div>
                <div className="text-[9px] font-mono tracking-[0.2em] uppercase text-violet-400/80 font-bold mt-1">
                  VIP AUDITORIUMS
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation - Main Experience */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500 font-bold mb-2">
              Discovery
            </div>
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-violet-600/25 via-violet-600/10 to-transparent border border-violet-500/40 text-white shadow-lg shadow-violet-600/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Glowing vertical indicator for active link */}
                  {active && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
                  )}

                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        active ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md font-bold ${
                        active
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                          : 'bg-white/5 text-slate-500 group-hover:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Navigation - Operations & Assessment */}
          <div className="space-y-1 pt-1">
            <div className="px-3 text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500 font-bold mb-2 flex items-center justify-between">
              <span>Operations & Staff</span>
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            </div>
            {adminLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-violet-600/25 via-violet-600/10 to-transparent border border-violet-500/40 text-white shadow-lg shadow-violet-600/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
                  )}

                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        active ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md font-bold ${
                        item.badge === 'v3.0'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : active
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                          : 'bg-white/5 text-slate-500 group-hover:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Evaluator Fast-Track Persona Dock */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-violet-400" />
                Evaluator Switcher
              </span>
              {switchingRole ? (
                <span className="text-[9px] text-emerald-400 font-mono font-bold animate-pulse">
                  {switchingRole}
                </span>
              ) : (
                <span className="text-[9px] font-mono text-slate-500 font-semibold">1-Click</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => handleQuickLogin('customer@cinema.com', 'password123', 'Customer')}
                className={`py-1.5 px-1.5 rounded-xl text-[10px] font-mono font-bold transition-all text-center border ${
                  user?.role === 'CUSTOMER'
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500/40 shadow-sm'
                    : 'bg-white/5 hover:bg-blue-600/20 text-slate-400 hover:text-white border-white/5'
                }`}
                title="Login as Customer Alex"
              >
                User
              </button>
              <button
                onClick={() => handleQuickLogin('staff@cinema.com', 'staff123', 'Gate Staff')}
                className={`py-1.5 px-1.5 rounded-xl text-[10px] font-mono font-bold transition-all text-center border ${
                  user?.role === 'STAFF'
                    ? 'bg-amber-600/30 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-white/5 hover:bg-amber-600/20 text-slate-400 hover:text-white border-white/5'
                }`}
                title="Login as Staff Sam"
              >
                Staff
              </button>
              <button
                onClick={() => handleQuickLogin('admin@cinema.com', 'admin123', 'Admin')}
                className={`py-1.5 px-1.5 rounded-xl text-[10px] font-mono font-bold transition-all text-center border ${
                  user?.role === 'ADMIN'
                    ? 'bg-violet-600/30 text-violet-300 border-violet-500/40 shadow-sm'
                    : 'bg-white/5 hover:bg-violet-600/20 text-slate-400 hover:text-white border-white/5'
                }`}
                title="Login as Admin Sarah"
              >
                Admin
              </button>
            </div>
          </div>

          {/* User Account Section at Bottom */}
          <div className="pt-3 border-t border-white/[0.08] mt-auto">
            {loading ? (
              <div className="h-12 rounded-2xl bg-white/5 animate-pulse" />
            ) : user ? (
              <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between gap-2 hover:border-white/20 transition-all">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md">
                      {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0a0b14]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate leading-tight">
                      {user.fullName}
                    </p>
                    <span className="text-[9px] font-mono uppercase text-violet-400 font-bold block mt-0.5">
                      {user.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
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
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 transition-colors"
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
