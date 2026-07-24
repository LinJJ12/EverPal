# Design: 记忆分类增强

## Boundaries

| 层 | 职责 |
|----|------|
| `storage/db.py` + `memory_repo` | schema、迁移、CRUD 带 category |
| `capabilities/memory.py` | 规则提取 → category；snippet 按类排序 |
| `api/profile.py` | 透传 memories（含 category） |
| `frontend` types + `MemoryView` | 展示中文标签 |

不改动：会话表、聊天流式协议字段（除间接经 profile/记忆行为）、档案 likes 数据模型。

## Schema

```sql
-- memories 新增
category TEXT NOT NULL DEFAULT 'preference'
-- 合法值: like | dislike | event | preference
CREATE INDEX IF NOT EXISTS idx_memories_client_cat
  ON memories(client_id, category, created_at DESC);
```

迁移策略（SQLite 无复杂 migration 框架时）：

1. `CREATE TABLE IF NOT EXISTS` 对新库带 `category`。
2. 对已有库：`PRAGMA table_info(memories)`，若缺列则 `ALTER TABLE memories ADD COLUMN category TEXT NOT NULL DEFAULT 'preference'`。
3. 旧数据全部视为 `preference`。

## Contracts

### Memory item（API / store）

```ts
{ id: number; text: string; category: "like"|"dislike"|"event"|"preference"; created_at: number }
```

### `add_memory(client_id, text, *, category="preference", keep=8)`

非法 category → 归一为 `preference`（或明确拒绝；推荐归一以免脏数据打断聊天）。

### Extract markers（MVP 规则，可后续扩展）

| 触发（含子串） | category |
|----------------|----------|
| 我喜欢 / 我爱 | like |
| 我不喜欢 / 我讨厌 | dislike |
| 我叫 / 我的名字是 | preference |
| 今天 / 昨天 +（去了/发生了/参加了）等简易事件标记 | event |

同一轮只写一条；优先级：dislike > like > preference > event（避免「我不喜欢」误入 like）。仍先跑 memory-gate。

### Snippet 顺序

1. 称呼（profile nickname）
2. 档案 likes（`likes_json`）
3. memories：`preference` → `like` → `dislike` → `event`（各类内按时间新→旧，总条数 cap 保持现有 ~5–8）

## Frontend

- `types`：memory 增加 `category`。
- `MemoryView`：标签映射  
  `like→喜欢` / `dislike→不喜欢` / `event→事件` / `preference→偏好`。
- 不做筛选 UI；清除仍调 `DELETE /v1/profile/memories`。

## Compatibility / Rollback

- 向后兼容：缺字段的旧客户端仍可读 `text`。
- 回滚：代码回退即可；多出的 `category` 列可保留无害。
- 不迁 `likes_json`。

## Trade-offs

- 同表 category 优于多表：一期字段同构，查询/清除简单。
- 档案 likes 与 `like` 记忆并存：产品语义不同（主动标签 vs 对话摘要），避免大迁移。
- 规则提取非 LLM：与现状一致，可控、便宜；召回有限可接受。
