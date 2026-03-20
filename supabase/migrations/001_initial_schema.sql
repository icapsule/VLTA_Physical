-- =============================================
-- Migration: 001_initial_schema.sql
-- 项目: VLTA Physical Training System
-- =============================================

-- 启用必要扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: profiles
-- 扩展 auth.users，存储用户业务信息
-- =============================================
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL,
  username    text UNIQUE,
  phone       text,
  gender      text CHECK (gender IN ('male', 'female', 'other')),
  birth_date  date,
  height_cm   int,
  weight_kg   numeric(5,2),
  avatar_url  text,
  role        text NOT NULL DEFAULT 'athlete'
                   CHECK (role IN ('athlete', 'coach', 'admin')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- TABLE: coach_athlete_assignments
-- 显式定义教练-学员归属关系（MVP 阶段预留，暂不激活）
-- =============================================
CREATE TABLE coach_athlete_assignments (
  id          bigserial PRIMARY KEY,
  coach_id    uuid NOT NULL REFERENCES profiles(id),
  athlete_id  uuid NOT NULL REFERENCES profiles(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(coach_id, athlete_id)
);

-- =============================================
-- TABLE: test_items
-- 预定义体能测试项目
-- =============================================
CREATE TABLE test_items (
  id               bigserial PRIMARY KEY,
  name             text NOT NULL,
  unit             text NOT NULL,
  description      text,
  higher_is_better bool NOT NULL DEFAULT true,
  sort_order       int NOT NULL DEFAULT 0,
  is_active        bool NOT NULL DEFAULT true
);

-- 插入预设测试项目
INSERT INTO test_items (name, unit, description, higher_is_better, sort_order) VALUES
  ('立定跳远',   'cm',   '双脚起跳，测量落脚最近点距起跳线距离', true,  1),
  ('坐位体前屈', 'cm',   '坐姿双腿伸直，测量手指前伸距离',       true,  2),
  ('50米跑',     '秒',   '直道冲刺',                             false, 3),
  ('1000米跑',   '秒',   '匀速耐力跑',                           false, 4),
  ('引体向上',   '次',   '男生引体向上，女生屈臂悬垂计秒',        true,  5),
  ('Beep Test',  '级别', 'Multi-Stage Fitness Test，到达的最高级别', true, 6),
  ('蜘蛛跑',     '秒',   'ITF 标准网球专项敏捷测试',              false, 7);

-- =============================================
-- TABLE: test_results
-- 学员体能测试成绩记录
-- =============================================
CREATE TABLE test_results (
  id             bigserial PRIMARY KEY,
  athlete_id     uuid NOT NULL REFERENCES profiles(id),
  test_item_id   bigint NOT NULL REFERENCES test_items(id),
  result_value   numeric(8,2) NOT NULL,
  test_date      date NOT NULL DEFAULT CURRENT_DATE,
  notes          text,
  coach_feedback text,
  created_by     uuid NOT NULL REFERENCES profiles(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 常用查询索引
CREATE INDEX idx_test_results_athlete ON test_results(athlete_id, test_date DESC);
CREATE INDEX idx_test_results_item    ON test_results(test_item_id);

-- =============================================
-- TABLE: training_plans
-- 教练创建的训练计划
-- =============================================
CREATE TABLE training_plans (
  id           bigserial PRIMARY KEY,
  coach_id     uuid NOT NULL REFERENCES profiles(id),
  title        text NOT NULL,
  description  text,
  start_date   date NOT NULL,
  end_date     date NOT NULL,
  plan_details jsonb NOT NULL DEFAULT '{"days": []}',
  is_active    bool NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- =============================================
-- TABLE: plan_assignments
-- 将训练计划分配给学员
-- =============================================
CREATE TABLE plan_assignments (
  id          bigserial PRIMARY KEY,
  plan_id     bigint NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
  athlete_id  uuid NOT NULL REFERENCES profiles(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plan_id, athlete_id)
);

-- =============================================
-- TABLE: plan_progress
-- 学员每日训练完成打卡记录
-- =============================================
CREATE TABLE plan_progress (
  id            bigserial PRIMARY KEY,
  assignment_id bigint NOT NULL REFERENCES plan_assignments(id) ON DELETE CASCADE,
  progress_date date NOT NULL,
  completed     bool NOT NULL DEFAULT false,
  notes         text,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, progress_date)
);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER plans_updated_at BEFORE UPDATE ON training_plans
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 新用户注册后自动创建 profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'athlete'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- VIEWS
-- =============================================

-- athlete_latest_results: 每个学员的最新各项成绩（供 Coach Dashboard 使用）
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
