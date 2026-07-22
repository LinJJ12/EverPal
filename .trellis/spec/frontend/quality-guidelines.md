# Frontend Quality Guidelines

## Must

- Mobile-first layout; chat usable one-handed
- Chinese UI strings; child mode shorter copy / larger type
- Accessible buttons (labels, not icon-only without text for primary actions)
- Stop generation control while streaming

## Forbidden patterns

| Pattern | Why |
|---------|-----|
| Model / API settings in UI | Violates PRD zero-config |
| Romance character entry points | Explicit non-goal |
| Raw `error.message` from fetch in toast | Scary / leaky |
| Porting kids-ai monolith HTML | Unmaintainable |
| Dark tooling aesthetic as default | Product is cartoon companion |

## Error copy examples

- Bad: `Upstream 429 rate_limit_exceeded`
- Good: `现在有点忙，稍后再试一下吧`

## Review checklist

- [ ] No developer controls visible
- [ ] Topic cards on empty chat
- [ ] Mode switch does not look like an admin panel
- [ ] Cartoon theme tokens used (no one-off palette drift)
