'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isSupabaseConfigured } from '@/lib/supabase';
import { syncLocalDataToSupabase } from '@/lib/storage';
import { Database, Sparkles, PlusCircle, BarChart3, Layers, AlertCircle, CheckCircle2, RefreshCw, X } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [geminiReady, setGeminiReady] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    setSupabaseReady(isSupabaseConfigured());
    setGeminiReady(process.env.NEXT_PUBLIC_GEMINI_CONFIGURED === 'true');
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await syncLocalDataToSupabase();
      if (res.success) {
        setSyncStatus(`Berhasil menyinkronkan ${res.count} kuesioner ke Supabase Cloud!`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setSyncStatus(`Gagal: ${res.error}`);
      }
    } catch (err: unknown) {
      setSyncStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
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
            <button
              onClick={() => setShowInfoModal(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border transition-all cursor-pointer ${
                supabaseReady
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
              }`}
            >
              <Database className="h-3 w-3" />
              <span>{supabaseReady ? 'Supabase Active' : 'Local Storage Mode'}</span>
            </button>

            {/* Gemini Status Pill */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border transition-all ${
                geminiReady
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800'
                  : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>{geminiReady ? 'Gemini AI' : 'Smart Heuristic'}</span>
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

      {/* Info & Sync Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${supabaseReady ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  Status Database: {supabaseReady ? 'Supabase Cloud Aktif' : 'Penyimpanan Lokal (Browser)'}
                </h2>
                <p className="text-xs text-neutral-500 font-mono">
                  {supabaseReady ? 'Data tersimpan di PostgreSQL Supabase' : 'Data tersimpan di Local Storage Browser'}
                </p>
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
              {supabaseReady ? (
                <>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Supabase Cloud terhubung! Semua kuesioner baru akan otomatis tersimpan langsung ke tabel Supabase.</span>
                  </div>
                  <p>
                    Jika sebelumnya Anda membuat kuesioner saat dalam mode offline/lokal, Anda dapat mengunggahnya sekarang ke Supabase:
                  </p>
                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 font-semibold transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Menyinkronkan data...' : 'Sinkronkan Data Lokal ke Supabase Cloud'}</span>
                  </button>
                  {syncStatus && (
                    <p className="text-center font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                      {syncStatus}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Mengapa belum masuk ke Supabase?</strong>
                      <span>Data yang Anda buat saat ini <strong>tersimpan aman di memori browser (Local Storage)</strong>, sehingga grafik dan kuesioner tetap bisa dibuka dan diekspor ke CSV kapan saja.</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                      Cara Menghubungkan ke Supabase Cloud:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 text-neutral-600 dark:text-neutral-400">
                      <li>Buka dashboard Supabase: <span className="font-mono text-[11px] bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">Project Settings → API</span>.</li>
                      <li>
                        Di bagian <strong>Project API keys</strong>, salin kunci baris <strong>anon public</strong> (kunci panjang yang diawali teks <span className="font-mono text-[11px] font-bold text-neutral-800 dark:text-neutral-200">eyJhbGciOi...</span>, <em>bukan</em> yang berawalan <code className="text-rose-500">sb_publishable_</code>).
                      </li>
                      <li>
                        Buka file <span className="font-mono text-[11px] bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">.env.local</span> di folder proyek Anda dan perbarui baris:
                        <div className="mt-1 p-2 rounded bg-neutral-950 text-neutral-200 font-mono text-[11px] overflow-x-auto">
                          NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1Ni...
                        </div>
                      </li>
                      <li>Simpan file dan restart server (<code className="font-mono">npm run dev</code>). Status akan berubah menjadi <strong className="text-emerald-600">Supabase Active</strong>!</li>
                    </ol>
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
