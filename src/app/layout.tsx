import type { Metadata } from 'next';
import './globals.css';
import { TopNavbar } from '@/components/TopNavbar';

export const metadata: Metadata = {
  title: 'CineBook — Movie Ticket Booking',
  description: 'Minimalist cinema ticket booking platform with real-time seat availability and digital passes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Fira+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#07080d] text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-[#d4af37] selection:text-black overflow-x-hidden font-sans">
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
