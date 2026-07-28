# 🎾 VLTA Physical Training System - Product Requirements Document (PRD)

> **文档版本**：v2.1 · **状态**：Active  
> 此文档定义项目的 **"What and Why"**。所有业务边界、用户故事与项目规划在此汇聚。所有技术细节（架构/API/数据库）已被彻底抽离至：`@[./TennisPysical_PROJECT_SPEC.md]`。

---

## 1. 产品愿景 & 核心价值

### 一句话定义（One-liner）
> 帮助网球教练**数字化管理**青少年运动员体能数据，用数据驱动训练决策，让每个运动员都能清楚看到自己的成长。

### 核心价值主张（Value Proposition）

| 角色 | 痛点 | 我们解决的方式 |
|------|------|---------------|
| **教练** | 手写记录体能数据，无法快速纵览全队状态 | 一屏看全队数据，趋势图秒出 |
| **运动员** | 不清楚自己的进步幅度，训练动力不足 | 个人体能成长曲线 + 评分激励 |
| **家长** | 无法了解孩子的训练情况 | （Phase 2）只读家长视图 |

### 产品范围声明（Scope Statement）
- **In Scope (Trainer-Centric MVP)**：Admin/Coach 创建并管理虚拟学员 (Virtual Athletes)、体能测试批量录入、多维雷达图综合分析。
- **Out of Scope (明确不做)**：实时通讯/聊天、可穿戴设备集成、支付、多语言（MVP阶段）。**学员无需强制注册登录 (No Athlete Auth MVP)**。
- **延迟 (Post-MVP)**：学员自助登录认领档案、家长只读视图、通知邮件、批量 CSV 导入导出、训练模板库。

---

## 2. 用户角色 & 核心场景

### 角色定义

```text
                    ┌─────────────┐
                    │    Admin    │  (唯一，系统级别操作)
                    └──────┬──────┘
                           │ 指定角色
              ┌────────────┴────────────┐
              │                         │
        ┌─────▼──────┐           ┌──────▼─────┐
        │   Coach    │ ──管理──▶ │   Athlete  │
        └────────────┘           └────────────┘
```

> ⚠️ **权限单一来源原则**：role 字段是权限的单一来源。Admin 进后台将某 user 的 role 改为 `coach` 即可，不需要独立的邀请码机制（MVP阶段简化）。

### 每个角色的核心 User Stories

#### 🏃 Athlete（运动员 - 现阶段为被动管理的 Virtual Athlete）
- **AS A coach/admin** I WANT TO manually create athletes without requiring them to sign up **SO THAT** I can immediately start tracking their physical data.
- **AS AN athlete** I WANT TO see my latest fitness scores and radar charts (via coach sharing or future read-only links) **SO THAT** I feel motivated.

#### 👨‍🏫 Coach（教练）
- **AS A coach** I WANT TO see all my athletes' latest test results at a glance **SO THAT** I can quickly identify who needs attention
- **AS A coach** I WANT TO record test results for any athlete (multiple items at once) **SO THAT** data entry is fast during or after sessions
- **AS A coach** I WANT TO create training plans and assign them to specific athletes **SO THAT** each athlete has a personalized schedule
- **AS A coach** I WANT TO see which athletes haven't completed their plans **SO THAT** I can follow up with the right people

#### 🔧 Admin（管理员）
- **AS AN admin** I WANT TO change a user's role (athlete ↔ coach) **SO THAT** I can manage team structure without code changes

---

## 3. 功能范围（MoSCoW）

### 🔴 Must Have（MVP 核心，优先完成）

#### F-01：用户认证
- **角色路由重定向**：登录后根据 role 自动跳转（athlete → `/dashboard`, coach → `/coach`）
- **断网恢复**：Session 过期后自动强制拦截回 `/login`

#### F-02：用户资料管理
- **Athlete 权限**：对 full_name, birth_date, height_cm, weight_kg, phone 等数据自我管理。禁止编辑 `role` 等越权字段。
- **Coach 权限**：只读权限（可看所有 athlete 的详细资料以便指导）。

#### F-03：体能测试管理（核心 V2.1升级）
- **标准项目包**：立定跳远, 坐位体前屈, 10/20/100/200米短跑, 400/800/1000/3000/5000米中长跑, 引体向上, 10x5折返跑。
- **混合日志能力 (Hybrid Log)**：打破单纯的成绩考核，支持同表录入 `训练任务 (Training Task)` (如 200mx6 间歇跑打卡)，并使用底层双色 Tag 与数据防火墙实现隔离，保障评测系统的绝对纯洁度。
- **Coach / Athlete 边界**：Coach 负责权威录入测考数据，Athlete 仅供查看报表防篡改。

#### F-04：训练计划管理
- **教练建库**：Coach 创建计划时可配置每一日的 `exercises` 动作数组，并一对多分发给麾下球员。
- **运动员核销**：Athlete 按日历打卡完成每日条目。

#### F-05：综合体能评分（Physical Fitness Score）
- 每次成绩数据变更，通过自动算法产出百分制大圆盘及“速度、耐力、爆发”等维度。

### 🟡 Should Have（MVP 之后首批突击）
- Coach 测试成绩点评审批、响应式 PWA（移动端添加到主屏幕）、按测试时间维度的学员交叉搜索。
- **F-09：自动化提醒邮件**（基于 Supabase Edge Functions + Webhook 技术，定时解析球员的训练计划日程库，对漏练、迟打卡的学员发送防漏邮件通报）。

### 🟢 Could Have（长期路线图）
- **Athlete 手动自编辑 PB 最佳成绩追踪**模式。
- 家长免越权只读观测数据网格。

---

## 4. MVP 交付路线图 (Roadmap)

```text
Sprint 1: 基础设施 & 认证 (✅ 100% 完成)
  ├── Supabase + Clerk 架构搭建
  ├── 执行 migration SQL 解耦主键
  └── Middleware 路由拦截器上线

Sprint 2: Athlete 核心流程 (✅ 100% 完成)
  ├── Profile 编辑页（Zod + Server Actions 验证逻辑完成）
  ├── 我的测试成绩页（历史展示 + 混合日志 + 折线图）
  └── Athlete Dashboard（支持双轨制评估的雷达卡片）

Sprint 3: Coach / Admin 核心流程 (✅ 100% 完成)
  ├── 批量测试录入表单（Server Actions 重构安全逻辑完成）
  ├── 学员列表 + 性别呈现
  ├── Admin 视图下的系统数据字典大全 (Test Metrics)
  └── 训练计划的 JSONB 数据流创建 (部分就绪)

Sprint 4: 算法与报表打磨 (✅ 100% 完成)
  ├── 基于年龄的体能评分计算边界测试 (双轨制：普通与精英)
  └── 高级 Recharts SVG 数据可视化 (带翻转倒排Y轴)
```

---

## 5. 🤖 全局 AI 心智与工作区元数据 (Global Meta Directives)

> **AI 状态设定**：你现在是 Michael 的高级首席架构师兼产品执行董事。
> **核心指令**：在开始任何业务逻辑开发前，必须扫描本 PRD 的验收目标和 `PROJECT_SPEC` 规范。

### 📂 项目特殊规范 (NexusAI Workspace)
所有新建系统需严格遵守 NexusAI 流：
- **Project Structure**: Obsidian-based knowledge base with `00_META`, `10_PROJECTS`, `20_AREAS`, `30_RESOURCES`, and `40_ARCHIVE`.
- **References**: Always cite sources from the `30_RESOURCES/` or `references/` folders.
- **Tone**: Professional, helpful, and concise.
- **Custom Instructions**: When defining testing logic, **MUST check** `00_META/SKILL.md` or the `AgentSkills/` pipeline definitions.





新的需求待分析


- 设定cppemu@gmail.com 用户为最高级别Admin, 拥有所有权限, 可以指定任何用户的成为coach角色, 并且可以查看所有数据

- 所有athlate 注册时, 可以绑定一个coach, 如果没有绑定, 则为单一用户, 可以自己管理自己的数据, 并且可以管理自己的训练计划

- 更改目前的 Athlete 的 Dashboard, 改为 雷达图（Radar Chart），也称为 蜘蛛图（Spider Chart）或 极坐标图, 也可以在右上角切换为目前的已有的Athlete Dashboard, 主要是可以通过不同的视图来展示自己的体能数据

- 所有athlate注册后, 可以点开一个PersonalBest (PB)页面, PB成绩自动收录自己的测试的最好成绩, 如果没没测试,则默认值,Coach 可以查看, 并且可以修改


- 测试项目

身体基本素质
- 立定跳远
- 坐位体前屈
- 50米跑
- 1000米跑
- 引体向上
- 400米跑
- 800米跑
- 3000米跑
- 12分钟跑

网球专项体能
- Beep Test
- 蜘蛛跑 (变向灵敏性——5球移动测试)
- 俯卧撑
- 100米跑
- 专项耐力——30秒移动测试 
  - 场地设置：球员持球拍，以准备姿势站在发球线中点（T点）和一侧单打线的中间位置。
  - 测试步骤：听到开始口令后，球员快速移动，用球拍依次触碰T点和一侧单打线与发球线的交点。计算在30秒内完成的有效触碰次数。
  - 进阶评估：休息30秒后，重复测试。如此循环共进行3次。如果三次成绩下降明显，说明有氧 恢复能力需要加强；如果成绩都较低但很平稳，则应重点训练速度耐力

关于整体能力的评估取决于球员各项测试的分数



公共区域
- 各个项目的Leading Board
- 连续打卡天数
- 





- Coach 注册时, 默认为Athlete, 注册后, 可以不绑定任何用户, 如果没有绑定, 则为单一用户



- Athlete 注册后, 可以用多维质量评估表 或 评分卡（Scorecard） 100分制, 综合评估 球员的体能水平, 并且可以根据评分卡来推荐训练计划    

---

## 5. Future Roadmap / Backlog (待开发需求池)

- **[Feature] Hybrid Role (Coach as Athlete)**: 允许 `admin` 或 `coach` 角色的账号全面继承 `athlete` 的体测记录与查看大屏权限。
  - **架构方案**：打破体测面板的 `role = 'athlete'` 硬性隔离墙。在教练端顶部导航栏新增“👤 我的体能档案”专属入口，点击后传入当前教练/Admin的 ID 进行体侧大屏渲染。并在“成绩批量录入”页面的下拉列表中，强制注入当前教练/Admin账号，使其能够实现自我体测打卡。

- **[Feature] Gamification & Social Leaderboard (训练狂魔排行榜与勋章系统)**: 引入轻量级社交属性，激发学员良性竞争。
  - **架构方案**：零数据表改动。通过聚合查询 `assessment_results` 中 `record_type = 'training'` 且 `is_passed = true` 的记录数，按照 `1次 = 1小时` 换算出“累计训练时长”与“连续打卡周数”。
  - **UI 呈现**：在学员 Dashboard 增加精美的 Top 5 榜单 Widget。采用 `名 + 姓氏首字母`（如 Lucas H.）脱敏显示保护隐私，并在榜单底部动态展示当前学员的排名差距。
  - **未来扩展**：支持基于累计小时数（50H/100H）的数字徽章（Badges）与连胜火焰（Streaks）特效。


