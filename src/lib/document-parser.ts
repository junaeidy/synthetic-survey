import { QuestionType } from '@/types/survey';

export interface ExtractedQuestion {
  question_text: string;
  question_type: QuestionType;
  options: string[];
}

export interface DocumentParseResult {
  title: string;
  description: string;
  target_respondents: number;
  questions: ExtractedQuestion[];
}

const DEFAULT_LIKERT_OPTIONS = [
  '1 - Sangat Tidak Setuju (STS)',
  '2 - Tidak Setuju (TS)',
  '3 - Ragu-ragu/Netral (N)',
  '4 - Setuju (S)',
  '5 - Sangat Setuju (SS)',
];

function cleanHtmlText(str: string): string {
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseAcademicSurveyHtml(html: string): DocumentParseResult {
  // 1. Ekstraksi Paragraf untuk Judul, Sasaran Responden, dan Pengantar
  const pMatches = html.match(/<(p|h[1-6]|li)[\s\S]*?<\/\1>/gi) || [];
  const paragraphs = pMatches.map(cleanHtmlText).filter((p) => p.length > 0);

  let title = '';
  let description = '';

  for (let i = 0; i < Math.min(paragraphs.length, 8); i++) {
    const p = paragraphs[i];
    const pLower = p.toLowerCase();

    if (!title && (pLower.includes('angket') || pLower.includes('kuesioner') || pLower.includes('penelitian') || p.length > 25)) {
      title = p;
      // Jika paragraf berikutnya adalah judul spesifik topik penelitian, gabungkan atau gunakan yang lebih spesifik
      if (paragraphs[i + 1] && paragraphs[i + 1].length > 15 && !paragraphs[i + 1].toLowerCase().startsWith('responden')) {
        title = paragraphs[i + 1];
      }
    }

    if (pLower.startsWith('responden:') || pLower.includes('mahasiswa') || pLower.includes('tujuan') || pLower.includes('yth.')) {
      description += (description ? '\n' : '') + p;
    }
  }

  if (!title) title = 'Kuesioner Penelitian';
  if (!description && paragraphs.length > 1) {
    description = paragraphs.slice(1, 4).join(' ');
  }

  // 2. Ekstraksi Seluruh Tabel dalam Dokumen Word
  const questions: ExtractedQuestion[] = [];

  // Lacak seksi bagian (misal: "Bagian B. Persepsi Kemudahan...", "Bagian C...")
  let currentSection = '';

  // Pecah HTML per elemen untuk melacak heading/paragraf sebelum tiap tabel
  const parts = html.split(/(<table[\s\S]*?<\/table>)/gi);

  parts.forEach((part) => {
    if (part.startsWith('<table')) {
      // Ini adalah tabel
      const trMatches = part.match(/<tr[\s\S]*?<\/tr>/gi) || [];
      if (trMatches.length < 2) return;

      const headerRow = trMatches[0] || '';
      const headerCells = (headerRow.match(/<t[hd][\s\S]*?<\/t[hd]>/gi) || []).map(cleanHtmlText);
      const headerLower = headerCells.map((h) => h.toLowerCase());

      // Kriteria Deteksi Tabel Skala Likert:
      // a. Header memiliki kolom 1, 2, 3, 4, 5 atau STS, TS, SS
      // b. ATAU jumlah kolom >= 6 (kolom kode, kolom pernyataan, lalu 5 kolom skala penilaian)
      // c. ATAU teks seksi saat ini bertuliskan Skala Likert
      const hasRatingCols = headerLower.some((h) =>
        ['1', '2', '3', '4', '5', 'sts', 'ts', 'ss', 'sangat tidak setuju', 'ragu', 'netral', 'setuju'].includes(h)
      );
      const isLikertTable = hasRatingCols || headerCells.length >= 6 || currentSection.toLowerCase().includes('skala');

      for (let r = 1; r < trMatches.length; r++) {
        const rowCells = (trMatches[r].match(/<t[hd][\s\S]*?<\/t[hd]>/gi) || []).map(cleanHtmlText);
        if (rowCells.length < 2) continue;

        if (isLikertTable) {
          // Format Skala Likert: Col 0 = Kode (misal AR1, AR2), Col 1 = Pernyataan
          const code = rowCells[0].replace(/[.:]$/, '').trim();
          const statement = rowCells[1].trim();

          // Abaikan jika baris ini ternyata subheader atau kosong
          if (statement && statement.length > 3 && !statement.toLowerCase().startsWith('pernyataan')) {
            const sectionPrefix = currentSection ? `[${currentSection}] ` : '';
            const codePrefix = code && !statement.startsWith(code) ? `${code}. ` : '';
            const fullQuestionText = `${sectionPrefix}${codePrefix}${statement}`;

            questions.push({
              question_text: fullQuestionText,
              question_type: 'likert',
              options: [...DEFAULT_LIKERT_OPTIONS],
            });
          }
        } else {
          // Format Pertanyaan Demografi/Identitas (seperti Bagian A):
          // Col 0 = No/Kode (A1, A2..), Col 1 = Pertanyaan, Col 2 = Pilihan Jawaban
          const code = rowCells[0].replace(/[.:]$/, '').trim();
          const questionText = rowCells[1].trim();
          const rawOptions = rowCells[2] || '';

          if (!questionText || questionText.length < 2 || questionText.toLowerCase() === 'pertanyaan') continue;

          const sectionPrefix = currentSection ? `[${currentSection}] ` : '';
          const codePrefix = code && !questionText.startsWith(code) ? `${code}. ` : '';
          const fullQuestionText = `${sectionPrefix}${codePrefix}${questionText}`;

          // Cek apakah ada opsi dalam kurung () atau []
          if (rawOptions.includes('(') || rawOptions.includes('[')) {
            const splitOptions = rawOptions
              .split(/\(\s*\)|\[\s*\]|\([xXvV\s]?\)/)
              .map((s) => s.trim())
              .filter((s) => s.length > 0 && !s.startsWith('......') && !s.startsWith('……'));

            if (splitOptions.length > 1) {
              const isBoolean =
                splitOptions.length === 2 &&
                splitOptions.some((o) => o.toLowerCase() === 'ya') &&
                splitOptions.some((o) => o.toLowerCase() === 'tidak');

              questions.push({
                question_text: fullQuestionText,
                question_type: isBoolean ? 'boolean' : 'multiple_choice',
                options: isBoolean ? ['Ya', 'Tidak'] : splitOptions,
              });
              continue;
            }
          }

          // Cek jika ada opsi terpisah garis miring / koma tanpa tanda kurung
          if (rawOptions.includes('/') && !rawOptions.includes('...')) {
            const slashOptions = rawOptions.split('/').map((s) => s.trim()).filter((s) => s.length > 0);
            if (slashOptions.length > 1 && slashOptions.length <= 6) {
              questions.push({
                question_text: fullQuestionText,
                question_type: 'multiple_choice',
                options: slashOptions,
              });
              continue;
            }
          }

          // Jika isian teks bebas (titik-titik seperti "... tahun", "...")
          questions.push({
            question_text: fullQuestionText,
            question_type: 'text',
            options: [],
          });
        }
      }
    } else {
      // Teks di luar tabel: Cari indikasi seksi bagian (misal: "Bagian B. Persepsi Kemudahan...")
      const sectionMatch = part.match(/Bagian\s+([A-H0-9]+)[.:\s]+([^<>\n]+)/i);
      if (sectionMatch) {
        currentSection = cleanHtmlText(`Bagian ${sectionMatch[1]} - ${sectionMatch[2]}`);
      }
    }
  });

  // 3. Fallback jika dokumen tidak memakai <table> melainkan list paragraf bernomor (1., 2., AR1., dll.)
  if (questions.length === 0) {
    paragraphs.forEach((p) => {
      const match = p.match(/^([A-Z]{1,3}\d+|\d+)[.:]\s*(.+)/i);
      if (match && match[2].length > 5) {
        questions.push({
          question_text: `${match[1]}. ${match[2]}`,
          question_type: 'likert',
          options: [...DEFAULT_LIKERT_OPTIONS],
        });
      }
    });
  }

  return {
    title: title || 'Angket Penelitian',
    description: description || 'Kuesioner penelitian.',
    target_respondents: 35,
    questions,
  };
}
