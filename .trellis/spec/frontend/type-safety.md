# Frontend Type Safety

## Conventions

- TypeScript strict mode when scaffolding
- Shared DTO types either duplicated thinly or imported from a shared package later — MVP may keep `frontend/src/types/chat.ts`

- Mode union: `type UserMode = 'child' | 'adult'`
- Roles: `type MessageRole = 'user' | 'assistant' | 'system'` (system not shown as bubble)

## Example

```ts
// frontend/src/types/chat.ts
export type UserMode = 'child' | 'adult';

export interface Companion {
  id: string;
  name: string;
  avatarUrl: string;
  blurb: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  safetyAction?: 'pass' | 'block' | 'rewrite';
}
```

## Forbidden

- `any` for message payloads
- Optional `model` / `temperature` on user-facing request types
