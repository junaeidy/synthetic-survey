import { Survey, Question, Respondent, Answer, SurveyAnalytics, QuestionType } from '@/types/survey';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { GeneratedRespondent } from './gemini';

const LOCAL_STORAGE_KEY = 'synthetic_surveys_data_v1';

// Contoh data default riset jika database masih kosong
const SAMPLE_SURVEYS: Array<Survey & { questions: Question[]; respondents: Respondent[]; answers: Answer[] }> = [
  {
    id: 'demo-survey-1',
    title: 'Evaluasi Adopsi Tools AI dalam Produktivitas Riset Akademik',
    description: 'Survei untuk mengukur frekuensi penggunaan, persepsi keandalan, dan efektivitas asisten AI bagi kalangan akademisi.',
    target_respondents: 40,
    start_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    questions: [
      {
        id: 'q1',
        survey_id: 'demo-survey-1',
        question_text: 'Berapa frekuensi Anda menggunakan asisten AI untuk membantu riset?',
        question_type: 'multiple_choice',
        options: ['Setiap Hari', 'Beberapa Kali Seminggu', 'Jarang', 'Belum Pernah'],
        order_index: 0,
      },
      {
        id: 'q2',
        survey_id: 'demo-survey-1',
        question_text: 'Apakah hasil bantuan AI meningkatkan efisiensi waktu pengerjaan tugas/riset Anda?',
        question_type: 'boolean',
        options: ['Ya', 'Tidak'],
        order_index: 1,
      },
      {
        id: 'q3',
        survey_id: 'demo-survey-1',
        question_text: 'Apa kendala atau masukan utama Anda terkait penggunaan asisten AI saat ini?',
        question_type: 'text',
        order_index: 2,
      },
    ],
    respondents: [],
    answers: [],
  },
];

// Helper Local Storage
function getLocalData(): typeof SAMPLE_SURVEYS {
  if (typeof window === 'undefined') return SAMPLE_SURVEYS;
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SAMPLE_SURVEYS));
    return SAMPLE_SURVEYS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return SAMPLE_SURVEYS;
  }
}

function saveLocalData(data: typeof SAMPLE_SURVEYS) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }
}

export async function fetchAllSurveys(): Promise<Survey[]> {
  const supabase = getSupabase();
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: surveys, error } = await supabase
        .from('surveys')
        .select(`
          *,
          questions (*),
          respondents (count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (surveys) {
        return (surveys as Array<Survey & { respondents?: Array<{ count: number }> }>).map((s) => ({
          ...s,
          respondents_count: s.respondents?.[0]?.count || 0,
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local storage:', err);
    }
  }

  const local = getLocalData();
  return local.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    target_respondents: s.target_respondents,
    start_date: s.start_date,
    end_date: s.end_date,
    status: s.status,
    created_at: s.created_at,
    questions: s.questions,
    respondents_count: s.respondents?.length || 0,
  }));
}

export async function fetchSurveyById(id: string): Promise<(Survey & { questions: Question[] }) | null> {
  const supabase = getSupabase();
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: survey, error } = await supabase
        .from('surveys')
        .select(`
          *,
          questions (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (survey) {
        survey.questions = (survey.questions || []).sort(
          (a: Question, b: Question) => a.order_index - b.order_index
        );
        return survey;
      }
    } catch (err) {
      console.warn('Supabase fetchSurveyById error:', err);
    }
  }

  const local = getLocalData();
  const found = local.find((s) => s.id === id);
  if (!found) return null;
  return {
    ...found,
    questions: found.questions.sort((a, b) => a.order_index - b.order_index),
  };
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
  const newSurveyId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `srv-${Date.now()}`;
  const supabase = getSupabase();

  // Selalu siapkan & simpan ke Local Storage terlebih dahulu agar 100% aman
  const formattedQuestions: Question[] = questions.map((q, idx) => ({
    id: `q-${Date.now()}-${idx}`,
    survey_id: newSurveyId,
    question_text: q.question_text,
    question_type: q.question_type,
    options: q.options || [],
    order_index: idx,
    created_at: new Date().toISOString(),
  }));

  const newSurvey: Survey & { questions: Question[]; respondents: Respondent[]; answers: Answer[] } = {
    id: newSurveyId,
    title: surveyData.title,
    description: surveyData.description,
    target_respondents: surveyData.target_respondents,
    start_date: surveyData.start_date,
    end_date: surveyData.end_date,
    status: 'draft',
    created_at: new Date().toISOString(),
    questions: formattedQuestions,
    respondents: [],
    answers: [],
  };

  const local = getLocalData();
  local.unshift(newSurvey);
  saveLocalData(local);

  // Jika Supabase aktif, coba simpan juga ke Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
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

      if (!srvErr && srv) {
        const qRows = formattedQuestions.map((q, idx) => ({
          id: q.id,
          survey_id: srv.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options || [],
          order_index: idx,
        }));
        await supabase.from('questions').insert(qRows);
        return srv.id;
      }
    } catch (err) {
      console.warn('Supabase createNewSurvey error, using local storage id:', err);
    }
  }

  return newSurveyId;
}

export async function saveSimulationBatch(
  surveyId: string,
  generatedRespondents: GeneratedRespondent[]
): Promise<void> {
  // Simpan ke Local Storage
  const local = getLocalData();
  const target = local.find((s) => s.id === surveyId);
  if (target) {
    target.status = 'completed';
    if (!target.respondents) target.respondents = [];
    if (!target.answers) target.answers = [];

    generatedRespondents.forEach((res, idx) => {
      const respId = `resp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
      target.respondents.push({
        id: respId,
        survey_id: surveyId,
        persona_profile: res.persona_profile,
        persona_sentiment: res.persona_sentiment,
        submitted_at: res.submitted_at,
        created_at: new Date().toISOString(),
      });

      Object.entries(res.answers).forEach(([qId, ansVal]) => {
        target.answers.push({
          id: `ans-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          survey_id: surveyId,
          respondent_id: respId,
          question_id: qId,
          answer_value: ansVal,
          created_at: new Date().toISOString(),
        });
      });
    });

    saveLocalData(local);
  }

  // Jika Supabase aktif, simpan juga ke Supabase
  const supabase = getSupabase();
  if (isSupabaseConfigured() && supabase) {
    try {
      for (const res of generatedRespondents) {
        const { data: respRow, error: respErr } = await supabase
          .from('respondents')
          .insert({
            survey_id: surveyId,
            persona_profile: res.persona_profile,
            persona_sentiment: res.persona_sentiment,
            submitted_at: res.submitted_at,
          })
          .select()
          .single();

        if (!respErr && respRow) {
          const answerRows = Object.entries(res.answers).map(([qId, ansVal]) => ({
            survey_id: surveyId,
            respondent_id: respRow.id,
            question_id: qId,
            answer_value: ansVal,
          }));

          if (answerRows.length > 0) {
            await supabase.from('answers').insert(answerRows);
          }
        }
      }

      await supabase
        .from('surveys')
        .update({ status: 'completed' })
        .eq('id', surveyId);
    } catch (err) {
      console.warn('Supabase saveSimulationBatch error, local storage saved:', err);
    }
  }
}

// Fungsi utama: Buat angket dan LANGSUNG isi seluruh responden bot secara instan
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
  // 1. Buat survei & pertanyaannya
  const surveyId = await createNewSurvey(surveyData, questions);
  const fullSurvey = await fetchSurveyById(surveyId);

  if (fullSurvey) {
    try {
      // 2. Panggil API simulator untuk mengisi seluruh responden target secara otomatis
      const simRes = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey: fullSurvey,
          questions: fullSurvey.questions,
          count: surveyData.target_respondents,
        }),
      });

      if (simRes.ok) {
        const simData = await simRes.json();
        if (simData.success && Array.isArray(simData.respondents)) {
          // 3. Simpan jawaban responden
          await saveSimulationBatch(surveyId, simData.respondents);
        }
      }
    } catch (e) {
      console.warn('Auto simulation error:', e);
    }
  }

  return surveyId;
}

export async function fetchSurveyAnalytics(surveyId: string): Promise<SurveyAnalytics | null> {
  let survey: Survey | null = null;
  let questions: Question[] = [];
  let respondents: Respondent[] = [];
  let answers: Answer[] = [];

  const supabase = getSupabase();
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: srv } = await supabase.from('surveys').select('*').eq('id', surveyId).single();
      const { data: qs } = await supabase.from('questions').select('*').eq('survey_id', surveyId).order('order_index');
      const { data: resps } = await supabase.from('respondents').select('*').eq('survey_id', surveyId).order('submitted_at');
      const { data: anss } = await supabase.from('answers').select('*').eq('survey_id', surveyId);

      if (srv) {
        survey = srv;
        questions = qs || [];
        respondents = resps || [];
        answers = anss || [];
      }
    } catch (err) {
      console.warn('Supabase fetchSurveyAnalytics error, falling back to local storage:', err);
    }
  }

  if (!survey) {
    const local = getLocalData();
    const found = local.find((s) => s.id === surveyId);
    if (!found) return null;
    survey = found;
    questions = found.questions || [];
    respondents = (found.respondents || []).sort(
      (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
    );
    answers = found.answers || [];
  }

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
    survey,
    questions,
    respondents,
    answers,
    questionStats,
    timelineData,
  };
}
