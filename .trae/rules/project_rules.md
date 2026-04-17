# API Business 项目规范

## 约束性规则

### 任务结束规则
- 用户说"任务结束" → 询问是否上传GitHub
- 提交GitHub并打tag，完成告知版本号

### Git提交规则
- 用户说"提交GitHub"时，先记录讨论总结到 docs/discussions/，再执行提交
- 总结内容：本次讨论的决策、规则更新、新增/修改的skill内容
- **禁止**基于本地有修改就自动上传，必须等待用户明确指令

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
- 用户表达任务结束意思时（"任务结束"、"到此为止"等）询问是否需要总结
- 总结 → docs/discussions/YYYY-MM-DD-主题.md（不要追加到业务文档）
- 总结风格：调侃要自然准确，不要刻意形容自己，要准确传达讨论的转折和亮点
