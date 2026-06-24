ALTER TABLE public.test_metrics 
ADD COLUMN IF NOT EXISTS in_radar BOOLEAN NOT NULL DEFAULT true;

-- Opt out certain non-benchmark tests by default
UPDATE public.test_metrics 
SET in_radar = false 
WHERE id IN ('run_5000m', 'run_3000m', 'run_1000m', 'sprint_100m', 'sprint_200m');
