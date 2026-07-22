# 玖伴 · 界面 Demo（纯 HTML）

**品牌暂定**：玖伴 — 九久相伴，永远有人回应。  
**图标**：`assets/brand/logo.png`（透明底）。

纯 HTML **产品壳**演示（非讲解 Tour），**不接真实大模型**。状态在本机 `localStorage`（键名 `companion_demo_v2`）。设置页「重置演示」可清空档案与游戏纪录；儿童模式字号略大于成人（`data-demo-mode`）。顶栏「游戏」进入益智大厅。

## 打开

浏览器打开 `demo/index.html`。

## 产品壳要点

- **首页** `index.html`：全幅品牌首屏（`.shell-hero`）+ 能力清单 + 探索入口；无 PRD / 时长 / Tour 元信息。
- **欢迎** `welcome.html`：当前伙伴头像、记忆线索、「接下来可以…」入口。
- **导航**：仅产品顶栏（`NAV_PRIMARY` / `NAV_MORE`）；**无** Tour-bar / 讲解步进。
- **文案**：用户可见口吻为产品用户向；开发对照见文末 PRD 链接。

## 页面一览（12 + 7 款游戏）

| 页面 | 用途 |
|------|------|
| `index.html` | 产品首页（品牌全幅首屏 + 能力 + 入口） |
| `welcome.html` | 欢迎 / 回访招呼 + 下一步入口 |
| `mode.html` | 儿童 / 成人模式 |
| `nickname.html` | 昵称 + 喜好标签 |
| `companions.html` | 小暖 / 跳跳 / 阿茶 |
| `scenes.html` | 六大场景入口 |
| `chat.html` | 自由聊；`?scene=` 播情境；`?session=` 回看历史 |
| `games.html` | 益智小游戏大厅（7 款入口 + 本机纪录） |
| `memory.html` | 记忆面板 |
| `history.html` | 已保存会话 |
| `safety-demo.html` | 安全词库可交互试玩 |
| `settings.html` | 本地设置（无模型配置；「重置演示」） |

### 益智小游戏（`games/`）

| 页面 | 游戏 |
|------|------|
| `games/snake.html` | 贪吃蛇 |
| `games/2048.html` | 2048 |
| `games/mines.html` | 扫雷 |
| `games/gomoku.html` | 五子棋（人机） |
| `games/tetris.html` | 俄罗斯方块 |
| `games/puzzle.html` | 数字拼图 3×3 |
| `games/match3.html` | 消消乐 |

共享逻辑：`js/store.js` · `js/games-common.js` · 样式：`css/cartoon.css` · `css/games.css`。成绩字段 `gameScores`，随「重置演示」清空。

## 情境对话（6）

| id | 标题 | 模式 |
|----|------|------|
| `bored` | 今天好无聊 | 儿童 |
| `why-blue` | 为什么天是蓝的 | 儿童 |
| `pretend` | 假想太空 | 儿童 |
| `vent` | 成人树洞 | 成人 |
| `memory` | 记得恐龙 | 儿童（会种子喜好） |
| `safety` | 安全拦截 | 儿童 |

深链示例：`chat.html?scene=safety` 会自动套用该场景的模式与角色。

## 自检清单

- [ ] 顶栏品牌为「玖伴」且图标无黑底方块  
- [ ] 首页全幅品牌首屏可读；无 PRD /「不接大模型」/ 讲解时长类 UI 文案  
- [ ] 任意页无 Tour-bar /「第 i/n 步」  
- [ ] 欢迎页可见当前伙伴与下一步入口  
- [ ] 场景 →「下一句」可完整播完一支剧本（含分支）  
- [ ] 自动慢放时不会叠出多条机器人气泡  
- [ ] 安全页输入「怎么做烟花爆炸」等可命中温和拒答  
- [ ] 保存对话后可在「历史」回看  
- [ ] 设置页「重置演示」确认后清空档案与游戏纪录  
- [ ] 顶栏「游戏」可进大厅；七款均可开局/重开  

## 开发对照

产品需求见仓库根目录 [`docs/PRD.md`](../docs/PRD.md) v0.4 · 第 15 节（仅开发者文档，不出现在产品 UI）。
