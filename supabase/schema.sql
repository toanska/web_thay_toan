-- ============================================================================
-- SUPABASE (POSTGRESQL) SCHEMA FOR PORTAL THCS NGO QUYEN - THAY TOAN
-- Chạy toàn bộ đoạn SQL này trong Supabase Dashboard -> SQL Editor -> Run
-- Miễn phí vĩnh viễn: Không giới hạn lượt đọc/ghi API, 500MB PostgreSQL.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  code TEXT,
  email TEXT,
  role TEXT DEFAULT 'student',
  class_name TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_code ON public.users (code);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);

CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  code TEXT,
  grade INTEGER,
  subject TEXT,
  difficulty TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_questions_grade ON public.questions (grade);

CREATE TABLE IF NOT EXISTS public.exams (
  id TEXT PRIMARY KEY,
  code TEXT,
  grade INTEGER,
  status TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exams_grade ON public.exams (grade);

CREATE TABLE IF NOT EXISTS public.attempts (
  id TEXT PRIMARY KEY,
  exam_id TEXT,
  student_id TEXT,
  student_code TEXT,
  score DOUBLE PRECISION,
  submitted_at TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attempts_submitted_at ON public.attempts (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_exam_id ON public.attempts (exam_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student_code ON public.attempts (student_code);

CREATE TABLE IF NOT EXISTS public.news (
  id TEXT PRIMARY KEY,
  category TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  published_at TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON public.news (published_at DESC);

CREATE TABLE IF NOT EXISTS public.materials (
  id TEXT PRIMARY KEY,
  grade INTEGER,
  type TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_materials_grade ON public.materials (grade);

CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  type TEXT,
  timestamp TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON public.notifications (timestamp DESC);

CREATE TABLE IF NOT EXISTS public.lessons (
  id TEXT PRIMARY KEY,
  grade TEXT,
  subject TEXT,
  semester TEXT,
  visibility TEXT DEFAULT 'public',
  views INTEGER DEFAULT 0,
  created_at TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON public.lessons (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_grade ON public.lessons (grade);

-- Atomic view counter RPC for lessons
CREATE OR REPLACE FUNCTION public.increment_lesson_view(p_lesson_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.lessons
  SET
    views = COALESCE(views, 0) + 1,
    data = jsonb_set(
      data,
      '{views}',
      to_jsonb(COALESCE((data->>'views')::INTEGER, views, 0) + 1),
      true
    ),
    updated_at = NOW()
  WHERE id = p_lesson_id;
END;
$$;

-- Permissions & Row Level Security (RLS)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_lesson_view(TEXT) TO anon, authenticated;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_users" ON public.users;
CREATE POLICY "allow_all_users" ON public.users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_questions" ON public.questions;
CREATE POLICY "allow_all_questions" ON public.questions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_exams" ON public.exams;
CREATE POLICY "allow_all_exams" ON public.exams FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_attempts" ON public.attempts;
CREATE POLICY "allow_all_attempts" ON public.attempts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_news" ON public.news;
CREATE POLICY "allow_all_news" ON public.news FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_materials" ON public.materials;
CREATE POLICY "allow_all_materials" ON public.materials FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_notifications" ON public.notifications;
CREATE POLICY "allow_all_notifications" ON public.notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_lessons" ON public.lessons;
CREATE POLICY "allow_all_lessons" ON public.lessons FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
