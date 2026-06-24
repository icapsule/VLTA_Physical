-- Insert interval_200x6 result for all athletes who had an assessment on 2026-06-22
INSERT INTO public.assessment_results (assessment_id, metric_id, athlete_id, is_passed)
SELECT 
    a.id as assessment_id, 
    'interval_200x6' as metric_id, 
    a.athlete_id, 
    true as is_passed
FROM public.assessments a
WHERE a.test_date = '2026-06-22'
ON CONFLICT DO NOTHING;
