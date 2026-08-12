-- Migration: 20260626000002_add_sprint_50m.sql
-- Description: 新增 50米冲刺跑 (50m Sprint) 速度与加速测试指标及 0-100 评分矩阵常模

INSERT INTO public.test_metrics (id, name_zh, dimension, unit, higher_is_better, record_type, in_radar)
VALUES (
  'sprint_50m',
  '50米冲刺跑 (50m Sprint)',
  'speed',
  's',
  false,
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

-- 配置 50米冲刺跑 (50m Sprint) 科学评分基线 (0分 -> 100分，时间越短越优秀)
UPDATE public.test_metrics 
SET scoring_matrix = '{
  "regular": {
    "male": {
      "8":  {"min_0": 13.5, "max_100": 9.2},
      "9":  {"min_0": 13.0, "max_100": 8.8},
      "10": {"min_0": 12.5, "max_100": 8.4},
      "11": {"min_0": 12.0, "max_100": 8.1},
      "12": {"min_0": 11.5, "max_100": 7.8},
      "13": {"min_0": 11.0, "max_100": 7.5},
      "14": {"min_0": 10.5, "max_100": 7.2},
      "15": {"min_0": 10.0, "max_100": 6.9},
      "16": {"min_0": 9.8,  "max_100": 6.8},
      "17": {"min_0": 9.6,  "max_100": 6.7},
      "18": {"min_0": 9.5,  "max_100": 6.6}
    },
    "female": {
      "8":  {"min_0": 14.0, "max_100": 9.6},
      "9":  {"min_0": 13.5, "max_100": 9.2},
      "10": {"min_0": 13.0, "max_100": 8.8},
      "11": {"min_0": 12.5, "max_100": 8.5},
      "12": {"min_0": 12.0, "max_100": 8.3},
      "13": {"min_0": 11.6, "max_100": 8.1},
      "14": {"min_0": 11.3, "max_100": 7.9},
      "15": {"min_0": 11.0, "max_100": 7.8},
      "16": {"min_0": 10.8, "max_100": 7.7},
      "17": {"min_0": 10.6, "max_100": 7.6},
      "18": {"min_0": 10.5, "max_100": 7.5}
    }
  },
  "elite": {
    "male": {
      "8":  {"min_0": 11.5, "max_100": 8.2},
      "9":  {"min_0": 11.0, "max_100": 7.8},
      "10": {"min_0": 10.5, "max_100": 7.5},
      "11": {"min_0": 10.0, "max_100": 7.2},
      "12": {"min_0": 9.8,  "max_100": 7.0},
      "13": {"min_0": 9.2,  "max_100": 6.6},
      "14": {"min_0": 8.8,  "max_100": 6.4},
      "15": {"min_0": 8.5,  "max_100": 6.2},
      "16": {"min_0": 8.2,  "max_100": 6.0},
      "17": {"min_0": 8.0,  "max_100": 5.9},
      "18": {"min_0": 7.8,  "max_100": 5.8}
    },
    "female": {
      "8":  {"min_0": 12.0, "max_100": 8.5},
      "9":  {"min_0": 11.5, "max_100": 8.1},
      "10": {"min_0": 11.0, "max_100": 7.8},
      "11": {"min_0": 10.5, "max_100": 7.6},
      "12": {"min_0": 10.2, "max_100": 7.4},
      "13": {"min_0": 9.8,  "max_100": 7.2},
      "14": {"min_0": 9.5,  "max_100": 7.1},
      "15": {"min_0": 9.2,  "max_100": 7.0},
      "16": {"min_0": 8.9,  "max_100": 6.8},
      "17": {"min_0": 8.7,  "max_100": 6.7},
      "18": {"min_0": 8.5,  "max_100": 6.6}
    }
  }
}'::jsonb 
WHERE id = 'sprint_50m';
