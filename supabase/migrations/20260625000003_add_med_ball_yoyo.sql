INSERT INTO public.test_metrics (id, name_zh, dimension, unit, higher_is_better, record_type, in_radar)
VALUES
  ('medicine_ball_throw', '实心球抛掷 2kg (Med Ball)', 'power', '米', true, 'test', true),
  ('yoyo_test', 'Yo-Yo 间歇恢复跑 (Beep Test)', 'endurance', '米', true, 'test', true)
ON CONFLICT (id) DO NOTHING;
