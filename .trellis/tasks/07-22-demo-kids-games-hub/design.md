# Design · Demo 益智小游戏大厅（7 款）

## Boundaries

- **In**：`demo/` 新增大厅与游戏页/脚本/样式；扩展 `store.js`（导航 + 成绩字段 + `resetDemo`）；导览 `index.html` / `demo/README.md` 入口与页数说明。
- **Out**：后端、真模型、外链游戏、音效资源包、SPA `web/`。

## Architecture

```
demo/games.html                 # 大厅
demo/games/<id>.html            # 7 个游玩页
demo/js/games-common.js         # 成绩读写、返回大厅、触控辅助
demo/js/games/<id>.js           # 各游戏逻辑
demo/css/games.css              # 大厅 + 棋盘/画布布局（沿用 cartoon 变量）
demo/js/store.js                # NAV_PRIMARY + defaults.gameScores + resetDemo
```

游戏 id：`snake` | `2048` | `mines` | `gomoku` | `tetris` | `puzzle` | `match3`。

```
games page
  ├─ data-demo-header + store.js（顶栏）
  ├─ 标题 / 本局分 / 最高分 / 重开 / 回大厅
  └─ games-common + games/<id>.js
```

## Contracts

### Navigation

| 项 | 约定 |
|----|------|
| 主栏 | `NAV_PRIMARY` 增加 `["games.html", "游戏"]`（建议放在「聊天」与「安全」之间或「安全」前） |
| Tour | **不**加入 `TOUR_STEPS` |
| 导览 | `index.html` 增加大厅入口；页数文案从 11 调整为含游戏后的实际页数 |

### Scores（`companion_demo_v2.gameScores`）

```js
gameScores: {
  snake: 0,      // 越高越好：吃到食物数或长度衍生分
  "2048": 0,     // 经典分
  mines: 0,      // 胜场或通关得分（越高越好）
  gomoku: 0,     // 对人机胜场
  tetris: 0,     // 消行/经典分
  puzzle: null,  // 最佳步数：越低越好；null = 尚无纪录
  match3: 0,     // 消除得分
}
```

- API（`games-common.js`，经 `DemoStore` 或薄封装）：`getHigh(id)` / `submitScore(id, value)`（按游戏比较规则更新）。
- `defaults` 含空 `gameScores`；`resetDemo()` 全量 `setItem(defaults)`， naturally 清分。
- UI：大厅可显示摘要；游玩页显示「本局 / 纪录」。

### Child-friendly defaults（固定）

| 游戏 | 默认 |
|------|------|
| 贪吃蛇 | 较慢 tick；约 12×12；触控方向键 |
| 2048 | 4×4；滑动 + 键 |
| 扫雷 | 约 8×8、少雷；点开/长按或双按钮区分插旗（移动端：模式切换「挖/旗」） |
| 五子棋 | 约 13×13；玩家黑子先手；简单启发 AI（堵四/活三优先，非强力引擎） |
| 俄罗斯方块 | 较慢下落；标准 7 块；触控左/右/旋/落 |
| 数字拼图 | 3×3 |
| 消消乐 | 约 7×7、3 色起消；点击两格交换；提示可有可无 |

### Page chrome

- 共用顶栏品牌；游戏页另有「回大厅」；结束层温和中文（赢了/再试一次）。
- 尊重 `prefers-reduced-motion`：非必要动画可关。

## Trade-offs

| 选择 | 取 | 舍 |
|------|----|----|
| 每游戏独立 HTML | 与现有多页 Demo 一致、好讲解 | 文件较多 |
| 成绩进同一 store 键 | 重置语义统一 | `companion_demo_v2` 略增字段 |
| 弱 AI 五子棋 | 小孩可独自玩 | 高手可碾压 AI |
| 独立 `games.css` | 不把 `cartoon.css` 撑爆 | 多一个 stylesheet |

## Compatibility / Rollback

- 旧 localStorage 无 `gameScores` 时 load 合并 defaults。
- 回滚：git revert `demo/` 相关提交即可；无服务端迁移。
