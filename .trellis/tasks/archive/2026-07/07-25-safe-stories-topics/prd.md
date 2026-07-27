# PRD: 安全故事库与官方话题包

> Task: `07-25-safe-stories-topics`  
> Status: implemented  
> Source: PRD §4.2 二期 P1；用户决策 A/A/A/A

## Goal

让孩子在**聊天空状态**与**场景页「短故事」分组**更容易点到官方话题 / 安全短故事；内容为前端静态包；故事为审定开场 + LLM 续写；不接外链、不做 CMS。

## Decisions

| 决策 | 选择 |
|------|------|
| 故事交付形态 | **A**：审定开场 + LLM 续写 |
| 话题卡显示时机 | **A**：仅空状态（无消息且未流式） |
| 内容存放 | **A**：前端静态包（`src/content/packs.ts`） |
| 短故事入口 | **A**：`/scenes` 增加「短故事」分组 + 空态话题卡保留故事类入口 |

## Confirmed (codebase)

- 话题：`useTopicCards` ← `content/packs` → `TopicCards`（空态）
- 场景 / 故事：`ScenesView` ← packs → `/chat?seed=` → `bootstrapChat`
- 后端无 topics/stories API；安全靠人设 + 词库

## Requirements

| ID | 需求 |
|----|------|
| ST-01 | 单一内容源：话题 / 场景 / 故事条目（含稳定 `id`、`label`、`seed`、可选 `companion_id` / `kind`） |
| ST-02 | 聊天空状态展示 ≥4 个官方话题卡；有消息或流式中不显示 |
| ST-03 | `/scenes` 保留场景卡，并新增「短故事」分组（≥3 则）；点卡 → 可切伙伴 → `/chat?seed=` |
| ST-04 | 故事条目含审定中文开场种子（引导听某则故事）；续写走现有聊天管线 |
| ST-05 | `useTopicCards` 从内容包派生话题，替换 `useChatPage` 内联常量 |
| ST-06 | 场景列表从同一内容包派生，去掉与话题重复的散落硬编码 |
| ST-07 | 文案儿童向、无恋爱；故事主题安全（友谊、勇气、自然、睡前等） |

## Out of scope

- 全文多轮脚本 / demo 式 choices 分支
- 内容 CMS、后端 `/v1/content/packs`
- 登录 / 家长面板
- 第三方审核 API、联网百科
- 新主导航「故事」独立页

## Acceptance Criteria

- [x] 空聊天可见 ≥4 话题；发送后话题卡消失；刷新空会话再出现
- [x] `/scenes` 有场景分组 + 短故事分组；点故事进入聊天并自动发出开场种子
- [x] 话题/场景/故事种子出自同一内容模块，无三处各写一份
- [x] 不新增后端内容 API；前端 build 通过
- [x] 文档：`directory-structure` 注明 `content/`

## Technical notes

- 复用 `?seed=` + `bootstrapChat`；不改 `POST /v1/chat/stream` 契约（本期）。
- 可选后续：`topic_id` 注入系统提示——明确不在本期。
