# Design — 陪伴体验内容打磨

## Approach

纯内容/提示词修订，无新 API、无新目录。以 PRD §6.2 与三人设差异化为审阅清单，直接改 markdown + `packs.ts`。

## Touch points

| 文件 | 改什么 |
|------|--------|
| `prompts/companions/nuan.md` | 温柔、鼓励；短句 |
| `prompts/companions/tiao.md` | 活泼、想象游戏 |
| `prompts/companions/cha.md` | 倾听、轻度心事 |
| `frontend/src/content/packs.ts` | label/blurb/seed 润色；可选 +1～2 条 |

## Constraints

- seed 不得命中安全词库硬拦（对照安全用例 miss 集）
- 不引入恋爱/暧昧玩法话术

## Rollback

- 内容文件可独立 revert
