import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { Question, Survey } from '@/types/survey';

function generateFluctuatingDailyCounts(totalRespondents: number, numDays: number): number[] {
  if (numDays <= 1) return [totalRespondents];

  // Algoritma Pola Gelombang Fluktuatif Alami:
  // Mensimulasikan perilaku survei nyata (Hari 1 ramai, Hari 2 turun, Hari 3 lonjakan reminder, Hari 4 turun, dst.)
  const rawWeights: number[] = [];
  for (let d = 0; d < numDays; d++) {
    // Pola selang-seling tajam antara hari ramai (peak) dan hari sepi (dip)
    const isPeakDay = d % 2 === 0;
    const baseWeight = isPeakDay
      ? 1.5 + Math.random() * 0.9 // Hari ramai: bobot 1.5 - 2.4
      : 0.35 + Math.random() * 0.4; // Hari sepi/turun: bobot 0.35 - 0.75

    // Hari pertama (peluncuran awal) dan hari terakhir (rush sebelum tutup)
    let dayBonus = 1.0;
    if (d === 0) dayBonus = 1.35;
    if (d === numDays - 1) dayBonus = 1.3;

    rawWeights.push(Math.max(0.2, baseWeight * dayBonus));
  }

  // Normalisasi bobot agar jumlahnya pas tepat sama dengan totalRespondents
  const sumWeights = rawWeights.reduce((a, b) => a + b, 0);
  const counts = rawWeights.map((w) => Math.floor((w / sumWeights) * totalRespondents));

  // Bagikan sisa selisih pembulatan
  const assigned = counts.reduce((a, b) => a + b, 0);
  let remainder = totalRespondents - assigned;
  let idx = 0;
  while (remainder > 0) {
    counts[idx % numDays]++;
    remainder--;
    idx += 2; // Alokasikan ke hari-hari puncak agar kontras naik-turun tetap tajam
  }

  return counts;
}

function generateFluctuatingTimestamps(startDateStr: string, endDateStr: string, totalCount: number): string[] {
  const start = new Date(startDateStr).getTime();
  const end = new Date(endDateStr).getTime();

  if (isNaN(start) || isNaN(end) || end <= start) {
    return Array.from({ length: totalCount }).map(() => new Date().toISOString());
  }

  const oneDayMs = 24 * 60 * 60 * 1000;
  const numDays = Math.max(2, Math.round((end - start) / oneDayMs));
  const dailyCounts = generateFluctuatingDailyCounts(totalCount, numDays);

  const timestamps: string[] = [];
  dailyCounts.forEach((countForDay, dayIdx) => {
    const dayStartMs = start + dayIdx * oneDayMs;
    for (let i = 0; i < countForDay; i++) {
      // Jam pengisian realistis: 08:30 s/d 22:00
      // Jam sibuk/ramai pengisian: 09:30-12:00 dan 19:00-21:30
      const isRushHour = Math.random() > 0.4;
      let hour: number;
      if (isRushHour) {
        hour = Math.random() > 0.5 ? Math.floor(9 + Math.random() * 4) : Math.floor(19 + Math.random() * 3);
      } else {
        hour = Math.floor(8 + Math.random() * 14); // 8 - 21
      }
      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);

      const d = new Date(dayStartMs);
      d.setHours(hour, minute, second);
      timestamps.push(d.toISOString());
    }
  });

  // Urutkan timestamps kronologis
  return timestamps.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
}

const DEFAULT_PERSONAS = [
  { profile: 'Mahasiswa S1 Informatika (21 th), aktif teknologi', sentiment: 'positive' as const },
  { profile: 'Karyawan Swasta Keuangan (29 th), kritis & teliti', sentiment: 'neutral' as const },
  { profile: 'Wirausaha Kuliner UMKM (35 th), efisiensi biaya', sentiment: 'neutral' as const },
  { profile: 'Ibu Rumah Tangga & Online Seller (32 th), detail', sentiment: 'positive' as const },
  { profile: 'Pegawai Negeri Sipil (45 th), terbiasa alur konvensional', sentiment: 'negative' as const },
  { profile: 'Fresh Graduate Desain Grafis (23 th), menyukai kepraktisan', sentiment: 'positive' as const },
  { profile: 'Guru SMA (38 th), fokus kegunaan nyata', sentiment: 'neutral' as const },
  { profile: 'Freelance Programmer (26 th), kritis terhadap bugs', sentiment: 'negative' as const },
  { profile: 'Manajer Operasional Logistik (41 th), orientasi kecepatan', sentiment: 'neutral' as const },
  { profile: 'Staf Administrasi Medis (27 th), mengutamakan kestabilan', sentiment: 'positive' as const },
  { profile: 'Dosen Muda Sains Terapan (31 th), analitis', sentiment: 'positive' as const },
  { profile: 'Pelaku Usaha Ritel (40 th), sangat memperhitungkan waktu', sentiment: 'neutral' as const },
];

function generateHeuristicBatch(
  survey: Survey,
  questions: Question[],
  batchCount: number,
  offset: number
) {
  return Array.from({ length: batchCount }).map((_, i) => {
    const personaSeed = DEFAULT_PERSONAS[(i + offset) % DEFAULT_PERSONAS.length];
    const answers: Record<string, string> = {};

    questions.forEach((q) => {
      const options = q.options && q.options.length > 0 ? q.options : ['Pilihan A', 'Pilihan B', 'Pilihan C'];

      if (q.question_type === 'likert') {
        // Skala Likert 1-5
        if (personaSeed.sentiment === 'positive') {
          // Dominan 4 (Setuju) atau 5 (Sangat Setuju)
          answers[q.id] = options.length >= 5 ? (Math.random() > 0.3 ? options[4] : options[3]) : options[options.length - 1];
        } else if (personaSeed.sentiment === 'negative') {
          // Dominan 1 (Sangat Tidak Setuju) atau 2 (Tidak Setuju)
          answers[q.id] = options.length >= 2 ? (Math.random() > 0.4 ? options[0] : options[1]) : options[0];
        } else {
          // Netral / Setuju (skala 3 atau 4)
          answers[q.id] = options.length >= 4 ? (Math.random() > 0.5 ? options[2] : options[3]) : options[Math.floor(Math.random() * options.length)];
        }
      } else if (q.question_type === 'multiple_choice') {
        if (personaSeed.sentiment === 'positive') {
          answers[q.id] = options[0];
        } else if (personaSeed.sentiment === 'negative' && options.length > 1) {
          answers[q.id] = options[options.length - 1];
        } else {
          answers[q.id] = options[Math.floor(Math.random() * options.length)];
        }
      } else if (q.question_type === 'boolean') {
        answers[q.id] = personaSeed.sentiment === 'positive' ? 'Ya' : personaSeed.sentiment === 'negative' ? 'Tidak' : Math.random() > 0.4 ? 'Ya' : 'Tidak';
      } else {
        const positivePhrases = [
          'Secara keseluruhan fiturnya sangat membantu riset, alur jelas dan prosesnya cepat.',
          'Sangat praktis untuk kebutuhan harian, navigasinya intuitif.',
          'Puas dengan kemudahan akses dan tampilan yang rapi.',
          'Membantu meningkatkan efektivitas waktu pengerjaan tugas secara signifikan.',
        ];
        const neutralPhrases = [
          'Standar seperti sistem survei pada umumnya, belum ada yang istimewa tapi berfungsi baik.',
          'Cukup lumayan, kadang masih butuh adaptasi di beberapa menu.',
          'Biasa saja, yang penting tugas pokok bisa terselesaikan tanpa kendala.',
        ];
        const negativePhrases = [
          'Masih terasa lambat di jam-jam sibuk, perlu optimasi pemangkasan tahapan.',
          'Tampilan perlu dibuat lebih ringkas lagi agar tidak terlalu banyak klik.',
          'Kurang ramah pengguna pemula, perlu panduan yang lebih lugas.',
        ];

        if (personaSeed.sentiment === 'positive') {
          answers[q.id] = positivePhrases[Math.floor(Math.random() * positivePhrases.length)];
        } else if (personaSeed.sentiment === 'negative') {
          answers[q.id] = negativePhrases[Math.floor(Math.random() * negativePhrases.length)];
        } else {
          answers[q.id] = neutralPhrases[Math.floor(Math.random() * neutralPhrases.length)];
        }
      }
    });

    return {
      persona_profile: personaSeed.profile,
      persona_sentiment: personaSeed.sentiment,
      answers,
      submitted_at: new Date().toISOString(),
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { survey, questions, count }: { survey: Survey; questions: Question[]; count: number } = body;
    const targetCount = Math.max(1, Math.min(5000, Number(count) || 30));

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const allRespondents: Array<{
      persona_profile: string;
      persona_sentiment: 'positive' | 'neutral' | 'negative';
      answers: Record<string, string>;
      submitted_at: string;
    }> = [];

    // Jika ada API Key Gemini, coba panggil batch cerdas
    if (apiKey && apiKey.trim().length > 10) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const questionPrompt = questions
          .map((q, idx) => {
            let optDesc = '';
            if (q.question_type === 'likert') {
              optDesc = `(Skala Likert 1-5: ${JSON.stringify(q.options || ['1', '2', '3', '4', '5'])})`;
            } else if (q.question_type === 'multiple_choice') {
              optDesc = `(Pilihan: ${JSON.stringify(q.options || [])})`;
            } else if (q.question_type === 'boolean') {
              optDesc = `(Pilihan: Ya atau Tidak)`;
            } else {
              optDesc = `(Isian bebas singkat 1-3 kalimat alami bahasa Indonesia)`;
            }
            return `${idx + 1}. [ID: ${q.id}] [Tipe: ${q.question_type}] ${q.question_text} ${optDesc}`;
          })
          .join('\n');

        const geminiBatchSize = Math.min(targetCount, 8);
        const systemPrompt = `Kamu adalah simulator responden survei untuk penelitian ilmiah.
Tugasmu adalah menghasilkan data sintetis dari ${geminiBatchSize} orang responden Indonesia yang BERBEDA-BEDA dan REALISTIS sesuai konteks dan target audiens survei.

Aturan:
1. Persona unik (misal sesuai target: mahasiswa PAUD, akademisi, atau masyarakat umum).
2. Variasikan opini (positif, netral, kritis/negatif).
3. HINDARI AI SLOP! Jawaban isian teks harus terdengar alami seperti ketikan manusia asli Indonesia.
4. Untuk multiple_choice dan likert: PILIH SALAH SATU persis dari daftar opsi yang disediakan.
5. Untuk boolean: jawab persis "Ya" atau "Tidak".
6. Kembalikan HANYA JSON murni (array objek) tanpa markdown.

Format JSON:
[
  {
    "persona_profile": "Mahasiswa PAUD, 21 th, semester 6",
    "persona_sentiment": "positive",
    "answers": {
      "question_id": "jawaban"
    }
  }
]`;

        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: `${systemPrompt}\n\nTopik Survei: ${survey.title}\nDeskripsi & Target: ${survey.description}\n\nDaftar Pertanyaan:\n${questionPrompt}\n\nBuat ${geminiBatchSize} responden sekarang dalam format JSON murni:`,
        });

        const responseText = response.text || '';
        const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed: Array<{
          persona_profile?: string;
          persona_sentiment?: string;
          answers?: Record<string, string>;
        }> = JSON.parse(cleanJson);

        parsed.forEach((item) => {
          allRespondents.push({
            persona_profile: item.persona_profile || 'Responden Umum',
            persona_sentiment:
              item.persona_sentiment === 'positive' || item.persona_sentiment === 'negative'
                ? item.persona_sentiment
                : 'neutral',
            answers: item.answers || {},
            submitted_at: new Date().toISOString(),
          });
        });
      } catch (geminiErr: unknown) {
        const geminiErrMsg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
        console.warn('Gemini API call skipped, generating via smart heuristic engine:', geminiErrMsg);
      }
    }

    // Penuhi sisa kuota responden yang belum tercapai dengan smart heuristic engine
    const remainingCount = targetCount - allRespondents.length;
    if (remainingCount > 0) {
      const heuristicBatch = generateHeuristicBatch(survey, questions, remainingCount, allRespondents.length);
      allRespondents.push(...heuristicBatch);
    }

    // Terapkan distribusi waktu fluktuatif (gelombang naik-turun alami harian) ke seluruh responden
    const timestamps = generateFluctuatingTimestamps(survey.start_date, survey.end_date, allRespondents.length);
    allRespondents.forEach((item, idx) => {
      item.submitted_at = timestamps[idx] || new Date().toISOString();
    });

    return NextResponse.json({ success: true, respondents: allRespondents });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
