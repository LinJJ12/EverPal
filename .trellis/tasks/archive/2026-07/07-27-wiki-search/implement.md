# Implement: 联网百科

> Task: `07-27-wiki-search`

## Checklist

1. [x] Settings + `.env.example`：`WIKI_*`
2. [x] `capabilities/wiki/`：查询扩展、hosts 白名单、MediaWiki、`maybe_lookup(force=)`
3. [x] `services/chat.py`：仅 `use_wiki` 时检索；注入 system；`done.sources`
4. [x] 单元测试：`use_wiki` 门闸、白名单、filter、chat 集成、相关性回归
5. [x] 前端：「百科」按钮、SSE sources、`ChatSources` 折叠 UI、regen/重置
6. [x] 相关性硬化：主题抽取、多查询择优、`title_covers_topic`；错配丢弃
7. [x] 文档：PRD v0.5.6、directory-structure v0.10、dev-setup、wiki README、task design/prd
8. [x] `frontend` build + `backend` pytest 全量通过；`wiki_relevance_smoke.py` 通过

## Validation

```bash
cd backend && pytest tests/unit -q
cd backend && python scripts/wiki_relevance_smoke.py   # needs network
cd frontend && npm run build
```

## Rollback

`WIKI_ENABLED=false`；或前端不传 `use_wiki`。
