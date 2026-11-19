'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

interface QuestionDraft {
  question_text: string;
  question_type: QuestionType;
  options: string[];
}

const TEMPLATES = [
  {
    title: 'Survei Kepuasan Layanan Platform Akademik & E-Learning Kampus',
    description: 'Mengukur kemudahan akses, ketersediaan materi digital, dan kecepatan respon layanan bantuan kampus.',
    target_respondents: 40,
    questions: [
      {
        question_text: 'Seberapa sering Anda mengakses portal e-learning dalam seminggu?',
        question_type: 'multiple_choice' as QuestionType,
        options: ['Hampir Setiap Hari', '3-4 Kali Seminggu', '1-2 Kali Seminggu', 'Jarang Sekali'],
      },
      {
        question_text: 'Apakah tampilan antarmuka (UI) portal saat ini mudah dipahami oleh mahasiswa baru?',
        question_type: 'boolean' as QuestionType,
        options: ['Ya', 'Tidak'],
      },
      {
        question_text: 'Fitur atau perbaikan apa yang paling mendesak dibutuhkan pada portal kampus ini?',
        question_type: 'text' as QuestionType,
        options: [],
      },
    ],
  },
  {
    title: 'Riset Preferensi Konsumen Terhadap Promo Bebas Ongkir E-Commerce',
    description: 'Analisis perilaku belanja online dan faktor penentu pemilihan platform marketplace.',
    target_respondents: 50,
    questions: [
      {
        question_text: 'Apa pertimbangan utama Anda saat memilih aplikasi belanja online?',
        question_type: 'multiple_choice' as QuestionType,
        options: ['Gratis Ongkir Tanpa Minimum', 'Harga Barang Termurah', 'Kecepatan Pengiriman', 'Keaslian Produk Terjamin'],
      },
      {
        question_text: 'Apakah Anda pernah membatalkan pesanan karena biaya pengiriman dirasa terlalu mahal?',
        question_type: 'boolean' as QuestionType,
        options: ['Ya', 'Tidak'],
      },
      {
        question_text: 'Tuliskan pengalaman Anda mengenai klaim voucer diskon yang paling sering Anda gunakan:',
        question_type: 'text' as QuestionType,
        options: [],
      },
    ],
  },
];

export default function CreateSurveyPage() {
  const router = useRouter();

  const now = new Date();
  const plus7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetRespondents, setTargetRespondents] = useState(35);
  const [startDate, setStartDate] = useState(now.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(plus7Days.toISOString().split('T')[0]);

  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      question_text: 'Bagaimana penilaian Anda terhadap stabilitas sistem ini?',
      question_type: 'multiple_choice',
      options: ['Sangat Baik', 'Cukup Baik', 'Kurang Memuaskan'],
    },
    {
      question_text: 'Apakah Anda akan merekomendasikan layanan ini kepada rekan Anda?',
      question_type: 'boolean',
      options: ['Ya', 'Tidak'],
    },
    {
      question_text: 'Tuliskan masukan atau kritik membangun yang Anda miliki:',
      question_type: 'text',
      options: [],
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question_text: '',
        question_type: 'multiple_choice',
        options: ['Pilihan A', 'Pilihan B', 'Pilihan C'],
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
        if (val === 'boolean') {
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
      copy[qIdx].options = [...copy[qIdx].options, `Pilihan ${String.fromCharCode(65 + copy[qIdx].options.length)}`];
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
      // Buat angket dan LANGSUNG isi seluruh responden bot secara instan
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
          options: q.question_type === 'multiple_choice' ? q.options : q.question_type === 'boolean' ? ['Ya', 'Tidak'] : [],
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
          <span className="text-xs text-neutral-400 font-mono hidden sm:inline">Pakai Template Cepat:</span>
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

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Buat Angket Kuesioner Baru
        </h1>
        <p className="mt-1 text-xs text-neutral-500">
          Setelah disimpan, seluruh responden bot akan <strong>langsung mengisi kuesioner secara otomatis</strong> dengan sebaran tanggal dan waktu yang berbeda-beda.
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
              placeholder="Contoh: Survei Evaluasi Kepuasan Pembelajaran Digital..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs text-neutral-900 focus:border-neutral-400 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:bg-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Deskripsi Singkat / Tujuan Penelitian
            </label>
            <textarea
              rows={2}
              placeholder="Jelaskan latar belakang atau fokus riset untuk membantu bot memahami konteks pertanyaan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs text-neutral-900 focus:border-neutral-400 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:bg-neutral-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-neutral-400" />
                Target Responden Otomatis
              </label>
              <input
                type="number"
                min="5"
                max="200"
                required
                value={targetRespondents}
                onChange={(e) => setTargetRespondents(parseInt(e.target.value) || 10)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-mono text-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
              />
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
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                Batas Selesai (+7 Hari)
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-mono text-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
              />
            </div>
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
                    placeholder={`Tuliskan teks pertanyaan nomor ${idx + 1}...`}
                    value={q.question_text}
                    onChange={(e) => handleQuestionChange(idx, 'question_text', e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-400 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
                  />
                </div>

                {/* Sub-form based on Question Type */}
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
                            {String.fromCharCode(65 + optIdx)}.
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
                    💡 Bot AI akan langsung mengisi tanggapan teks autentik berbahasa Indonesia bervariasi sesuai profil persona.
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
                <span>Menghasilkan...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Simpan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
