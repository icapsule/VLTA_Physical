-- Create test_metrics dictionary table
CREATE TABLE IF NOT EXISTS public.test_metrics (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  dimension TEXT NOT NULL,
  unit TEXT NOT NULL,
  higher_is_better BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create assessments table (sessions)
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coach_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  test_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create assessment_results table
CREATE TABLE IF NOT EXISTS public.assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  metric_id TEXT NOT NULL REFERENCES public.test_metrics(id) ON DELETE RESTRICT,
  athlete_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempts NUMERIC[] DEFAULT '{}',
  best_result NUMERIC,
  is_passed BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast PB queries
CREATE INDEX IF NOT EXISTS idx_assessment_results_athlete_metric ON public.assessment_results (athlete_id, metric_id, best_result);

-- Insert the predefined test metrics
INSERT INTO public.test_metrics (id, name_zh, dimension, unit, higher_is_better)
VALUES
  ('standing_long_jump', '立定跳远', 'power', 'cm', true),
  ('sprint_10m', '10米冲刺', 'speed', 's', false),
  ('sprint_20m', '20米', 'speed', 's', false),
  ('shuttle_10x5', '10x5 折返跑', 'agility', 's', false),
  ('interval_200x6', '200x6 interval', 'endurance', 'boolean', true)
ON CONFLICT (id) DO NOTHING;
