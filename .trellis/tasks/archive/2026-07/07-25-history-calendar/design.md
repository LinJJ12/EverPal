# Design: 历史页日历

> Task: `07-25-history-calendar`

## Architecture

```text
HistoryView (月历 UI)
  → GET /v1/history/calendar?month=YYYY-MM
  → GET /v1/history/days/{day}/sessions   (day=YYYY-MM-DD)
       → storage: messages + sessions + daily_moods
```

不改聊天管线；只读聚合。

## API

### `GET /v1/history/calendar?month=YYYY-MM`

Headers: `X-Client-Id`（与现网一致）。

Response:

```json
{
  "month": "2026-07",
  "days": [
    {
      "day": "2026-07-25",
      "has_chat": true,
      "session_count": 2,
      "mood": "hope",
      "mood_label": "期待"
    }
  ]
}
```

- 只返回当月内「有对话或有心情」的日（前端空日自行灰显）；或返回整月 28–31 项均可，实现选**稀疏列表**以减包体。
- `has_chat`：该 `client_id` 下任意会话在东八区该日存在 `messages`（role 为 user/assistant）。
- `mood` / `mood_label`：来自 `daily_moods`；无则 `null`。

### `GET /v1/history/days/{day}/sessions`

Response:

```json
{
  "day": "2026-07-25",
  "mood": "hope",
  "mood_label": "期待",
  "sessions": [
    {
      "id": "...",
      "title": "...",
      "companion_id": "nuan",
      "updated_at": 0,
      "message_count_that_day": 4
    }
  ]
}
```

- 会话：当日至少一条消息；按当日最后一条消息时间倒序。
- 仅心情无会话：`sessions: []`，仍返回 mood 字段。

## Storage / SQL sketch

- 对话日：`messages` JOIN `sessions` ON client_id，将 `created_at` 转东八区 `strftime`/`datetime(..., '+8 hours')` 得 `day`，按月过滤。
- 当日会话：同上 filter `day=?`，`GROUP BY session_id`。
- 心情：`daily_moods` WHERE `client_id` AND `day LIKE 'YYYY-MM%'` 或 `day BETWEEN`.

复用 `domain/moods.label_for`；时区常量与 `mood_repo.CN_TZ` 对齐（可抽到 domain 或 shared helper，避免两套偏移）。

## Frontend

- `HistoryView`：月历网格（一列 7，周一首）；上/下月；选中日下方会话列表。
- `api/history.ts`：上述两个 GET。
- 心情展示：`getMoodFaceStyle` + `MOOD_OPTIONS` / `MoodSticker`（小尺寸）。
- 路由仍 `/history`；进聊天沿用 `?session=`。

## Trade-offs

| 选择 | 利 | 弊 |
|------|----|----|
| 按消息日 | 准 | 比 updated_at 查询重 |
| 稀疏 days 数组 | 响应小 | 前端要自己填空格 |
| 不做农历 | 简单 | 不像完整手机日历 |

## Compatibility

- 旧长列表 UI 替换为月历；无破坏性 API 删除（`GET /v1/sessions` 仍可供别处使用）。
