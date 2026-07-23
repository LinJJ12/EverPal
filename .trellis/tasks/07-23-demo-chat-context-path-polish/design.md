# Design · 自由聊上下文 + 路径页视觉统一

## Boundaries

- **In**：`demo/chat.html`（自由聊上下文）；可选将回复助手抽到 `demo/js/store.js`；`demo/css/cartoon.css` 共用 path-stage；`mode` / `nickname` / `companions` / `scenes` HTML。
- **Out**：真模型、状态机剧情树、其余设置/历史大改版。

## Free-chat context

```
sendUser(text)
  → log 已有近轮
  → freeReply(text, { recent: log.slice(-6), nick, mode, likes })
       1. matchSafety
       2. detectFollowUp(recent, text)  // 上一 bot 问句 + 本轮像回答
       3. detectTheme(recent + text)
       4. intent rules (无聊/故事/…) 可参考 theme
       5. themed / rotating fallback
```

### Follow-up heuristics (MVP)

| 上一 bot 线索 | 用户短答特征 | 承接方向 |
|---------------|--------------|----------|
| 种子变成星星/灯笼 | 含星星/灯笼/变 | 续写故事一小段并再问一句 |
| 飞船名字/船长 | 短名、叫…、叫做 | 确认船名并推进一拍 |
| 太阳/月亮 | 太阳/月亮 | 给对应短科普 |
| 听/陪/建议 二选一 | 听|陪|建议|继续|换 | 按选择给一句落地 |

实现：对上一 bot 文本做关键词/问号检测；不引入完整 NLP。

### Theme tags

从 recent 扫：`story` | `sky` | `space` | `interest` | `mood` | `none`。连续同 theme 时 fallback 带主题词。

## Path visual

共享 class（建议）：

- `.path-stage`：复用 welcome-stage 的氛围/圆角/入场（可 alias 或抽公共 `.shell-stage`）
- 页内：标题 + lead + 主交互（choice / tags / grid）+ footer CTAs
- companions / scenes：保留现有卡片网格，外包 stage 或顶区 stage + 下方网格

不改 `:root` 色板与 Baloo/Nunito。

## Trade-offs

| 选择 | 取 | 舍 |
|------|----|----|
| 轻量 log 窗口 | 快、够演示 | 长对话会忘更早内容 |
| 关键词跟进 | 零依赖 | 奇葩短答可能误跟 |
| 四页视觉 | 主路径齐 | 设置/历史仍偏旧 |

## Rollback

静态文件，`git revert` 即可。
