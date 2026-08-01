# Frontend State Management

## Principles (MVP, no login)

Formal app lives in `frontend/` (Vue + Pinia). Device identity is `jiuban_client_id` via `getClientId()` / `resetClientId()`.

| State | Where | Notes |
|-------|-------|--------|
| Profile (nickname, mode, companionId, likes, memories) | Pinia `useProfileStore` + backend `/v1/profile` | Hydrate on app mount; writes via `save()` |
| Active `sessionId` | Pinia `sessionId` | Synced from chat stream `done` and history `?session=` load |
| Messages (current chat) | Page/composable local ref | Ephemeral until loaded from `/v1/sessions/:id` |
| Streaming draft | `useChatStream` | AbortController; stop/clear cancels |
| Backend reachability | `backendUnreachable` on profile store | Set on hydrate network failure; clear on successful profile fetch/save |

## Rules

1. Profile `mode` is always **`child`** (minors-only product). Do not expose adult/child toggles.
2. Do not sync across devices in MVP (no login).
3. Clearing memory is user-initiated and must call backend + refresh store memories. Memory list items may include `category` (`like` / `dislike` / `event` / `preference`); `MemoryView` shows Chinese labels and falls back to「偏好」. Clear still keeps nickname + archive likes.
4. **Optimistic profile writes must roll back** local Pinia fields if `patchProfile` fails (avoid fake success UI).
5. **「重置本机档案」**: call `resetClientId()` (persist new id immediately), clear local `sessionId` intent (also clears `jiuban_active_session`), then **`location.reload()`**. Do not `removeItem` then `save` while claiming “refresh later”.
6. **History → chat**: loading / success / friendly error. On load failure set `sessionId = null` and clear messages so the next send does not attach to a stale session.
7. **History restore**: on successful `getSession`, apply that session's `companion_id` + `mode` to the store (sync via `save` when possible; on fail keep values locally + `applyModeChrome`) so continue-chat matches the thread.
8. **Seed entry** (scenes / safety `?seed=`): clear `sessionId` (and empty in-memory messages on chat mount) before/when entering — do not append a seeded opener onto a prior thread.
9. **Regenerate**: drop trailing assistant **and** the last user bubble, then `submit` so `onUser` re-adds the user **once** (UI and outbound `history` must not contain consecutive duplicate user turns).
11. **Session isolation**: switching companions starts a **blank** chat (clear messages + active `sessionId`). Before blanking, **save** the leaving companion's current `sessionId` into `jiuban_sessions_by_companion`. Do **not** clear the target companion's mapping, and do **not** auto-load their last thread. Resume via explicit「继续上次」(`getSessionForCompanion` → `loadSessionById`) or history (`?session=`). 「新建对话」clears the *current* companion's mapping + active id (server history kept). While chatting, `rememberSession` keeps the same-companion map entry for refresh recovery.

## Forbidden

- Putting secrets in client state
- Global store for "selected model / temperature"
- Silent `catch` on profile/mode/companion write paths (must show plain Chinese via `friendlyError`)
- Navigating from scenes/safety into chat after a failed profile `save` (show `friendlyError`, stay on page)
