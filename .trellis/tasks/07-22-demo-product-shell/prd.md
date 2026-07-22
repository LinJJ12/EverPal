# Demo 去讲解感 · 产品级展示面

## Goal

把纯 HTML `demo/` 从「内部讲解稿 / PRD 对照包」改成可对外展示的**温暖陪伴产品壳**：去掉讲解元信息与 Tour，升级首页与主路径的信息层级/留白/动效秩序；保留玖伴品牌与现有卡通色板、字体族；不接真实大模型，不迁正式 SPA。

## Background

- 交付面：`demo/*.html` + `demo/js/store.js` + `demo/css/cartoon.css`；状态键 `companion_demo_v2`。
- 产品硬规则（`.trellis/spec/frontend/index.md`）：mobile-first 卡通陪伴 UI；无登录；对用户隐藏模型配置。
- 现状痛点：`demo-banner`、各页「对应 PRD… / 讲解备忘」、Tour-bar（`mountTourBar` + `TOUR_STEPS`）、时长与「不接大模型」措辞、首页「讲解用」分区。
- 并行：`07-22-demo-kids-games-hub` 正交，须共享顶栏/token；`07-22-demo-frontend-polish` 与本任务冲突，**归档且不并入**其非 Tour 增强项（另开跟进）。

## Decisions

| 决策 | 结论 |
|------|------|
| 视觉标尺 | 温暖陪伴产品壳；借鉴企业级前端完成度，禁止 Admin Dashboard |
| 技术边界 | 纯 HTML `demo/`；不接真模型；不迁 `web/` |
| Tour | 完全移除 Tour-bar / 讲解步进 UI |
| 视觉深度 | 文案后追加 **可见跃迁 A**：首页全幅品牌首屏 + 全局 chrome；路径页统一气质；**不换**色板与字体族 |
| 旧 polish | 归档；不吸收重置确认 / 记忆 wow / 头像加强等 |

## Requirements

- **R-copy-clean**：所有用户可见 `demo/*.html`（及场景动态文案）去掉 PRD 版本、讲解时长、「不接大模型」、Tour/讲解备忘、`对应 PRD…`、`PRD ·` 标签等内部元信息；改为产品用户口吻。开发者向 `README.md` / `demo/README.md` 可保留技术说明，不出现在产品 UI。
- **R-no-tour**：移除 Tour-bar UI 与启动时挂载；删除或停用 `mountTourBar` 调用与相关 CSS；`TOUR_STEPS` 不再驱动任何用户可见导航（可删或仅留内部注释级常量，默认删除更干净）。
- **R-home-shell**：`index.html` 首屏为**全幅品牌构图**（品牌名主导 + 一句主张 + CTA 组 + 主导视觉），一眼可辨产品壳；非 chip/讲义/双栏侧注旧骨架。
- **R-path-copy**：`welcome` / `mode` / `nickname` / `companions` / `scenes` / `chat` / `memory` / `history` / `safety-demo` / `settings` 及游戏相关页的标题与 lead 统一产品口吻；场景卡去掉 `PRD ·` 展示。
- **R-layout-polish**：全局顶栏/按钮/间距氛围升级；≥2 处有意动效；尊重 `prefers-reduced-motion`；不引入侧栏控制台布局。
- **R-brand**：保留玖伴 logo、现有主色与 Baloo/Nunito 字体族。
- **R-compat**：模式、档案、角色、场景「下一句」、聊天、记忆、历史、安全、设置、游戏仍可走通；`companion_demo_v2` 读写与现有重置不无故破坏。

## Out of scope

- 真实大模型 / BFF、登录、家长面板、语音
- `web/` SPA / React/Vue 引入
- 换字体族或主色板
- 旧 polish：Tour 流畅度、重置确认增强、记忆 wow、SVG 头像加强、窄屏抽屉（除非本任务改文案时顺手不破坏现有行为）
- 改 `docs/PRD.md` 正文
- 把「不接大模型」从仓库根 README 技术说明中强制删光（UI 禁止即可）

## Acceptance Criteria

- [x] AC1：`demo/index.html` 与主路径页无 PRD 版本号 / 8–12 分钟 /「不接真实大模型」类用户可见措辞与 `demo-banner`
- [x] AC2：各页 lead / 标题 / 标签为产品口吻；无「对应 PRD」「讲解用」「讲解备忘」；场景无 `PRD ·` 标签
- [x] AC3：任意页无 Tour-bar /「第 i/n 步」讲解导航；store 启动不再挂载 Tour
- [x] AC4：首页首屏为全幅品牌构图（相对旧双栏+chip 骨架有明显视觉跃迁）；品牌主导；未改色板/字体族
- [x] AC5：约 ≤480px 宽可完成核心路径；无登录、无模型配置 UI
- [x] AC6：游戏大厅与主壳共享顶栏/token，无讲解 Tour 文案残留
- [x] AC7：`07-22-demo-frontend-polish` 已归档（`--no-commit` 除非用户另要求提交）
