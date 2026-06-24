-- Add new long distance track metrics
INSERT INTO public.test_metrics (id, name_zh, dimension, unit, higher_is_better, record_type)
VALUES
  ('run_1000m', '1000米', 'endurance', 's', false, 'test'),
  ('run_3000m', '3000米', 'endurance', 's', false, 'test'),
  ('run_5000m', '5000米', 'endurance', 's', false, 'test')
ON CONFLICT (id) DO NOTHING;
