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

Until `web/` lands, UX ships as `demo/*.html` + `demo/js/store.js` + `demo/css/cartoon.css` as a **product shell** (not a presenter Tour pack).

- **Home**: `index.html` uses full-bleed `.shell-hero` (brand-dominant first viewport) + benefit list + explore hub; keep existing cartoon color tokens / font families unless a task explicitly changes them.
- **Welcome**: `welcome.html` shows current companion avatar, optional memory chips, and next-step hub links.
- **No Tour-bar**: do **not** add `TOUR_STEPS` / `mountTourBar`; navigation is `NAV_PRIMARY` + `NAV_MORE` + page CTAs only.
- **Copy**: no user-visible PRD version, 「讲解」, timing tips, or 「不接真实大模型」; developer notes stay in README / `docs/`.
- **Full reset**: settings「重置演示」→ `confirm` → `DemoStore.resetDemo()` must rewrite full `defaults` (includes `gameScores`).
- **Mode chrome**: `html[data-demo-mode="child|adult"]` drives `--demo-font-scale`.
- **Chat grid**: two areas only — side | shell; mobile drawer ≤960px.
- **Kids games**: hub `demo/games.html` + play pages `demo/games/<id>.html`; shared `demo/js/games-common.js`, `demo/js/games/<id>.js`, `demo/css/games.css`.
- **Nav**: `NAV_PRIMARY` includes「游戏」→ `games.html`.
- **Scores**: `companion_demo_v2.gameScores` via `getGameHigh` / `submitGameScore` (puzzle is lower-better / `null` = no record).
- **Nested paths**: pages under `demo/games/` must use `../` for css/js/assets; `DemoStore.demoRootPrefix()` prefixes injected nav/favicon.
- **Chat layout**: `body:has(.page-chat)` is a flex column filling the viewport; `.chat-shell` stretches; `.chat-messages` is the only scrolling pane (`flex:1; min-height:0; overflow:auto`). Do not let bubbles grow document height.
- **Free chat**: local heuristic replies in `chat.html` (`freeReply`) — expand intent matches for topic chips; never rely on one default line. Guard concurrent sends with a busy lock and `cancelStream()` on stop/clear/exit.
- **User text in DOM**: prefer `textContent` / `createElement` for nickname, memory lines, and history titles (avoid raw `innerHTML` with user data).
