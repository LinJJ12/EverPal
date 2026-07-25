# `src/content` — 产品静态内容包

官方话题 / 场景 / 短故事开场、伙伴空态开场白等**非 HTTP** 文案与元数据。

- `packs.ts`：话题 / 场景 / 短故事唯一内容源；UI 经 composable / view 读取
- `openers.ts`：伙伴空态开场白
- 禁止把内容常量塞进 `api/` 或散落在多个 view 各写一份
- 故事本期仅为审定开场种子，续写走聊天管线（LLM）
