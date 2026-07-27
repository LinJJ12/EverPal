# `capabilities/wiki`

Server-side encyclopedia tool for `services/chat` (only when request `use_wiki=true`):

| File | Role |
|------|------|
| `intent.py` | Query expansion helpers（产品触发靠 UI 按钮，不靠自动意图） |
| `hosts.py` | Wikipedia HTTPS host/URL allowlist |
| `client.py` | MediaWiki search + extracts |
| `lookup.py` | `maybe_lookup(force=True)` + prompt block + SSE sources |

Do not add a second chat orchestrator here.
