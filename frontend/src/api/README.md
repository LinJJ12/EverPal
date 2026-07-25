# `src/api` — 唯一 HTTP 层

对齐 backend：`chat` / `companions` / `profile` / `sessions` / `speech` / `mood`。  
禁止在 views/composables 内直接 `fetch`（本目录除外）。

| 文件 | 后端 |
|------|------|
| `mood.ts` | `GET\|PUT /v1/mood/today`（仅 HTTP；UI 常量见 `components/mood/moodOptions.ts`） |
