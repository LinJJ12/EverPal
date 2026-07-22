# Design · Demo 产品壳（去讲解感）

## Boundaries

- **In**：`demo/**/*.html` 用户文案与首页信息架构；`demo/js/store.js`（Tour 拆除）；`demo/css/cartoon.css`（去 Tour/banner 样式、布局秩序与克制动效）；必要时轻改 `demo/js` 中注入文案。
- **Out**：框架迁移、换肤 token、真模型、旧 polish 体验增强项、改 `docs/PRD.md`。

## Architecture

```
mountHeader()          // 保留产品顶栏
mountTourBar()         // 删除调用与实现（或空实现后删除）
TOUR_STEPS             // 删除；导航仅靠 NAV_* + 页内 CTA

index.html             // 产品壳首屏 + 能力/入口区（非讲义）
path pages             // lead/标题产品口吻
scenes render          // 去掉 prd-tag 展示（数据字段可保留在 store 供内部）
cartoon.css            // 去 .tour-bar / .demo-banner；微调间距与动效
```

## Copy contract

| 禁止（用户可见） | 替换方向 |
|------------------|----------|
| 对照 PRD / v0.x / 演示包时长 | 删除或改为产品价值句 |
| 不接真实大模型 | UI 删除；README 可留技术说明 |
| 对应 PRD「…」/ 讲解备忘 / 讲解用 | 功能说明（用户收益） |
| PRD · 场景标签 | 场景主题短标签或删除 |
| 第 i/n 步 · Tour 下一步 | 无；用顶栏与页内按钮 |

## Home IA

1. **Hero**：logo +「玖伴」+ tagline + 一句 lead + 主 CTA（开始陪伴 / 去聊天）+ 次 CTA（选伙伴或场景，产品口吻）。
2. **能力区**：原「产品原则（讲解用）」→ 3–5 条用户收益（陪伴、安全、记得你…），无「原则 N / 非目标」讲义编号。
3. **入口区**：原「推荐演示顺序」→「去探索」式入口网格；去掉「约 N 分钟」「★ 重点讲解」；游戏入口保留但无 Tour 旁注。

## Layout / motion

- 保持 `:root` 色板与 `--font-display` / `--font-body`。
- 统一 `.page` 最大宽、section 间距、按钮组节奏；弱化过密 `stat-row` 若显得讲义（可改为更轻的能力摘要或删除）。
- 动效：hero 轻入场 + 卡片/气泡既有过渡中至少 2 处可感知且尊重 `prefers-reduced-motion`。

## Compatibility

- `companion_demo_v2` schema 不强制迁移；场景对象若含 `prd` 字段可保留于 JS，仅 UI 不渲染。
- 游戏页路径前缀 `demoRootPrefix()` 不变。
- 顶栏 `NAV_PRIMARY` / `NAV_MORE` 保留；文案若含「演示」可改为中性产品词。

## Trade-offs

| 选择 | 取 | 舍 |
|------|----|----|
| 删 Tour 而非弱引导 | 对外最干净 | 新人少一条强制路径 |
| 不换色板 | 成本可控、与游戏一致 | 气质跃迁有限 |
| 不并 polish 增强 | 范围清晰 | 重置确认/头像等另开 |

## Rollback

- 静态文件改动，`git revert` 即可；无服务端状态。
- 归档 polish 任务可用 archive 记录回溯，与代码回滚独立。
