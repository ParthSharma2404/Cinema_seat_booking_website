import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'CineBook — Luxury VIP Cinema Booking',
  description: 'Minimalist dark cinema ticketing platform with real-time atomic seat locks and single-use digital turnstile passes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#08090e] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-violet-600 selection:text-white overflow-x-hidden">
        <Sidebar />
        <div className="flex-1 md:pl-[104px] flex flex-col min-h-screen w-full">
          <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4">
            {children}
          </main>
          <footer className="border-t border-white/5 bg-[#0a0b12] py-8 text-center text-xs text-slate-500 mt-12">
            <div className="w-full px-4 sm:px-8 space-y-2">
              <p className="font-semibold text-slate-400">
                © 2026 Algions AI Labs Assessment — Cinema Hall Ticket Booking System
              </p>
              <p className="font-mono text-[11px] text-slate-600">
                Dark Cinematic Architecture • Server-Side RBAC • ACID Seat Lock Engine • Verifiable QR Gatekeeper
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
