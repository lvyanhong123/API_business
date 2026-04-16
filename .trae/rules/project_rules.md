# API Business 项目规范

## 约束性规则

### 任务结束规则
- 判断：用户说"任务结束"、"今天就到这里" | 例外：仅更新规则、确认方案 → 询问"需要上传GitHub吗？"
- 执行：提交GitHub并打tag，版本号末位满10进1，完成告知版本号

### 需求理解规则
- 未完全理解或有歧义时必须澄清，不假设意图
- 用户说"你是怎么理解的"时是讨论而非执行

### 任务执行规则
- 一次只做一件事，确认后再做下一件 | 不确定时先提方案

### 文档更新规则
- 确认决策后主动更新 | 用户说"多次告知应..."时需沉淀
- 不确定归属时先澄清
- 归属：约束AI行为→project_rules.md | 前端组件→component-standard.md | 视觉样式→ui-interaction-standard.md | 命名/逻辑→logic-standard.md | 业务知识→API_business_project.md
- 显式指令+操作步骤 → Skill (.trae/skills/<name>/SKILL.md)

### 讨论记录规则
- 用户说"任务结束"时询问是否总结，过程记录到todo list
- 存放：docs/discussions/YYYY-MM-DD-主题.md
