# 陪伴体验内容打磨

## Goal

轻量提升三人设与官方内容包的「好懂、温暖、愿意再聊」，不改变产品边界、不大幅扩量。

## Background

- 提示词：`backend/src/prompts/companions/{nuan,tiao,cha}.md`
- 内容：`frontend/src/content/packs.ts`（TOPIC / SCENE / STORY 已有基础条数）
- 依赖：建议在安全抽检子任务出初版后合并，避免文案与安全结论冲突

## Decisions

| 决策 | 选择 |
|------|------|
| 深度 | **A 轻打磨**：语气校对 + 文案润色 + 少量补缺（1～2 条级），不翻倍扩量 |

## Requirements

1. 校对三人设：可区分、短句适龄、共情优先、危险话题引导找大人、禁止恋爱暧昧
2. 润色现有 topic/scene/story 文案；仅当核心场景明显缺口时少量补条
3. 保持空态话题卡 ≥4；seed 路径仍可进入聊天

## Out of scope

- 新角色、内容翻倍、自定义人设、UI 大改、家长能力

## Acceptance Criteria

- [ ] 三人设与 packs 完成一轮对照 PRD §6.2 的轻量修改并落地
- [ ] 无恋爱导向 / 无成人模式暗示
- [ ] 话题卡 ≥4；场景/故事卡片可点
- [ ] 不与安全基线冲突（不引入必拦 seed）

## Technical notes

- 故事仍为 opener seed + LLM 续写；只改文案不改架构
- 父任务：`07-29-safety-audit-and-polish`
