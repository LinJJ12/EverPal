# Frontend Directory Structure

> **Source of truth:** [`docs/directory-structure.md`](../../../docs/directory-structure.md) (v0.3+, OmniStream-inspired layers).  
> App root: **`frontend/`**. HTTP only via `src/api/`. Screens live in `src/views/`.

## Layer mental model

```text
views → composables → api → backend
              ↘ stores
views / composables → components
official topics/scenes/stories → content/packs.ts
voice helpers → utils/voice/*
mood UI constants → components/mood/moodOptions.ts
```

| Layer | One-liner | Forbidden |
|-------|-----------|-----------|
| `views/` | One screen per folder | Raw `fetch` |
| `composables/` | Page/interaction logic (`useMoodGate` for chat mood) | Bypass `api` for HTTP |
| `api/` | Sole HTTP client; files align with backend resources | DOM; UI constants; writing global stores; speech keys |
| `content/` | Static topic / scene / story packs | HTTP; duplicating copy across views |
| `stores/` | Cross-page state | Direct HTTP |
| `components/` | Reusable UI (`voice/`, `mood/` gate+sticker+options) | Route-level business |
| `utils/voice/` | Browser STT/TTS helpers + MediaRecorder + speakProgress | HTTP calls |
| `themes/cartoon/` | Skin tokens (`cartoon.css`, `mood.css`, `games.css`) | Business rules |

## Target tree (summary)

```text
frontend/
├── .env.example               # VITE_API_BASE_URL only
├── .env                       # gitignored; never LLM/DashScope keys
├── src/
│   ├── api/                   # http, chat, companions, sessions, profile, mood, speech
│   ├── content/               # packs.ts — topics / scenes / stories
│   ├── views/                 # home … chat … scenes … memory … games, safety
│   ├── composables/           # useChatPage, useChatStream, useChatSession, useChatSpeak,
│   │                          # useMoodGate, useTopicCards, useSpeechRecognition, …
│   ├── components/{layout,chat,voice,mood,companions}/
│   ├── stores/
│   ├── themes/cartoon/        # cartoon.css + mood.css + chat.css + games.css
│   ├── types/
│   └── utils/
│       └── voice/{browser,companionVoice,mediaRecorder,speakProgress}.ts
└── package.json
```

## Vertical API map

See `docs/directory-structure.md` §3 (includes `speech` + `mood`). Change FE+BE+that table in the same PR.

## Demo notes

`demo/` remains the HTML product-shell reference until features are ported. Keep path-stage / no Tour / textContent rules when porting UX.
