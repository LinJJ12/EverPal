# `capabilities/wiki`

Server-side encyclopedia tool for `services/chat` (only when request `use_wiki=true`):

| File | Role |
|------|------|
| `intent.py` | Topic extract + query expansion（产品触发靠 UI 按钮，不靠自动意图） |
| `hosts.py` | Wikipedia HTTPS host/URL allowlist |
| `client.py` | MediaWiki search + extracts；`score_title_for_query` / `title_covers_topic` |
| `lookup.py` | `maybe_lookup(force=True)`：多查询择优；标题不相关则 `None`；prompt block + SSE sources |

## Relevance gate

Wrong sources are worse than no sources. After MediaWiki returns a page:

1. Expand queries（如「为什么天是蓝的」→ `天空 蓝色` / `天空` 优先于原句片段）。
2. Try several queries；keep the best-scoring title.
3. Hard gate `title_covers_topic`（剥「什么是…」外壳；停用词；单字主题更严）。
4. Fail → skip wiki injection（no `sources`），fall back to plain companion reply.

Regression:「什么是性？」不得挂「数学」；「为什么天是蓝的」应优先「天空」。

Do not add a second chat orchestrator here.
