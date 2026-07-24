# Frontend Directory Structure

> **Source of truth:** [`docs/directory-structure.md`](../../../docs/directory-structure.md) (v0.3+, OmniStream-inspired layers).  
> App root: **`frontend/`**. HTTP only via `src/api/`. Screens live in `src/views/`.

## Layer mental model

```text
views → composables → api → backend
              ↘ stores
views / composables → components
```

| Layer | One-liner | Forbidden |
|-------|-----------|-----------|
| `views/` | One screen per folder | Raw `fetch` |
| `composables/` | Page/interaction logic | Bypass `api` for HTTP |
| `api/` | Sole HTTP client; files align with backend resources | DOM; writing global stores |
| `stores/` | Cross-page state | Direct HTTP |
| `composables/` | Page/interaction logic; name `useXxxPage` to match `views/<name>` | Bypass `api` for HTTP |
| `components/` | Reusable UI | Route-level business |
| `themes/cartoon/` | Skin tokens | Business rules |

## Target tree (summary)

```text
frontend/
├── .env.example               # VITE_API_BASE_URL only
├── .env                       # gitignored; never LLM keys
├── src/
│   ├── api/                   # http, chat, companions, sessions, profile
│   ├── views/                 # home, welcome, profile, companions,
│   │                          # scenes, chat, history, memory, settings,
│   │                          # games, safety  (/mode redirects; no ModeView)
│   ├── composables/           # useChatPage, useChatStream,
│   │                          # useSpeechRecognition, useSpeechSynthesis
│   ├── components/{layout,chat,voice,companions}/
│   ├── stores/
│   ├── themes/cartoon/
│   ├── types/
│   └── utils/                 # includes speech.ts helpers
└── package.json
```

## Vertical API map

See `docs/directory-structure.md` §3. Change FE+BE+that table in the same PR.

## Demo notes

`demo/` remains the HTML product-shell reference until `frontend/` ships. Keep path-stage / no Tour / textContent rules from prior demos when porting UX.
