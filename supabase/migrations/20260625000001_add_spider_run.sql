-- Add Spider Run Test
INSERT INTO public.test_metrics (id, name_zh, dimension, unit, higher_is_better, record_type)
VALUES
  ('spider_run', '蜘蛛跑 (Spider Run)', 'agility', '秒', false, 'test')
ON CONFLICT (id) DO NOTHING;
