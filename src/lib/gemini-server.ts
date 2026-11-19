import { GoogleGenAI } from '@google/genai';
import { Question, Survey } from '@/types/survey';

export interface GeneratedRespondent {
  persona_profile: string;
  persona_sentiment: 'positive' | 'neutral' | 'negative';
  answers: Record<string, string>; // questionId -> answer string
  submitted_at: string;
}

// Helper untuk menghasilkan timestamp realistis di antara rentang waktu (misal: Now s/d +7 hari)
export function generateRealisticTimestamp(startDateStr: string, endDateStr: string): string {
  const start = new Date(startDateStr).getTime();
  const end = new Date(endDateStr).getTime();
  
  if (isNaN(start) || isNaN(end) || end <= start) {
    return new Date().toISOString();
  }

  // Acak waktu di antara start dan end
  const randomTime = start + Math.random() * (end - start);
  const date = new Date(randomTime);

  // Penyesuaian jam agar realistis (kebanyakan orang mengisi antara jam 08:00 - 22:00)
  const realisticHour = Math.floor(8 + Math.random() * 14); // 8 s/d 21
  date.setHours(realisticHour);
  date.setMinutes(Math.floor(Math.random() * 60));
  date.setSeconds(Math.floor(Math.random() * 60));

  return date.toISOString();
}

const DEFAULT_PERSONAS = [
  { profile: 'Mahasiswa S1 Informatika (21 th), pengguna aktif teknologi', sentiment: 'positive' as const },
  { profile: 'Karyawan Swasta Keuangan (29 th), kritis dan pragmatis', sentiment: 'neutral' as const },
  { profile: 'Wirausaha Kuliner UMKM (35 th), mengutamakan efisiensi & biaya', sentiment: 'neutral' as const },
  { profile: 'Ibu Rumah Tangga & Seller Online (32 th), teliti dan detail', sentiment: 'positive' as const },
  { profile: 'Pegawai Negeri Sipil (45 th), konservatif terhadap perubahan', sentiment: 'negative' as const },
  { profile: 'Fresh Graduate Desain Grafis (23 th), menyukai kepraktisan', sentiment: 'positive' as const },
  { profile: 'Guru SMA (38 th), fokus pada kegunaan nyata', sentiment: 'neutral' as const },
  { profile: 'Freelance Programmer (26 th), skeptis terhadap janji fitur berlebih', sentiment: 'negative' as const },
  { profile: 'Manajer Operasional Logistik (41 th), berorientasi hasil cepat', sentiment: 'neutral' as const },
  { profile: 'Staf Administrasi Rumah Sakit (27 th), mengutamakan kestabilan', sentiment: 'positive' as const },
];

export async function generateBatchResponses(
  survey: Survey,
  questions: Question[],
  batchSize: number,
  apiKey?: string
): Promise<GeneratedRespondent[]> {
  const key = apiKey || process.env.GEMINI_API_KEY;

  if (key && key.trim().length > 10) {
    try {
      const ai = new GoogleGenAI({ apiKey: key });

      const questionPrompt = questions.map((q, idx) => {
        let optDesc = '';
        if (q.question_type === 'multiple_choice') {
          optDesc = `(Pilihan: ${JSON.stringify(q.options || [])})`;
        } else if (q.question_type === 'boolean') {
          optDesc = `(Pilihan: Ya atau Tidak / Benar atau Salah)`;
        } else {
          optDesc = `(Isian bebas singkat 1-3 kalimat alami bahasa Indonesia, bukan bahasa robot/formal kaku)`;
        }
        return `${idx + 1}. [ID: ${q.id}] [Tipe: ${q.question_type}] ${q.question_text} ${optDesc}`;
      }).join('\n');

      const systemPrompt = `Kamu adalah simulator responden survei untuk penelitian ilmiah.
Tugasmu adalah menghasilkan data sintetis dari ${batchSize} orang responden Indonesia yang BERBEDA-BEDA dan REALISTIS.

Aturan Penting:
1. Setiap responden harus punya karakter/persona yang unik (misal: mahasiswa, pekerja kantor, pedagang, profesional).
2. Variasikan opini dan sentimen mereka (ada yang antusias/positif, ada yang biasa saja/netral, ada yang kritis/kecewa/negatif).
3. HINDARI AI SLOP! Jawaban isian teks harus terdengar seperti ketikan manusia asli Indonesia (boleh lugas, sedikit santai, langsung pada intinya, tidak bertele-tele).
4. Untuk pertanyaan multiple_choice, PILIH SALAH SATU dari daftar opsi yang disediakan.
5. Untuk pertanyaan boolean, jawab persis "Ya" atau "Tidak".
6. Kembalikan HANYA JSON murni (array objek) tanpa markdown formatting tambahan atau pembungkus backtick.

Struktur JSON yang diharapkan:
[
  {
    "persona_profile": "Karyawan swasta, 28 th, sering belanja online",
    "persona_sentiment": "positive",
    "answers": {
      "question_id_1": "jawaban persis sesuai opsi",
      "question_id_2": "Ya",
      "question_id_3": "Komentar teks asli manusia..."
    }
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: `${systemPrompt}\n\nTopik Survei: ${survey.title}\nDeskripsi: ${survey.description}\n\nDaftar Pertanyaan:\n${questionPrompt}\n\nBuat ${batchSize} responden sekarang dalam format JSON murni:`
      });

      const responseText = response.text || '';
      const cleanJson = responseText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsed: Array<{
        persona_profile: string;
        persona_sentiment: 'positive' | 'neutral' | 'negative';
        answers: Record<string, string>;
      }> = JSON.parse(cleanJson);

      return parsed.map((item) => ({
        persona_profile: item.persona_profile || 'Responden Umum',
        persona_sentiment:
          item.persona_sentiment === 'positive' || item.persona_sentiment === 'negative'
            ? item.persona_sentiment
            : 'neutral',
        answers: item.answers || {},
        submitted_at: generateRealisticTimestamp(survey.start_date, survey.end_date),
      }));
    } catch (err) {
      console.warn('Gemini API call error or rate limit, falling back to local heuristic generator:', err);
    }
  }

  // Fallback Heuristik Cerdas Lokal (Jika API key kosong atau kena limit, tetap berjalan mulus)
  return Array.from({ length: batchSize }).map((_, i) => {
    const personaSeed = DEFAULT_PERSONAS[(i + Math.floor(Math.random() * 10)) % DEFAULT_PERSONAS.length];
    const answers: Record<string, string> = {};

    questions.forEach((q) => {
      if (q.question_type === 'multiple_choice') {
        const options = q.options && q.options.length > 0 ? q.options : ['Pilihan A', 'Pilihan B', 'Pilihan C'];
        // Sedikit bias sesuai sentimen
        if (personaSeed.sentiment === 'positive') {
          answers[q.id] = options[0];
        } else if (personaSeed.sentiment === 'negative' && options.length > 1) {
          answers[q.id] = options[options.length - 1];
        } else {
          answers[q.id] = options[Math.floor(Math.random() * options.length)];
        }
      } else if (q.question_type === 'boolean') {
        if (personaSeed.sentiment === 'positive') {
          answers[q.id] = 'Ya';
        } else if (personaSeed.sentiment === 'negative') {
          answers[q.id] = 'Tidak';
        } else {
          answers[q.id] = Math.random() > 0.4 ? 'Ya' : 'Tidak';
        }
      } else {
        // Teks isian bebas realistis bahasa Indonesia (Anti-Slop)
        const positivePhrases = [
          'Secara keseluruhan fiturnya cukup membantu dan alurnya jelas, semoga ke depannya performanya tetap stabil.',
          'Sangat praktis untuk kebutuhan sehari-hari, navigasinya tidak membingungkan.',
          'Puas dengan kemudahan aksesnya, tampilannya rapi dan responsif.',
        ];
        const neutralPhrases = [
          'Standar saja seperti aplikasi sejenis pada umumnya, belum ada yang terlalu istimewa tapi berfungsi baik.',
          'Cukup lumayan, kadang masih butuh penyesuaian di bagian alur menu tapi tidak terlalu mengganggu.',
          'Biasa saja, yang penting tugas utama bisa diselesaikan tanpa kendala berat.',
        ];
        const negativePhrases = [
          'Masih terasa agak lambat di jam-jam sibuk, perlu optimasi server dan pemangkasan tahapan.',
          'Tampilan perlu dibuat lebih ringkas lagi, saat ini terlalu banyak klik untuk sampai ke tujuan.',
          'Kurang ramah pengguna baru, petunjuknya masih membingungkan jika tidak dibaca seksama.',
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
      submitted_at: generateRealisticTimestamp(survey.start_date, survey.end_date),
    };
  });
}
