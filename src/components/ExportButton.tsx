'use client';

import React, { useState } from 'react';
import { SurveyAnalytics } from '@/types/survey';
import { fetchSurveyAnswersForExport } from '@/lib/storage';
import { Download, Loader2 } from 'lucide-react';

interface ExportButtonProps {
  analytics: SurveyAnalytics;
}

export default function ExportButton({ analytics }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const { survey, questions, respondents } = analytics;

      // Ambil seluruh jawaban secara on-demand jika belum dimuat
      let answers = analytics.answers;
      if (!answers || answers.length === 0) {
        answers = await fetchSurveyAnswersForExport(survey.id);
      }

      // Header baris CSV
      const headers = ['Respondent_ID', 'Persona_Profile', 'Sentiment', 'Submitted_At'];
      questions.forEach((q, idx) => {
        headers.push(`Q${idx + 1}_${q.question_text.replace(/"/g, '""')}`);
      });

      // Petakan jawaban ke Map O(1) agar cepat memproses ribuan data responden
      const answerMap = new Map<string, string>();
      answers.forEach((a) => {
        answerMap.set(`${a.respondent_id}_${a.question_id}`, a.answer_value);
      });

      // Baris data per responden
      const rows = respondents.map((r) => {
        const rowData = [
          `"${r.id}"`,
          `"${r.persona_profile.replace(/"/g, '""')}"`,
          `"${r.persona_sentiment}"`,
          `"${r.submitted_at}"`,
        ];

        questions.forEach((q) => {
          const ansValue = answerMap.get(`${r.id}_${q.id}`) || '';
          rowData.push(`"${ansValue.replace(/"/g, '""')}"`);
        });

        return rowData.join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `survey_${survey.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_data.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating CSV export:', err);
      alert('Gagal mengunduh CSV riset. Silakan coba beberapa saat lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExportCSV}
      disabled={isExporting}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-all shadow-sm disabled:opacity-60"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-500" />
          <span>Menyiapkan CSV...</span>
        </>
      ) : (
        <>
          <Download className="h-3.5 w-3.5 text-neutral-500" />
          <span>Unduh CSV Riset</span>
        </>
      )}
    </button>
  );
}
