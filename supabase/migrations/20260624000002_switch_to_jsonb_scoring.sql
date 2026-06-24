-- Replace 8 linear standard columns with a single JSONB scoring_matrix

-- 1. Add the new JSONB column
ALTER TABLE public.test_metrics
ADD COLUMN IF NOT EXISTS scoring_matrix JSONB DEFAULT '{}'::jsonb;

-- 2. Drop the old columns
ALTER TABLE public.test_metrics
DROP COLUMN IF EXISTS reg_base_min,
DROP COLUMN IF EXISTS reg_base_max,
DROP COLUMN IF EXISTS reg_growth_min,
DROP COLUMN IF EXISTS reg_growth_max,
DROP COLUMN IF EXISTS elite_base_min,
DROP COLUMN IF EXISTS elite_base_max,
DROP COLUMN IF EXISTS elite_growth_min,
DROP COLUMN IF EXISTS elite_growth_max;
