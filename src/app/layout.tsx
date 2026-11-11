import type { Metadata } from 'next';
import './globals.css';
import { TopNavbar } from '@/components/TopNavbar';

export const metadata: Metadata = {
  title: 'CineBook — Luxury VIP Cinema Booking',
  description: 'Minimalist cinema ticketing platform with real-time atomic seat locks and single-use digital turnstile passes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090b14] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-amber-500 selection:text-black overflow-x-hidden">
        <TopNavbar />
        <div className="flex-1 flex flex-col min-h-screen w-full">
          <main className="flex-1 w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
