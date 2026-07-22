# Implement · 完善前端 Demo 讲解体验

## Checklist（建议顺序）

1. **Store 基建**
   - [ ] 定义 `TOUR_STEPS`；`mountTourBar()` 并由 `mountHeader` 或 DOM ready 调用
   - [ ] 实现 `resetDemo()`；导出 `KEY` 已有则沿用
   - [ ] 加强 `avatarSvg()` 三角色差异
   - [ ] `applyModeChrome()`：`data-demo-mode` + 切换时更新
   - [ ] `companionOpener()`（或等价）供欢迎以外页面用

2. **CSS**
   - [ ] `.tour-bar` 样式（细、不抢 hero）
   - [ ] 儿童/成人字号 token
   - [ ] 聊天侧栏窄屏抽屉
   - [ ] `bubble-in` + `prefers-reduced-motion`

3. **页面接线**
   - [ ] `settings.html`：重置确认 + 调用 `resetDemo`
   - [ ] `companions.html`：展示 memory-aware 开场；用加强头像
   - [ ] `chat.html`：空状态/首条引用记忆；窄屏侧栏开关；气泡动效；场景下一句轻过渡

4. **文档**
   - [ ] `demo/README.md` 补一句：Tour-bar、重置演示、儿童字号

5. **自测（浏览器）**
   - [ ] 走完 10 步 Tour-bar「下一步」链路
   - [ ] Full 重置后欢迎页回到「开箱」文案
   - [ ] 昵称+喜好后欢迎与 chat/companions 有引用
   - [ ] 三头像可辨；手机宽度可发送
   - [ ] 模式切换字号变化；动效在 reduce 下可关

## Validation

```bash
# 静态检查：无构建；用浏览器打开
# demo/index.html → welcome → … → settings
# DevTools 窄屏 + localStorage 键 companion_demo_v2
```

无自动化单测要求（纯 HTML demo）。质量门：对照 `prd.md` AC1–AC7 + `trellis-check`。

## Risky files

| 文件 | 风险 |
|------|------|
| `demo/js/store.js` | 集中逻辑；Tour/reset/avatar 易互相干扰 |
| `demo/css/cartoon.css` | 断点与 chat 布局回归 |
| `demo/chat.html` | 场景播放与空状态文案冲突 |

## Rollback points

- 每完成 checklist 一大步可停；不需要中间 commit 除非用户要求。
- 若 Tour-bar 与现有 `demo-banner` 冲突：优先保留 banner，Tour-bar 更矮。

## Before `task.py start`

- [x] `prd.md` 收敛
- [x] `design.md` / `implement.md`
- [ ] 用户审阅通过
- [x] `implement.jsonl` / `check.jsonl` 真实条目
