# Design: 安全故事库与官方话题包

> Task: `07-25-safe-stories-topics`

## Architecture

```text
frontend/src/content/packs.ts     # 唯一内容源
  ├─ topics[]  → useTopicCards → TopicCards（空态）
  ├─ scenes[]  → ScenesView 场景分组
  └─ stories[] → ScenesView 短故事分组 → /chat?seed=
                      └─ useChatSession.bootstrapChat → submit(seed)
```

不改 `POST /v1/chat/stream`；故事续写仍为人设 + 儿童提示 + 词库。

## Content shape

```ts
type PackKind = "topic" | "scene" | "story";

interface PackItem {
  id: string;
  kind: PackKind;
  label: string;       // 卡片标题 / chip 文案
  seed: string;        // 发进聊天的用户首句
  blurb?: string;      // 场景/故事副文案
  companion_id?: string;
  theme?: string;
}
```

话题 chip 用 `{ label, text: seed }` 适配现有 `TopicCards`。

## UI

- **Chat**：`messages.length === 0 && !streaming` 时渲染 `TopicCards`。
- **Scenes**：两段标题——「一起玩场景」「安全短故事」；故事卡点击逻辑复用 `enter`（save companion → clear session → seed）。

## Trade-offs

| 选择 | 利 | 弊 |
|------|----|----|
| 前端静态包 | 快、零 API | 改文案需发版 |
| seed + LLM | 复用管线 | 故事每次略有不同（靠开场锚定） |
| 故事挂场景页 | 无新路由 | 场景页略长 |

## Compatibility

- 删除 `useChatPage` / `avatars.SCENE_CARDS` 内联重复；`avatars` 可 re-export 过渡或直接改 import。
- Demo 文案可参考，不强制同步 demo。
