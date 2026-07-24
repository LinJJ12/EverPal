# Frontend Type Safety

## Conventions

- TypeScript strict mode when scaffolding
- Shared DTO types either duplicated thinly or imported from a shared package later — MVP may keep `frontend/src/types`

- Mode: `type Mode = "child"`（minors-only product; no adult）
- Roles: `type MessageRole = 'user' | 'assistant' | 'system'` (system not shown as bubble)

## Example

```ts
// frontend/src/types/index.ts
export type Mode = "child";

export interface Companion {
  id: string;
  name: string;
  role: string;
  blurb: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}
```

## Forbidden

- `any` for message payloads
- Optional `model` / `temperature` on user-facing request types
- `Mode` including `"adult"`
