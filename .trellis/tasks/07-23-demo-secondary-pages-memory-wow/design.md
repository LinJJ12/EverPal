# Design · 其余页视觉 + 记忆感知（A）

## Boundaries

- **In**：`memory.html` / `history.html` / `safety-demo.html` / `settings.html`；`cartoon.css` 复用 path-stage；`chat.html` 顶栏/侧栏/空状态文案微调；清除/重置反馈文案。
- **Out**：改 `freeReply` 喜好策略；真模型；换肤。

## Path visual

四页结构对齐 onboarding：

```html
<main class="page page-path">
  <section class="path-stage shell-stage">
    <div class="path-stage-glow shell-stage-glow"></div>
    <h1>…</h1>
    <p class="lead">…</p>
    <div class="path-stage-body">…现有卡片/列表…</div>
    <div class="shell-hero-actions footer-actions">…</div>
  </section>
</main>
```

settings 去掉「无登录」chip（或改为 lead 一句）；主按钮可用 `btn-lg`。

## Memory chrome (chat)

- `refreshChrome`：无喜好时副文案仍点名昵称；有喜好时保持「记得你喜欢…」。
- `seedGreeting`：确保 empty hint + opener 在有档案时点名（已有 opener 则补 hint）。
- 侧栏：昵称行始终可读；喜好标签为空时温和引导去档案。

## Clear / reset feedback

- memory `clearMem`：confirm（可选）或直接清 + `#clearHint` 显示「已清除记忆条，昵称与喜好仍保留」数秒。
- settings reset：保留 confirm；成功 alert 文案固定清晰；`refresh()` 后 summary 显示空档。

## Rollback

静态文件 revert 即可。
