DO $$ 
DECLARE 
  v_admin_id TEXT;
  v_vincent_id TEXT := 'virt_' || gen_random_uuid();
  v_frank_id TEXT := 'virt_' || gen_random_uuid();
  v_yani_id TEXT := 'virt_' || gen_random_uuid();
  v_lucas_id TEXT := 'virt_' || gen_random_uuid();
  v_geroge_id TEXT := 'virt_' || gen_random_uuid();
  v_assessment_vincent UUID;
  v_assessment_frank UUID;
  v_assessment_yani UUID;
  v_assessment_lucas UUID;
  v_assessment_geroge UUID;
BEGIN
  -- 1. 获取超级管理员 ID
  SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Admin profile not found. Please ensure an admin exists.';
  END IF;
  
  -- 2. 插入 5 位虚拟学员档案
  INSERT INTO public.profiles (id, full_name, role) VALUES
    (v_vincent_id, 'Vincent', 'athlete'),
    (v_frank_id, 'Frank', 'athlete'),
    (v_yani_id, 'Yani Ma', 'athlete'),
    (v_lucas_id, 'Lucas Huang', 'athlete'),
    (v_geroge_id, 'Geroge Ma', 'athlete');

  -- 3. 分配学员给超级管理员 (教练)
  INSERT INTO public.coach_athlete_assignments (coach_id, athlete_id) VALUES
    (v_admin_id, v_vincent_id),
    (v_admin_id, v_frank_id),
    (v_admin_id, v_yani_id),
    (v_admin_id, v_lucas_id),
    (v_admin_id, v_geroge_id);

  -- 4. 创建 2026-06-22 的测试记录课次
  INSERT INTO public.assessments (athlete_id, coach_id, test_date) VALUES (v_vincent_id, v_admin_id, '2026-06-22') RETURNING id INTO v_assessment_vincent;
  INSERT INTO public.assessments (athlete_id, coach_id, test_date) VALUES (v_frank_id, v_admin_id, '2026-06-22') RETURNING id INTO v_assessment_frank;
  INSERT INTO public.assessments (athlete_id, coach_id, test_date) VALUES (v_yani_id, v_admin_id, '2026-06-22') RETURNING id INTO v_assessment_yani;
  INSERT INTO public.assessments (athlete_id, coach_id, test_date) VALUES (v_lucas_id, v_admin_id, '2026-06-22') RETURNING id INTO v_assessment_lucas;
  INSERT INTO public.assessments (athlete_id, coach_id, test_date) VALUES (v_geroge_id, v_admin_id, '2026-06-22') RETURNING id INTO v_assessment_geroge;

  -- 5. 插入所有的测试成绩与最佳成绩
  -- Vincent: Jump 181, 20m 4.08/3.93, shuttle 14.66/14.23, 200x6 Pass
  INSERT INTO public.assessment_results (assessment_id, metric_id, athlete_id, attempts, best_result, is_passed) VALUES
    (v_assessment_vincent, 'standing_long_jump', v_vincent_id, '{181}', 181, null),
    (v_assessment_vincent, 'sprint_20m', v_vincent_id, '{4.08, 3.93}', 3.93, null),
    (v_assessment_vincent, 'shuttle_10x5', v_vincent_id, '{14.66, 14.23}', 14.23, null),
    (v_assessment_vincent, 'interval_200x6', v_vincent_id, null, null, true);

  -- Frank: 159, 4.26/4.26, 15.00/14.45, Pass
  INSERT INTO public.assessment_results (assessment_id, metric_id, athlete_id, attempts, best_result, is_passed) VALUES
    (v_assessment_frank, 'standing_long_jump', v_frank_id, '{159}', 159, null),
    (v_assessment_frank, 'sprint_20m', v_frank_id, '{4.26, 4.26}', 4.26, null),
    (v_assessment_frank, 'shuttle_10x5', v_frank_id, '{15.00, 14.45}', 14.45, null),
    (v_assessment_frank, 'interval_200x6', v_frank_id, null, null, true);

  -- Yani Ma: 136, 4.63/4.45, 16.23/16.21, Pass
  INSERT INTO public.assessment_results (assessment_id, metric_id, athlete_id, attempts, best_result, is_passed) VALUES
    (v_assessment_yani, 'standing_long_jump', v_yani_id, '{136}', 136, null),
    (v_assessment_yani, 'sprint_20m', v_yani_id, '{4.63, 4.45}', 4.45, null),
    (v_assessment_yani, 'shuttle_10x5', v_yani_id, '{16.23, 16.21}', 16.21, null),
    (v_assessment_yani, 'interval_200x6', v_yani_id, null, null, true);

  -- Lucas Huang: 163, 4.5/4.41, 14.33/14.11, Pass
  INSERT INTO public.assessment_results (assessment_id, metric_id, athlete_id, attempts, best_result, is_passed) VALUES
    (v_assessment_lucas, 'standing_long_jump', v_lucas_id, '{163}', 163, null),
    (v_assessment_lucas, 'sprint_20m', v_lucas_id, '{4.5, 4.41}', 4.41, null),
    (v_assessment_lucas, 'shuttle_10x5', v_lucas_id, '{14.33, 14.11}', 14.11, null),
    (v_assessment_lucas, 'interval_200x6', v_lucas_id, null, null, true);

  -- Geroge Ma: 125, 5.3/4.86, 16.45/16.34, Pass
  INSERT INTO public.assessment_results (assessment_id, metric_id, athlete_id, attempts, best_result, is_passed) VALUES
    (v_assessment_geroge, 'standing_long_jump', v_geroge_id, '{125}', 125, null),
    (v_assessment_geroge, 'sprint_20m', v_geroge_id, '{5.3, 4.86}', 4.86, null),
    (v_assessment_geroge, 'shuttle_10x5', v_geroge_id, '{16.45, 16.34}', 16.34, null),
    (v_assessment_geroge, 'interval_200x6', v_geroge_id, null, null, true);

END $$;
