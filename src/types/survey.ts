export type QuestionType = 'multiple_choice' | 'boolean' | 'likert' | 'text';

export type ChartType = 'bar_vertical' | 'bar_horizontal' | 'pie' | 'donut';

export interface Question {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: QuestionType;
  options?: string[]; // for multiple_choice, boolean, or likert labels
  order_index: number;
  created_at?: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  target_respondents: number;
  start_date: string;
  end_date: string;
  status: 'draft' | 'simulating' | 'completed';
  created_at?: string;
  questions?: Question[];
  respondents_count?: number;
}

export interface Respondent {
  id: string;
  survey_id: string;
  persona_profile: string;
  persona_sentiment: 'positive' | 'neutral' | 'negative';
  submitted_at: string;
  created_at?: string;
}

export interface Answer {
  id: string;
  survey_id: string;
  respondent_id: string;
  question_id: string;
  answer_value: string;
  created_at?: string;
}

export interface SurveyAnalytics {
  survey: Survey;
  questions: Question[];
  respondents: Respondent[];
  answers: Answer[];
  questionStats: {
    [questionId: string]: {
      question: Question;
      preferredChart: ChartType;
      distribution: { name: string; count: number; percentage: number }[];
      textResponses?: {
        text: string;
        persona: string;
        sentiment: string;
        date: string;
      }[];
    };
  };
  timelineData: {
    date: string;
    count: number;
    cumulative: number;
  }[];
}
