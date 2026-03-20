# 🎯 Vibe Coding 指挥官手册 (v1.1 - 2026)

> **AI 状态设定**：你现在是 Michael 的高级首席架构师。
> **核心指令**：在开始任何代码生成前，必须全文检索并内化本规范。

---

## 🌐 部署与云端环境 (Cloud Architecture)
- **Host**: Vercel (Hobby Tier).
- **Backend/DB**: Supabase (PostgreSQL + Auth + Storage).
- **Video Logic**: 10MB 以下视频使用 Supabase Storage 存储，前端使用 `supabase-js` 进行流式加载。
- **Env**: 严禁将 `SUPABASE_KEY` 写入代码，必须使用 `.env.local` 并在 Vercel 后台配置。



## 🛠 协作与项目全局准则 (Crucial Prompting & Principles)
1. **只增不减原则**：严禁随意删除或重写已有代码行。所有更新应以“新增模块”或“指定位置替换 (Append/Replace)”的方式提供。
2. **上下文对齐**：在执行任务前，先确认当前工作区路径。
3. **拒绝废话**：直接给出方案和代码，解释应保持在 10 句以内。
4. **规范与风格优先级**：代码风格与规范**一致性优先于个人偏好**（本规则即为最高优先级）。
5. **绝对类型安全 (Hard Rule)**：强制使用 TypeScript Strict 模式（noImplicitAny、strictNullChecks 开启）。严禁使用 `any`，所有对象和 API 返回值必须定义 `interface` 或 `type`。
6. **函数式优先 (Hard Rule)**：优先进行函数式编程，使用函数组件和 Hooks，避免不必要的 class 和 this 绑定，禁止 class 绑定。
7. **包管理锁定 (Hard Rule)**：仅允许使用 `pnpm` 作为包管理器（禁止 npm/yarn）。

## 🛡 开发底线与错误安全 (Hard Rules & Safety)
1. **错误处理全面**：每个异步操作/外部调用必须有 try/catch + 自定义错误类型 + 日志。所有 Promise 必须处理 .catch 或 try/await。
2. **凭证与安全**：**永不提交**密钥、token、密码、私钥、API key（使用环境变量或 secret manager）。禁止直接在代码中硬编码 URL、密钥、环境变量。使用 `process.env` 或 `import.meta.env` 访问环境变量。所有 fetch/axios 调用必须：
   - 设置 timeout（默认 10s）
   - 处理 401/403/5xx 错误
   - 添加 AbortController 支持取消
3. **输入校验与防御**：所有外部输入（API/用户输入）必须经过校验/转义（如 Zod / Yup 验证）。
4. **DOM 安全**：禁止使用 `dangerouslySetInnerHTML`，除非必要且已 sanitization。

## 📝 交付与代码规范 (Output Standard & Style)
- **语言**：TypeScript（.ts / .tsx）
- **缩进**：2 spaces
- **引号**：单引号（'）优先
- **分号**：不需要（semi: false）
- **换行**：最大行宽 100 字符
- **命名规范**：
  - 变量/函数：camelCase
  - 类型/接口/类/组件：PascalCase
  - 常量：SCREAMING_SNAKE_CASE
  - 文件名：kebab-case（如 `my-component.tsx`）
- **Import 顺序（严格）**：
  1. React / Next.js 内置
  2. 第三方库（按字母序）
  3. 项目内部模块（`@/*` 别名优先）
  4. 样式 / 资源文件
- **禁止使用语法**：any、console.log（生产环境）、eval、new Function。禁止 console.* 提交到 main 分支（eslint 强制）。
- **现代语法推荐**：优先使用现代语法：可选链 `?.`, nullish `??`, 顶层 await。
- **注释要求**：关键逻辑、关键函数、组件必须使用 JSDoc 格式注释。

## ⚛️ React / Next.js 规范
- 使用 **函数组件** + Hooks，不使用 class component。
- 组件拆分原则：单一职责、组合优于继承。
- 状态管理优先级：
  1. React.useState / useReducer
  2. Zustand（全局状态）
  3. Redux Toolkit（复杂场景）
- 副作用统一使用 useEffect，依赖数组必须完整。
- 组件必须有 displayName（便于调试）。
- 所有事件处理函数使用 useCallback 包裹（性能关键路径）。
- 优先使用 Server Components（Next.js App Router），Client Component 需明确标注 `'use client'`。

## 🧪 测试要求
- 单元测试：每个纯函数、工具函数、hook 必须有测试（vitest / jest）。
- 组件测试：使用 @testing-library/react，测试交互与渲染结果。
- 测试文件位置：同目录下 `__tests__/*.test.tsx`。
- 覆盖率目标：关键业务逻辑 ≥ 85%，整体 ≥ 70%。
- 禁止提交未测试的核心逻辑。

## 📦 Git & 提交流程规范
- **Git Commit 规范**：Commit message 严格遵循 Conventional Commits：
  `feat:` 新功能 | `fix:` 修复 bug | `chore:` 杂项 | `refactor:` 重构 | `docs:` 文档 | `test:` 测试 | `style:` 格式
- **提交流程**：提交前必须运行 lint + test（husky + lint-staged）。
- **分支命名**：`feature/xxx`、`bugfix/xxx`、`hotfix/xxx`、`release/v1.2.3`

## 📂 项目特殊规范 (NexusAI Workspace)
所有新建项目请严格遵守 NexusAI 体系下的所有规范：
- **Project Structure**: Obsidian-based knowledge base with `00_META`, `10_PROJECTS`, `20_AREAS`, `30_RESOURCES`, and `40_ARCHIVE`.
- **Tagging**: All new notes must include YAML frontmatter with `tags`, `type`, and `topic`.
- **References**: Always cite sources from the `30_RESOURCES/` or `references/` folders.
- **Tone**: Professional, helpful, and concise.
- **Custom Instructions**: When researching, always check `00_META/SKILL.md` first for core dispatching logic.
- **多工作区技巧 / VS Code**：
  - 方案一：独立窗口：Control + Shift + N 打开新窗口。
  - 方案二：同一窗口多目录 (Multi-root Workspaces)：点击顶部菜单栏的 File -> Add Folder to Workspace...

## ⚡️ 违规触发处理 (Fallback)
1. **如果生成代码内容违反以上任一条规则，你必须在回复开头自检并道歉/说明原因，然后立即修正**。
2. **准则优先级**：安全 > 类型安全 > 测试 > 风格 > 性能。

*(最后更新：2026-03-18)*



Vltaaitechnology11!