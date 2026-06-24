-- Populate scoring standards for missing metrics

UPDATE public.test_metrics
SET 
  reg_base_min = 2800, reg_base_max = 1500, reg_growth_min = -60, reg_growth_max = -40,
  elite_base_min = 2400, elite_base_max = 1200, elite_growth_min = -70, elite_growth_max = -50
WHERE id = 'run_5000m';

UPDATE public.test_metrics
SET 
  reg_base_min = 1800, reg_base_max = 900, reg_growth_min = -40, reg_growth_max = -30,
  elite_base_min = 1500, elite_base_max = 700, elite_growth_min = -50, elite_growth_max = -40
WHERE id = 'run_3000m';

UPDATE public.test_metrics
SET 
  reg_base_min = 600, reg_base_max = 300, reg_growth_min = -15, reg_growth_max = -10,
  elite_base_min = 500, elite_base_max = 240, elite_growth_min = -20, elite_growth_max = -15
WHERE id = 'run_1000m';

UPDATE public.test_metrics
SET 
  reg_base_min = 450, reg_base_max = 240, reg_growth_min = -10, reg_growth_max = -8,
  elite_base_min = 380, elite_base_max = 180, elite_growth_min = -15, elite_growth_max = -10
WHERE id = 'run_800m';

UPDATE public.test_metrics
SET 
  reg_base_min = 200, reg_base_max = 90, reg_growth_min = -5, reg_growth_max = -3,
  elite_base_min = 160, elite_base_max = 70, elite_growth_min = -6, elite_growth_max = -4
WHERE id = 'run_400m';

UPDATE public.test_metrics
SET 
  reg_base_min = 45, reg_base_max = 28, reg_growth_min = -1, reg_growth_max = -0.5,
  elite_base_min = 40, elite_base_max = 24, elite_growth_min = -1.2, elite_growth_max = -0.8
WHERE id = 'sprint_200m';

UPDATE public.test_metrics
SET 
  reg_base_min = 22, reg_base_max = 14, reg_growth_min = -0.5, reg_growth_max = -0.3,
  elite_base_min = 19, elite_base_max = 12, elite_growth_min = -0.6, elite_growth_max = -0.4
WHERE id = 'sprint_100m';

UPDATE public.test_metrics
SET 
  reg_base_min = 0, reg_base_max = 20, reg_growth_min = 0.5, reg_growth_max = 1,
  elite_base_min = 5, elite_base_max = 25, elite_growth_min = 0.5, elite_growth_max = 1
WHERE id = 'sit_and_reach';

UPDATE public.test_metrics
SET 
  reg_base_min = 0, reg_base_max = 8, reg_growth_min = 0, reg_growth_max = 1,
  elite_base_min = 0, elite_base_max = 15, elite_growth_min = 1, elite_growth_max = 2
WHERE id = 'pull_up';

UPDATE public.test_metrics
SET 
  reg_base_min = 0, reg_base_max = 20, reg_growth_min = 1, reg_growth_max = 3,
  elite_base_min = 5, elite_base_max = 40, elite_growth_min = 2, elite_growth_max = 5
WHERE id = 'push_up';
