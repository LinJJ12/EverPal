# Implement · Demo 产品壳

## Checklist

1. **归档冲突任务**：`python ./.trellis/scripts/task.py archive 07-22-demo-frontend-polish --no-commit`（用户批准 start 后或批准本清单时执行）。
2. **拆 Tour**：`store.js` 删除 `TOUR_STEPS` / `mountTourBar` / 导出与 `DOMContentLoaded` 调用；`cartoon.css` 删除 `.tour-bar*`；全文搜索确认无残留挂载。
3. **首页壳**：重写 `demo/index.html`（去 banner、讲义分区、分钟标注）；hero + 能力 + 入口；CTA 产品口吻。
4. **路径页文案**：依次改 `welcome` `mode` `nickname` `companions` `scenes` `chat` `memory` `history` `safety-demo` `settings`；去掉讲解备忘块；`scenes`/`chat` 去掉 `PRD ·` 展示。
5. **游戏相关**：`games.html` 与各游戏页扫讲解/Tour 旁注；保持顶栏一致。
6. **布局秩序**：在 `cartoon.css` 微调首页/通用 section 间距与动效（不改色板/字体族变量值）。
7. **自检**：浏览器打开 index → 主路径与游戏大厅；grep `讲解|对应 PRD|demo-banner|tour-bar|不接真实|8–12` 于 `demo/**/*.{html,js,css}` 应为空或仅非 UI 注释。
8. **质量**：按 Trellis check 跑一轮（spec / 文案 / 窄屏目视）。

## Validation

```text
# 静态残留扫描（PowerShell）
rg -n "讲解|对应 PRD|demo-banner|tour-bar|不接真实|8–12|PRD ·" demo --glob "*.{html,js,css}"

# 手工
# 打开 demo/index.html → 欢迎 → 模式 → … → 设置；再进游戏大厅
# ≤480px 宽确认顶栏与主 CTA 可用
```

## Risk / rollback

- 高风险文件：`demo/js/store.js`、`demo/index.html`、`demo/css/cartoon.css`。
- 回滚：还原上述文件；Tour 删除若需临时恢复可从 git 取回 `mountTourBar` 块。

## Before `task.py start`

- [x] `prd.md` 已收敛
- [x] `design.md` / `implement.md` 已写
- [x] `implement.jsonl` / `check.jsonl` 已有真实 spec 条目
- [ ] 用户审阅本规划并同意开始实现
