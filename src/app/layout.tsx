import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'CineBook — Cinema Hall Ticket Booking',
  description: 'Minimalist full-stack cinema ticketing system with real-time seat locks and QR entry validation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#fafbfc] text-slate-900 min-h-screen flex flex-col antialiased selection:bg-violet-100 selection:text-violet-900">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-slate-200/80 bg-white/70 py-6 text-center text-xs text-slate-500">
          <p className="font-medium text-slate-600">© 2026 Algions AI Labs Assessment — Cinema Hall Ticket Booking System</p>
          <p className="mt-1 font-mono text-[11px] text-slate-400">
            Light Minimalist Architecture • Server-Side RBAC • ACID Seat Lock Engine • Single-Use QR Gatekeeper
          </p>
        </footer>
      </body>
    </html>
  );
}
