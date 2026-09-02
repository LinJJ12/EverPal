# Trellis 使用说明（本仓库）

本仓库（产品 **玖伴** / **Everpal**）已用 [Trellis](https://docs.trytrellis.app/zh) **0.6.7** 初始化（Cursor 平台），用于把**项目规范**注入后续 AI 开发。

当前可演示界面在 `demo/`；产品约束见 PRD 与 `.trellis/spec/guides/product-constraints.md`。

## 已就绪内容

| 路径 | 作用 |
|------|------|
| `.trellis/spec/` | 前后端与产品约束规范（已按 PRD 填好初版） |
| `.trellis/tasks/` | 任务与 PRD 上下文 |
| `.trellis/workspace/` | 会话日志 |
| `.cursor/agents/` | `trellis-research` / `implement` / `check` |
| `.cursor/skills/` | Trellis 工作流 skills |
| `.cursor/commands/` | `trellis-finish-work` / `trellis-continue` |
| `AGENTS.md` | 通用 Agent 入口说明 |
| `demo/` | HTML Demo（规范落地前的可点原型） |

关键规范请先看：

- `.trellis/spec/guides/product-constraints.md`
- `.trellis/spec/backend/safety-pipeline.md`
- `docs/PRD.md` / `demo/README.md`

## 日常用法

- 继续任务：Cursor 命令 **Trellis Continue** / `/trellis:continue`
- 收尾：**/trellis:finish-work**
- 规范过时：**/trellis:update-spec**（代码落地后把「planned」路径改成真实路径）

CLI（本机）：

```powershell
& "$env:APPDATA\npm\trellis.cmd" update --cursor
```

`session_auto_commit` 已设为 `false`（当前仓库未必使用 git 自动提交 journal）。
