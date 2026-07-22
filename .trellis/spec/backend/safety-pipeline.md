# Backend Safety Pipeline

> Phase-1 approach from PRD: **system prompt constraints + rule lexicon** (no third-party moderation API yet).
> Adapt patterns from `vendor/kids-ai/lib/safety_gate.py` (MIT) — do not import that module as a hard dependency.

## Pipeline order (mandatory)

```text
user message
  → build system prompt (mode + companion + memory snippet)
  → input lexicon check
      → on hard hit: return soft refusal (do not call LLM)
  → stream LLM
  → output lexicon check (buffer or post-chunk policy)
      → on hit: rewrite/replace with safe Chinese copy
  → persist message + safety_action
  → async memory extract (only if allowed)
```

## Lexicon file contract

```json
{
  "category": "self_harm",
  "mode_scope": ["child", "adult", "all"],
  "action": "block",
  "terms": ["…"],
  "reply_template": "…温和中文…"
}
```

| Field | Meaning |
|-------|---------|
| `mode_scope` | Which modes apply |
| `action` | `block` \| `rewrite` \| `watch` |
| `terms` | Substrings or regexes (document which) |

## Mode differences

| | Child | Adult |
|--|-------|-------|
| Lexicon | Strictest | Standard harm filters |
| Prompt | Short sentences, shallow topics | Empathy-first venting allowed |
| Romance | Always forbidden | Always forbidden (no dating roles) |

## Soft refusal requirements

- No scolding; no graphic detail
- For crisis topics: comfort + encourage talking to a trusted adult (and appropriate hotline guidance when applicable)
- Never ask for address / school full name / ID numbers

## Forbidden

- Log-only safety in production child mode (kids-ai default `SAFETY_LOG_ONLY` must not ship as our default)
- Relying only on the model "being nice" without lexicon
