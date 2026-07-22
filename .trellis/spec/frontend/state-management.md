# Frontend State Management

## Principles (MVP, no login)

| State | Where | Notes |
|-------|-------|--------|
| Profile (nickname, mode, companionId) | Local persistence (`lib/storage`) | Survives refresh; device-bound |
| Active session + messages | Local and/or anonymous server session | Must survive refresh on same device |
| Streaming draft assistant text | React state in chat page/hook | Ephemeral |
| Server memories | Server only; UI may show/clear | Do not duplicate full memory graph in Redux-like stores |

## Rules

1. Prefer **React state + small storage module** over heavy global stores until complexity forces it.
2. Mode (`child` / `adult`) is **global profile state**, not per-message.
3. Do not sync across devices in MVP (no login).
4. Clearing memory is user-initiated and must call backend + clear local caches.

## Forbidden

- Putting secrets in client state
- Global store for "selected model / temperature"
