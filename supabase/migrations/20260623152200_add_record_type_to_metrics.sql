-- Add record_type to test_metrics
ALTER TABLE public.test_metrics ADD COLUMN IF NOT EXISTS record_type TEXT NOT NULL DEFAULT 'test';

-- Re-insert interval_200x6 as a 'training' record type
INSERT INTO public.test_metrics (id, name_zh, dimension, unit, higher_is_better, record_type)
VALUES
  ('interval_200x6', '200mx6 间歇跑', 'endurance', 'boolean', true, 'training')
ON CONFLICT (id) DO UPDATE SET record_type = EXCLUDED.record_type;
