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
        await fetchUser();
        router.push(targetPath);
      }
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#07080d] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // RBAC Access Guard: If not admin, show clean access barrier
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#07080d] pt-28 px-6 flex items-center justify-center font-sans">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0e101a] border border-white/10 text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-sans font-bold text-white">Administrator Clearance Required</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This dashboard provides financial reconciliation, movie catalog management, and audit logs. Only users with the <strong className="text-white">ADMIN</strong> role have access.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => handleRoleSwitch('admin@cinema.com', 'admin123', '/admin')}
              className="w-full py-3 rounded-xl bg-white text-black font-sans font-semibold text-xs hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Login as Administrator Persona</span>
            </button>
            {user?.role === 'STAFF' && (
              <Link
                href="/staff"
                className="w-full py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-sans text-xs transition-all flex items-center justify-center gap-2"
              >
                <span>Go to Staff Turnstile Workstation →</span>
              </Link>
            )}
            <Link
              href="/"
              className="w-full py-3 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-white font-sans text-xs transition-all flex items-center justify-center gap-2"
            >
              <span>Return to Customer Movie Booking</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: 'Reconciliation & Revenue', icon: BarChart3 },
    { href: '/admin/movies', label: 'Movies Catalog', icon: Film },
    { href: '/admin/shows', label: 'Schedules & Tiers', icon: Calendar },
    { href: '/admin/audit-logs', label: 'Audit Trail', icon: History },
    { href: '/admin/scan', label: 'Turnstile Scanner', icon: QrCode },
  ];

  return (
    <div className="space-y-8 pt-24 px-4 sm:px-8 pb-16 max-w-7xl mx-auto w-full font-sans text-white">
      {/* Admin Management Strip */}
      <div className="p-6 rounded-3xl border border-white/10 bg-[#0e101a] shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
            <ShieldCheck className="w-5 h-5 text-zinc-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-sans font-bold text-white tracking-wide">
                Cinema Management & Control Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/10 text-zinc-300 border border-white/20 uppercase">
                Admin Clearance
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Financial Reconciliation • Catalog & Schedules • Concurrency Audits • System Ledgers
            </p>
          </div>
        </div>

        {/* Quick External Links */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-xs text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <span>Customer View</span>
          </Link>
          <Link
            href="/staff"
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-xs text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <span>Staff Portal</span>
          </Link>
          <Link
            href="/api/docs"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition-all flex items-center gap-1.5"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Swagger API</span>
            <ExternalLink className="w-3 h-3 text-zinc-400" />
          </Link>
        </div>
      </div>

      {/* Tab Navigation Ribbon */}
      <div className="flex flex-wrap items-center gap-2 bg-white/[0.03] p-1.5 rounded-2xl border border-white/10">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
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
  );
}
