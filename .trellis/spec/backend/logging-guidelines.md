# Backend Logging Guidelines

## Levels

| Level | Use |
|-------|-----|
| INFO | Request start/end, mode, companion id, latency |
| WARNING | Safety hits, retries, slow guards |
| ERROR | Upstream failures, unexpected exceptions |

## Must log

- `request_id`, `mode`, `companion_id`, `safety_action` (if any)
- Token usage estimates when available

## Must NOT log

- Full API keys
- Unnecessary raw child PII (school names, addresses) — prefer redaction helpers
- Entire prompt dumps in production INFO

## Safety audit

- Prefer append-only `safety_*.jsonl` or equivalent for block/rewrite events (kids-ai pattern is fine to adapt)

## Forbidden

- `print()` as the only logging strategy in production paths
- Logging complete conversation history at INFO by default
