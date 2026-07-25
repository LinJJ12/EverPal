# `public/games` — 本地益智小游戏（静态页）

产品大厅在 Vue：`/games` → `src/views/games/GamesView.vue`。  
对局页**不进** Vue 壳，由 Vite 直接提供本目录静态资源。

## 目录约定

```text
public/games/
├── README.md                 # 本说明
├── cartoon.css               # 独立皮肤副本（勿依赖 src/themes 路径）
├── games.css                 # 大厅卡 + 棋盘/画布布局
├── store.js                  # localStorage 成绩（companion_demo_v2.gameScores）
├── games-common.js           # META + GamesCommon 辅助
├── {id}.html                 # 一局一页
└── js/{id}.js                # 一局一脚本（IIFE，const ID = "{id}"）
```

维护脚本（**不在** public，避免被当成站点资源）：

```text
frontend/scripts/games/
├── smoke-check.mjs           # 注册/文件/语法/记分对齐
└── playtest-logic.mjs        # 核心规则冒烟
```

```bash
node frontend/scripts/games/smoke-check.mjs
node frontend/scripts/games/playtest-logic.mjs
```

## 新增一款游戏（检查清单）

对同一 `id`（小写 ASCII，与文件名一致）同步改这几处：

1. `src/utils/gamesMeta.ts` — Vue 大厅卡片  
2. `games-common.js` → `META`（含 `unit` / `lowerBetter?`）  
3. `store.js` → `defaults.gameScores`；若「越小越好」再加 `GAME_LOWER_BETTER`  
4. `{id}.html` + `js/{id}.js`  
5. 需要时补 `games.css` 专用样式  
6. 跑上面两条 smoke / playtest  

**不要**把游戏列表塞进 `avatars.ts`。  
**不要**用 `memory` 作 id（与 `/memory` 记忆页混淆）。

## 与 demo 的关系

`demo/games/` 是早期对照副本，**可能落后于**本目录。以 `frontend/public/games/` + `gamesMeta.ts` 为准。
