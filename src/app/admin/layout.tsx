'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  QrCode,
  Film,
  Calendar,
  History,
  ShieldCheck,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Occupancy & Stats', icon: BarChart3 },
    { href: '/admin/scan', label: 'Gate QR Scanner', icon: QrCode },
    { href: '/admin/movies', label: 'Movies Catalog', icon: Film },
    { href: '/admin/shows', label: 'Schedules & Tiers', icon: Calendar },
    { href: '/admin/audit-logs', label: 'Audit Trail', icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Admin Subheader Strip */}
      <div className="p-4 rounded-3xl border border-slate-200/90 bg-white shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-violet-50 text-violet-700 border border-violet-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Cinema Operations & Staff Portal
            </h1>
            <p className="text-xs text-slate-500">
              Role-Based Access Control • Occupancy Reconciliation • Gate Check-in
            </p>
          </div>
        </div>

        {/* Tab Links */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-full border border-slate-200">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <item.icon className="w-3.5 h-3.5 text-slate-500" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
