import { Survey, Question, Respondent, Answer, SurveyAnalytics, QuestionType } from '@/types/survey';
import { getSupabase } from './supabase';
import { GeneratedRespondent } from './gemini';

function formatSupabaseError(error: unknown, context: string): Error {
  const errObj = error as { message?: string; code?: string | number; status?: string | number } | null;
  const msg = errObj?.message || String(error);
  const code = errObj?.code || errObj?.status || '';

  if (msg.includes('Invalid API key') || code === 'PGRST301' || msg.includes('JWT') || code === 401) {
    return new Error(
      `[Supabase 401 Unauthorized] Kunci API tidak valid di ${context}. Kunci NEXT_PUBLIC_SUPABASE_ANON_KEY harus berupa JWT token (diawali 'eyJ...'), bukan yang berawalan 'sb_publishable_'.`
    );
  }

  if (msg.includes('relation') && msg.includes('does not exist')) {
    return new Error(
      `[Supabase Table Missing] Tabel belum dibuat di database Supabase Anda. Silakan jalankan seluruh skrip 'supabase/schema.sql' di SQL Editor dashboard Supabase Anda.`
    );
  }

  if (code === '42501' || msg.includes('permission denied') || msg.includes('42501')) {
    return new Error(
      `[Supabase 42501 Permission Denied] Role 'anon' belum memiliki izin akses ke tabel Supabase. Silakan buka Supabase SQL Editor dan jalankan: GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;`
    );
  }

  return new Error(`[Supabase Error di ${context}]: ${msg} ${code ? `(Kode: ${code})` : ''}`);
}

export async function fetchAllSurveys(): Promise<Survey[]> {
  const supabase = getSupabase();
  const { data: surveys, error } = await supabase
    .from('surveys')
    .select(`
      *,
      questions (*),
      respondents (count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw formatSupabaseError(error, 'fetchAllSurveys');
  }

  return (surveys || []).map((s) => {
    const item = s as Survey & { respondents?: Array<{ count: number }> };
    return {
      ...item,
      respondents_count: item.respondents?.[0]?.count || 0,
    };
  });
}

export async function fetchSurveyById(id: string): Promise<(Survey & { questions: Question[] }) | null> {
  const supabase = getSupabase();
  const { data: survey, error } = await supabase
    .from('surveys')
    .select(`
      *,
      questions (*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw formatSupabaseError(error, `fetchSurveyById(${id})`);
  }

  if (!survey) return null;

  survey.questions = (survey.questions || []).sort(
    (a: Question, b: Question) => a.order_index - b.order_index
  );

  return survey;
}

export async function createNewSurvey(
  surveyData: {
    title: string;
    description: string;
    target_respondents: number;
    start_date: string;
    end_date: string;
  },
  questions: Array<{
    question_text: string;
    question_type: QuestionType;
    options?: string[];
  }>
): Promise<string> {
  const supabase = getSupabase();

  // 1. Simpan Kuesioner ke tabel 'surveys' Supabase
  const { data: srv, error: srvErr } = await supabase
    .from('surveys')
    .insert({
      title: surveyData.title,
      description: surveyData.description,
      target_respondents: surveyData.target_respondents,
      start_date: surveyData.start_date,
      end_date: surveyData.end_date,
      status: 'draft',
    })
    .select()
    .single();

  if (srvErr) {
    throw formatSupabaseError(srvErr, 'Insert surveys');
  }

  // 2. Simpan Butir Pertanyaan ke tabel 'questions' Supabase
  const qRows = questions.map((q, idx) => ({
    survey_id: srv.id,
    question_text: q.question_text,
    question_type: q.question_type,
    options: q.options || [],
    order_index: idx,
  }));

  const { error: qErr } = await supabase.from('questions').insert(qRows);
  if (qErr) {
    throw formatSupabaseError(qErr, 'Insert questions');
  }

  return srv.id;
}

export async function saveSimulationBatch(
  surveyId: string,
  generatedRespondents: GeneratedRespondent[]
): Promise<void> {
  const supabase = getSupabase();

  const respondentsToInsert: Array<{
    id: string;
    survey_id: string;
    persona_profile: string;
    persona_sentiment: 'positive' | 'neutral' | 'negative';
    submitted_at: string;
  }> = [];

  const answersToInsert: Array<{
    id: string;
    survey_id: string;
    respondent_id: string;
    question_id: string;
    answer_value: string;
  }> = [];

  for (let i = 0; i < generatedRespondents.length; i++) {
    const res = generatedRespondents[i];
    const respId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `resp-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 8)}`;

    respondentsToInsert.push({
      id: respId,
      survey_id: surveyId,
      persona_profile: res.persona_profile,
      persona_sentiment: res.persona_sentiment,
      submitted_at: res.submitted_at,
    });

    for (const [qId, ansVal] of Object.entries(res.answers)) {
      answersToInsert.push({
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `ans-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        survey_id: surveyId,
        respondent_id: respId,
        question_id: qId,
        answer_value: ansVal,
      });
    }
  }

  // Bulk insert respondents per batch 500 ke tabel 'respondents'
  for (let i = 0; i < respondentsToInsert.length; i += 500) {
    const chunk = respondentsToInsert.slice(i, i + 500);
    const { error: respErr } = await supabase.from('respondents').insert(chunk);
    if (respErr) {
      throw formatSupabaseError(respErr, 'Insert respondents');
    }
  }

  // Bulk insert answers per batch 1000 ke tabel 'answers'
  for (let i = 0; i < answersToInsert.length; i += 1000) {
    const chunk = answersToInsert.slice(i, i + 1000);
    const { error: ansErr } = await supabase.from('answers').insert(chunk);
    if (ansErr) {
      throw formatSupabaseError(ansErr, 'Insert answers');
    }
  }

  // Update status survei menjadi 'completed'
  const { error: updateErr } = await supabase
    .from('surveys')
    .update({ status: 'completed' })
    .eq('id', surveyId);

  if (updateErr) {
    throw formatSupabaseError(updateErr, 'Update survey status');
  }
}

export async function createSurveyWithInstantResponses(
  surveyData: {
    title: string;
    description: string;
    target_respondents: number;
    start_date: string;
    end_date: string;
  },
  questions: Array<{
    question_text: string;
    question_type: QuestionType;
    options?: string[];
  }>
): Promise<string> {
  // 1. Simpan kuesioner & pertanyaan langsung ke Supabase
  const surveyId = await createNewSurvey(surveyData, questions);
  const fullSurvey = await fetchSurveyById(surveyId);

  if (!fullSurvey) {
    throw new Error('Gagal memverifikasi kuesioner yang baru disimpan di Supabase.');
  }

  // 2. Jalankan pemrosesan tanggapan responden
  const simRes = await fetch('/api/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      survey: fullSurvey,
      questions: fullSurvey.questions,
      count: surveyData.target_respondents,
    }),
  });

  if (!simRes.ok) {
    throw new Error(`Gagal memproses data responden (Status: ${simRes.status})`);
  }

  const simData = await simRes.json();
  if (!simData.success || !Array.isArray(simData.respondents)) {
    throw new Error(simData.error || 'Gagal memproses data responden');
  }

  // 3. Simpan seluruh responden & jawaban langsung ke Supabase
  await saveSimulationBatch(surveyId, simData.respondents);

  return surveyId;
}

// Helper untuk mengambil seluruh data dari Supabase secara paralel dan terukur
// Menggunakan exact count terlebih dahulu sehingga jumlah halaman pasti dan tidak terjadi infinite loop
async function fetchInParallelChunks<T>(
  totalCount: number,
  pageSize: number,
  concurrency: number,
  fetchFn: (from: number, to: number) => Promise<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalPages === 0) return [];

  const results: T[] = [];

  // Jalankan dalam potongan paralel (concurrency) agar cepat tetapi tidak membebani connection pool
  for (let i = 0; i < totalPages; i += concurrency) {
    const chunkPromises = [];
    for (let p = i; p < Math.min(i + concurrency, totalPages); p++) {
      const from = p * pageSize;
      const to = from + pageSize - 1;
      chunkPromises.push(fetchFn(from, to));
    }

    const chunkResults = await Promise.all(chunkPromises);
    for (const res of chunkResults) {
      if (res.error) throw res.error;
      if (res.data) {
        results.push(...res.data);
      }
    }
  }

  return results;
}

export async function fetchSurveyAnalytics(surveyId: string): Promise<SurveyAnalytics> {
  const supabase = getSupabase();

  const { data: srv, error: srvErr } = await supabase.from('surveys').select('*').eq('id', surveyId).single();
  if (srvErr || !srv) {
    throw formatSupabaseError(srvErr || new Error('Kuesioner tidak ditemukan'), `fetchSurveyAnalytics surveys (${surveyId})`);
  }

  const { data: qs, error: qErr } = await supabase.from('questions').select('*').eq('survey_id', surveyId).order('order_index');
  if (qErr) {
    throw formatSupabaseError(qErr, `fetchSurveyAnalytics questions (${surveyId})`);
  }

  // 1. Cek total responden yang ada di database secara instan
  const { count: respCount, error: countErr } = await supabase
    .from('respondents')
    .select('id', { count: 'exact', head: true })
    .eq('survey_id', surveyId);

  if (countErr) {
    throw formatSupabaseError(countErr, `fetchSurveyAnalytics respondents count (${surveyId})`);
  }

  const totalRespondents = respCount || 0;

  // 2. Ambil seluruh data responden secara paralel (cepat & bebas limit 1000)
  let respondents: Respondent[] = [];
  try {
    respondents = await fetchInParallelChunks<Respondent>(
      totalRespondents,
      1000,
      4,
      async (from, to) => {
        const res = await supabase
          .from('respondents')
          .select('*')
          .eq('survey_id', surveyId)
          .order('id', { ascending: true })
          .range(from, to);
        return { data: (res.data as Respondent[]) || null, error: res.error };
      }
    );
  } catch (respErr) {
    throw formatSupabaseError(respErr, `fetchSurveyAnalytics respondents (${surveyId})`);
  }

  // Urutkan responden berdasarkan submitted_at untuk konsistensi linimasa
  respondents.sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());

  // 3. Cek total jawaban (answers) yang ada di database secara instan
  const { count: ansCount, error: ansCountErr } = await supabase
    .from('answers')
    .select('id', { count: 'exact', head: true })
    .eq('survey_id', surveyId);

  if (ansCountErr) {
    throw formatSupabaseError(ansCountErr, `fetchSurveyAnalytics answers count (${surveyId})`);
  }

  const totalAnswers = ansCount || 0;

  // 4. Ambil data jawaban secara paralel (hanya kolom yang diperlukan untuk analitik & ekspor)
  let answers: Answer[] = [];
  try {
    answers = await fetchInParallelChunks<Answer>(
      totalAnswers,
      1000,
      6,
      async (from, to) => {
        const res = await supabase
          .from('answers')
          .select('id, question_id, respondent_id, answer_value')
          .eq('survey_id', surveyId)
          .order('id', { ascending: true })
          .range(from, to);
        return { data: (res.data as Answer[]) || null, error: res.error };
      }
    );
  } catch (ansErr) {
    throw formatSupabaseError(ansErr, `fetchSurveyAnalytics answers (${surveyId})`);
  }

  const questions: Question[] = qs || [];

  // Hitung Statistik per Pertanyaan
  const questionStats: SurveyAnalytics['questionStats'] = {};

  questions.forEach((q) => {
    const qAnswers = answers.filter((a) => a.question_id === q.id);
    const totalAns = qAnswers.length;

    if (q.question_type === 'multiple_choice' || q.question_type === 'boolean' || q.question_type === 'likert') {
      const counts: Record<string, number> = {};

      if (q.options && q.options.length > 0) {
        q.options.forEach((opt) => (counts[opt] = 0));
      } else if (q.question_type === 'boolean') {
        counts['Ya'] = 0;
        counts['Tidak'] = 0;
      }

      qAnswers.forEach((a) => {
        counts[a.answer_value] = (counts[a.answer_value] || 0) + 1;
      });

      const distribution = Object.entries(counts).map(([name, count]) => ({
        name,
        count,
        percentage: totalAns > 0 ? Math.round((count / totalAns) * 100) : 0,
      }));

      questionStats[q.id] = {
        question: q,
        preferredChart:
          q.question_type === 'boolean'
            ? 'donut'
            : q.question_type === 'likert'
            ? 'bar_horizontal'
            : 'bar_vertical',
        distribution,
      };
    } else {
      const textResponses = qAnswers.map((a) => {
        const resp = respondents.find((r) => r.id === a.respondent_id);
        return {
          text: a.answer_value,
          persona: resp?.persona_profile || 'Responden Anonim',
          sentiment: resp?.persona_sentiment || 'neutral',
          date: resp?.submitted_at || new Date().toISOString(),
        };
      });

      questionStats[q.id] = {
        question: q,
        preferredChart: 'bar_vertical',
        distribution: [],
        textResponses,
      };
    }
  });

  const dateCounts: Record<string, number> = {};
  respondents.forEach((r) => {
    const dateKey = new Date(r.submitted_at).toISOString().split('T')[0];
    dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
  });

  const sortedDates = Object.keys(dateCounts).sort();
  let cumulative = 0;
  const timelineData = sortedDates.map((date) => {
    cumulative += dateCounts[date];
    return {
      date,
      count: dateCounts[date],
      cumulative,
    };
  });

  return {
    survey: srv,
    questions,
    respondents,
    answers,
    questionStats,
    timelineData,
  };
}
