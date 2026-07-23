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

1. Mode (`child` / `adult`) is **global profile state**, not per-message.
2. Do not sync across devices in MVP (no login).
3. Clearing memory is user-initiated and must call backend + refresh store memories.
4. **Optimistic profile writes must roll back** local Pinia fields if `patchProfile` fails (avoid fake success UI).
5. **「重置本机档案」**: call `resetClientId()` (persist new id immediately), clear local `sessionId` intent, then **`location.reload()`**. Do not `removeItem` then `save` while claiming “refresh later”.
6. **History → chat**: loading / success / friendly error. On load failure set `sessionId = null` and clear messages so the next send does not attach to a stale session.

## Forbidden

- Putting secrets in client state
- Global store for "selected model / temperature"
- Silent `catch` on profile/mode/companion write paths (must show plain Chinese via `friendlyError`)
