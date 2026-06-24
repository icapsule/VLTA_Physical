# 🎯 AgentCore 本地运行守则

> [!IMPORTANT]
> **全局宪法继承**：本仓库是 AI 技能的母库。在执行任何任务前，AI 必须先读取并绝对服从全局最高宪法：
> 👉 `.antigravity/global-rules.md`

---

## 🎯 本仓库专属高优军规 (Local Overrides)

由于本仓库（AgentCore）的特殊业务属性（它是技能母库，而非普通的业务代码库），AI 在维护本仓库时必须额外遵守以下“地方法规”：

### 1. 框架与核心架构树
- **元数据绝对敏感**：禁止 AI 擅自修改 `plugins/` 目录中任何技能文件顶部的 YAML 元数据中的 `pattern` 和 `domain` 标签，除非人类明确授权。
- **架构纯洁性**：保证所有新技能必须严格遵循渐进式加载（Progressive Disclosure）架构，严禁制造污染。
