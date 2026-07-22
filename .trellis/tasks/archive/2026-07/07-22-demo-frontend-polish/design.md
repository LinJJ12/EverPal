# Design · 完善前端 Demo 讲解体验

## Boundaries

- **In**：仅改 `demo/`（主要 `js/store.js`、`css/cartoon.css`，以及 settings / chat / companions / 必要时各页 class）。
- **Out**：后端、真流式、新框架、新图片资源管线。

## Architecture

```
mountHeader()
    └─ site-header (existing)
    └─ tour-bar (new, if page ∈ TOUR_STEPS)

DemoStore
    ├─ TOUR_STEPS[]          // path order + labels
    ├─ resetDemo()           // write defaults, clear key semantics
    ├─ avatarSvg(id)         // richer faces
    ├─ applyModeChrome()     // data-mode + font scale
    ├─ companionOpener()     // memory-aware opening line (new/extend)
    └─ welcomeGreeting()     // keep / minor tune
```

## Contracts

### Tour-bar

| 字段 | 说明 |
|------|------|
| `TOUR_STEPS` | 对齐 index 01–10：`welcome` → `mode` → `nickname` → `companions` → `scenes` → `chat` → `memory` → `history` → `safety-demo` → `settings` |
| 渲染条件 | 当前文件名 ∈ TOUR_STEPS；`index.html` 不挂细条（导览本身已是总览） |
| UI | 左：`第 i/n 步 · 标题`；右：`下一步：标题`（末步显示「完成 · 回导览」→ `index.html`） |
| 场景带参 | `chat.html?scene=` 仍算 chat 步 |

### Full reset

- API：`DemoStore.resetDemo()` → `localStorage` 写回与 `defaults` 等价的干净状态（或 `removeItem` 后依赖 load 合并；推荐显式 `setItem(JSON.stringify(defaults))` 以免旧字段残留）。
- UI：设置页主按钮文案改为「重置演示」；`confirm` 后再执行；成功后 `refresh()` + 简短提示。
- 兼容：替换现有无确认 `clearBtn` 行为，避免两套清除语义。

### Memory-wow

- 保留 `welcomeGreeting()`。
- 新增或扩展：`companionOpener(companion)` / chat 空状态文案：有昵称则点名；有喜好则提 1 个标签；无则用角色 `sample`。
- 写入点：`companions.html` 开场白展示；`chat.html` 无消息时的首条 bot 或空状态引导。

### Avatars

- 仍返回 inline SVG 字符串；同 viewBox；用发型/腮红/道具区分三角色，色板保持现有 `.avatar.nuan|tiao|cha` 渐变。

### Mobile chat

- `≤720px`（或现有断点）：`.chat-side` 默认折叠；提供「伙伴/记忆」开关按钮打开抽屉/面板；主区全宽。

### Mode typography

- `html[data-demo-mode="child|adult"]` 由 `store` 在 load/header 时设置。
- CSS：`--demo-font-scale` 儿童 > 成人（例如 1.12 vs 1.0），作用于 `.page-chat` / 气泡 / 输入框。

### Motion

1. 新气泡 `animation: bubble-in …`（短、可 `prefers-reduced-motion: reduce` 关闭）。
2. 场景「下一句」出现时轻过渡或打字光标闪烁（复用/轻改 `streamText`）。
3. 可选第三处：Tour-bar 步进时短高亮（非必须）。

## Trade-offs

| 选择 | 取 | 舍 |
|------|----|----|
| Tour-bar 仅路径页 | 少打扰 | index 无细条（可接受） |
| Full + confirm | 换人干净 | 误触需多点一次 |
| SVG 加强非 PNG | 零资源依赖 | 精致度上限 |

## Rollback

- 改动集中在 demo 静态文件；git revert 即可。无迁移、无服务端状态。
- `resetDemo` 仅影响本机 `companion_demo_v2`。
