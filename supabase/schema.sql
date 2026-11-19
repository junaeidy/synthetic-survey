-- ==========================================================
-- SYNTHETIC SURVEY SIMULATOR - SUPABASE DATABASE SCHEMA
-- ==========================================================
-- Jalankan query ini di SQL Editor di dashboard Supabase Anda:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run

-- 1. Enable UUID Extension (jika belum aktif)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-running (Clean setup)
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS respondents CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS surveys CASCADE;

-- 3. Tabel Kuesioner (Surveys)
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  target_respondents INT NOT NULL DEFAULT 50,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'simulating', 'completed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabel Pertanyaan (Questions)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- 'multiple_choice', 'boolean', 'text'
  options JSONB DEFAULT '[]'::jsonb, -- e.g. ["Sangat Puas", "Puas", "Cukup", "Kurang"]
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabel Responden Sintetis (Respondents)
CREATE TABLE respondents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  persona_profile TEXT NOT NULL, -- e.g. "Mahasiswa, 21 th, pengguna harian"
  persona_sentiment TEXT DEFAULT 'neutral', -- 'positive', 'neutral', 'negative'
  submitted_at TIMESTAMPTZ NOT NULL, -- Timestamp simulasi dalam rentang waktu
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tabel Jawaban (Answers)
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  respondent_id UUID NOT NULL REFERENCES respondents(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Indexes untuk Kecepatan Query Analitik & Grafik
CREATE INDEX idx_questions_survey_id ON questions(survey_id);
CREATE INDEX idx_respondents_survey_id ON respondents(survey_id);
CREATE INDEX idx_respondents_submitted_at ON respondents(submitted_at);
CREATE INDEX idx_answers_survey_id ON answers(survey_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_respondent_id ON answers(respondent_id);

-- 8. Row Level Security (RLS)
-- Untuk simulasi riset, kita aktifkan RLS dengan akses publik anon/authenticated
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE respondents ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read surveys" ON surveys FOR SELECT USING (true);
CREATE POLICY "Allow public insert surveys" ON surveys FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update surveys" ON surveys FOR UPDATE USING (true);
CREATE POLICY "Allow public delete surveys" ON surveys FOR DELETE USING (true);

CREATE POLICY "Allow public read questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Allow public insert questions" ON questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update questions" ON questions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete questions" ON questions FOR DELETE USING (true);

CREATE POLICY "Allow public read respondents" ON respondents FOR SELECT USING (true);
CREATE POLICY "Allow public insert respondents" ON respondents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete respondents" ON respondents FOR DELETE USING (true);

CREATE POLICY "Allow public read answers" ON answers FOR SELECT USING (true);
CREATE POLICY "Allow public insert answers" ON answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete answers" ON answers FOR DELETE USING (true);
