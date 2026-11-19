'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Survey } from '@/types/survey';
import { fetchAllSurveys } from '@/lib/storage';
import {
  PlusCircle,
  Calendar,
  Users,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react';

export default function HomePage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAllSurveys();
    setSurveys(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalRespondentsAll = surveys.reduce((acc, curr) => acc + (curr.respondents_count || 0), 0);

  return (
    <div className="space-y-8">
      {/* Hero / Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400 text-xs font-mono mb-3">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            <span>Synthetic Research Simulation Platform</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Kuesioner & Responden AI Sintetis
          </h1>
          <p className="mt-1 text-sm text-neutral-500 max-w-2xl">
            Rancang angket kuesioner Anda, tentukan jumlah responden dan rentang waktu pengisian, lalu biarkan bot AI mengisi data realistis yang langsung siap divisualisasikan dalam aneka grafik dinamis.
          </p>
        </div>

        <Link
          href="/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-semibold tracking-wide transition-all shadow-sm shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Buat Angket Baru</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-mono uppercase">Total Angket</span>
            <Layers className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-2">
            {surveys.length}
          </p>
          <p className="text-[11px] text-neutral-400 font-mono mt-0.5">Survei riset aktif</p>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-mono uppercase">Total Responden Bot</span>
            <Users className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-2">
            {totalRespondentsAll}
          </p>
          <p className="text-[11px] text-neutral-400 font-mono mt-0.5">Jawaban sintetis terisi</p>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-mono uppercase">Mesin Pengisi</span>
            <Sparkles className="h-4 w-4" />
          </div>
          <p className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-2">
            Gemini Flash + Batch
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">Anti-Slop & Rate-Limit Safe</p>
        </div>
      </div>

      {/* Survey List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Daftar Kuesioner Riset
          </h2>
          <span className="text-xs font-mono text-neutral-400">
            Menampilkan {surveys.length} angket
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-400">
            Memuat daftar survei...
          </div>
        ) : surveys.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white/50 p-12 text-center dark:border-neutral-800 dark:bg-neutral-900/30">
            <Layers className="mx-auto h-10 w-10 text-neutral-300 dark:text-neutral-700" />
            <h3 className="mt-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Belum ada kuesioner yang dibuat
            </h3>
            <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto">
              Mulai buat angket baru dengan pertanyaan pilihan ganda, benar/salah, atau isian bebas.
            </p>
            <Link
              href="/create"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 text-white text-xs font-medium dark:bg-neutral-100 dark:text-neutral-900"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Buat Angket Sekarang
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {surveys.map((survey) => {
              const isCompleted = (survey.respondents_count || 0) >= survey.target_respondents;
              return (
                <div
                  key={survey.id}
                  className="group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/60 dark:hover:border-neutral-700"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                        }`}
                      >
                        {isCompleted ? 'Target Tercapai' : 'Perlu Simulasi'}
                      </span>

                      <span className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
                        <Calendar className="h-3 w-3" />
                        {new Date(survey.start_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        -{' '}
                        {new Date(survey.end_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                        {survey.title}
                      </h3>
                      <p className="mt-1 text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                        {survey.description || 'Tidak ada deskripsi tambahan.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-5 mt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-600 dark:text-neutral-400">
                      <Users className="h-3.5 w-3.5 text-neutral-400" />
                      <span>
                        <strong className="text-neutral-900 dark:text-neutral-100 font-bold">
                          {survey.respondents_count || 0}
                        </strong>{' '}
                        / {survey.target_respondents} responden
                      </span>
                    </div>

                    <Link
                      href={`/survey/${survey.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-neutral-900 dark:text-neutral-100 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Buka Analitik</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
