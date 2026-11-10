import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'CineBook — Cinema Hall Ticket Booking System',
  description: 'Enterprise full-stack cinema ticketing system with real-time seat locks and QR entry validation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0f19] text-slate-100 min-h-screen flex flex-col antialiased">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
          <p>© 2026 Algions AI Labs Assessment — Cinema Hall Ticket Booking System</p>
          <p className="mt-1 font-mono text-[11px] text-slate-600">
            Modular Monolith Architecture • Server-Side RBAC • ACID Seat Lock Engine • Single-Use QR Gatekeeper
          </p>
        </footer>
      </body>
    </html>
  );
}
