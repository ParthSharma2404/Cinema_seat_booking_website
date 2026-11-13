'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ScanLine,
  QrCode,
  Users,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  UserCheck,
  Film,
} from 'lucide-react';

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; fullName: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      setLoading(true);
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
    fetchUser();
  }, [pathname]);

  const handleQuickSwitch = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      if (res.ok) {
        await fetchUser();
        router.refresh();
      }
    } catch (err) {
      console.error('Quick switch failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080d] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // RBAC Access Guard: If not staff or admin, show clean access denied
  if (!user || (user.role !== 'STAFF' && user.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-[#07080d] pt-28 px-6 flex items-center justify-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0e101a] border border-white/10 text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-sans font-bold text-white">Staff Clearance Required</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This portal is strictly dedicated to Gatehouse Turnstile operators and Floor Staff for ticket check-ins and auditorium management.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => handleQuickSwitch('staff@cinema.com', 'staff123')}
              className="w-full py-3 rounded-xl bg-white text-black font-sans font-semibold text-xs hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Login as Gate Staff Persona</span>
            </button>
            <Link
              href="/"
              className="w-full py-3 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-white font-sans text-xs transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Customer Movie Booking</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080d] text-white pt-24 pb-16 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Staff Header Strip */}
      <div className="p-6 rounded-3xl bg-[#0e101a] border border-white/10 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
            <ScanLine className="w-5 h-5 text-zinc-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-sans font-bold text-white tracking-wide">
                Gatehouse & Turnstile Workstation
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                Staff Live
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Operator: <strong className="text-white">{user.fullName}</strong> • Metropol Grand Screen 1 • 1-Pass Admission Policy
            </p>
          </div>
        </div>

        {/* Quick Nav & Status */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-xs text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Customer Site View</span>
          </Link>
          {user.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="px-3.5 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all flex items-center gap-1.5"
            >
              <span>Admin Control Center →</span>
            </Link>
          )}
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}

