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
| Reset / clear with no visible success copy | User cannot tell archive vs memory-lines were wiped | `settings` confirm → `resetDemo()` + clear success alert（「已清空并恢复默认」）; `memory` clear lines → inline status（昵称/喜好仍保留）+ empty list |
| Hardcode root-relative `css/` / `js/` / `assets/` inside `demo/games/*.html` | Nested pages break styles, store, and brand mark | Use `../css/…`, `../js/…`; rely on `demoRootPrefix()` for injected header links |
| Store game high scores outside `companion_demo_v2` |「重置演示」won't clear them; two sources of truth | Keep scores in `defaults.gameScores` + `submitGameScore` |
| Let `.chat-messages` grow the page (`min-height` only, no locked shell height) | Browser page scrolls forever; composer drifts down | `body:has(.page-chat)` flex column + `.chat-shell`/`messages` `flex:1; min-height:0; overflow:auto` |
| Single default free-chat reply for all unmatched lines | Topic chips feel broken (same line forever) | Match story/sky/space/interest intents; rotate fallbacks |
| Allow send/topic clicks while a bot stream is in flight | Overlapping streams / orphaned typing nodes | `chatBusy` lock + `cancelStream()` on stop/clear/exit |
| 「重置本机档案」只 `removeItem(client_id)` 再 `save`，文案写「刷新后才换标识」 | `save` 已触发新 id，提示与行为不一致；内存里旧 session 仍可能残留 | `resetClientId()` 立刻写入新 id → 清 `sessionId` → `location.reload()` |
| `?session=` 加载失败仍保留旧 `sessionId` / 空白当成功 | 后续发送挂到错误会话；用户以为回看成功 | 失败：人话错误 + `sessionId = null` + 清空消息；加载中明示「正在加载…」 |
| 档案/模式/伙伴 `save` 先改本地再请求，失败时静默 `catch` | UI 显示已切换，服务端未改 | `save` 失败回滚 Pinia；页面用人话提示（`friendlyError`） |
| 「重新生成」只 pop 助手再 `submit` | `onUser` 再 push → 连续两条相同 user | pop 助手 + 末条 user 后再 `submit` |
| Chrome 里切换「朗读这条」后再也读不了 | 旧句 `cancel` 的 interrupted 回调把新朗读 `speaking` 打回 false；`setTimeout(0)` 过早 | 用 speakGen 忽略过期回调；cancel 后 `resume` + ~80ms 再 `speak`；speakingIndex 延后清理 |
| STT 转写不经 composer 另开 API | 旁路安全词库 | 只写入输入框，走现有发送 |
| 语音 `abort()` 不结束 `stop()` 的 Promise | 卸载/取消后逻辑挂起 | `abort` 时 resolve 等待中的 Promise |
| 场景/安全 `?seed=` 不清理 `sessionId` | 新开场白挂到旧会话 | 进聊天前 `sessionId = null`；Chat 对 seed mount 再清消息 |
| `?seed=` 留在地址栏，刷新时 `onMounted` 再清 session 并重发 | 刷新等于新开聊，旧记录「消失」 | 有活跃 session 时优先恢复并去掉 seed；仅无活跃 session 时才发 seed，并发后立刻 `replace` 掉 seed |
| 聊天侧栏换伙伴只改 `companion_id`、不清会话 | 新伙伴气泡里仍是旧对话，人设错位 | 换伙伴后清空消息与 active session；旧线程只从历史进入 |
| 换伙伴后仍 `resolveSessionForCompanion` 自动加载 | 用户以为「没隔离」，看到往日会话 | 切换 = 空白新对话；「新建对话」同理脱离当前 session |
| 会话加载失败（含网络）一律 `sessionId = null` | 一次闪断就丢掉可恢复的会话指针 | 仅 `not_found` 时清除；网络错误保留 `jiuban_active_session` 以便重试 |
| 场景进聊天：`save` 失败仍 `navigate` | 假成功；与写路径可见失败原则冲突 | 失败人话提示并 `return`；成功才跳转 |
