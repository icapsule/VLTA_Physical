-- Migration: 20260626000001_add_five_jump_test.sql
-- Description: 新增 Five-Jump Test (5JT) 下肢爆发力多级跳测试指标及 0-100 评分矩阵常模

INSERT INTO public.test_metrics (id, name_zh, dimension, unit, higher_is_better, record_type, in_radar)
VALUES (
  'five_jump_test',
  'Five-Jump Test (5JT)',
  'power',
  'm',
  true,
  'test',
  true
)
ON CONFLICT (id) DO UPDATE SET 
  name_zh = EXCLUDED.name_zh,
  dimension = EXCLUDED.dimension,
  unit = EXCLUDED.unit,
  higher_is_better = EXCLUDED.higher_is_better,
  record_type = EXCLUDED.record_type,
  in_radar = EXCLUDED.in_radar;

-- 配置 Five-Jump Test (5JT) 科学评分基线 (0分 -> 100分)
UPDATE public.test_metrics 
SET scoring_matrix = '{
  "regular": {
    "male": {
      "8":  {"min_0": 6.5, "max_100": 10.5},
      "9":  {"min_0": 7.0, "max_100": 11.2},
      "10": {"min_0": 7.5, "max_100": 12.0},
      "11": {"min_0": 8.0, "max_100": 12.8},
      "12": {"min_0": 8.5, "max_100": 13.5},
      "13": {"min_0": 9.0, "max_100": 14.0},
      "14": {"min_0": 9.5, "max_100": 14.5},
      "15": {"min_0": 10.0, "max_100": 15.0},
      "16": {"min_0": 10.5, "max_100": 15.3},
      "17": {"min_0": 10.8, "max_100": 15.6},
      "18": {"min_0": 11.0, "max_100": 16.0}
    },
    "female": {
      "8":  {"min_0": 6.0, "max_100": 9.8},
      "9":  {"min_0": 6.5, "max_100": 10.3},
      "10": {"min_0": 7.0, "max_100": 10.8},
      "11": {"min_0": 7.5, "max_100": 11.3},
      "12": {"min_0": 8.0, "max_100": 11.8},
      "13": {"min_0": 8.3, "max_100": 12.1},
      "14": {"min_0": 8.6, "max_100": 12.4},
      "15": {"min_0": 8.8, "max_100": 12.7},
      "16": {"min_0": 9.0, "max_100": 13.0},
      "17": {"min_0": 9.2, "max_100": 13.2},
      "18": {"min_0": 9.5, "max_100": 13.5}
    }
  },
  "elite": {
    "male": {
      "8":  {"min_0": 7.5, "max_100": 11.8},
      "9":  {"min_0": 8.2, "max_100": 12.5},
      "10": {"min_0": 9.0, "max_100": 13.2},
      "11": {"min_0": 9.8, "max_100": 14.0},
      "12": {"min_0": 10.5, "max_100": 14.8},
      "13": {"min_0": 11.2, "max_100": 15.5},
      "14": {"min_0": 12.0, "max_100": 16.2},
      "15": {"min_0": 12.8, "max_100": 17.0},
      "16": {"min_0": 13.2, "max_100": 17.5},
      "17": {"min_0": 13.6, "max_100": 18.0},
      "18": {"min_0": 14.0, "max_100": 18.5}
    },
    "female": {
      "8":  {"min_0": 7.0, "max_100": 10.8},
      "9":  {"min_0": 7.5, "max_100": 11.4},
      "10": {"min_0": 8.0, "max_100": 12.0},
      "11": {"min_0": 8.5, "max_100": 12.6},
      "12": {"min_0": 9.0, "max_100": 13.2},
      "13": {"min_0": 9.5, "max_100": 13.7},
      "14": {"min_0": 10.0, "max_100": 14.2},
      "15": {"min_0": 10.5, "max_100": 14.7},
      "16": {"min_0": 10.8, "max_100": 15.0},
      "17": {"min_0": 11.0, "max_100": 15.3},
      "18": {"min_0": 11.2, "max_100": 15.5}
    }
  }
}'::jsonb 
WHERE id = 'five_jump_test';
