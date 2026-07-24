# Backend Safety Pipeline

> Phase-1 approach from PRD: **system prompt constraints + rule lexicon** (no third-party moderation API yet).
> Adapt patterns from `vendor/kids-ai/lib/safety_gate.py` (MIT) — do not import that module as a hard dependency.

## Pipeline order (mandatory)

```text
user message
  → input lexicon check (first — cheap; skip prompt/LLM on hard hit)
      → on hard hit: return soft refusal (do not call LLM)
  → build system prompt (mode + companion + memory snippet)
  → LLM generate with windowed output lexicon gate (safe_stream)
      → flush only lexicon-safe prefixes to the client
      → on hit: keep flushed safe prefix + soft refusal (never send unchecked pending)
  → persist message + safety_action
  → memory extract only if allowed (not on block/rewrite; gate user text again)
  → safety audit jsonl + request_id on logs
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

Walkthrough alignment (phase-1): `self_harm` must include at least the phrases used by `SafetyView` / demo samples (e.g. 「伤害自己」「自我伤害」) so product-shell safety demos hit the lexicon, not only the model.

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
