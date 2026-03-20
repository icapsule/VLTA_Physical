-- =============================================
-- Migration: 002_rls_policies.sql
-- 项目: VLTA Physical Training System
-- =============================================

-- =============================================
-- 辅助函数：获取当前用户角色（避免每条策略都 JOIN）
-- =============================================
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =============================================
-- RLS: profiles
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 任何人只能看自己，或教练/Admin 可看所有
CREATE POLICY "select_own_or_coach" ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR get_my_role() IN ('coach', 'admin')
  );

-- 用户只能更新自己，且不能修改 role
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Admin 可更新任何人（包括修改 role）
CREATE POLICY "admin_update_any" ON profiles FOR UPDATE
  USING (get_my_role() = 'admin');

-- =============================================
-- RLS: coach_athlete_assignments
-- =============================================
ALTER TABLE coach_athlete_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_manage_assignments" ON coach_athlete_assignments FOR ALL
  USING (get_my_role() IN ('coach', 'admin'));

-- =============================================
-- RLS: test_items
-- =============================================
ALTER TABLE test_items ENABLE ROW LEVEL SECURITY;

-- 所有登录用户可查看测试项目
CREATE POLICY "all_can_view_test_items" ON test_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 只有 Admin 能管理测试项目
CREATE POLICY "admin_manage_test_items" ON test_items FOR ALL
  USING (get_my_role() = 'admin');

-- =============================================
-- RLS: test_results
-- =============================================
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Athlete 只能看自己的成绩；Coach/Admin 可看所有
CREATE POLICY "athlete_select_own" ON test_results FOR SELECT
  USING (
    athlete_id = auth.uid()
    OR get_my_role() IN ('coach', 'admin')
  );

-- 只有 Coach/Admin 能录入成绩（防作弊）
CREATE POLICY "coach_insert_results" ON test_results FOR INSERT
  WITH CHECK (get_my_role() IN ('coach', 'admin'));

-- 只有录入人或 Admin 能修改
CREATE POLICY "coach_update_results" ON test_results FOR UPDATE
  USING (created_by = auth.uid() OR get_my_role() = 'admin');

-- 只有录入人或 Admin 能删除
CREATE POLICY "coach_delete_results" ON test_results FOR DELETE
  USING (created_by = auth.uid() OR get_my_role() = 'admin');

-- =============================================
-- RLS: training_plans
-- =============================================
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;

-- Coach 只能看/改自己的计划，Admin 看所有；Athlete 无直接访问
CREATE POLICY "coach_manage_own_plans" ON training_plans FOR ALL
  USING (coach_id = auth.uid() OR get_my_role() = 'admin');

-- =============================================
-- RLS: plan_assignments
-- =============================================
ALTER TABLE plan_assignments ENABLE ROW LEVEL SECURITY;

-- Athlete 只能看分配给自己的；Coach 看自己计划的分配；Admin 看所有
CREATE POLICY "view_own_assignments" ON plan_assignments FOR SELECT
  USING (
    athlete_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM training_plans
      WHERE id = plan_id AND coach_id = auth.uid()
    )
    OR get_my_role() = 'admin'
  );

-- 只有 Coach 能分配计划
CREATE POLICY "coach_create_assignments" ON plan_assignments FOR INSERT
  WITH CHECK (get_my_role() IN ('coach', 'admin'));

-- Coach 和 Admin 能删除分配
CREATE POLICY "coach_delete_assignments" ON plan_assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM training_plans
      WHERE id = plan_id AND coach_id = auth.uid()
    )
    OR get_my_role() = 'admin'
  );

-- =============================================
-- RLS: plan_progress
-- =============================================
ALTER TABLE plan_progress ENABLE ROW LEVEL SECURITY;

-- Athlete 只能看/更新自己的进度；Coach/Admin 可查看所有
CREATE POLICY "athlete_manage_own_progress" ON plan_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM plan_assignments pa
      WHERE pa.id = assignment_id AND pa.athlete_id = auth.uid()
    )
    OR get_my_role() IN ('coach', 'admin')
  );
