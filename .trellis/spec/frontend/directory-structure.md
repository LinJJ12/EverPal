# Frontend Directory Structure

> **Source of truth:** [`docs/directory-structure.md`](../../../docs/directory-structure.md) (v0.3+, OmniStream-inspired layers).  
> App root: **`frontend/`**. HTTP only via `src/api/`. Screens live in `src/views/`.

## Layer mental model

```text
views → composables → api → backend
              ↘ stores
views / composables → components
voice helpers → utils/voice/*
```

| Layer | One-liner | Forbidden |
|-------|-----------|-----------|
| `views/` | One screen per folder | Raw `fetch` |
| `composables/` | Page/interaction logic | Bypass `api` for HTTP |
| `api/` | Sole HTTP client; files align with backend resources | DOM; writing global stores; speech keys |
| `stores/` | Cross-page state | Direct HTTP |
| `components/` | Reusable UI (`voice/` for talk button) | Route-level business |
| `utils/voice/` | Browser STT/TTS helpers + MediaRecorder | HTTP calls |
| `themes/cartoon/` | Skin tokens | Business rules |

## Target tree (summary)

```text
frontend/
├── .env.example               # VITE_API_BASE_URL only
├── .env                       # gitignored; never LLM/DashScope keys
├── src/
│   ├── api/                   # http, chat, companions, sessions, profile, speech
│   ├── views/                 # home … chat … games, safety
│   ├── composables/           # useChatPage, useChatStream,
│   │                          # useSpeechRecognition, useSpeechSynthesis
│   ├── components/{layout,chat,voice,companions}/
│   ├── stores/
│   ├── themes/cartoon/
│   ├── types/
│   └── utils/
│       └── voice/{browser,companionVoice,mediaRecorder}.ts
└── package.json
```

## Vertical API map

See `docs/directory-structure.md` §3 (includes `speech`). Change FE+BE+that table in the same PR.

## Demo notes

`demo/` remains the HTML product-shell reference until features are ported. Keep path-stage / no Tour / textContent rules when porting UX.
