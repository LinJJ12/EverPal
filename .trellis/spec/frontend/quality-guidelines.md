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
- [ ] Chat layout: toggle / extra chrome is **not** a sibling grid item of side+shell (see Mistakes)

## Common Mistakes

| Mistake | Why it breaks | Correct |
|---------|---------------|---------|
| Put mobile 「伙伴/记忆」toggle as a direct child of `.chat-layout` grid | Even with `display:none` risk / media-query visibility, a 3rd grid child can place `.chat-shell` in the narrow column and stretch side links into empty “cards” | Only `aside.chat-side` + `section.chat-shell` as layout children; put the toggle **inside** `.chat-shell`; use `grid-template-areas: "side shell"` |
| Rely on `max-height` on `.chat-messages` without accounting for sticky chrome | Sticky header / pace bar steals viewport; bubbles clip | Prefer flex column on `.chat-shell` + `flex:1; overflow:auto` on messages; avoid brittle `100dvh - fixed` max-heights |
| Put sticky Tour-bar /「第 i/n 步」讲解导航 back into `demo/` | Breaks product-shell UX; meta presenter chrome | Use header nav + in-page CTAs only |
| Show PRD version /「不接真实大模型」/ 讲解时长 in product UI | Reads as internal demo pack | Keep in README / `docs/` only |
| Soft-clear only (delete some keys) for「重置演示」 | Stale fields remain in `companion_demo_v2` | Full replace via `setItem(JSON.stringify(defaults))` after confirm |
| Hardcode root-relative `css/` / `js/` / `assets/` inside `demo/games/*.html` | Nested pages break styles, store, and brand mark | Use `../css/…`, `../js/…`; rely on `demoRootPrefix()` for injected header links |
| Store game high scores outside `companion_demo_v2` |「重置演示」won't clear them; two sources of truth | Keep scores in `defaults.gameScores` + `submitGameScore` |
| `innerHTML` user nickname / memory / history titles | XSS if crafted strings land in localStorage | Use `textContent` or `createElement` |
