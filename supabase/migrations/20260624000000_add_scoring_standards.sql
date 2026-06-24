-- Add scoring standard columns to test_metrics table
ALTER TABLE public.test_metrics
ADD COLUMN IF NOT EXISTS reg_base_min NUMERIC,
ADD COLUMN IF NOT EXISTS reg_base_max NUMERIC,
ADD COLUMN IF NOT EXISTS reg_growth_min NUMERIC,
ADD COLUMN IF NOT EXISTS reg_growth_max NUMERIC,
ADD COLUMN IF NOT EXISTS elite_base_min NUMERIC,
ADD COLUMN IF NOT EXISTS elite_base_max NUMERIC,
ADD COLUMN IF NOT EXISTS elite_growth_min NUMERIC,
ADD COLUMN IF NOT EXISTS elite_growth_max NUMERIC;

-- Update existing default metrics with their hardcoded values
UPDATE public.test_metrics
SET 
  reg_base_min = 100, reg_base_max = 180, reg_growth_min = 6, reg_growth_max = 8,
  elite_base_min = 120, elite_base_max = 200, elite_growth_min = 8, elite_growth_max = 10
WHERE id = 'standing_long_jump';

UPDATE public.test_metrics
SET 
  reg_base_min = 2.8, reg_base_max = 1.8, reg_growth_min = -0.05, reg_growth_max = -0.05,
  elite_base_min = 2.6, elite_base_max = 1.7, elite_growth_min = -0.06, elite_growth_max = -0.06
WHERE id = 'sprint_10m';

UPDATE public.test_metrics
SET 
  reg_base_min = 5.5, reg_base_max = 3.9, reg_growth_min = -0.15, reg_growth_max = -0.12,
  elite_base_min = 5.2, elite_base_max = 3.7, elite_growth_min = -0.18, elite_growth_max = -0.15
WHERE id = 'sprint_20m';

UPDATE public.test_metrics
SET 
  reg_base_min = 17.5, reg_base_max = 14.0, reg_growth_min = -0.3, reg_growth_max = -0.4,
  elite_base_min = 16.5, elite_base_max = 13.0, elite_growth_min = -0.4, elite_growth_max = -0.5
WHERE id = 'shuttle_10x5';

-- If interval_200x6 or others exist, leave them null or default
