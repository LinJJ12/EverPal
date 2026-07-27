# PRD: 更强长期记忆 + 今日心情打卡

> Task: `07-25-memory-mood-checkin`  
> Status: planning ready (await implement approval)  
> Source: `docs/PRD.md` §4.2 P1

## Goal

孩子打开聊天时能选「今天怎么样」，伙伴在对话里自然记得这份心情；记忆面板可删单条，并能查看/改今日心情。本刀以心情打卡为主，不做 LLM 摘要。

## Background

- 一期已有：昵称、喜好、规则抽取 memories（cap 8）、列表、一键清空、按 `client_id` 跨会话。
- 无心情存储/API/UI；无单条记忆删除。
- 语音 P0 已交付；本刀为二期 P1。

## Requirements

### Mood check-in

| ID | 需求 |
|----|------|
| MOOD-01 | 每天首次进入 `/chat` 且今日未打卡 → 展示选心情层；选完进入聊天 |
| MOOD-02 | 今日已打卡 → 不挡门，直进聊天 |
| MOOD-03 | 六档固定（2×3）：`happy` 开心 / `calm` 平静 / `tired` 有点累 / `sad` 难过 / `angry` 生气 / `hope` 期待；门控可选表情/贴纸风 |
| MOOD-04 | 同日可改签（覆盖更新）；入口：记忆页 + 聊天内轻量入口 |
| MOOD-05 | 当日心情写入系统提示（与昵称/记忆同路）；约束：可自然关心、勿每句提起、勿盘问；**无**强制开场白 |

### Memory polish

| ID | 需求 |
|----|------|
| MEM-P1 | 记忆列表支持**单条删除**（昵称/喜好保留） |
| MEM-P2 | 记忆页展示今日心情，并可改签 |

## Out of scope

- LLM 记忆摘要/抽取、向量库
- 多日心情趋势图、家长审阅
- 登录 / 家长面板
- 强制心情开场白

## Acceptance criteria

- [ ] 新设备/新日首次进聊天出现 6 档选心情；提交后进聊天且当日不再挡门
- [ ] 记忆页与聊天入口可改今日心情；后端按日覆盖一条
- [ ] 流式聊天的 system 侧含今日心情；无自动伙伴开场气泡
- [ ] 记忆页可删单条；清空全部仍可用
- [ ] Key 仅后端；无登录（`X-Client-Id`）

## Technical notes (summary)

详见 `design.md`。建议：`moods` 表或等价存储（`client_id` + `date` 唯一）；`GET/PUT /v1/mood/today`；`DELETE /v1/profile/memories/{id}`；前端门闸组件挂在 `ChatView` 启动路径。
