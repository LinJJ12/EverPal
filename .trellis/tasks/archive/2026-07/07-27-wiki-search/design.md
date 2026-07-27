# Design: 联网百科（服务端 wiki 工具）

> Task: `07-27-wiki-search`

## Architecture

```text
POST /v1/chat/stream
  → session / meta (现有)
  → check_input  —— block 则直接拒答，不查维基
  → wiki.maybe_lookup(message, force=use_wiki)
       use_wiki? → 查询扩展 → MediaWiki search + extracts（多查询择优）
              → title_covers_topic 硬门控
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
| `intent.py` | 主题抽取（「什么是X」→ X）；「为什么A是B」扩展；停用词；查询列表排序 |
| `client.py` | MediaWiki `list=search` + `prop=extracts`；标题打分；`title_covers_topic` |
| `hosts.py` | Wikipedia HTTPS 主机/URL 白名单 |
| `lookup.py` | `maybe_lookup(force=)`：仅 chat 在 `use_wiki` 时 `force=True`；失败/`None` |

Settings（示例）：`WIKI_ENABLED`（默认 true）、`WIKI_API_BASE`、`WIKI_TIMEOUT_SECONDS`、`WIKI_MAX_CHARS`。

User-Agent：遵守维基礼貌策略（固定产品 UA 字符串）。

## Relevance (wrong source > no source)

| 步骤 | 行为 |
|------|------|
| 主题 | `extract_topic` 剥问句外壳；停用词不可单独作主题 |
| 查询 | 扩展词（如 `天空 蓝色`）排在噪声原句片段前；尝试至多 4 条，按 `score_title_for_query` 择优 |
| 硬门控 | `title_covers_topic`：标题须含主题；单字主题禁止中间夹字假命中（如「性」⊂「急性…」） |
| 失败 | 丢弃摘要与 sources，降级为普通陪伴 |

回归样例：「什么是性？」↛「数学」；「为什么天是蓝的」→「天空」（非影视长标题）。

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

- 在**确定注入摘要之后**的最终 `done` 中带上。
- 未注入则字段省略或 `[]`。

## Frontend

1. `api/chat.ts`：解析事件里的 `sources`。
2. `useChatStream` / 消息类型：助手消息可选 `sources?: { title, url }[]`。
3. `ChatSources.vue`：有 sources 时折叠「查看来源」；`parseChatSources` 仅放行 `*.wikipedia.org` HTTPS。
4. 无 sources：UI 与现网一致。

## Safety

| 阶段 | 行为 |
|------|------|
| 输入 block | 不调用 wiki |
| 标题不相关 | 丢弃摘要，降级 |
| 摘要命中 block/rewrite 词 | 丢弃摘要，降级 |
| 模型输出 | 仍走 `gated_llm_deltas` |
| 外链 | 仅 Wikipedia 主机（服务端构造 URL + 前端白名单，不信模型） |

## Risks

- 维基词条成人向内容 → 摘要词库 + 儿童 system 约束；极端条目可后续加标题黑名单。
- 过严门控 → 偶发无来源但仍有 LLM 回答（可接受）。
- 流式中途无法改 sources → 以 `done` 附着为准。

## Out of scope (design)

- OpenAI `tool_calls`、多跳 Agent、非维基站点、默认展开来源、自动意图触发。
