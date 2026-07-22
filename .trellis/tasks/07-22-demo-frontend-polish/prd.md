# 完善前端 Demo 讲解体验

## Goal

在纯 HTML `demo/` 上交付 **A 讲解流畅 + B 视觉角色感**，让 8–12 分钟走查少背稿、角色一眼可分。不接真实大模型。剧本加厚（C）本轮不做。

## Background

- 品牌玖伴；对照产品约束与 `docs/PRD.md`。
- 状态：`demo/js/store.js` → localStorage `companion_demo_v2`；顶栏已由 `mountHeader()` 注入。
- 欢迎页已有部分「记得你」文案（`welcomeGreeting()`）；设置页已有无确认的「清除本机全部演示数据」。
- 三角色已有简笔 `avatarSvg()` + 分色底，需加强表情/道具差异。

## Decisions

| 决策 | 结论 |
|------|------|
| MVP 范围 | A + B；C 延后 |
| 任务结构 | 单任务，不拆 parent/child |
| 头像 | 加强现有 SVG（不出新 PNG） |
| 重置 | Full：回 store 默认；需确认 |
| 讲解条 | Tour-bar：推荐路径页顶栏下进度 +「下一步」 |

## Requirements

### A · 讲解流畅

- **R-guide**：推荐 10 步路径页显示 Tour-bar（当前步、下一步链接）；`index.html` 可不显示细条或仅链到欢迎。
- **R-reset**：设置页「重置演示」→ 确认 → Full 恢复默认（儿童、空昵称、空喜好、小暖、空记忆/会话）。
- **R-memory-wow**：有昵称或喜好时，欢迎 + 角色开场/聊天空状态至少一处主动引用（刷新仍有效）。欢迎页已有基础能力，需补齐角色/聊天侧。

### B · 视觉角色感

- **R-avatar**：小暖/跳跳/阿茶 SVG 一眼可分；companions 与 chat 共用。
- **R-mobile**：窄屏聊天侧栏不永久占满主对话区（抽屉或折叠）。
- **R-mode-type**：儿童模式字号明显大于成人（`body`/`html` data-mode 驱动）。
- **R-motion**：≥2 处有意动效（气泡出现、打字/下一句轻过渡），不干扰讲解节奏。

## Out of scope

- C：更多剧本分支、安全对照页、反恋爱短剧
- 真模型、语音、登录、家长面板
- 正式 SPA `web/` 迁移；改 `docs/PRD.md` 正文

## Acceptance Criteria

- [ ] AC1：在 `welcome.html`→…→`settings.html` 推荐路径页可见 Tour-bar；当前步正确；「下一步」跳到路径下一页
- [ ] AC2：设置页重置经确认后，状态为儿童/空昵称/空喜好/小暖/无会话无记忆；刷新仍干净
- [ ] AC3：设置昵称 + ≥1 喜好后，欢迎文案引用之；companions 或 chat 空状态至少再引用一次
- [ ] AC4：三角色 SVG 在 companions 与 chat 头像一致且可辨识
- [ ] AC5：约 ≤480px 宽下可完成发送，侧栏不挡死主区
- [ ] AC6：儿童/成人切换后字号差异可感知
- [ ] AC7：聊天或场景中 ≥2 处动效，且「下一句」仍可手动控速

## Notes

- 实现前：`design.md` + `implement.md` + jsonl 已备；需用户审阅后 `task.py start`。
