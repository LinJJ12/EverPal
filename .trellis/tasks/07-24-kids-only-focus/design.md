# Design: 去掉成人模式

## Boundaries

| 层 | 改动 |
|----|------|
| Docs / spec | PRD、diagrams（可简）、product-constraints、backend/frontend 指南中双模式表述 |
| Backend | 枚举、persona、safety 测试、schemas；删除 `adult.md` |
| Frontend | 删/重定向 `/mode`；类型 `Mode`；设置/记忆/场景文案；阿茶 blurb |
| Demo | `mode.html` 入口、store 成人分支、vent 场景、欢迎文案 |

## Mode 字段策略

- **保留** SQLite `profiles.mode` / API `mode`，常量 **`child` only**。
- `Mode` 枚举仅 `CHILD`（或字符串字面量 `"child"`）；传入其它值 → `400` 或强制忽略（推荐：schema `Literal["child"]` 默认 child，非法值校验失败）。
- 不新增年龄段模式开关。

## Prompt

- 删除 `backend/src/prompts/modes/adult.md`。
- 扩展 `child.md`：短句、更严安全；允许轻度心事倾诉（先情绪、再问是否想办法）；引导找家长/老师等信任的大人；禁止恋爱养成与危险教学。
- `persona.build_system` 只加载 child（或 `modes/minors.md` 重命名——可选，非必须；为少 churn 可仍叫 `child.md`）。

## Companions / scenes

- 阿茶 blurb：改为「愿意听你说说心里话的稳重听友」（适龄），去掉「大人树洞」。
- Frontend `public/games/store.js` / demo 同源：删 `vent` 成人场景；成人 fallback 池删除。
- `ScenesView` 不再显示「成人」标签。

## Frontend IA

- 移除 `ModeView` 双选；`/mode` → redirect `/profile` 或删除路由并改欢迎 CTA。
- Nav / settings 去掉模式切换；记忆页去掉「儿童/成人」展示（可改为「未成年人陪伴」或不显示模式）。
- `data-demo-mode` / `data-mode` 仅 child 或移除 adult CSS 分支。

## Safety

- Lexicon `mode_scope`：文档与代码注释改为 `child` / `all`；若有 adult-only 更松规则，删除或升为 child 同级严格。
- 测试：删除「成人可抽烟词」类断言；儿童拦截用例保留并作为唯一基线。

## Compatibility

- 无 adult 历史数据 → 不做迁移。
- 若脏数据偶发 `adult`：`ensure_profile` / `upsert` 写成 `child`（防御一行即可，非正式兼容层）。

## Trade-offs

- 保留 `mode=child` 字段：少破会话/档案合同，二期若要分龄可再扩展。
- 删模式页：减少选择焦虑，符合「打开即适龄」。
