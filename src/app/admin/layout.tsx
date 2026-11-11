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
  AlertTriangle,
  UserCheck,
  ArrowRight,
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

  const navItems = [
    { href: '/admin', label: 'Occupancy & Stats', icon: BarChart3, roles: ['ADMIN', 'STAFF'] },
    { href: '/admin/scan', label: 'Gate QR Scanner', icon: QrCode, roles: ['STAFF', 'ADMIN'] },
    { href: '/admin/movies', label: 'Movies Catalog', icon: Film, roles: ['ADMIN'] },
    { href: '/admin/shows', label: 'Schedules & Tiers', icon: Calendar, roles: ['ADMIN'] },
    { href: '/admin/audit-logs', label: 'Audit Trail', icon: History, roles: ['ADMIN'] },
  ];

  return (
    <div className="space-y-6">
      {/* Admin Subheader Strip */}
      <div className="p-4 rounded-3xl border border-white/10 bg-[#0e101a] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              Cinema Operations & Staff Portal
            </h1>
            <p className="text-xs text-slate-400">
              Role-Based Access Control • Occupancy Reconciliation • Gate Check-in
            </p>
          </div>
        </div>

        {/* Tab Links */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white/5 p-1.5 rounded-2xl border border-white/10">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Role State Banner */}
      {!loadingUser && (
        <>
          {user?.role === 'CUSTOMER' && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] font-mono uppercase font-black text-amber-400 tracking-wider">
                    RBAC Role Notice • Logged in as Customer ({user.fullName})
                  </span>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Operations and Gatehouse portals enforce Role-Based Access Control. Fast-switch below to test staff gate validation or administrator ledger reconciliation:
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleRoleSwitch('staff@cinema.com', 'staff123', '/admin/scan')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Switch to Staff (Gatekeeper)</span>
                </button>
                <button
                  onClick={() => handleRoleSwitch('admin@cinema.com', 'admin123', '/admin')}
                  className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Switch to Admin</span>
                </button>
              </div>
            </div>
          )}

          {user?.role === 'STAFF' && (
            <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold">Staff Session Verified:</span> {user.fullName} ({user.email}) — Gatehouse turnstile scanner privileges unlocked.
              </div>
              <Link href="/admin/scan" className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
                <span>Scanner Active</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {user?.role === 'ADMIN' && (
            <div className="px-4 py-2.5 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-violet-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="font-bold">Executive Admin Verified:</span> {user.fullName} ({user.email}) — All system ledgers, reconciliation proofs, and audit streams accessible.
              </div>
              <span className="text-[10px] font-mono uppercase font-bold text-violet-400 px-2 py-0.5 rounded-md bg-violet-500/20">
                Full Clearance
              </span>
            </div>
          )}
        </>
      )}

      <div>{children}</div>
    </div>
  );
}
