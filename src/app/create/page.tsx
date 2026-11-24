'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSurveyWithInstantResponses } from '@/lib/storage';
import { QuestionType } from '@/types/survey';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  Users,
  FileText,
  Loader2,
  Sparkles,
  FileUp,
  CheckCircle2,
} from 'lucide-react';

interface QuestionDraft {
  question_text: string;
  question_type: QuestionType;
  options: string[];
}

const DEFAULT_LIKERT_OPTIONS = [
  '1 - Sangat Tidak Setuju (STS)',
  '2 - Tidak Setuju (TS)',
  '3 - Ragu-ragu/Netral (N)',
  '4 - Setuju (S)',
  '5 - Sangat Setuju (SS)',
];

const TEMPLATES = [
  {
    title: 'Penciptaan Media Pembelajaran Menggunakan Articulate, Canva, dan ChatGPT',
    description: 'Responden: Mahasiswa Program Studi Pendidikan Islam / PAUD untuk mengukur kemudahan, persepsi, dan kualitas media pembelajaran.',
    target_respondents: 35,
    questions: [
      {
        question_text: 'Semester saat ini',
        question_type: 'multiple_choice' as QuestionType,
        options: ['1-2', '3-4', '5-6', '7 atau lebih'],
      },
      {
        question_text: 'Pengalaman menggunakan ChatGPT sebelum perkuliahan ini',
        question_type: 'multiple_choice' as QuestionType,
        options: ['Belum pernah', 'Pernah, kurang dari 1 bulan', 'Pernah, 1-6 bulan', 'Lebih dari 6 bulan'],
      },
      {
        question_text: 'Antarmuka aplikasi mudah dipahami dan dioperasikan',
        question_type: 'likert' as QuestionType,
        options: DEFAULT_LIKERT_OPTIONS,
      },
      {
        question_text: 'Saya dapat mempelajari fitur dasar aplikasi dalam waktu singkat',
        question_type: 'likert' as QuestionType,
        options: DEFAULT_LIKERT_OPTIONS,
      },
      {
        question_text: 'Aplikasi memungkinkan pembuatan media yang lebih interaktif dibanding presentasi biasa',
        question_type: 'likert' as QuestionType,
        options: DEFAULT_LIKERT_OPTIONS,
      },
      {
        question_text: 'Tuliskan kritik, kendala, atau saran pengembangan media pembelajaran:',
        question_type: 'text' as QuestionType,
        options: [],
      },
    ],
  },
  {
    title: 'Survei Evaluasi Pengalaman Belanja Online & Bebas Ongkir',
    description: 'Riset perilaku konsumen terhadap promo gratis ongkir dan pertimbangan checkout belanja digital.',
    target_respondents: 40,
    questions: [
      {
        question_text: 'Apa pertimbangan utama Anda saat memilih marketplace online?',
        question_type: 'multiple_choice' as QuestionType,
        options: ['Gratis Ongkir', 'Harga Termurah', 'Kecepatan Pengiriman', 'Keaslian Produk'],
      },
      {
        question_text: 'Promo gratis ongkir mempengaruhi keputusan saya untuk menyelesaikan pembayaran',
        question_type: 'likert' as QuestionType,
        options: DEFAULT_LIKERT_OPTIONS,
      },
      {
        question_text: 'Tuliskan pengalaman atau kendala Anda terkait voucer promo belanja:',
        question_type: 'text' as QuestionType,
        options: [],
      },
    ],
  },
];

export default function CreateSurveyPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const now = new Date();
  const plus2Days = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetRespondents, setTargetRespondents] = useState(100);
  const [startDate, setStartDate] = useState(now.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(plus2Days.toISOString().split('T')[0]);

  const setDurationDays = (days: number) => {
    const start = new Date(startDate);
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      question_text: 'Semester saat ini',
      question_type: 'multiple_choice',
      options: ['1-2', '3-4', '5-6', '7 atau lebih'],
    },
    {
      question_text: 'Antarmuka aplikasi mudah dipahami dan dioperasikan',
      question_type: 'likert',
      options: DEFAULT_LIKERT_OPTIONS,
    },
    {
      question_text: 'Tuliskan masukan atau kritik membangun yang Anda miliki:',
      question_type: 'text',
      options: [],
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docSuccessMsg, setDocSuccessMsg] = useState<string | null>(null);

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setTitle(t.title);
    setDescription(t.description);
    setTargetRespondents(t.target_respondents);
    setQuestions(
      t.questions.map((q) => ({
        ...q,
        options: [...q.options],
      }))
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
    setDocSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Gagal membaca dokumen');
      }

      const extracted = resData.data;
      if (extracted.title) setTitle(extracted.title);
      if (extracted.description) setDescription(extracted.description);
      if (extracted.target_respondents) setTargetRespondents(extracted.target_respondents);

      if (Array.isArray(extracted.questions) && extracted.questions.length > 0) {
        setQuestions(
          extracted.questions.map((q: { question_text?: string; question_type?: QuestionType; options?: string[] }) => ({
            question_text: q.question_text || '',
            question_type: (q.question_type as QuestionType) || 'multiple_choice',
            options: Array.isArray(q.options) && q.options.length > 0 ? q.options : q.question_type === 'likert' ? DEFAULT_LIKERT_OPTIONS : [],
          }))
        );
      }

      setDocSuccessMsg(`Berhasil mengekstrak ${extracted.questions?.length || 0} butir pertanyaan dari ${file.name}!`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(`Gagal mengekstrak dokumen Word: ${errMsg}`);
    } finally {
      setIsUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question_text: '',
        question_type: 'likert',
        options: DEFAULT_LIKERT_OPTIONS,
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = <K extends keyof QuestionDraft>(
    idx: number,
    field: K,
    val: QuestionDraft[K]
  ) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      if (field === 'question_type') {
        if (val === 'likert') {
          copy[idx].options = DEFAULT_LIKERT_OPTIONS;
        } else if (val === 'boolean') {
          copy[idx].options = ['Ya', 'Tidak'];
        } else if (val === 'multiple_choice' && copy[idx].options.length === 0) {
          copy[idx].options = ['Pilihan A', 'Pilihan B', 'Pilihan C'];
        }
      }
      return copy;
    });
  };

  const handleAddOption = (qIdx: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].options = [...copy[qIdx].options, `Opsi ${copy[qIdx].options.length + 1}`];
      return copy;
    });
  };

  const handleRemoveOption = (qIdx: number, optIdx: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].options = copy[qIdx].options.filter((_, i) => i !== optIdx);
      return copy;
    });
  };

  const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const newOpts = [...copy[qIdx].options];
      newOpts[optIdx] = val;
      copy[qIdx].options = newOpts;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Silakan isi judul kuesioner.');
      return;
    }
    if (questions.length === 0) {
      alert('Harap tambahkan setidaknya 1 pertanyaan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newId = await createSurveyWithInstantResponses(
        {
          title: title.trim(),
          description: description.trim(),
          target_respondents: Number(targetRespondents) || 35,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
        },
        questions.map((q) => ({
          question_text: q.question_text.trim(),
          question_type: q.question_type,
          options: q.question_type === 'text' ? [] : q.options,
        }))
      );

      router.push(`/survey/${newId}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(`Gagal membuat survei: ${errMsg}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>

        {/* Template Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 font-mono hidden sm:inline">Template Riset:</span>
          {TEMPLATES.map((t, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyTemplate(t)}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 transition-all"
            >
              Template {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Dokumen Word (AI Docx Parser) */}
      <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 text-[11px] font-mono">
              <Sparkles className="h-3 w-3" />
              <span>AI Document Parser (Word / .docx)</span>
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Punya Dokumen Angket Word (.docx)?
            </h3>
            <p className="text-xs text-neutral-500 max-w-lg">
              Unggah file Word kuesioner Anda. AI akan otomatis mengekstrak Judul, Sasaran Responden, Pertanyaan Demografi, dan Matriks Skala Likert (STS–SS) ke dalam formulir.
            </p>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".docx,.doc,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              disabled={isUploadingDoc}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-all shadow-sm disabled:opacity-50"
            >
              {isUploadingDoc ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                  <span>AI Sedang Membaca Dokumen...</span>
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Unggah File Word (.docx)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {docSuccessMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{docSuccessMsg}</span>
          </div>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Parameter & Butir Pertanyaan Angket
        </h1>
        <p className="mt-1 text-xs text-neutral-500">
          Periksa butir pertanyaan di bawah ini. Setelah disimpan, data kuesioner dan tanggapan responden akan <strong>langsung diproses secara otomatis</strong> dengan sebaran tanggal dan waktu yang berbeda-beda.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Survey Basic Information Card */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <FileText className="h-4 w-4 text-neutral-500" />
            Informasi & Parameter Kuesioner
          </h2>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Judul Angket / Riset <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Penciptaan Media Pembelajaran Menggunakan Articulate..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs text-neutral-900 focus:border-neutral-400 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:bg-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Deskripsi Singkat & Sasaran Responden (Membantu AI Membentuk Karakter Persona)
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Responden: Mahasiswa Program Studi Pendidikan Islam / PAUD..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs text-neutral-900 focus:border-neutral-400 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:bg-neutral-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-neutral-400" />
                  Target Responden
                </span>
                <span className="text-[10px] font-mono text-neutral-400">Maks. 5000</span>
              </label>
              <input
                type="number"
                min="5"
                max="5000"
                required
                value={targetRespondents}
                onChange={(e) => setTargetRespondents(parseInt(e.target.value) || 10)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-mono text-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
              />
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                {[50, 100, 500, 1000, 2000].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTargetRespondents(num)}
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-all ${
                      targetRespondents === num
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold border-transparent'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    {num >= 1000 ? `${num / 1000}k` : num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                Tanggal Mulai Angket
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-mono text-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                  Batas Selesai
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">Rentang Waktu</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-mono text-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
              />
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setDurationDays(2)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-medium"
                >
                  ⚡ +2 Hari (Aman Token)
                </button>
                <button
                  type="button"
                  onClick={() => setDurationDays(7)}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900"
                >
                  +7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setDurationDays(14)}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900"
                >
                  +14 Hari
                </button>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-neutral-500 leading-relaxed bg-neutral-50 dark:bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
            <span className="text-emerald-500 font-bold shrink-0">🛡️ Proteksi Kuota API:</span>
            <span>Untuk volume besar (hingga 2.000+ data), sistem menggunakan <strong>Hybrid Smart Seed</strong> dan <strong>Bulk Chunk Insert</strong> ke Supabase sehingga token API tetap aman dan proses selesai dalam hitungan detik.</span>
          </div>
        </div>

        {/* Question Builder List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Daftar Pertanyaan Angket ({questions.length})
            </h2>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-all shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 text-neutral-500" />
              <span>Tambah Pertanyaan</span>
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60 space-y-4 relative"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 text-xs font-mono font-bold">
                    {idx + 1}
                  </span>

                  <div className="flex items-center gap-3">
                    <select
                      value={q.question_type}
                      onChange={(e) =>
                        handleQuestionChange(idx, 'question_type', e.target.value as QuestionType)
                      }
                      className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-mono text-neutral-800 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200"
                    >
                      <option value="likert">Skala Likert (1-5 STS s/d SS)</option>
                      <option value="multiple_choice">Pilihan Ganda (A, B, C...)</option>
                      <option value="boolean">Benar / Salah (Ya / Tidak)</option>
                      <option value="text">Isian Bebas (Kualitatif / Teks)</option>
                    </select>

                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-neutral-400 hover:text-rose-500 transition-colors p-1"
                        title="Hapus Pertanyaan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    required
                    placeholder={`Tuliskan teks pertanyaan / pernyataan nomor ${idx + 1}...`}
                    value={q.question_text}
                    onChange={(e) => handleQuestionChange(idx, 'question_text', e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-400 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
                  />
                </div>

                {/* Sub-form based on Question Type */}
                {q.question_type === 'likert' && (
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                    <span className="text-[11px] text-neutral-400 mr-1">Skala 1–5:</span>
                    {q.options.map((opt, oIdx) => (
                      <span
                        key={oIdx}
                        className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-700 dark:text-neutral-300"
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                )}

                {q.question_type === 'multiple_choice' && (
                  <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase text-neutral-400">
                        Opsi Pilihan Jawaban
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddOption(idx)}
                        className="text-[11px] font-mono text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                      >
                        + Tambah Opsi
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-1.5">
                          <span className="text-xs font-mono text-neutral-400 w-4 text-center">
                            {optIdx + 1}.
                          </span>
                          <input
                            type="text"
                            required
                            value={opt}
                            onChange={(e) => handleOptionChange(idx, optIdx, e.target.value)}
                            className="flex-1 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs text-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
                          />
                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(idx, optIdx)}
                              className="text-neutral-400 hover:text-rose-500 p-1"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {q.question_type === 'boolean' && (
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-3 text-xs text-neutral-500 font-mono">
                    <span>Opsi Otomatis:</span>
                    <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      Ya
                    </span>
                    <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      Tidak
                    </span>
                  </div>
                )}

                {q.question_type === 'text' && (
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 font-mono">
                    💡 Tanggapan teks isian terbuka akan diproses dengan kalimat autentik bahasa Indonesia sesuai karakteristik responden.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit action */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <Link
            href="/"
            className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-semibold tracking-wide transition-all shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyimpan Kuesioner & Memproses {targetRespondents} Responden...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Simpan Kuesioner & Buat Analitik</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
