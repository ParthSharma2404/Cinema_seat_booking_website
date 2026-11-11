'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Film, Ticket, ShieldCheck, LogOut, User, LogIn, FileCode } from 'lucide-react';

interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Film className="w-4 h-4 text-violet-300" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-slate-900">
              CINE<span className="text-violet-600">BOOK</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono font-medium">
              MINIMAL
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors hover:text-slate-900 ${
              pathname === '/' ? 'text-violet-600 font-semibold' : 'text-slate-500'
            }`}
          >
            Movies
          </Link>
          <Link
            href="/my-bookings"
            className={`text-sm font-medium transition-colors hover:text-slate-900 flex items-center gap-1.5 ${
              pathname.startsWith('/my-bookings') ? 'text-violet-600 font-semibold' : 'text-slate-500'
            }`}
          >
            <Ticket className="w-4 h-4" />
            My Passes
          </Link>
          <Link
            href="/api/docs"
            target="_blank"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1.5"
          >
            <FileCode className="w-4 h-4 text-emerald-600" />
            API Docs
          </Link>

          {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
            <Link
              href="/admin"
              className={`text-sm font-medium transition-colors flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                pathname.startsWith('/admin')
                  ? 'bg-violet-50 border-violet-200 text-violet-700 font-semibold'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-violet-600" />
              Staff Portal
            </Link>
          )}
        </nav>

        {/* Right side auth */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-8 bg-slate-100 rounded-full animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900">{user.fullName}</span>
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-rose-600 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-sm"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-500" />
                Login
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-full shadow-sm transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
