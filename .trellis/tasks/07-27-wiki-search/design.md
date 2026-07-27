# Design: 联网百科（服务端 wiki 工具）

> Task: `07-27-wiki-search`

## Architecture

```text
POST /v1/chat/stream
  → session / meta (现有)
  → check_input  —— block 则直接拒答，不查维基
  → wiki.maybe_lookup(message)
       intent? → MediaWiki opensearch + extracts
              → lexicon filter on extract
              → { snippet, sources[] } | None
  → build_system(+ optional「百科摘要：…」块)
  → LLM stream + gated_llm_deltas
  → done(+ sources if used)
```

编排仍只在 `services/chat.py`。`capabilities/wiki` 是可调用工具，不是第二编排器。

## Wiki capability

| 模块 | 职责 |
|------|------|
| `intent.py` | 启发式：含「为什么/是什么/什么是/谁发明/多少」等且非纯情绪闲聊；可排除过短句 |
| `client.py` | `https://zh.wikipedia.org/w/api.php`：`action=opensearch` 取标题 → `prop=extracts&exintro&explaintext` 取导言；超时可配 |
| `wiki.py` | `maybe_lookup()` 编排上述步骤；失败返回 `None` |

Settings（示例）：`WIKI_ENABLED`（默认 true）、`WIKI_API_BASE`、`WIKI_TIMEOUT_SECONDS`、`WIKI_MAX_CHARS`。

User-Agent：遵守维基礼貌策略（固定产品 UA 字符串）。

## Prompt injection

成功时在 system 末尾追加短块，例如：

```text
【百科摘要·仅供参考】
标题：…
摘要：…
请用伙伴口吻、短句向小朋友解释；不要编造摘要外的具体数据；不要输出 Markdown 链接。
```

来源 URL 只走 SSE，不依赖模型输出链接。

## SSE contract

现有事件：`meta` / `delta` / `done`。

扩展（可选字段，向后兼容）：

```json
{
  "sources": [
    { "title": "天空", "url": "https://zh.wikipedia.org/wiki/天空" }
  ]
}
```

- 在**确定注入摘要之后**的 `meta` 或最终 `done` 中带上（推荐 `done` + 前端在流结束时挂到该条助手消息；若希望更早展示可同时在第二次 `meta` 带）。
- 未注入则字段省略或 `[]`。

## Frontend

1. `api/chat.ts`：解析事件里的 `sources`。
2. `useChatStream` / 消息类型：助手消息可选 `sources?: { title, url }[]`。
3. `ChatView`（或气泡组件）：有 sources 时渲染 `<details>`/折叠「查看来源」；内链 `a[target=_blank rel=noopener noreferrer]`。
4. 无 sources：UI 与现网一致。

## Safety

| 阶段 | 行为 |
|------|------|
| 输入 block | 不调用 wiki |
| 摘要命中 block/rewrite 词 | 丢弃摘要，降级 |
| 模型输出 | 仍走 `gated_llm_deltas` |
| 外链 | 仅 zh.wikipedia.org 主机（客户端构造 URL，不信模型） |

## Risks

- 意图误触发 → 略增延迟；用窄规则 + 超时短（如 2–3s）缓解。
- 维基词条成人向内容 → 摘要词库 + 儿童 system 约束；极端条目可后续加标题黑名单。
- 流式中途无法改 sources → 以 `done` 附着为准。

## Out of scope (design)

- OpenAI `tool_calls`、多跳 Agent、非维基站点、默认展开来源。
