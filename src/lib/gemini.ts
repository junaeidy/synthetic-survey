import { Question, Survey } from '@/types/survey';

export interface GeneratedRespondent {
  persona_profile: string;
  persona_sentiment: 'positive' | 'neutral' | 'negative';
  answers: Record<string, string>;
  submitted_at: string;
}

export async function generateBatchResponses(
  survey: Survey,
  questions: Question[],
  batchSize: number
): Promise<GeneratedRespondent[]> {
  try {
    const res = await fetch('/api/simulate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        survey,
        questions,
        count: batchSize,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.respondents)) {
      return data.respondents;
    }
    throw new Error(data.error || 'Gagal menghasilkan responden');
  } catch (err) {
    console.warn('API simulate failed, falling back to client heuristic:', err);
    // Client fallback jika jaringan offline
    return Array.from({ length: batchSize }).map((_, i) => ({
      persona_profile: `Responden Umum #${i + 1}`,
      persona_sentiment: 'neutral',
      answers: {},
      submitted_at: new Date().toISOString(),
    }));
  }
}
