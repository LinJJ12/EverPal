# Backend Database / Persistence Guidelines

## MVP storage

| Entity | Storage | Notes |
|--------|---------|--------|
| Anonymous profile | SQLite or local+server anonymous id | `nickname`, `mode`, optional age band |
| Session / Message | SQLite | Include optional `safety_action` |
| Memory items | SQLite | See **Memory categories** below |
| Lexicon | Versioned files under `data/lexicon/` | Hot-reload preferred; not only DB |

## Rules

1. No real user accounts in phase 1 (PRD: no login).
2. Prefer simple schema; migrate to PostgreSQL only when needed (phase 2+).
3. Memory writes go through safety memory-gate rules (discard health/self-harm/PII patterns).
4. Do not store full raw prompts with secrets in message logs.
5. Keep archive `profiles.likes_json` separate from `memories(category=like)` (UI tags vs dialogue extract).

## Naming

- Tables/collections: `snake_case` plural (`sessions`, `messages`, `memories`)
- IDs: string ULIDs/UUIDs

## Forbidden

- Requiring email/phone schema for MVP
- Storing provider API keys in DB rows
- Splitting memory categories into multiple physical tables in phase 1
- Creating indexes that reference columns before those columns exist on legacy DBs

---

## Memory categories (code-spec)

### 1. Scope / Trigger

Applies when creating/altering `memories`, writing extract/snippet logic, or returning profile memories to the client.

### 2. Signatures (DB / repo)

```sql
-- memories.category
category TEXT NOT NULL DEFAULT 'preference'
-- allowed: like | dislike | event | preference
```

```text
memory_repo.normalize_category(category) -> str
memory_repo.add_memory(client_id, text, *, category="preference", keep=8) -> list[dict]
memory_repo.list_memories(client_id, *, limit=8) -> list[dict]
  # each dict: {id, text, category, created_at}
```

`init_db()` must:

1. `CREATE TABLE IF NOT EXISTS` (new DBs include `category`)
2. `_ensure_memories_category`: if table exists without `category`, `ALTER TABLE ... ADD COLUMN ... DEFAULT 'preference'`
3. **Only then** `CREATE INDEX IF NOT EXISTS idx_memories_client_cat ON memories(client_id, category, created_at DESC)`

### 3. Contracts

| Surface | Contract |
|---------|----------|
| Profile API `memories[]` | Each item includes `category` (normalized) |
| Archive likes | Still `profiles.likes_json`; clear memories does **not** clear likes |
| Extract markers | dislike > like > preference > event; gate before write |
| Snippet order | nickname → likes_json → preference → like → dislike → event |

Frontend labels: `like→喜欢` / `dislike→不喜欢` / `event→事件` / `preference→偏好` (unknown → 偏好).

### 4. Validation & Error Matrix

| Input | Behavior |
|-------|----------|
| Unknown category string | Normalize to `preference` (do not fail chat) |
| Empty text / client_id | No insert; return current list |
| Lexicon hit on user text | No memory write |
| Legacy DB missing column | ALTER on init; old rows read as `preference` |

### 5. Good / Base / Bad Cases

| Case | Example | Expect |
|------|---------|--------|
| Good | `我不喜欢菠菜` | `dislike` (not `like`) |
| Good | `今天去了公园` | `event` |
| Base | Legacy row without column | After init → `preference` |
| Bad | Index on `category` inside same `executescript` as CREATE-IF-NOT-EXISTS before ALTER | `OperationalError: no such column: category` on old DBs |

### 6. Tests Required

- Category roundtrip + illegal normalize (`test_storage_persist`)
- Legacy migration ALTER (`test_memories_category_migration`)
- Extract dispatch + dislike-over-like (`test_memory_and_output_gate`)
- Snippet category order
- Profile/API path returns `category` after chat extract

### 7. Wrong vs Correct

| Wrong | Correct |
|-------|---------|
| Put `idx_memories_client_cat` in the initial `_SCHEMA` script before ensure-column | Create that index only after `_ensure_memories_category` |
| Merge archive likes into memories and clear both on “清除记忆条” | Clear `memories` only; keep `likes_json` + nickname |
| Match `我喜欢` before `我不喜欢` | Priority: dislike markers first |
