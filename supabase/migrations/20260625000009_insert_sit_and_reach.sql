INSERT INTO public.test_metrics (id, name_zh, dimension, unit, higher_is_better, record_type, in_radar)
VALUES ('sit_and_reach', '坐位体前屈 (Sit-and-Reach)', 'flexibility', 'cm', true, 'test', true)
ON CONFLICT (id) DO UPDATE SET name_zh = EXCLUDED.name_zh;
