# Implement: 安全故事库与官方话题包

> Task: `07-25-safe-stories-topics`

## Checklist

1. [x] 新增 `frontend/src/content/packs.ts`（topics ≥4、scenes ≥4、stories ≥3）
2. [x] `useTopicCards.ts`：从 packs 取话题；ChatView 仅空态显示
3. [x] `useChatPage` 去掉内联 TOPICS，改用 composable
4. [x] `ScenesView`：场景 + 短故事两组；统一从 packs 读
5. [x] `avatars.ts`：SCENE_CARDS 改为从 packs 派生（re-export）
6. [x] 文档：`directory-structure` / `frontend/src/README` / 根 README / PRD §4.2
7. [x] `npm run typecheck` + `npm run build`；packs 计数校验（5/4/4）；无散落硬编码话题

## Validation

```bash
cd frontend && npm run build
```

手测（联调时）：
- 新会话空态 ≥4 话题 → 点一条 → 卡消失 → 有回复
- `/scenes` 点短故事 → 心情门闸通过后自动发出开场句

## Risky points

- seed bootstrap 与心情门闸顺序：须门闸通过后再 bootstrap（沿用现有 `useMoodGate` 延后逻辑）
- 故事开场文案须避免敏感词触发词库误拦

## Rollback

- 回退 `content/packs` 与 Chat/Scenes 接线；可暂恢复硬编码常量
