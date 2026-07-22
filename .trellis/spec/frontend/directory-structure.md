# Frontend Directory Structure

> Planned layout from `docs/diagrams.md`. Update paths when scaffolding lands.

## Target tree

```text
web/
├── src/
│   ├── pages/                 # Route-level screens only
│   │   ├── welcome/           # First-run: mode + nickname + companion pick
│   │   ├── chat/              # Main companion chat
│   │   └── settings/          # Local-only: mode switch, clear memory
│   ├── components/
│   │   ├── chat/              # Bubble, composer, stop button, topic cards
│   │   ├── companion/         # Avatar, companion picker cards
│   │   └── ui/                # Tiny primitives (Button, Toast) — no design-system bloat
│   ├── themes/
│   │   └── cartoon/           # Phase-1 skin tokens + assets
│   ├── lib/
│   │   ├── storage.ts         # Local profile / sessions (no login)
│   │   ├── api.ts             # SSE/chat client
│   │   └── safety-copy.ts     # Client-side friendly error strings only
│   ├── hooks/
│   └── types/
└── package.json
```

## Placement rules

| Kind | Put it in | Not in |
|------|-----------|--------|
| Full screen flow | `pages/*` | `components/*` |
| Reusable UI tied to chat | `components/chat/*` | `pages/*` |
| Companion persona visuals | `components/companion/*` | Inline in page once reused |
| Skin tokens / CSS vars | `themes/cartoon/*` | Hardcoded hex scattered in components |
| localStorage / IndexedDB | `lib/storage.ts` | Random components |
| Fetch / SSE | `lib/api.ts` | Components calling `fetch` directly |

## Demo HTML notes (current ship surface)

Until `web/` lands, UX ships as `demo/*.html` + `demo/js/store.js` + `demo/css/cartoon.css`.

- **Tour-bar**: `DemoStore.TOUR_STEPS` + `mountTourBar()` under sticky header; skip `index.html`.
- **Full reset**: `DemoStore.resetDemo()` from settings after `confirm`.
- **Mode chrome**: `html[data-demo-mode="child|adult"]` drives `--demo-font-scale`.
- **Chat grid**: two areas only — side | shell; mobile drawer ≤960px.
