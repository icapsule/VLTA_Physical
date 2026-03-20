-- =============================================
-- Migration: 003_vlta_v2_schema_update.sql
-- 目的: 将所有的 UUID 主键转为 Text(适配 Clerk IDs)，移除 RLS，断开 supabase.auth 依赖
-- =============================================

-- 0. 剥离依赖了 `profiles.id` 类型的视图 (View)，否则无法修改基础表列的数据类型
DROP VIEW IF EXISTS athlete_latest_results CASCADE;

-- 1. 废弃由于旧有 Supabase Auth 造成的触发器与函数
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS get_my_role() CASCADE;

-- 2. 彻底停用并关闭 RLS 安全屏障
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE coach_athlete_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE test_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE test_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan_progress DISABLE ROW LEVEL SECURITY;

-- 2.1 彻底销毁在 002 中定义的所有 RLS 原生策略 (防止阻塞 Column Type 转换)
DROP POLICY IF EXISTS "select_own_or_coach" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "admin_update_any" ON profiles;

DROP POLICY IF EXISTS "coach_manage_assignments" ON coach_athlete_assignments;

DROP POLICY IF EXISTS "all_can_view_test_items" ON test_items;
DROP POLICY IF EXISTS "admin_manage_test_items" ON test_items;

DROP POLICY IF EXISTS "athlete_select_own" ON test_results;
DROP POLICY IF EXISTS "coach_insert_results" ON test_results;
DROP POLICY IF EXISTS "coach_update_results" ON test_results;
DROP POLICY IF EXISTS "coach_delete_results" ON test_results;

DROP POLICY IF EXISTS "coach_manage_own_plans" ON training_plans;

DROP POLICY IF EXISTS "view_own_assignments" ON plan_assignments;
DROP POLICY IF EXISTS "coach_create_assignments" ON plan_assignments;
DROP POLICY IF EXISTS "coach_delete_assignments" ON plan_assignments;

DROP POLICY IF EXISTS "athlete_manage_own_progress" ON plan_progress;

-- 3. 清空老旧数据，以便进行列类型的终极替换。
TRUNCATE TABLE profiles CASCADE;

-- 4. 暴力拆解所有的 UUID 外键关联锁
ALTER TABLE coach_athlete_assignments DROP CONSTRAINT IF EXISTS coach_athlete_assignments_coach_id_fkey;
ALTER TABLE coach_athlete_assignments DROP CONSTRAINT IF EXISTS coach_athlete_assignments_athlete_id_fkey;
ALTER TABLE test_results DROP CONSTRAINT IF EXISTS test_results_athlete_id_fkey;
ALTER TABLE test_results DROP CONSTRAINT IF EXISTS test_results_created_by_fkey;
ALTER TABLE training_plans DROP CONSTRAINT IF EXISTS training_plans_coach_id_fkey;
ALTER TABLE plan_assignments DROP CONSTRAINT IF EXISTS plan_assignments_athlete_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey; 

-- 5. 将涉及用户的核心字段由 UUID 升维成通用的 TEXT
ALTER TABLE profiles ALTER COLUMN id TYPE text;
ALTER TABLE coach_athlete_assignments ALTER COLUMN coach_id TYPE text;
ALTER TABLE coach_athlete_assignments ALTER COLUMN athlete_id TYPE text;
ALTER TABLE test_results ALTER COLUMN athlete_id TYPE text;
ALTER TABLE test_results ALTER COLUMN created_by TYPE text;
ALTER TABLE training_plans ALTER COLUMN coach_id TYPE text;
ALTER TABLE plan_assignments ALTER COLUMN athlete_id TYPE text;

-- 6. 重新缝合结构 (Re-establish Foreign Keys)
ALTER TABLE coach_athlete_assignments ADD CONSTRAINT coach_athlete_assignments_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE coach_athlete_assignments ADD CONSTRAINT coach_athlete_assignments_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE test_results ADD CONSTRAINT test_results_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE test_results ADD CONSTRAINT test_results_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE training_plans ADD CONSTRAINT training_plans_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE plan_assignments ADD CONSTRAINT plan_assignments_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 7. 重建依赖视图 (View) 
CREATE OR REPLACE VIEW athlete_latest_results AS
SELECT DISTINCT ON (tr.athlete_id, tr.test_item_id)
  tr.athlete_id,
  p.full_name,
  ti.name    AS test_name,
  ti.unit,
  ti.higher_is_better,
  tr.result_value,
  tr.test_date
FROM test_results tr
JOIN profiles p ON p.id = tr.athlete_id
JOIN test_items ti ON ti.id = tr.test_item_id
ORDER BY tr.athlete_id, tr.test_item_id, tr.test_date DESC;
