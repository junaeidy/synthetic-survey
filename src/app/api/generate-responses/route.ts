import { NextRequest, NextResponse } from 'next/server';
import { generateBatchResponses } from '@/lib/gemini-server';
import { Question, Survey } from '@/types/survey';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin || new URL(origin).host !== request.headers.get('host')) {
    return NextResponse.json({ error: 'Permintaan tidak valid.' }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (
    !body ||
    typeof body !== 'object' ||
    !('survey' in body) ||
    !('questions' in body) ||
    !('batchSize' in body) ||
    !body.survey ||
    typeof body.survey !== 'object' ||
    !Array.isArray(body.questions) ||
    typeof body.batchSize !== 'number' ||
    !Number.isInteger(body.batchSize) ||
    body.batchSize < 1 ||
    body.batchSize > 10
  ) {
    return NextResponse.json({ error: 'Data simulasi tidak valid.' }, { status: 400 });
  }

  const respondents = await generateBatchResponses(
    body.survey as Survey,
    body.questions as Question[],
    body.batchSize
  );
  return NextResponse.json(respondents);
}
