# PRD: 游戏大厅新增多款小游戏

> Task: `07-25-games-four-new`

## Goal

在 `/games` 大厅扩展本地离线小游戏，并理顺注册结构便于维护。

## Delivered games

| id | 名称 | 成绩 |
|----|------|------|
| `breakout` | 打砖块 | 分（越高越好） |
| `flip` | 记忆翻牌 | 步（越少越好） |
| `guess` | 猜数字 | 最少次数（越少越好） |
| `tictactoe` | 井字棋 | 胜场 |
| `maze` | 走迷宫 | 步（越少越好） |

大厅现为 **12 款**（含原有 7 款）。

## Structure（维护）

- Vue 列表：`frontend/src/utils/gamesMeta.ts`
- 静态页：`frontend/public/games/{id}.html` + `js/{id}.js`
- META / 记分：`games-common.js`、`store.js`
- 检查清单：`frontend/public/games/README.md`
- 冒烟：`cd frontend && npm run test:games`

## Acceptance

- [x] 大厅展示 12 款入口（`GAME_META.length`）
- [x] 新游戏可玩、可回大厅、可记本机成绩
- [x] `npm run test:games` 通过
- [x] `npm run build` 通过
- [x] 文档已更新（根 README / directory-structure / public/games README / demo 注明落后）
