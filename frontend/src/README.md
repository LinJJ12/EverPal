# `frontend/src`

```text
views → composables → api → backend
         ↘ stores
```

- `api/`：唯一 HTTP / SSE
- `views/`：一页一目录（含 games / safety）
- `composables/useXxxPage`：页级逻辑
- `stores/`：跨页档案状态
- `themes/cartoon/`：`cartoon.css` + `games.css`（自 demo）
- `public/games/`：七款本地小游戏静态页

禁止：页面裸 `fetch`；前端放置 LLM Key。
