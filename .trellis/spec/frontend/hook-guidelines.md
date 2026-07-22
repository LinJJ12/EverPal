# Frontend Hook Guidelines

## Naming

- Custom hooks: `use` + noun/verb (`useChatStream`, `useLocalProfile`, `useCompanions`)
- Return stable object shapes; document loading/error fields

## Planned hooks

| Hook | Responsibility |
|------|----------------|
| `useLocalProfile` | nickname, mode (`child` \| `adult`), selected companion — persisted locally |
| `useSessions` | list/create/rename/delete sessions in local or server anonymous store |
| `useChatStream` | send message, consume SSE/NDJSON, stop generation, surface friendly errors |
| `useTopicCards` | mode-aware starter topics |

## Rules

1. **No API keys in hooks or browser storage** for server-managed keys.
2. Chat hooks must support **stop** mid-stream.
3. On network/API failure, map to Chinese soft copy (see quality guidelines) — never throw raw upstream text into UI.
4. Memory clear must go through an explicit hook/API, not ad-hoc `localStorage.clear()` in components.

## Forbidden

- Hooks that configure LLM base URL / temperature for end users
- Mixing persona prompt assembly into the browser (server owns prompts)
