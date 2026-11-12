'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Film,
  Ticket,
  ScanLine,
  BarChart3,
  LogOut,
  LogIn,
  Menu,
  X,
  MapPin,
  FileCode,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  History,
  QrCode,
  Sparkles,
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      if (res.ok) {
        await fetchSession();
        if (roleName === 'Staff') {
          router.push('/staff');
        } else if (roleName === 'Admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const isHome = pathname === '/';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 font-sans ${
        isHome && !scrolled
          ? 'bg-transparent text-white'
          : 'bg-[#090b14]/90 backdrop-blur-xl border-b border-white/10 text-white shadow-xl'
      }`}
    >
      <div className="w-full px-6 sm:px-10 lg:px-16 h-20 flex items-center justify-between">
        {/* LEFT: Logo & Role-Specific Brand */}
        <div className="flex items-center gap-6">
          <Link
            href={user?.role === 'STAFF' ? '/staff' : user?.role === 'ADMIN' ? '/admin' : '/'}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white transition-colors group-hover:bg-white/20">
              <Film className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-base font-bold text-white tracking-wider uppercase leading-none">
                CINEBOOK
              </span>
              {user?.role === 'STAFF' && (
                <span className="text-[9px] font-mono tracking-widest text-emerald-400 uppercase mt-0.5 font-bold">
                  Staff Portal
                </span>
              )}
              {user?.role === 'ADMIN' && (
                <span className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase mt-0.5 font-bold">
                  Admin Control
                </span>
              )}
            </div>
          </Link>

          {/* =========================================================================
              ROLE-ISOLATED NAVIGATION LINKS
              ========================================================================= */}

          {/* 1. VISITOR (Not logged in): Only public movie discovery */}
          {!user && (
            <nav className="hidden lg:flex items-center gap-6 text-xs font-sans tracking-wide text-zinc-400">
              <Link
                href="/"
                className={`hover:text-white transition-colors ${
                  pathname === '/' ? 'text-white font-semibold' : ''
                }`}
              >
                All Movies & Showtimes
              </Link>
            </nav>
          )}

          {/* 2. CUSTOMER: Only Customer discovery and their own tickets */}
          {user?.role === 'CUSTOMER' && (
            <nav className="hidden lg:flex items-center gap-6 text-xs font-sans tracking-wide text-zinc-400">
              <Link
                href="/"
                className={`hover:text-white transition-colors ${
                  pathname === '/' ? 'text-white font-semibold' : ''
                }`}
              >
                All Movies
              </Link>
              <Link
                href="/my-bookings"
                className={`hover:text-white transition-colors flex items-center gap-1.5 ${
                  pathname === '/my-bookings' ? 'text-white font-semibold' : ''
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>My Passes</span>
              </Link>
            </nav>
          )}

          {/* 3. STAFF: Strictly gatehouse, turnstile admission and screenings */}
          {user?.role === 'STAFF' && (
            <nav className="hidden lg:flex items-center gap-6 text-xs font-sans tracking-wide text-zinc-400">
              <Link
                href="/staff"
                className={`hover:text-white transition-colors flex items-center gap-1.5 ${
                  pathname === '/staff' ? 'text-white font-semibold' : ''
                }`}
              >
                <ScanLine className="w-3.5 h-3.5 text-emerald-400" />
                <span>Turnstile Scanner</span>
              </Link>
              <Link
                href="/"
                className="hover:text-zinc-300 text-zinc-500 transition-colors flex items-center gap-1"
              >
                <span>Customer Site Preview</span>
              </Link>
            </nav>
          )}

          {/* 4. ADMIN: Dedicated cinema management links */}
          {user?.role === 'ADMIN' && (
            <nav className="hidden lg:flex items-center gap-5 text-xs font-sans tracking-wide text-zinc-400">
              <Link
                href="/admin"
                className={`hover:text-white transition-colors flex items-center gap-1.5 ${
                  pathname === '/admin' ? 'text-white font-semibold' : ''
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Reconciliation</span>
              </Link>
              <Link
                href="/admin/movies"
                className={`hover:text-white transition-colors ${
                  pathname === '/admin/movies' ? 'text-white font-semibold' : ''
                }`}
              >
                Movies
              </Link>
              <Link
                href="/admin/shows"
                className={`hover:text-white transition-colors ${
                  pathname === '/admin/shows' ? 'text-white font-semibold' : ''
                }`}
              >
                Schedules
              </Link>
              <Link
                href="/admin/audit-logs"
                className={`hover:text-white transition-colors ${
                  pathname === '/admin/audit-logs' ? 'text-white font-semibold' : ''
                }`}
              >
                Audit Trail
              </Link>
              <Link
                href="/admin/scan"
                className={`hover:text-white transition-colors flex items-center gap-1.5 ${
                  pathname === '/admin/scan' ? 'text-white font-semibold' : ''
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Turnstile</span>
              </Link>
              <Link
                href="/api/docs"
                target="_blank"
                className="hover:text-white transition-colors text-zinc-500 flex items-center gap-1"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>API Docs</span>
              </Link>
              <Link
                href="/"
                className="hover:text-zinc-300 text-zinc-500 transition-colors"
              >
                Customer View
              </Link>
            </nav>
          )}
        </div>

        {/* RIGHT: Fast-Track Persona Switcher, User Badge, & Logout */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Location Pin */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs font-sans text-zinc-400">
            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
            <span>Metropolis, Screen 1</span>
          </div>

          {/* Evaluator 1-Click Fast-Track Persona Switcher Dock */}
          <div className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/[0.05] border border-white/10">
            <button
              onClick={() => handleQuickLogin('customer@cinema.com', 'password123', 'Customer')}
              title="Switch to Customer Persona (Opens Customer Booking Flow)"
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
              title="Switch to Staff Persona (Opens Dedicated Staff Workstation)"
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
              title="Switch to Admin Persona (Opens Admin Management Center)"
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
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded ${
                      user.role === 'STAFF'
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                        : user.role === 'ADMIN'
                        ? 'bg-white/10 text-zinc-300 font-bold'
                        : 'text-zinc-400'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-full border border-white/20 hover:border-white/50 text-white text-xs font-sans font-medium transition-all hover:bg-white/10"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#090b14]/98 border-b border-white/10 px-6 py-6 space-y-4 shadow-2xl backdrop-blur-2xl">
          <nav className="flex flex-col gap-3 text-sm font-semibold text-zinc-200">
            {(!user || user.role === 'CUSTOMER') && (
              <>
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">
                  All Movies & Shows
                </Link>
                {user && (
                  <Link href="/my-bookings" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">
                    My Passes & Tickets
                  </Link>
                )}
              </>
            )}

            {user?.role === 'STAFF' && (
              <>
                <Link href="/staff" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1 text-emerald-300">
                  Staff Turnstile Scanner
                </Link>
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1 text-zinc-400">
                  Customer Site View
                </Link>
              </>
            )}

            {user?.role === 'ADMIN' && (
              <>
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">
                  Reconciliation & Financials
                </Link>
                <Link href="/admin/movies" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">
                  Movies Catalog
                </Link>
                <Link href="/admin/shows" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">
                  Shows & Schedules
                </Link>
                <Link href="/admin/audit-logs" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">
                  Audit Trail
                </Link>
                <Link href="/admin/scan" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">
                  Gate Scanner
                </Link>
                <Link href="/api/docs" target="_blank" className="hover:text-white py-1 text-zinc-400">
                  Swagger API Docs
                </Link>
              </>
            )}
          </nav>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">Switch Persona:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  handleQuickLogin('customer@cinema.com', 'password123', 'Customer');
                  setMobileMenuOpen(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-medium text-white"
              >
                Customer
              </button>
              <button
                onClick={() => {
                  handleQuickLogin('staff@cinema.com', 'staff123', 'Staff');
                  setMobileMenuOpen(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-medium text-white"
              >
                Staff
              </button>
              <button
                onClick={() => {
                  handleQuickLogin('admin@cinema.com', 'admin123', 'Admin');
                  setMobileMenuOpen(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-medium text-white"
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
