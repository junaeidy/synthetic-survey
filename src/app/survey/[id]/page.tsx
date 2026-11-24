'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { SurveyAnalytics } from '@/types/survey';
import { fetchSurveyAnalytics } from '@/lib/storage';
import QuestionChart from '@/components/QuestionChart';
import TimelineChart from '@/components/TimelineChart';
import TextResponseFeed from '@/components/TextResponseFeed';
import SimulatorModal from '@/components/SimulatorModal';
import ExportButton from '@/components/ExportButton';
import {
  ArrowLeft,
  Calendar,
  Users,
  BarChart3,
  RefreshCw,
  Layers,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';

export default function SurveyDetailPage() {
  const params = useParams();
  const surveyId = params.id as string;

  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!surveyId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSurveyAnalytics(surveyId);
      setAnalytics(data);
    } catch (err: unknown) {
      console.error('Error fetching survey analytics:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="py-24 text-center font-mono text-xs text-neutral-400">
        Memuat data analitik angket...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 max-w-2xl mx-auto space-y-4">
        <div className="rounded-2xl border border-rose-300 bg-rose-50/70 p-6 dark:border-rose-900 dark:bg-rose-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                Gagal Mengambil Data Survei dari Supabase
              </h3>
              <p className="text-xs text-rose-800 dark:text-rose-300 font-mono bg-rose-100/60 dark:bg-rose-900/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800 break-words">
                {error}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={loadData}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 text-white hover:bg-rose-800 text-xs font-medium transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Coba Lagi</span>
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 font-mono"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Kembali ke Beranda</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="py-24 text-center space-y-3">
        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Kuesioner tidak ditemukan di Supabase
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 font-mono"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
    );
  }

  const { survey, questions, respondents, questionStats, timelineData } = analytics;
  const isTargetAchieved = respondents.length >= survey.target_respondents;
  const progressPercent = Math.min(
    100,
    Math.round((respondents.length / survey.target_respondents) * 100)
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-5 dark:border-neutral-800">
        <div className="space-y-1.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Daftar Angket</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isTargetAchieved
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
              }`}
            >
              {isTargetAchieved ? 'Target Tercapai' : 'Pengumpulan Aktif'}
            </span>
            <span className="text-xs font-mono text-neutral-400">
              ID: {survey.id.slice(0, 8)}...
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {survey.title}
          </h1>
          <p className="text-xs text-neutral-500 max-w-2xl leading-relaxed">
            {survey.description || 'Tidak ada deskripsi riset tambahan.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={loadData}
            title="Muat ulang data"
            className="p-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 transition-all shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <ExportButton analytics={analytics} />

          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-medium transition-all shadow-sm"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Tambah Responden</span>
          </button>
        </div>
      </div>

      {/* Progress & Overview Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-mono uppercase">Responden Terkumpul</span>
            <Users className="h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {respondents.length}
            </span>
            <span className="text-xs text-neutral-500 font-mono">/ {survey.target_respondents}</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-full bg-neutral-900 dark:bg-neutral-100 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-mono uppercase">Jumlah Pertanyaan</span>
            <Layers className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-2">
            {questions.length}
          </p>
          <p className="text-[11px] text-neutral-400 font-mono mt-0.5">Butir instrumen riset</p>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-mono uppercase">Rentang Waktu</span>
            <Calendar className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold font-mono text-neutral-900 dark:text-neutral-100 mt-2 truncate">
            {new Date(survey.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} -{' '}
            {new Date(survey.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </p>
          <p className="text-[11px] text-neutral-400 font-mono mt-0.5">Jendela waktu pengisian</p>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-mono uppercase">Status Instrumen</span>
            <BarChart3 className="h-4 w-4" />
          </div>
          <p className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-2">
            {respondents.length > 0 ? 'Siap Analisis' : 'Belum Ada Responden'}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            Grafik dapat disesuaikan
          </p>
        </div>
      </div>

      {/* Temporal Distribution Section (Waktu Pengisian Berbeda-beda) */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider font-mono text-neutral-500">
          1. Distribusi Waktu Pengisian (Linimasa Rentang Hari)
        </h2>
        <TimelineChart
          timelineData={timelineData}
          startDate={survey.start_date}
          endDate={survey.end_date}
          totalRespondents={respondents.length}
        />
      </section>

      {/* Questions Analytics & Dynamic Charts */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider font-mono text-neutral-500">
            2. Analisis Hasil per Pertanyaan
          </h2>
          <span className="text-xs font-mono text-neutral-400">
            Admin dapat mengganti tipe grafik pada setiap kartu
          </span>
        </div>

        <div className="space-y-6">
          {questions.map((q) => {
            const stat = questionStats[q.id];
            if (!stat) return null;

            if (q.question_type === 'text') {
              return (
                <TextResponseFeed
                  key={q.id}
                  question={q}
                  responses={stat.textResponses}
                />
              );
            }

            return (
              <QuestionChart
                key={q.id}
                question={q}
                distribution={stat.distribution}
                initialChartType={stat.preferredChart}
              />
            );
          })}
        </div>
      </section>

      {/* Simulator Modal */}
      <SimulatorModal
        survey={survey}
        questions={questions}
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onComplete={() => {
          setIsSimulatorOpen(false);
          loadData();
        }}
      />
    </div>
  );
}
