# 去掉成人模式，专注儿童与初中生

## Goal

产品只服务 **18 岁以下**（以小学生、初中生为主）：删除成人模式与成人向入口/文案，统一未成年人安全与语气；保留轻量「可以说说心事」，不做成人树洞模式。

## Background

- 现有双模式：`Mode.CHILD` / `Mode.ADULT`，模式页、demo、`adult.md`、场景 `vent`、伙伴阿茶「大人树洞」文案等。
- 本环境未使用过 `adult` 数据，可硬删。
- 一期仍无登录、无家长同意（二期）。

## Decisions

| 决策 | 选择 |
|------|------|
| 小学/初中分档 | 不做；统一未成年人体验 |
| 改动表面 | frontend + backend + docs/PRD + `.trellis/spec` + `demo/` |
| `adult` | 硬删除，无兼容归一 |
| 心事倾诉 | 写入未成年人提示词（共情+引导找信任的大人）；删除成人树洞模式/场景 |

## Requirements

- **R1 产品定位**：PRD / product-constraints 受众改为未成年人；去掉成人模式 P0、成人皮肤/树洞验收项。
- **R2 UI**：移除模式二选一页与导航入口；欢迎流改走档案/伙伴；界面不再出现「成人模式」。
- **R3 Backend**：删除 `Mode.ADULT`、`prompts/modes/adult.md`；聊天/档案不再接受成人模式；词库/测试去掉 adult 分支；`child.md` 并入轻度倾诉指引。
- **R4 文案**：阿茶等「大人树洞」改为适龄听友；demo 场景去掉成人 `vent`；CSS/徽章 adult 样式可删或失活。
- **R5 demo**：与正式产品同口径（无成人开关）。
- **R6 `mode` 字段**：DB/API 可保留恒为 `child`（少迁表），或逐步淡出；禁止 `adult` 值。

## Acceptance Criteria

- [x] AC1：前端与 demo 无法选择或展示成人模式。
- [x] AC2：后端无 `adult` 模式提示词路径；相关单测通过且不再断言成人更松安全。
- [x] AC3：统一未成年人提示词含轻度倾诉边界（先共情、引导真人、禁止危险细节）。
- [x] AC4：PRD 与 product-constraints 受众/模式描述已更新。
- [x] AC5：伙伴/场景文案无「大人树洞」「成人」产品入口表述。

## Out of scope

- 家长同意、宵禁、登录、第二套皮肤
- 小学/初中双档模式
- adult→child 数据迁移层
