# Backend Directory Structure

> **Source of truth:** [`docs/directory-structure.md`](../../../docs/directory-structure.md) (v0.3+, OmniStream-inspired).  
> App root: **`backend/`**. Chat orchestration is thin (`services/chat`); units live in `capabilities/`.

## Layer mental model

```text
api → services/chat (only MVP orchestrator)
        → capabilities/{persona,memory,safety,llm}
            → storage + domain + config + prompts + data/lexicon
LLM client: config/llm only
lib: logging + exceptions whitelist — no business dump
```

| Layer | One-liner | Forbidden |
|-------|-----------|-----------|
| `api/` | HTTP shape → call service/capability | Lexicon details; create LLM client |
| `services/chat.py` | Fixed chat pipeline order | Prompt prose; lexicon implementation |
| `capabilities/*` | Single reusable units | Second chat orchestrator; agent loop |
| `storage/` | Persistence only | LLM calls |
| `domain/` | Enums / pure rules | I/O; read env |
| `config/` | Settings + LLM factory | Business orchestration |
| `lib/` | Cross-cutting utils | Companion domain concepts |

## Target tree (summary)

```text
backend/
├── .env.example / .env
├── main.py
├── data/                      # runtime DB (gitignore contents)
├── resource/                  # logs/cache/tmp
├── src/
│   ├── api/{health,chat,companions,sessions,profile}.py
│   ├── services/chat.py
│   ├── capabilities/{persona,memory,safety,llm}.py
│   ├── prompts/{modes,companions,safety}/
│   ├── data/lexicon/
│   ├── storage/
│   ├── domain/
│   ├── config/
│   ├── schemas/
│   └── lib/
└── tests/{unit,api,fixtures}/
```

## Hard rules

1. Do not put LLM keys outside `backend/.env`.
2. Do not invent `pipeline/` / `agent/` until a real multi-step Job or tool-loop is scheduled (OmniStream has them; 玖伴 MVP does not need empty shells).
3. Prefer extending existing layers over new top-level folders.

Safety order: see `safety-pipeline.md` and `docs/directory-structure.md` §5.1.
