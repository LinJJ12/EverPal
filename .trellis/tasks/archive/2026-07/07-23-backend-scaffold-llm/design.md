# Design — backend scaffold

## Call graph

```text
POST /v1/chat/stream
  → api/chat
  → services/chat.run_chat_stream
       → capabilities.persona.build_system
       → capabilities.memory.snippet (optional empty)
       → capabilities.safety.check_input
       → capabilities.llm.stream (or soft refusal)
       → capabilities.safety.filter_output_chunk / finalize
       → storage (optional persist)
```

## Stream protocol

SSE events:

- `event: meta` — `{companion_id, mode, safety_action?}`
- `event: delta` — `{text}`
- `event: done` — `{safety_action}`
- `event: error` — `{code, message}` 人话

Safety hard block: still 200 SSE with full soft refusal as deltas (or single delta), `safety_action=block`.

## Config keys

见 `backend/.env.example`（`LLM_*` / `HOST` / `PORT` / `CORS_ORIGINS` / `DATABASE_URL`）。
