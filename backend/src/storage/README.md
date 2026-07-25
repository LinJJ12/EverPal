# `backend/src/storage`

Persistence only (SQLite via `db.py` + `*_repo.py`).

- Own tables / queries / upserts
- Do not call LLM or DashScope
- Pure mood id/label rules live in `domain/moods.py` (repos may import them)
- History calendar aggregations: `history_repo.py` (message-day + daily_moods; CN day via SQLite `+8 hours`)
