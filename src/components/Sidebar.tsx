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
  ShieldCheck,
  CheckCircle2,
  Compass,
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
  const [quickSwitchMsg, setQuickSwitchMsg] = useState('');

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
      setQuickSwitchMsg(roleName);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      if (res.ok) {
        await fetchSession();
        setTimeout(() => setQuickSwitchMsg(''), 2000);
      }
    } catch {
      setQuickSwitchMsg('');
    }
  };

  const navItems = [
    { label: 'Explore Movies', href: '/', icon: Film },
    { label: 'My Passes', href: '/my-bookings', icon: Ticket },
    { label: 'Gate Turnstile', href: '/admin/scan', icon: ScanLine, dot: true },
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
      {/* Mobile Top Floating Toggle */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-3 rounded-2xl bg-[#0e101a]/90 backdrop-blur-xl border border-white/15 text-white shadow-2xl flex items-center gap-2"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-violet-400" />}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/85 backdrop-blur-md"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* FLOATING NARROW VERTICAL RECTANGLE SIDEBAR WITH ROUNDED CORNERS */}
      <aside
        className={`fixed top-4 bottom-4 left-4 z-50 w-[74px] bg-[#0c0e18]/90 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col items-center justify-between py-6 transition-all duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-32 md:translate-x-0'
        }`}
      >
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-4 w-12 h-12 bg-violet-600/30 rounded-full filter blur-xl pointer-events-none" />

        {/* 1. TOP: Cinema Brand Logo Squircle */}
        <div className="relative z-10 flex flex-col items-center group">
          <Link
            href="/"
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 p-[1.5px] shadow-lg shadow-violet-600/30 group-hover:scale-105 group-hover:shadow-violet-600/50 transition-all flex items-center justify-center"
          >
            <div className="w-full h-full rounded-2xl bg-[#090a12] flex items-center justify-center">
              <Film className="w-5 h-5 text-white group-hover:text-violet-300 transition-colors" />
            </div>
          </Link>
          <span className="text-[8px] font-mono tracking-widest text-violet-400 uppercase font-black mt-1.5 opacity-80">
            CINE
          </span>
        </div>

        {/* 2. CENTER: Navigation Icons Stack with Floating Tooltips */}
        <div className="relative z-10 flex flex-col items-center gap-3 w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <div key={item.href} className="relative group/nav flex items-center justify-center">
                <Link
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                    active
                      ? 'bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/40 scale-105'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.dot && !active && (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </Link>

                {/* Floating Modern Tooltip (Appears to the right of the floating bar) */}
                <div className="absolute left-16 px-3 py-1.5 rounded-xl bg-[#141624] border border-white/10 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover/nav:opacity-100 transition-opacity shadow-2xl z-50">
                  {item.label}
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#141624] border-l border-b border-white/10 rotate-45" />
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. BOTTOM: Evaluator 1-Click Role Switcher + User Profile */}
        <div className="relative z-10 flex flex-col items-center gap-3.5 w-full px-2">
          {/* Micro Persona Switcher Dock */}
          <div className="flex flex-col items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10">
            {/* Customer Pill */}
            <button
              onClick={() => handleQuickLogin('customer@cinema.com', 'password123', 'Customer')}
              title="Fast-Track: Login as Customer (Alex)"
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                user?.role === 'CUSTOMER'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-blue-300 hover:bg-white/5'
              }`}
            >
              U
            </button>

            {/* Staff Pill */}
            <button
              onClick={() => handleQuickLogin('staff@cinema.com', 'staff123', 'Staff')}
              title="Fast-Track: Login as Gate Staff (Sam)"
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                user?.role === 'STAFF'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-white/5'
              }`}
            >
              S
            </button>

            {/* Admin Pill */}
            <button
              onClick={() => handleQuickLogin('admin@cinema.com', 'admin123', 'Admin')}
              title="Fast-Track: Login as Administrator (Sarah)"
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                user?.role === 'ADMIN'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-violet-300 hover:bg-white/5'
              }`}
            >
              A
            </button>
          </div>

          {/* User Profile Avatar with Popover Logout */}
          <div className="relative group/user flex items-center justify-center">
            {loading ? (
              <div className="w-10 h-10 rounded-2xl bg-white/10 animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={handleLogout}
                  title={`Logged in as ${user.fullName} (${user.role}). Click to logout.`}
                  className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 p-[1.5px] shadow-lg shadow-violet-600/30 flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <div className="w-full h-full rounded-2xl bg-[#0d0e1a] flex items-center justify-center text-white font-black text-xs">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                </button>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0c0e18]" />

                {/* Floating User Card on Hover */}
                <div className="absolute left-16 bottom-0 p-3 rounded-2xl bg-[#141624] border border-white/10 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover/user:opacity-100 transition-opacity shadow-2xl z-50 min-w-[160px]">
                  <p className="font-bold text-white text-xs">{user.fullName}</p>
                  <span className="text-[10px] font-mono uppercase text-violet-400 font-bold block mt-0.5">
                    {user.role}
                  </span>
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-slate-400 hover:text-rose-400 text-[11px] cursor-pointer">
                    <span>Click avatar to logout</span>
                    <LogOut className="w-3 h-3 text-rose-400" />
                  </div>
                  <div className="absolute -left-1 bottom-3 w-2 h-2 bg-[#141624] border-l border-b border-white/10 rotate-45" />
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                title="Sign In"
                className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-violet-600 hover:text-white border border-white/10 flex items-center justify-center text-slate-400 transition-colors"
              >
                <LogIn className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
