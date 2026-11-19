'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Database, Sparkles, PlusCircle, BarChart3, Layers } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [geminiReady, setGeminiReady] = useState(false);

  useEffect(() => {
    setSupabaseReady(isSupabaseConfigured());
    setGeminiReady(process.env.NEXT_PUBLIC_GEMINI_CONFIGURED === 'true');
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/90 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm transition-transform group-hover:scale-105">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <span className="font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 text-base">
                SimSurvei <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-normal">v1.0</span>
              </span>
              <p className="text-[11px] text-neutral-500 font-mono tracking-wide -mt-0.5">Synthetic Respondent Engine</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 border-l border-neutral-200 dark:border-neutral-800 pl-6">
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                pathname === '/'
                  ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Daftar Kuesioner
            </Link>
          </nav>
        </div>

        {/* Status Indicators & Action */}
        <div className="flex items-center gap-3">
          {/* Supabase Status Pill */}
          <div
            title={supabaseReady ? 'Terhubung ke Supabase Cloud DB' : 'Mode Penyimpanan Lokal (Mock / Offline)'}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border transition-all ${
              supabaseReady
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800'
            }`}
          >
            <Database className="h-3 w-3" />
            <span>{supabaseReady ? 'Supabase Active' : 'Local Storage Mode'}</span>
          </div>

          {/* Gemini Status Pill */}
          <div
            title={geminiReady ? 'Gemini API aktif untuk bot' : 'Heuristik Cerdas (API Key belum diisi di .env)'}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border transition-all ${
              geminiReady
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800'
                : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span>{geminiReady ? 'Gemini 1.5 Flash' : 'Smart Heuristic'}</span>
          </div>

          {/* Create Button */}
          <Link
            href="/create"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-medium transition-all shadow-sm"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Buat Angket</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
