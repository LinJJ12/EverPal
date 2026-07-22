# Backend Error Handling

## Principles

1. Upstream LLM failures → **502/503** with **sanitized** body for clients.
2. Safety blocks are **not** 500s: return a normal assistant-style soft refusal (200 stream or JSON) with `safety_action=block|rewrite`.
3. Validation errors → 400 with stable `code` field.

## Client-facing shape (planned)

```json
{
  "error": {
    "code": "upstream_unavailable",
    "message": "现在有点忙，稍后再试一下吧"
  }
}
```

## Mapping

| Internal | HTTP | User message |
|----------|------|--------------|
| Missing messages | 400 | 请先说点什么再发送 |
| Lexicon hard block | 200 + soft reply | Soft redirect / comfort copy |
| LLM timeout | 503 | 现在有点忙，稍后再试一下吧 |
| Invalid mode | 400 | 模式不正确 |

## Forbidden

- Returning Anthropic/OpenAI raw error payloads to the browser
- Raising uncaught exceptions past the chat orchestrator
