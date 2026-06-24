-- Add push_ups (Test) and agility_ladder (Training)
INSERT INTO public.test_metrics (id, name_zh, dimension, unit, higher_is_better, record_type)
VALUES
  ('push_up', '俯卧撑', 'strength', '次', true, 'test'),
  ('agility_ladder', '绳梯', 'agility', 'boolean', true, 'training')
ON CONFLICT (id) DO NOTHING;
