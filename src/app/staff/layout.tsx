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
import { StaffLayoutSkeleton } from '@/components/Skeleton';

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
        window.location.href = '/staff';
      }
    } catch (err) {
      console.error('Quick switch failed:', err);
    }
  };

  if (loading && !user) {
    return <StaffLayoutSkeleton />;
  }

  // RBAC Access Guard: If not staff or admin, show clean access denied
  if (!user || (user.role !== 'STAFF' && user.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-[#090b10] pt-28 px-6 flex items-center justify-center font-sans">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0d0f17] border border-white/10 text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#cca255]/10 border border-[#cca255]/30 flex items-center justify-center mx-auto text-[#cca255]">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-sans font-bold text-white uppercase tracking-tight">
              Staff Clearance Required
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This portal is strictly dedicated to Gatehouse Turnstile operators and Floor Staff for ticket check-ins and auditorium management.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => handleQuickSwitch('staff@cinema.com', 'staff123')}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#cca255] via-[#f5d99b] to-[#cca255] text-black font-sans font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(204,162,85,0.25)]"
            >
              <UserCheck className="w-4 h-4" />
              <span>Login as Gate Staff Persona</span>
            </button>
            <Link
              href="/"
              className="w-full py-3.5 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white font-sans text-xs transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Customer Site</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b10] text-zinc-100 relative font-sans">
      {/* Ambient Cinema Downlight Aura */}
      <div
        className="pointer-events-none absolute top-0 inset-x-0 h-96 z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(204, 162, 85, 0.14) 0%, rgba(13, 15, 23, 0.4) 60%, transparent 100%)',
        }}
      />

      <div className="relative z-10 pt-24 pb-16 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-8 font-sans">
        {/* Staff Header Strip */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#0d0f17]/95 border border-[#cca255]/20 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#cca255]/20 to-[#cca255]/5 border border-[#cca255]/30 flex items-center justify-center text-[#f5d99b] shrink-0 shadow-[0_0_20px_rgba(204,162,85,0.15)]">
              <ScanLine className="w-6 h-6 text-[#cca255]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-white tracking-wide uppercase">
                  Gatehouse Entry Station
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#cca255]/15 text-[#f5d99b] border border-[#cca255]/30 uppercase tracking-widest shadow-sm">
                  Station Active
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-sans">
                Operator: <strong className="text-white font-medium">{user.fullName}</strong> • Screen 1 Gatehouse • Verified Ticket Check-In
              </p>
            </div>
          </div>

          {/* Quick External Navigation */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 hover:border-[#cca255]/40 text-xs text-zinc-300 hover:text-[#f5d99b] transition-all flex items-center gap-1.5"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Customer View</span>
            </Link>
            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#cca255] to-[#f5d99b] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(204,162,85,0.25)]"
              >
                <span>Admin Center →</span>
              </Link>
            )}
          </div>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
