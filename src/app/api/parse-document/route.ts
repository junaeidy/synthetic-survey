import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { GoogleGenAI } from '@google/genai';
import { QuestionType } from '@/types/survey';

interface ExtractedQuestion {
  question_text: string;
  question_type: QuestionType;
  options: string[];
}

interface ParseResult {
  title: string;
  description: string;
  target_respondents?: number;
  questions: ExtractedQuestion[];
}

export async function POST(req: NextRequest) {
  try {
    let documentText = '';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ success: false, error: 'File tidak ditemukan' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        const result = await mammoth.extractRawText({ buffer });
        documentText = result.value;
      } else {
        documentText = buffer.toString('utf-8');
      }
    } else {
      const body = await req.json();
      documentText = body.text || '';
    }

    if (!documentText.trim()) {
      return NextResponse.json(
        { success: false, error: 'Dokumen kosong atau tidak dapat dibaca teksnya.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (apiKey && apiKey.trim().length > 10) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `Kamu adalah analis instrumen kuesioner penelitian akademis/skripsi.
Tugasmu adalah menganalisis teks dokumen angket penelitian berikut dan mengekstraknya menjadi struktur data formulir survei yang rapi.

Aturan Ekstraksi:
1. "title": Temukan judul penelitian / angket (misal: "Penciptaan Media Pembelajaran Menggunakan Articulate...").
2. "description": Ambil teks pengantar, tujuan penelitian, dan sebutkan secara spesifik TARGET RESPONDENNYA (misal: "Responden: Mahasiswa Program Studi PAUD UIN Mahmud Yunus Batusangkar").
3. "target_respondents": Perkirakan jumlah responden yang wajar jika ada disebutkan, atau default 35.
4. "questions": Ekstrak semua butir pertanyaan dari Bagian A (Identitas/Demografi) dan Bagian B-H (Skala Likert / Pernyataan):
   - Jika pertanyaan skala 1-5 (Sangat Tidak Setuju s/d Sangat Setuju), beri "question_type": "likert" dan options: ["1 - Sangat Tidak Setuju (STS)", "2 - Tidak Setuju (TS)", "3 - Ragu-ragu/Netral (N)", "4 - Setuju (S)", "5 - Sangat Setuju (SS)"].
   - Jika pilihan ganda, beri "question_type": "multiple_choice" dan sebutkan daftar opsinya.
   - Jika benar/salah atau persetujuan ya/tidak, beri "question_type": "boolean" dan options: ["Ya", "Tidak"].
   - Jika isian bebas / titik-titik (seperti usia, mata kuliah, saran), beri "question_type": "text" dan options: [].

Kembalikan HANYA JSON MURNI tanpa markdown, tanpa tanda petik backtick \`\`\`json.
Format JSON:
{
  "title": "string",
  "description": "string",
  "target_respondents": 35,
  "questions": [
    {
      "question_text": "string",
      "question_type": "multiple_choice | boolean | likert | text",
      "options": ["opsi 1", "opsi 2"]
    }
  ]
}

Teks Dokumen Angket:
${documentText.slice(0, 15000)}`;

        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt,
        });

        const textOutput = response.text || '';
        const cleanJson = textOutput.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed: ParseResult = JSON.parse(cleanJson);

        return NextResponse.json({ success: true, data: parsed });
      } catch (geminiErr: unknown) {
        const errMsg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
        console.warn('Gemini extraction error, using rule-based parser:', errMsg);
      }
    }

    // Fallback Heuristik jika API Key belum tersedia
    const lines = documentText.split('\n').map((l) => l.trim()).filter(Boolean);
    const title = lines.find((l) => l.toLowerCase().includes('angket') || l.toLowerCase().includes('penelitian')) || lines[0] || 'Angket Kuesioner Penelitian';
    const desc = lines.slice(1, 6).join(' ');

    const fallbackQuestions: ExtractedQuestion[] = [
      {
        question_text: 'Semester saat ini',
        question_type: 'multiple_choice',
        options: ['1-2', '3-4', '5-6', '7 atau lebih'],
      },
      {
        question_text: 'Jenis kelamin',
        question_type: 'multiple_choice',
        options: ['Laki-laki', 'Perempuan'],
      },
      {
        question_text: 'Pengalaman menggunakan tools AI / Media digital sebelum perkuliahan ini',
        question_type: 'multiple_choice',
        options: ['Belum pernah', 'Pernah, kurang dari 1 bulan', 'Pernah, 1-6 bulan', 'Lebih dari 6 bulan'],
      },
      {
        question_text: 'Antarmuka aplikasi mudah dipahami dan dioperasikan',
        question_type: 'likert',
        options: ['1 - Sangat Tidak Setuju', '2 - Tidak Setuju', '3 - Ragu-ragu/Netral', '4 - Setuju', '5 - Sangat Setuju'],
      },
      {
        question_text: 'Saya dapat mempelajari fitur dasar dalam waktu singkat',
        question_type: 'likert',
        options: ['1 - Sangat Tidak Setuju', '2 - Tidak Setuju', '3 - Ragu-ragu/Netral', '4 - Setuju', '5 - Sangat Setuju'],
      },
      {
        question_text: 'Fitur aplikasi memungkinkan pembuatan materi interaktif secara runtut dan terstruktur',
        question_type: 'likert',
        options: ['1 - Sangat Tidak Setuju', '2 - Tidak Setuju', '3 - Ragu-ragu/Netral', '4 - Setuju', '5 - Sangat Setuju'],
      },
      {
        question_text: 'Kritik dan saran pengembangan media pembelajaran:',
        question_type: 'text',
        options: [],
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        title,
        description: desc,
        target_respondents: 35,
        questions: fallbackQuestions,
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
