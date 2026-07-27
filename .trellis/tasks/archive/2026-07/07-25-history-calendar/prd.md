# PRD: 历史页日历 — 对话日与心情一览

> Task: `07-25-history-calendar`  
> Status: planning ready (await implement approval)  
> Source: 用户诉求；现有 `/history`、今日心情、`sessions` / `messages` / `daily_moods`

## Goal

在「会话历史」用**中国常用排法的月历**（周一起始、公历），一眼看出哪天聊过、那天心情如何；点有内容的日子展开当日会话列表，再回看聊天。

## Background

- 现 [`HistoryView.vue`](frontend/src/views/history/HistoryView.vue) 为会话长列表。
- 会话仅有 `updated_at`；消息有 `created_at`（「哪天聊过」以消息日为准）。
- 心情按东八区 `day` 存于 `daily_moods`；尚无按月批量 API。
- 心情打卡（`07-25-memory-mood-checkin`）已交付六档心情与表情/贴纸偏好。

## Decisions

| 决策 | 选择 |
|------|------|
| 对话日归属 | 按消息日期（东八区日历日） |
| 点某日 | 展开当日会话列表，再进 `/chat?session=` |
| 历史页形态 | 仅月历，无全部会话长列表 |
| 空日（无对话且无心情） | 灰显、不可点 |
| 仅心情无对话 | 可点：心情 +「这天还没有聊天」 |
| 周起始 / 样式 | 周一为首；公历；**不**显示农历小字 |

## Requirements

| ID | 需求 |
|----|------|
| CAL-01 | `/history` 主视图为月历，可切换上/下月；表头为周一→周日 |
| CAL-02 | 当天存在 user/assistant 消息（东八区日）→ 格子有「聊过」可见标记 |
| CAL-03 | 当天有心情打卡 → 格子展示心情（沿用本机表情/贴纸偏好） |
| CAL-04 | 点有内容的日子 → 下方（或面板）列出当日有消息的会话；点条目进聊天 |
| CAL-05 | 不提供「全部会话」长列表 |
| CAL-06 | 无对话且无心情 → 灰显不可点 |
| CAL-07 | 仅心情无对话 → 可点；展示心情与空态文案，无会话行 |
| CAL-08 | 公历数字；不显示农历 |

## Out of scope

- 农历、节假日/节气标注
- 心情趋势图、统计报表
- 家长云同步 / 多设备
- 改聊天门闸；从日历改签心情（可继续用记忆页/聊天 chip）

## Technical notes（摘要）

- 新（或扩展）API：按 `year-month` 返回每日 `{ day, has_chat, mood?, session_count? }`；按 `day` 返回当日会话摘要列表（会话须在该日有消息）。
- 消息日切分与心情一致：东八区（`CN_TZ`）。
- 前端：重做 `HistoryView`；复用 `moodOptions` 的 emoji/贴纸偏好。

## Acceptance Criteria

- [x] `/history` 为周一起始的公历月历，可翻月
- [x] 有消息的日期有「聊过」标记；有心情的日期显示对应心情脸
- [x] 双空日不可点；仅心情日可点并见空态文案
- [x] 有对话日可展开当日会话列表并进入对应会话
- [x] 无「全部会话」长列表；无农历小字
- [x] 后端单测覆盖：跨日同会话、仅心情日、空日聚合
- [x] 前端 build 通过
