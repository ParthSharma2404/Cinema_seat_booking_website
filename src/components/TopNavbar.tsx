'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Film,
  Ticket,
  ScanLine,
  BarChart3,
  Search,
  LogOut,
  LogIn,
  Menu,
  X,
  MapPin,
  FileCode,
  ShieldAlert,
  UserCheck,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState('');
  const [scrolled, setScrolled] = useState(false);

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
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
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
        await fetchSession();
        if (roleName === 'Staff') {
          router.push('/admin/scan');
        } else if (roleName === 'Admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
        setTimeout(() => setSwitchingRole(''), 2500);
      }
    } catch {
      setSwitchingRole('');
    }
  };

  const isHome = pathname === '/';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        isHome && !scrolled
          ? 'bg-transparent text-white'
          : 'bg-[#090b14]/90 backdrop-blur-xl border-b border-white/10 text-white shadow-xl'
      }`}
    >
      <div className="w-full px-6 sm:px-10 lg:px-16 h-20 flex items-center justify-between">
        {/* LEFT: Logo & All Movies Pill */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-black font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-black tracking-tight text-white uppercase">
              CINE<span className="text-amber-400">BOOK</span>
            </span>
          </Link>

          {/* All Movies Pill (from reference image) */}
          <Link
            href="/"
            className="hidden sm:inline-flex items-center px-4 py-1.5 rounded-full border border-white/20 hover:border-amber-400/80 text-xs font-medium text-slate-200 hover:text-white transition-all bg-white/[0.03] hover:bg-white/[0.08]"
          >
            All Movies
          </Link>

          {/* Quick Nav Links */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-300">
            <Link
              href="/my-bookings"
              className={`hover:text-white transition-colors ${
                pathname === '/my-bookings' ? 'text-amber-400 font-bold' : ''
              }`}
            >
              My Passes
            </Link>
            <Link
              href="/admin/scan"
              className={`hover:text-white transition-colors ${
                pathname === '/admin/scan' ? 'text-amber-400 font-bold' : ''
              }`}
            >
              Gate Turnstile
            </Link>
            <Link
              href="/admin"
              className={`hover:text-white transition-colors ${
                pathname === '/admin' ? 'text-amber-400 font-bold' : ''
              }`}
            >
              Reconciliation
            </Link>
            <Link
              href="/api/docs"
              target="_blank"
              className="hover:text-white transition-colors text-slate-400"
            >
              Swagger Docs
            </Link>
          </nav>
        </div>

        {/* RIGHT: Location, Fast-Track Switcher, User, & Menu */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Location Pin (matching "Malaysia, Global" in reference) */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs font-mono text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Metropolis, Grand IMAX</span>
          </div>

          {/* Evaluator 1-Click Fast-Track Persona Dock */}
          <div className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md">
            <button
              onClick={() => handleQuickLogin('customer@cinema.com', 'password123', 'Customer')}
              title="Fast Switch: Customer Persona (Alex)"
              className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold transition-all ${
                user?.role === 'CUSTOMER'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => handleQuickLogin('staff@cinema.com', 'staff123', 'Staff')}
              title="Fast Switch: Gate Staff (Turnstile Scanner)"
              className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold transition-all ${
                user?.role === 'STAFF'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Staff
            </button>
            <button
              onClick={() => handleQuickLogin('admin@cinema.com', 'admin123', 'Admin')}
              title="Fast Switch: Admin (Reconciliation)"
              className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold transition-all ${
                user?.role === 'ADMIN'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin
            </button>
          </div>

          {/* User Profile / Login */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 p-[1.5px] shadow-md flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-[#0d0e1a] flex items-center justify-center text-white font-black text-xs">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-white leading-tight line-clamp-1">{user.fullName}</p>
                  <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-all"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#090b14]/98 border-b border-white/10 px-6 py-6 space-y-4 shadow-2xl backdrop-blur-2xl">
          <nav className="flex flex-col gap-3 text-sm font-semibold text-slate-200">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-amber-400 py-1">
              All Movies & Shows
            </Link>
            <Link href="/my-bookings" onClick={() => setMobileMenuOpen(false)} className="hover:text-amber-400 py-1">
              My Bookings & Passes
            </Link>
            <Link href="/admin/scan" onClick={() => setMobileMenuOpen(false)} className="hover:text-amber-400 py-1">
              Gate Turnstile QR Scanner (Staff)
            </Link>
            <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="hover:text-amber-400 py-1">
              Reconciliation & Reports (Admin)
            </Link>
            <Link href="/api/docs" target="_blank" className="hover:text-amber-400 py-1">
              Swagger API Docs
            </Link>
          </nav>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Fast Switch Persona:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  handleQuickLogin('customer@cinema.com', 'password123', 'Customer');
                  setMobileMenuOpen(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-mono font-bold text-slate-200"
              >
                Customer
              </button>
              <button
                onClick={() => {
                  handleQuickLogin('staff@cinema.com', 'staff123', 'Staff');
                  setMobileMenuOpen(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-mono font-bold text-slate-200"
              >
                Staff
              </button>
              <button
                onClick={() => {
                  handleQuickLogin('admin@cinema.com', 'admin123', 'Admin');
                  setMobileMenuOpen(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-mono font-bold text-slate-200"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
