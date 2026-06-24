-- Add pull_up (Test)
INSERT INTO public.test_metrics (id, name_zh, dimension, unit, higher_is_better, record_type)
VALUES
  ('pull_up', '引体向上', 'strength', '次', true, 'test')
ON CONFLICT (id) DO NOTHING;
