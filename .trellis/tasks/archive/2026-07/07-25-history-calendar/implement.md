# Implement: 历史页日历

> Task: `07-25-history-calendar`

## Checklist

1. [x] Backend：日历日切分 helper（东八区 `YYYY-MM-DD`，与 mood 一致）
2. [x] Backend：`history` repo 或 session/mood 查询 — 按月聚合 days；按日列会话
3. [x] Backend：`api/history.py` 挂路由；`app.py` include
4. [x] Backend：单测 — 跨日同会话、仅心情日、空月、无 client_id；API 测在 `tests/api/test_history.py`
5. [x] Frontend：`api/history.ts`（wire 无 UI 依赖）+ `utils/timeCn.ts`
6. [x] Frontend：重写 `HistoryView` 月历 + 日下面板（伙伴 / 删除）；`history.css`
7. [x] Docs：`docs/directory-structure.md` §3 垂直表补 `history`
8. [x] `npm run build` + `pytest`

## Validation

```bash
cd backend && conda run -n chatbot python -m pytest tests -q
cd frontend && npm run build
```

手测：翻月；有聊/有心情/双空/仅心情；点日进会话；删除会话后月历刷新。

**验证（质量复查）：** pytest **52 passed**；frontend **build OK**。

## Risky points

- SQLite 时区：统一用 `domain/time_cn` + SQLite `+8 hours`，避免 UTC 日界偏差。
- 消息量大时按月扫描：MVP 可接受；必要时后期加索引或物化「活跃日」表。

## Rollback

- 前端可回退为长列表 `HistoryView`；新 API 可保留无害。
