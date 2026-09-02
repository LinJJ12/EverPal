# Frontend Directory Structure

> **Source of truth:** [`docs/directory-structure.md`](../../../docs/directory-structure.md) (v0.8+).  
> App root: **`frontend/`**. HTTP only via `src/api/`. Screens live in `src/views/`.

## Layer mental model

```text
views → composables → api → backend
              ↘ stores
views / composables → components
official topics/scenes/stories → content/packs.ts
like suggestions → content/likes.ts
safety demo seeds → content/safetySamples.ts
voice helpers → utils/voice/*
mood UI constants → components/mood/moodOptions.ts
encyclopedia sources UI → components/chat/ChatSources.vue
```

| Layer | One-liner | Forbidden |
|-------|-----------|-----------|
| `views/` | One screen per folder | Raw `fetch` |
| `composables/` | Page/interaction logic (`useMoodGate` for chat mood; `useChatStream` parses optional `sources`) | Bypass `api` for HTTP |
| `api/` | Sole HTTP client; files align with backend resources | DOM; UI constants; writing global stores; speech keys |
| `content/` | Static packs / openers / like chips / safety samples | HTTP; duplicating copy across views or stuffing into `types/` |
| `stores/` | Cross-page state | Direct HTTP |
| `components/` | Reusable UI (`chat/` includes `ChatSources`; `voice/`, `mood/`) | Route-level business |
| `utils/voice/` | Browser STT/TTS helpers + MediaRecorder + speakProgress | HTTP calls |
| `themes/cartoon/` | Skin tokens (`cartoon.css`, `mood.css`, `chat.css`, …) | Business rules |

## Target tree (summary)

```text
frontend/
├── .env.example               # local `npm run dev` → VITE_API_BASE_URL=http://127.0.0.1:8000
├── .env.production            # `vite build` / Docker → empty base (same-origin via nginx)
├── .env                       # gitignored; never LLM/DashScope keys
├── Dockerfile                 # multi-stage: empty VITE_API_BASE_URL → nginx + deploy/nginx.conf
├── src/
│   ├── api/                   # http, chat, companions, sessions, profile, mood, speech
│   ├── content/               # packs · openers · likes · safetySamples
│   ├── views/                 # home … chat … scenes … memory … games, safety
│   ├── composables/           # useChatPage, useChatStream (+ parseChatSources), useChatSession,
│   │                          # useChatSpeak, useMoodGate, useTopicCards, useSpeech*, …
│   ├── components/{layout,chat,voice,mood,companions}/
│   │                          # chat: Bubble, Composer, TopicCards, ChatSources
│   ├── stores/
│   ├── themes/cartoon/        # cartoon.css + mood.css + chat.css + history.css + games.css
│   ├── types/                 # includes ChatSource
│   └── utils/
│       ├── activeSession / chatSidebar / avatars / clientId / errors / timeCn / gamesMeta
│       └── voice/{browser,companionVoice,mediaRecorder,speakProgress}.ts
└── package.json
```

## Env contract (Docker / production)

| File | When loaded | `VITE_API_BASE_URL` |
|------|-------------|---------------------|
| `.env` / `.env.example` | `npm run dev` | `http://127.0.0.1:8000` |
| `.env.production` | `vite build` (Compose `web` image) | **empty** → browser calls `/v1` on same origin |

**Pitfall**: If production build inherits local `.env` with `:8000`, the Docker single-entry trial breaks (UI hits host port 8000 instead of nginx `:8080`). Keep `.env.production` committed empty; Dockerfile also strips `.env*` before build.

## Vertical API map

See `docs/directory-structure.md` §3 (includes `speech` + `mood`; chat stream may carry wiki `sources`). Change FE+BE+that table in the same PR.

## Demo notes

`demo/` remains the HTML product-shell reference until features are ported. Keep path-stage / no Tour / textContent rules when porting UX.
