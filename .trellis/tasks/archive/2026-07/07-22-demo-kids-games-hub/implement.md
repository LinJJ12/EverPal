# Implement · Demo 益智小游戏大厅（7 款）

## Checklist（顺序）

1. **Store / 导航**
   - [ ] `defaults.gameScores` + load 合并；确认 `resetDemo` 清分
   - [ ] `NAV_PRIMARY` 加「游戏」→ `games.html`
   - [ ] 导出成绩读写给游戏页（或由 `games-common` 读同一 KEY，优先走 DemoStore API）

2. **壳与大厅**
   - [ ] `demo/css/games.css`（变量复用 cartoon）
   - [ ] `demo/js/games-common.js`
   - [ ] `demo/games.html` 七入口 + 纪录摘要
   - [ ] `index.html` 入口卡片 + 页数文案；`demo/README.md` 页表更新

3. **游戏实现**（每款：HTML + `js/games/<id>.js`，儿童默认难度，触控，计分/纪录）
   - [ ] `snake` 贪吃蛇
   - [ ] `2048`
   - [ ] `mines` 扫雷
   - [ ] `gomoku` 五子棋（人机）
   - [ ] `tetris` 俄罗斯方块
   - [ ] `puzzle` 数字拼图（3×3，最佳步数）
   - [ ] `match3` 消消乐

4. **收尾自检**
   - [ ] ≤480px 各玩一局关键路径
   - [ ] 破纪录 → 刷新仍在；重置演示后纪录清空
   - [ ] Tour 仍 10 步；无外链游戏

## Validation

```text
# 浏览器打开
demo/index.html → 顶栏「游戏」→ 大厅 → 逐个进入开局/重开
demo/settings.html → 重置演示 → 确认 → 再进大厅看纪录是否清空
# DevTools Console：游戏页无未捕获异常
```

## Risk / Rollback

| 风险 | 缓解 |
|------|------|
| 七款体量大 | 按 checklist 逐款合入；先壳后玩法 |
| 扫雷移动端插旗 | 明确「挖/旗」模式切换，避免误触 |
| AI 过强/过弱 | 固定弱启发式即可，不追求棋力 |
| store 字段残留 | `resetDemo` 必须全量写 defaults |

回滚：还原 `demo/` 与本任务相关文件即可。

## Ready for start

- [x] `prd.md` 已收敛
- [x] `design.md` / `implement.md` 已写
- [ ] 用户审阅通过后执行：`python ./.trellis/scripts/task.py start 07-22-demo-kids-games-hub`
