'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  MapPin,
  LogOut,
  Sparkles,
  Ticket,
} from 'lucide-react';

interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);

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
    }
  };

  useEffect(() => {
    fetchSession();

    const handleAuthChange = () => fetchSession();
    window.addEventListener('auth-changed', handleAuthChange);
    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.dispatchEvent(new Event('auth-changed'));
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
      window.location.href = '/';
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
        window.dispatchEvent(new Event('auth-changed'));
        if (roleName === 'Staff') {
          window.location.href = '/staff';
        } else if (roleName === 'Admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/';
        }
      } else {
        setSwitchingRole(null);
      }
    } catch (err) {
      console.error('Login error:', err);
      setSwitchingRole(null);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full font-sans pointer-events-none p-4 sm:p-5 lg:px-10">
      <div className="w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 sm:gap-4 pointer-events-auto">
        {/* LEFT PILL: Pure Solid White CINEBOOK Text (Zero Gray) + Thin Divider + All Movies & Showtimes */}
        <Link
          href="/"
          className="group inline-flex items-center gap-3.5 px-5 py-2.5 rounded-full border border-white/[0.16] bg-[rgba(12,20,20,0.78)] backdrop-blur-[16px] text-white hover:border-white/30 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]"
        >
          <span className="font-bold tracking-[0.24em] text-white text-sm sm:text-base leading-none uppercase select-none transition-transform duration-200 group-hover:scale-105">
            CINEBOOK
          </span>
          <span className="w-px h-4 bg-white/20" aria-hidden="true" />
          <span className="text-[13px] font-medium text-white/90 tracking-wide group-hover:text-white transition-colors">
            All Movies &amp; Showtimes
          </span>
        </Link>

        {/* RIGHT SIDE: 3 Separate Elevated Glass Pills (wrap on smaller screens) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Pill 1: Cinema Location & Screen status (no dot) */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-full border border-white/[0.16] bg-[rgba(12,20,20,0.78)] backdrop-blur-[16px] text-white/90 text-[13px] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)]"
            aria-label="Cinema location and screen"
          >
            <MapPin className="w-3.5 h-3.5 text-zinc-300 flex-shrink-0" aria-hidden="true" />
            <span className="text-[13px] font-medium tracking-wide">
              Metropolis <span className="text-white/40">·</span> Screen 1
            </span>
          </div>

          {/* My Passes / Tickets Vault Link (Strictly for Customer persona, hidden from Staff and Admin) */}
          {(!user || user.role === 'CUSTOMER') && (
            <Link
              href="/my-bookings"
              className={`inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-full border border-white/[0.16] bg-[rgba(12,20,20,0.78)] backdrop-blur-[16px] text-[13px] transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] ${
                pathname === '/my-bookings'
                  ? 'bg-white/20 text-[#f5d99b] border-[#cca255]/50 font-bold'
                  : 'text-white/90 hover:text-white hover:border-white/30 font-medium'
              }`}
              aria-label="My Passes Vault"
            >
              <Ticket className="w-3.5 h-3.5 text-[#cca255]" />
              <span>My Passes</span>
            </Link>
          )}

          {/* Operational Shortcut for Staff (when away from gate station) */}
          {user?.role === 'STAFF' && pathname !== '/staff' && (
            <Link
              href="/staff"
              className="inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-[16px] text-[13px] text-emerald-300 hover:bg-emerald-500/20 font-medium transition-all shadow-md"
            >
              <span>Gate Station →</span>
            </Link>
          )}

          {/* Operational Shortcut for Admin (when away from control center) */}
          {user?.role === 'ADMIN' && !pathname.startsWith('/admin') && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-full border border-[#cca255]/30 bg-[#cca255]/10 backdrop-blur-[16px] text-[13px] text-[#f5d99b] hover:bg-[#cca255]/20 font-medium transition-all shadow-md"
            >
              <span>Admin Portal →</span>
            </Link>
          )}

          {/* Pill 2: Segmented Persona Switcher */}
          <div
            className="inline-flex items-center p-1 rounded-full border border-white/[0.16] bg-[rgba(12,20,20,0.78)] backdrop-blur-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] text-[13px]"
            role="group"
            aria-label="Role switcher"
          >
            <button
              type="button"
              disabled={!!switchingRole}
              onClick={() => handleQuickLogin('customer@cinema.com', 'password123', 'Customer')}
              className={`px-3.5 py-1.5 rounded-full text-[13px] transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                switchingRole === 'Customer'
                  ? 'bg-white/30 text-white font-bold animate-pulse'
                  : user?.role === 'CUSTOMER'
                  ? 'bg-white/20 text-white font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_8px_rgba(0,0,0,0.4)] border border-white/20'
                  : 'text-zinc-300 hover:text-white font-medium hover:bg-white/10'
              }`}
              aria-label="Switch to Customer role"
            >
              {switchingRole === 'Customer' && (
                <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>Customer</span>
            </button>
            <button
              type="button"
              disabled={!!switchingRole}
              onClick={() => handleQuickLogin('staff@cinema.com', 'staff123', 'Staff')}
              className={`px-3.5 py-1.5 rounded-full text-[13px] transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                switchingRole === 'Staff'
                  ? 'bg-emerald-500/40 text-emerald-200 font-bold animate-pulse border border-emerald-400/50'
                  : user?.role === 'STAFF'
                  ? 'bg-emerald-500/30 text-emerald-200 font-bold shadow-[inset_0_1px_0_rgba(52,211,153,0.3),0_2px_8px_rgba(0,0,0,0.4)] border border-emerald-400/40'
                  : 'text-zinc-300 hover:text-white font-medium hover:bg-white/10'
              }`}
              aria-label="Switch to Staff role"
            >
              {switchingRole === 'Staff' && (
                <span className="w-2.5 h-2.5 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin" />
              )}
              <span>Staff</span>
            </button>
            <button
              type="button"
              disabled={!!switchingRole}
              onClick={() => handleQuickLogin('admin@cinema.com', 'admin123', 'Admin')}
              className={`px-3.5 py-1.5 rounded-full text-[13px] transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                switchingRole === 'Admin'
                  ? 'bg-amber-500/35 text-amber-200 font-bold animate-pulse border border-amber-400/50'
                  : user?.role === 'ADMIN'
                  ? 'bg-amber-500/25 text-amber-200 font-bold shadow-[inset_0_1px_0_rgba(245,158,11,0.3),0_2px_8px_rgba(0,0,0,0.4)] border border-amber-400/40'
                  : 'text-zinc-300 hover:text-white font-medium hover:bg-white/10'
              }`}
              aria-label="Switch to Admin role"
            >
              {switchingRole === 'Admin' && (
                <span className="w-2.5 h-2.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
              )}
              <span>Admin</span>
            </button>
          </div>

          {/* Pill 3: Solid pearl-white Sign In button or logged-in profile pill */}
          {user ? (
            <div className="inline-flex items-center gap-2.5 pl-3.5 pr-2 py-1.5 rounded-full border border-white/[0.16] bg-[rgba(12,20,20,0.78)] backdrop-blur-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)]">
              <span className="text-[13px] text-white font-semibold line-clamp-1 max-w-[120px]">
                {user.fullName || user.email.split('@')[0]}
              </span>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                  user.role === 'STAFF'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : user.role === 'ADMIN'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    : 'bg-white/15 text-white/90 border border-white/20'
                }`}
              >
                {user.role}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-full hover:bg-white/15 text-zinc-300 hover:text-white transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-b from-white to-zinc-100 text-zinc-950 font-semibold text-[13px] hover:from-zinc-100 hover:to-zinc-200 transition-all shadow-[0_4px_16px_rgba(255,255,255,0.25)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.35)] active:scale-95"
              aria-label="Sign in"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
