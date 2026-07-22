# Backend Directory Structure

> Planned from `docs/diagrams.md`.

```text
server/
├── src/
│   ├── routes/                 # HTTP only: parse → call service → respond
│   │   ├── chat.py             # POST stream completions
│   │   ├── sessions.py
│   │   ├── companions.py
│   │   └── health.py
│   ├── services/
│   │   ├── persona.py          # Load companion + child/adult system prompts
│   │   ├── memory.py           # Profile memories / snippets (inspired by kids-ai)
│   │   ├── safety.py           # Lexicon + prompt constraints
│   │   ├── llm.py              # OpenAI-compatible streaming client
│   │   └── chat.py             # Orchestrates the pipeline
│   ├── prompts/
│   │   ├── modes/              # child.md / adult.md
│   │   └── companions/         # per-role overlays
│   ├── data/
│   │   └── lexicon/            # JSON/YAML rule packs by category + mode_scope
│   ├── store/                  # SQLite or file adapters
│   └── main.py
├── tests/
└── package.json / pyproject.toml
```

## Placement rules

| Kind | Location |
|------|----------|
| Route handlers | `routes/*` — no prompt assembly here |
| Pipeline orchestration | `services/chat.py` |
| Lexicon matching | `services/safety.py` + `data/lexicon/*` |
| Companion definitions | `prompts/companions/*` (+ optional DB later) |
| Reference-only upstream | `vendor/kids-ai/*` — never import as runtime dependency |

## Forbidden

- Single 2k-line `server.py` god file (kids-ai pattern)
- Importing Discord relay / invention_engine from kids-ai
- Exposing `/api/admin/models` to the public web app in MVP
