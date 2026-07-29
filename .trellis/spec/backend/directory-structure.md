# Backend Directory Structure

> **Source of truth:** [`docs/directory-structure.md`](../../../docs/directory-structure.md) (v0.3+, OmniStream-inspired).  
> App root: **`backend/`**. Chat orchestration is thin (`services/chat`); units live in `capabilities/`.

## Layer mental model

```text
api → services/chat (only MVP orchestrator)
        → capabilities/{persona,memory,safety,llm,wiki,speech}
            → storage + domain + config + prompts + data/lexicon
LLM client: config/llm only
Speech client: capabilities/speech/client.py (DashScope; not LLM)
Wiki client: capabilities/wiki/client.py (MediaWiki; allowlisted hosts)
lib: logging + exceptions whitelist — no business dump
```

| Layer | One-liner | Forbidden |
|-------|-----------|-----------|
| `api/` | HTTP shape → call service/capability | Lexicon details; create LLM/DashScope clients |
| `services/chat.py` | Fixed chat pipeline order | Prompt prose; lexicon implementation |
| `capabilities/*` | Single reusable units | Second chat orchestrator; agent loop |
| `capabilities/wiki/` | Intent/query expand + MediaWiki extract + relevance gate + host allowlist | Open-web search; second orchestrator; attach irrelevant sources |
| `capabilities/moderation/` | Optional Aliyun inbound TextModerationPlus after lexicon | Replace lexicon; fail-closed by default; DashScope sk as AK |
| `capabilities/speech/` | Package (tts/asr/client) — only multi-file capability | Empty shells; keys outside Settings |
| `storage/` | Persistence only | LLM / speech upstream calls; pure enum tables |
| `domain/` | Enums / pure rules (`moods.py`) | I/O; read env |
| `config/` | Settings + LLM factory | Business orchestration |
| `schemas/` | Request/response DTOs (`mood.py` included) | Upstream SDK types |
| `lib/` | Cross-cutting utils | Companion domain concepts |

## Target tree (summary)

```text
backend/
├── .env.example / .env
├── main.py
├── data/
├── resource/
├── src/
│   ├── api/{health,chat,companions,sessions,profile,mood,speech}.py
│   ├── services/chat.py
│   ├── capabilities/{persona,memory,safety,llm,safe_stream}.py
│   ├── capabilities/wiki/{intent,hosts,client,lookup}.py
│   ├── capabilities/speech/{client,tts,asr}.py
│   ├── schemas/{chat,companion,speech,mood}.py
│   ├── prompts/{modes,companions,safety}/
│   ├── data/lexicon/
│   ├── storage/{db,profile_repo,session_repo,memory_repo,mood_repo}.py
│   ├── domain/{enums,moods}.py
│   ├── config/
│   └── lib/
└── tests/{unit,api,fixtures}/
```

## Hard rules

1. Do not put LLM / DashScope keys outside `backend/.env`.
2. Do not invent `pipeline/` / `agent/` until a real multi-step Job or tool-loop is scheduled.
3. Prefer extending existing layers over new top-level folders.
4. Keep `capabilities/speech` as a **package** (TTS+ASR share client); other capabilities may stay single-file until they grow.

Safety order: see `safety-pipeline.md` and `docs/directory-structure.md` §5.1.
