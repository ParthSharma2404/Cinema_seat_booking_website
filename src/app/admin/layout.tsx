'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  QrCode,
  Film,
  Calendar,
  History,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  FileCode,
  ExternalLink,
} from 'lucide-react';

import { AdminLayoutSkeleton } from '@/components/Skeleton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; fullName: string; role: string } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const fetchUser = async () => {
    try {
      setLoadingUser(true);
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
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const handleRoleSwitch = async (email: string, pass: string, targetPath: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      if (res.ok) {
        window.location.href = targetPath;
      }
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  if (loadingUser && !user) {
    return <AdminLayoutSkeleton />;
  }

  // RBAC Access Guard: If not admin, show clean access barrier
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#090b10] pt-28 px-6 flex items-center justify-center font-sans">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0d0f17] border border-white/10 text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#cca255]/10 border border-[#cca255]/30 flex items-center justify-center mx-auto text-[#cca255]">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-sans font-bold text-white uppercase tracking-tight">
              Administrator Clearance Required
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This dashboard provides financial reconciliation, movie catalog management, and audit logs. Only users with the <strong className="text-white">ADMIN</strong> role have access.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => handleRoleSwitch('admin@cinema.com', 'admin123', '/admin')}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#cca255] via-[#f5d99b] to-[#cca255] text-black font-sans font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(204,162,85,0.25)]"
            >
              <UserCheck className="w-4 h-4" />
              <span>Login as Administrator Persona</span>
            </button>
            {user?.role === 'STAFF' && (
              <Link
                href="/staff"
                className="w-full py-3.5 rounded-full bg-[#cca255]/10 hover:bg-[#cca255]/20 border border-[#cca255]/30 text-[#f5d99b] font-sans text-xs transition-all flex items-center justify-center gap-2"
              >
                <span>Go to Staff Turnstile Workstation →</span>
              </Link>
            )}
            <Link
              href="/"
              className="w-full py-3.5 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white font-sans text-xs transition-all flex items-center justify-center gap-2"
            >
              <span>Return to Customer Movie Booking</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: 'Revenue & Analytics', icon: BarChart3 },
    { href: '/admin/movies', label: 'Movie Catalog', icon: Film },
    { href: '/admin/shows', label: 'Schedules & Pricing', icon: Calendar },
    { href: '/admin/audit-logs', label: 'Activity Logs', icon: History },
    { href: '/admin/scan', label: 'Ticket Scanner', icon: QrCode },
  ];

  return (
    <div className="min-h-screen bg-[#090b10] text-zinc-100 font-sans relative">
      {/* Ambient Cinema Downlight Aura */}
      <div
        className="pointer-events-none absolute top-0 inset-x-0 h-96 z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(204, 162, 85, 0.16) 0%, rgba(13, 15, 23, 0.4) 60%, transparent 100%)',
        }}
      />

      <div className="relative z-10 space-y-8 pt-24 px-4 sm:px-8 pb-16 max-w-7xl mx-auto w-full">
        {/* Admin Management Strip */}
        <div className="p-6 sm:p-7 rounded-3xl border border-[#cca255]/20 bg-[#0d0f17]/95 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#cca255]/20 to-[#cca255]/5 border border-[#cca255]/30 flex items-center justify-center text-[#f5d99b] shrink-0 shadow-[0_0_20px_rgba(204,162,85,0.15)]">
              <ShieldCheck className="w-6 h-6 text-[#cca255]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-white tracking-wide uppercase">
                  Cinema Operations Dashboard
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#cca255]/15 text-[#f5d99b] border border-[#cca255]/40 uppercase tracking-widest shadow-sm">
                  Admin
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-sans">
                Real-time management of sales, auditorium seating, schedules, and security logs
              </p>
            </div>
          </div>

          {/* Quick External Links */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/"
              className="px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 hover:border-[#cca255]/40 text-xs text-zinc-300 hover:text-[#f5d99b] transition-all flex items-center gap-1.5"
            >
              <span>Customer Site</span>
            </Link>
            <Link
              href="/staff"
              className="px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 hover:border-[#cca255]/40 text-xs text-zinc-300 hover:text-[#f5d99b] transition-all flex items-center gap-1.5"
            >
              <span>Staff Station</span>
            </Link>
            <Link
              href="/api/docs"
              target="_blank"
              className="px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs text-zinc-400 hover:text-white transition-all flex items-center gap-1.5"
            >
              <span>API Reference</span>
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </Link>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex flex-wrap items-center gap-2 bg-[#0d0f17]/90 p-2 rounded-full border border-white/10 backdrop-blur-xl shadow-2xl">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#cca255] to-[#f5d99b] text-black font-bold shadow-[0_0_20px_rgba(204,162,85,0.3)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
