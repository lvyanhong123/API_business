# API Business 项目规范

## 文档说明

本文档包含**约束性规则**（约束 AI 工作方式），其他规范请参考：

- [component-standard.md](../docs/standards/component-standard.md) - 前端组件规范
- [ui-interaction-standard.md](../docs/standards/ui-interaction-standard.md) - UI/交互规范
- [logic-standard.md](../docs/standards/logic-standard.md) - 代码实现逻辑规范
- [API_business_project.md](../docs/API_business_project.md) - 业务文档

---

## 约束性规则 (AI Behavior Rules)

### 工作流程规则

#### 任务结束规则
- **每次任务结束时**，必须将代码提交到 GitHub 并打 tag
- 版本号递增规则：末位满 10 进 1（如 v1.2.0 → v1.2.1）
- 提交信息应简洁描述本次完成的工作
- **完成后必须告知用户本次版本号**

#### 需求理解规则
- 当**没有完全理解**用户表达的意思，或认为存在歧义时，**必须先澄清**，而不是直接实现代码/执行任务
- 不要在有歧义的情况下假设用户的意图

#### 任务执行规则
- 每次只进行**一个主要任务**，避免同时处理多个任务导致混乱
- 完成当前任务并确认无误后，再开始下一个任务

#### 确认规则
- 对于**重大决定**（如架构变更、删除重要代码等），先询问用户确认再执行
- 对于不确定的实现方式，先提出方案让用户选择

### 文档更新规则

- 当用户确认新的业务决策、需求变更或规范更新时，AI 应主动更新相应的规范文档
- 规范归属判断：
  - **约束 AI 行为** → project_rules.md
  - **前端组件选择/组合** → component-standard.md
  - **视觉样式** → ui-interaction-standard.md
  - **命名/逻辑/后端** → logic-standard.md
  - **业务知识/需求** → API_business_project.md
- **例外**：如果该规范需要用户显式指令触发，且有明确操作步骤（如 Git 上传），应创建 Skill 存放到 `.trae/skills/<name>/SKILL.md`，而不是文档

---

## 强制执行的组件规范 (Component Rules)

以下组件规范是**强制执行**的，违反将导致功能缺失或用户体验不一致。

### 列表页面强制要求

- **禁止省略**任何列表页面的分页功能
- **禁止使用**非统一的页面结构
- **禁止省略** search-results 和 pagination 容器

### Tab标签页强制要求

新页面必须在 `openTab` 函数中注册，必须包含：
1. tabs 数组添加
2. activeMenuGroup 设置
3. switchTab 函数处理

### API路由强制要求

- 前端调用的 API 路径必须与后端实际注册的路由**完全一致**
- 添加新功能时，确保后端路由已正确注册
