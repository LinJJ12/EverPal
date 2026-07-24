# 记忆分类增强：memories 细分类存储

## Goal

让自动抽出的陪伴记忆带稳定类别，能正确写入 SQLite、注入 system prompt，并在记忆页以中文标签展示；档案侧喜好标签保持独立。

## Background

- 现有表：`profiles` / `sessions` / `messages` / `memories`。
- `memories` 仅有 `text`，无 category；提取规则只覆盖「我喜欢 / 我爱 / 我叫 / 我的名字是」。
- 档案喜好在 `profiles.likes_json`；记忆页清除 memories 时保留昵称与档案喜好。
- 规格约定类别：`like` / `dislike` / `event` / `preference`；snippet 不得注入被安全门丢弃的内容。

## Decisions

| 决策 | 选择 |
|------|------|
| 存储 | 同表 `memories` 增加 `category` 列，不拆物理表 |
| 档案喜好 | 保留 `likes_json`；对话抽出的喜好写 `memories(category=like)` |
| 类别集合 | `like` / `dislike` / `event` / `preference`（称呼归 `preference`） |
| 前端 | 记忆页展示中文类别标签；不做筛选 / 按类清除 |
| 不做 | 消息编辑、导出、登录、PostgreSQL、`likes_json` 迁表 |

## Requirements

- **R1** Schema：`memories.category` 非空，合法值为四类之一；旧行迁移为 `preference`（或等价默认），不丢数据。
- **R2** API：`GET/PATCH /v1/profile` 返回的每条 memory 含 `category`；写入路径接受并持久化 category。
- **R3** 提取：现有「喜欢 → like」「称呼 → preference」按类写入；至少再支持一条 `dislike` 与一条 `event` 的规则标记（中文触发语）；仍走 memory-gate，命中安全词库不写入。
- **R4** Snippet：按固定顺序拼接（档案昵称/likes → preference → like → dislike → event），总量仍受现有条数上限约束。
- **R5** 前端：`MemoryView` 每条显示中文标签（喜欢 / 不喜欢 / 事件 / 偏好）；清除语义不变（清全部记忆条，保留昵称与档案喜好）。
- **R6** 测试：存储 roundtrip、提取分发、profile API 含 category、旧库迁移可测。

## Acceptance Criteria

- [x] AC1：新建记忆写入后可读回正确 `category`。
- [x] AC2：已有无 category 的 DB 启动后可读写，旧行有默认 category。
- [x] AC3：说「我喜欢 X」→ `like`；说「我叫 Y」→ `preference`；约定的 dislike/event 触发语分别落入对应类。
- [x] AC4：安全拦截的用户文本不产生记忆条。
- [x] AC5：`GET /v1/profile` 的 `memories[]` 每项含 `category`。
- [ ] AC6：记忆页展示对应中文标签；清除后档案 likes / nickname 仍在。（代码已改，待联调肉眼确认）
- [x] AC7：相关单测 / API 测通过。

## Out of scope

- 按类筛选、按类清除、记忆编辑、会话导出。
- 将档案 `likes_json` 并入 memories。
- 额外 LLM 抽取（仍用规则提取）。
