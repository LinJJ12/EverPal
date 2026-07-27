# Design: 今日心情 + 记忆单条删除

## Architecture

```
ChatView mount
  → GET /v1/mood/today
  → if missing → MoodGate overlay → PUT /v1/mood/today
  → chat as today

chat stream
  → memory.snippet(...) + today mood line → persona system

MemoryView
  → show today mood + change
  → list memories + DELETE one / clear all
```

## Backend

### Storage

New table `daily_moods` (SQLite via existing `db.py` init):

| column | type | notes |
|--------|------|-------|
| client_id | TEXT | |
| day | TEXT | `YYYY-MM-DD` local or UTC—**pick server local date in Asia/Shanghai or date from client**; recommend **client sends `day` optional, default server UTC+8 calendar date** for kids in CN |
| mood | TEXT | enum ids |
| updated_at | REAL | |
| PRIMARY KEY | (client_id, day) | upsert |

### API

| Method | Path | Body / notes |
|--------|------|----------------|
| GET | `/v1/mood/today` | → `{ day, mood }` or `{ day, mood: null }` |
| PUT | `/v1/mood/today` | `{ mood: "happy"\|... }` → upsert today |
| DELETE | `/v1/profile/memories/{memory_id}` | 404 if missing / wrong client |

Reuse `X-Client-Id` like profile. Errors: Chinese soft copy via existing handlers.

### Prompt injection

Extend `memory.snippet` or chat assembly:

```
今日心情：有点累。可轻轻关心，不要每句提起，不要追问为什么。
```

Only when today's mood is set. No user-visible auto message.

### Memory delete

`memory_repo.delete_memory(client_id, memory_id) -> bool`  
Wire in `api/profile.py`.

## Frontend

| Piece | Role |
|-------|------|
| `api/mood.ts` | GET/PUT today |
| `api/profile.ts` | add `deleteMemory(id)` |
| `components/mood/MoodGate.vue` | 6-choice overlay; emoji/sticker styles; kid-friendly |
| `ChatView` | on bootstrap: fetch mood; show gate if null; chip to reopen change |
| `MemoryView` | today mood row + per-item delete button |

Date: use backend `day` from GET response for consistency after PUT.

## Compatibility

- Old clients without mood: chat works; snippet omits mood.
- Existing memories unchanged; delete is additive.

## Rollback

- Feature-flag unnecessary for MVP: drop routes + UI; table can remain empty.

## Trade-offs

- Gate on `/chat` only (not home): less hero clutter; kids who only use home→welcome still hit gate when they chat.
- Server-defined "today" (UTC+8): avoids device clock skew for CN audience.
