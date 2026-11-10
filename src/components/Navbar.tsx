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
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-900/30 group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-red-400 transition-colors">
              CINE<span className="text-red-500">BOOK</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] ml-2 px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-mono">
              ALGIONS LABS
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors hover:text-white ${
              pathname === '/' ? 'text-red-500 font-semibold' : 'text-slate-400'
            }`}
          >
            Movies & Shows
          </Link>
          <Link
            href="/my-bookings"
            className={`text-sm font-medium transition-colors hover:text-white flex items-center gap-1.5 ${
              pathname.startsWith('/my-bookings') ? 'text-red-500 font-semibold' : 'text-slate-400'
            }`}
          >
            <Ticket className="w-4 h-4" />
            My Bookings
          </Link>
          <Link
            href="/api/docs"
            target="_blank"
            className="text-sm font-medium text-slate-400 hover:text-white flex items-center gap-1.5"
          >
            <FileCode className="w-4 h-4 text-emerald-400" />
            API Docs
          </Link>

          {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
            <Link
              href="/admin"
              className={`text-sm font-medium transition-colors flex items-center gap-1.5 px-3 py-1 rounded-md border ${
                pathname.startsWith('/admin')
                  ? 'bg-red-950/60 border-red-700 text-red-300 font-semibold'
                  : 'border-slate-800 text-amber-400 hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Staff / Admin Portal
            </Link>
          )}
        </nav>

        {/* Right side auth */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-8 bg-slate-800 rounded animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200">{user.fullName}</span>
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-red-900/50 bg-slate-900/60 transition-colors"
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
                className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Login
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg shadow-sm shadow-red-950 transition-colors"
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
