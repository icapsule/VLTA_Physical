-- Delete the results for interval_200x6 first to satisfy foreign key constraint
DELETE FROM public.assessment_results WHERE metric_id = 'interval_200x6';

-- Delete the metric from test_metrics
DELETE FROM public.test_metrics WHERE id = 'interval_200x6';
