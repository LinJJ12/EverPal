# `capabilities/wiki`

Server-side encyclopedia tool for `services/chat` (only when request `use_wiki=true`):

| File | Role |
|------|------|
| `intent.py` | Topic extract + query expansion + lemma merge |
| `lemma.py` / `lemma_map.json` | Colloquial short asks → search terms |
| `hosts.py` | Wikipedia HTTPS host/URL allowlist |
| `client.py` | MediaWiki search + extracts；`score_title_for_query` / `title_covers_topic` |
| `lookup.py` | `maybe_lookup(force=True)`：多查询择优；标题不相关则 `None`；prompt block + SSE sources |

## Relevance gate

Wrong sources are worse than no sources:

1. Lemma map + expand queries（如「天为啥蓝」→ `天空 蓝色` / `天空`）。
2. Try several queries；keep the best-scoring title.
3. Hard gate `title_covers_topic`.
4. Fail → skip wiki injection（no `sources`）.

Do not add a second chat orchestrator here.
