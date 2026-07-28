# 🎾 VLTA Physical Training System - Technical SPEC (CTO Edition)

> **文档性质**：系统级架构蓝图、数据库设计与编码纪律。（"HOW"）  
> 不包含用户故事和产品愿景，业务验收场景请前往 `@[./PRD.md]` 对齐。
> 重构时间：2026-06 (V2.1 三表联动架构)

---

## 📋 目录 (CTO Overview)
1. **[架构设计抉择 (Architecture Design)](#1-架构设计抉择-architecture-design)** (框架、安全模型、解耦基准)
2. **[后端服务与数据库 Schema (Backend & Database)](#2-后端服务与数据库-schema-backend--database)** (SQL 建模)
3. **[前端引擎与组件化 (Frontend Architecture)](#3-前端引擎与组件化-frontend-architecture)** (目录规范、可视化)
4. **[部署与基础设施环境 (Infrastructure)](#4-部署与基础设施环境-infrastructure)** (系统变量、上层云托管)
5. **[核心体能算法实现规格 (Fitness Algorithm Matrix)](#5-核心体能算法实现规格-fitness-algorithm-matrix)**
6. **[代码整洁守则与 AI 纪律准则 (Coding & AI Pipeline)](#6-代码整洁守则与-ai-纪律准则-coding--ai-pipeline)**
7. **[防退化自动化 TDD 测试规约 (Testing Safeguards)](#7-防退化自动化-tdd-测试规约-testing-safeguards)**
8. **[AI 开发指令参考集 (Prompt Templates)](#8-ai-开发指令参考集-prompt-templates)**

---

## 1. 架构设计抉择 (Architecture Design)

### 1.1 技术底座栈
| 模块 | 技术选型 | CTO 技术决策原委 |
|---|---|---|
| **全栈引擎** | **Next.js 15 (App Router)** | RSC 与 Server Actions 支持，彻底抹除冗余的客户端 REST API 夹层 |
| **访问网关** | **Clerk** | 零配置剥除传统 Session 痛点，接管所有 Cookie、Token 的签发拦截，兼修无代码图片源管理 |
| **云端关系库** | **Supabase (Postgres)** | （已彻底废除自带 Auth / Storage / RLS）单纯降维打击用作核心数据持久化网格 |
| **安全边疆防御** | **Zod + Server Actions** | **只增不减原则重点**：彻底在后端 Action Runtime 中通过 `await auth()` 斩杀越权注入，不再纵容数据库内层的 SQL 权限判断 |
| **渲染层** | **Tailwind CSS + shadcn/ui** | 与 AI 组件生成极度亲和的无头组件规范，附加强大的 Recharts 图表挂载能力 |

### 1.2 安全控制流向图 (Security Data Flow)
1. **身份防伪**: 非公开路由必须穿过 `clerkMiddleware()` 拦截重定向。
2. **入库强排雷**: 用户提交（Profile、批量生成分数）必须通过 `Zod` `safeParse`。
3. **服务端斩断**: Server Action 内首行使用 `@clerk/nextjs/server` 获取绝对防篡改的 `userId`。
4. **底层透传**: SQL 写入操作内嵌 `eq('id', userId)` 等归属强行注入，确保绝对私有化更新。

---

## 2. 后端服务与数据库 Schema (Backend & Database)

> 以下 Schema 为系统唯一解：已断开与 Supabase Auth 的物理联系。

```sql
-- Migration: vlta_v2.1_tri_table_schema.sql (V2.1 三表联动更新版)
-- 注意：所有原有的 `uid` 或 `uuid` 主键已改为 `text`，为了硬生生兼容 Clerk 的 `user_...` 格式。
-- !!! 所有 ROW LEVEL SECURITY (RLS) 拦截器必须为关闭状态 (Drop ALL Policies) !!!

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户主权表 (兼容 Clerk 登录事件映射与 Virtual Athlete 随机 UUID)
CREATE TABLE profiles (
  id          text PRIMARY KEY,
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

-- ==========================================
-- 核心架构：三表联动体能测考体系 (Tri-Table Schema)
-- ==========================================

-- 1. 数据字典表 (Test Metrics)
CREATE TABLE public.test_metrics (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  dimension TEXT NOT NULL,
  unit TEXT NOT NULL,
  higher_is_better BOOLEAN NOT NULL,
  record_type TEXT NOT NULL DEFAULT 'test', -- 'test' (评估测试) 或 'training' (日常打卡)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 考试场次表 (Assessments Sessions)
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coach_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  test_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 成绩明细表 (Assessment Results)
CREATE TABLE public.assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  metric_id TEXT NOT NULL REFERENCES public.test_metrics(id) ON DELETE RESTRICT,
  athlete_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempts NUMERIC[] DEFAULT '{}',
  best_result NUMERIC,
  is_passed BOOLEAN, -- 专供 record_type='training' 形式的通过制打卡使用
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assessment_results_athlete_metric ON public.assessment_results (athlete_id, metric_id, best_result);

-- 教练分配给学员的模块 JSON 训练容器
CREATE TABLE training_plans (
  id           bigserial PRIMARY KEY,
  coach_id     text NOT NULL REFERENCES profiles(id),
  title        text NOT NULL,
  description  text,
  start_date   date NOT NULL,
  end_date     date NOT NULL,
  plan_details jsonb NOT NULL DEFAULT '{"days": []}',  -- 强制统一为 JSONB 结构储存每天 exercises
  is_active    bool NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

CREATE TABLE plan_assignments (
  id          bigserial PRIMARY KEY,
  plan_id     bigint NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
  athlete_id  text NOT NULL REFERENCES profiles(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plan_id, athlete_id)
);

-- 学员每日打卡勾选痕迹
CREATE TABLE plan_progress (
  id            bigserial PRIMARY KEY,
  assignment_id bigint NOT NULL REFERENCES plan_assignments(id) ON DELETE CASCADE,
  progress_date date NOT NULL,
  completed     bool NOT NULL DEFAULT false,
  notes         text,                        
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, progress_date)       
);

-- 自动生成的时间戳触发器
CREATE OR REPLACE FUNCTION handle_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 最新成绩仪表板聚合视图 (可选基于三表的优化视图)
CREATE OR REPLACE VIEW athlete_latest_results AS
SELECT DISTINCT ON (ar.athlete_id, ar.metric_id)
  ar.athlete_id, p.full_name, tm.name_zh AS test_name, tm.unit, ar.best_result, a.test_date
FROM assessment_results ar
JOIN profiles p ON p.id = ar.athlete_id
JOIN test_metrics tm ON tm.id = ar.metric_id
JOIN assessments a ON a.id = ar.assessment_id
ORDER BY ar.athlete_id, ar.metric_id, a.test_date DESC;
```

---

## 3. 前端引擎与组件化 (Frontend Architecture)

### 3.1 路径拓扑设计 (Route Segment)
```text
app/
├── (athlete)/               # 受 Clerk role="athlete" 或默认保护访问
│   ├── dashboard/           # 包含 <FitnessScoreCard /> 雷达总览
│   ├── tests/               # 搭载 Recharts <TestTrendChart /> 折线表
│   ├── plans/               # 计划读取挂接与 checklist 返回器
│   └── profile/             # Profile 自管理编辑组件层
├── (coach)/                 # 受 Clerk 强检查区
│   ├── dashboard/           # 数据聚合报表
│   ├── athletes/            
│   │   └── [athleteId]/tests/new/   # <BulkTestEntry /> 统一防注入表格
│   └── plans/new/           # JSONB 复杂训练建造器
└── (admin)/                 # (唯一后台)
```

### 3.2 抽象可视组件 (Core Components Definition)
1. `<BulkTestEntry />`: 教练端的并发存储库，单个 Athlete + 单日时间流，下方并发排列 `test_items`。基于 Zod Array Object Validation 拦截不合法数字，最终映射为 Server Actions Bulk Insert。
2. `<TestTrendChart />`: 依托 `Recharts` 加载，挂载 Hover Tooltip 查询。最高分（PB）记录使用特殊 marker SVG 注解。
3. `<FitnessScoreCard />`: 综合评分散列指示器。圆弧进度算法依据计算文件（Section 5）。

---

## 4. 部署与基础设施环境 (Infrastructure)

### 4.1 云服务环境变量（`.env.local` 必配清单）
要求执行 `pnpm dev` 或 Vercel 构建必须检查到的核心金钥：
```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Service or Anon Key> # 代理写入通过它连接池
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... # 路由及客户端 Clerk 签名
CLERK_SECRET_KEY=sk_test_...                 # 后端验权锁
SUPABASE_DB_PASSWORD=<Password>              # 如果有纯数据池管理需要的话
```

### 4.2 环境编译
本地使用 `pnpm build` 与 `tsc --noEmit` 进行地毯式的类型校验与 `package.json` 清洗。**生产环境交由 Vercel Hoby 无缝挂载。**

---

## 5. 核心体能算法实现规格 (Fitness Algorithm Matrix)

| 测评维度 | 数据依据项目 | 算法权重分配 |
|------|-------------|------|
| ⚡️ 速度（Speed）| 10米冲刺、20米跑、100米、200米 | 动态均摊 |
| 💥 爆发力（Power）| 立定跳远 | 动态均摊 |
| 🫁 耐力（Endurance）| 400米、800米、1000米、3000米、5000米 | 动态均摊 |
| 🐍 柔韧性（Flexibility）| 坐位体前屈 | 动态均摊 |
| 🦾 力量（Strength）| 引体向上 | 动态均摊 |
| 🌪️ 敏捷（Agility）| 10x5 折返跑 | 动态均摊 |

### 5.1 双轨制年龄动态增长算法 (Dual-Track Growth Factor)
为了保证测试分数的客观性，系统摒弃了死板的“Min/Max”静态查表，采用了 **年龄基线偏移算法 (Growth Factor)** 与 **双轨制标准 (Regular vs Elite)**。

- **普通青少年 (Regular Mode)**：每年能力自然递增的线性模型（起点年龄设定为 9 岁）。
- **精英标准 (Elite Mode)**：针对具有职业潜力的选手设定的更为严苛的斜率与基线拦截点。

```typescript
// 动态计分伪代码
const ageOffset = Math.max(0, age - 9); // 从9岁开始计入发育因素
const growthFactor = isElite ? 0.35 : 0.25; 
const dynamicCeiling = baseCeiling + (ageOffset * growthFactor); // 天花板随着年龄增加而拔高

// 防火墙拦截：仅将 `record_type === 'test'` 的数据注入算法引擎，丢弃 'training' 打卡数据
if (metrics.record_type === 'test') {
   score = Math.round( (value / dynamicCeiling) * 100 );
}
```

---

## 6. 代码整洁守则与 AI 纪律准则 (Coding & AI Pipeline)
> 这是架构委员会向系统及执行层（你，AI CTO）下达的最高操作权限（Hard Rules）。

### 6.1 只增不减原则 (Append-Only Principle)
- 严禁随意删除或重写已有业务流。如果要废弃冗余，使用 `@deprecated`。如果逻辑更改，建立一个平行的 Server Action V2 模块再进行切流验证。

### 6.2 绝对类型安全边界 (TypeScript Isolation)
- 强制使用 Strict 防火墙 (`noImplicitAny`, `strictNullChecks`)。
- 绝不允许使用 `any` 越界传参。
- RLS 脱解后，所有客户端传入的对象通过 `zod` 的 `safeParse` 解耦推导为安全的 payload 才能存根。

### 6.3 统一技术基调策略 
- **包管理器**：全局锁定 `pnpm`。完全杜绝 npm/yarn 引发的锁问题。
- **函数式编程**：剥离复杂的 class，以极致纯粹的 React Hooks (useCallback 等包裹事件链) 进行。
- **Promise 全面阻断**：每一个 Fetch 及外部接口必须执行严密的 `try/catch` 捕获链。

---

## 7. 防退化自动化 TDD 测试规约 (Testing Safeguards)

> 配合 `AgentSkills/software-testing/SKILL.md` 指南执行 `Red-Green-Refactor`。

### 7.1 测试策略地图 (Coverage Vectors)
1. **纯净算法层集** (`lib/utils/fitness-score.ts`) : 对 clamp 的负数边界、溢出满分线执行 100%覆盖测试。
2. **中间件截流认证集** (`middleware.ts`) : 确保 `athlete` 未授权跳转防抖回路由 `/login`。
3. **Zod 组件级表单强校验** : 年龄溢出阻断、不安全 URL 文件阻止上传机制。

### 7.2 AI 测试汇报表 (执行完毕后反馈)
| Feature 代码 | 关联用例脚本 | 通过状态 | 延时容错指标反馈 |
|---|---|---|---|
| F-02 Profile | `__tests__/profile-form.test.ts` | 待测 N/N | - |
| F-03 Tests | `__tests__/bulk-test-entry.test.ts` | 待测 N/N | - |

---

## 8. AI 开发指令参考集 (Prompt Templates)

> 仅供参考：针对历史版本的批量操作指令池。现代开发请主动采用 `Agile TDD Iterator` 构建脚本。

### 初始化或生成复杂表单标准指令：
```
你是一名 Next.js 15 全栈专家。基于 TDD 思路：
1. 请先根据我的 PRD 需求建好测试边界。
2. 用 React Hook Form + Zod 生成对应的客户端防守表单。
3. 把真正的 Database Update 逻辑剥离到只调用 auth().userId 验证的服务端 Action 中执行。
```
