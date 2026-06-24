-- Add new track metrics
INSERT INTO public.test_metrics (id, name_zh, dimension, unit, higher_is_better, record_type)
VALUES
  ('sprint_100m', '100米', 'speed', 's', false, 'test'),
  ('sprint_200m', '200米', 'speed', 's', false, 'test'),
  ('run_400m', '400米', 'endurance', 's', false, 'test'),
  ('run_800m', '800米', 'endurance', 's', false, 'test')
ON CONFLICT (id) DO NOTHING;
