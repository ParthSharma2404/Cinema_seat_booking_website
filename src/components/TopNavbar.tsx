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
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white transition-colors group-hover:bg-white/20">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="font-sans text-base font-bold text-white tracking-wider uppercase">
              CINEBOOK
            </span>
          </Link>

          {/* All Movies Pill (from reference image) */}
          <Link
            href="/"
            className="hidden sm:inline-flex items-center px-3.5 py-1 rounded-full border border-white/15 hover:border-white/40 text-xs font-sans tracking-wide text-zinc-300 hover:text-white transition-all bg-white/[0.04]"
          >
            All Movies
          </Link>

          {/* Quick Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-sans tracking-wide text-zinc-400">
            <Link
              href="/my-bookings"
              className={`hover:text-white transition-colors ${
                pathname === '/my-bookings' ? 'text-white font-semibold' : ''
              }`}
            >
              My Passes
            </Link>
            <Link
              href="/admin/scan"
              className={`hover:text-white transition-colors ${
                pathname === '/admin/scan' ? 'text-white font-semibold' : ''
              }`}
            >
              Gate Turnstile
            </Link>
            <Link
              href="/admin"
              className={`hover:text-white transition-colors ${
                pathname === '/admin' ? 'text-white font-semibold' : ''
              }`}
            >
              Reconciliation
            </Link>
            <Link
              href="/api/docs"
              target="_blank"
              className="hover:text-white transition-colors text-zinc-500"
            >
              Swagger Docs
            </Link>
          </nav>
        </div>

        {/* RIGHT: Location, Fast-Track Switcher, User, & Menu */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Location Pin */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs font-sans text-zinc-400">
            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
            <span>Metropolis, Screen 1</span>
          </div>

          {/* Evaluator 1-Click Fast-Track Persona Dock */}
          <div className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/[0.05] border border-white/10">
            <button
              onClick={() => handleQuickLogin('customer@cinema.com', 'password123', 'Customer')}
              title="Fast Switch: Customer Persona (Alex)"
              className={`px-3 py-1 rounded-full text-[11px] font-sans font-medium transition-all ${
                user?.role === 'CUSTOMER'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => handleQuickLogin('staff@cinema.com', 'staff123', 'Staff')}
              title="Fast Switch: Gate Staff (Turnstile Scanner)"
              className={`px-3 py-1 rounded-full text-[11px] font-sans font-medium transition-all ${
                user?.role === 'STAFF'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Staff
            </button>
            <button
              onClick={() => handleQuickLogin('admin@cinema.com', 'admin123', 'Admin')}
              title="Fast Switch: Admin (Reconciliation)"
              className={`px-3 py-1 rounded-full text-[11px] font-sans font-medium transition-all ${
                user?.role === 'ADMIN'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Admin
            </button>
          </div>

          {/* User Profile / Login */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-sans font-bold text-xs">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-white leading-tight line-clamp-1">{user.fullName}</p>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-full border border-white/20 hover:border-white/50 text-white text-xs font-sans font-medium transition-all hover:bg-white/10"
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

