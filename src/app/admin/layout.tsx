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
  ChevronRight,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard & Occupancy', icon: BarChart3 },
    { href: '/admin/scan', label: 'Gate Entry Scanner', icon: QrCode },
    { href: '/admin/movies', label: 'Manage Movies', icon: Film },
    { href: '/admin/shows', label: 'Schedules & Pricing', icon: Calendar },
    { href: '/admin/audit-logs', label: 'Audit Trail', icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Admin Subheader Strip */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500 border border-red-800/60">
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
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
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
