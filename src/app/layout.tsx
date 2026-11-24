import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Header from '@/components/Header';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'SimSurvei - Platform Kuesioner & Analisis Riset',
  description: 'Platform pembuatan kuesioner dan visualisasi analitik riset modern',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-neutral-50 text-neutral-900 font-sans antialiased dark:bg-neutral-950 dark:text-neutral-100 flex flex-col`}
      >
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="w-full border-t border-neutral-200 py-6 text-center text-xs text-neutral-500 font-mono dark:border-neutral-800">
          SimSurvei © 2026 — Research Engine & Dynamic Analytics
        </footer>
      </body>
    </html>
  );
}
