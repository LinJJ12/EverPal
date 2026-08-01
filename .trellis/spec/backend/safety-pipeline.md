# Backend Safety Pipeline

> Phase-1 approach from PRD: **system prompt constraints + rule lexicon**.
> Optional Phase-2 P2: Aliyun inbound text moderation after lexicon (`MODERATION_*`, default off, fail-open).

## Pipeline order (mandatory)

```text
user message
  → input lexicon check (first — cheap; skip prompt/LLM on hard hit)
      → on hard hit: return soft refusal (do not call LLM)
  → optional moderation.check_input (only if MODERATION_ENABLED + AccessKey)
      → high/medium risk (or attack/sensitive S3–S4): soft refusal
      → timeout / upstream error: log + continue (fail-open)
  → optional wiki lookup (only if request.use_wiki; relevance gate + lexicon on extract; soft-fail skip)
  → build system prompt (mode + companion + memory snippet [+ wiki block])
  → LLM generate with windowed output lexicon gate (safe_stream)
      → flush only lexicon-safe prefixes to the client
      → on hit: keep flushed safe prefix + soft refusal (never send unchecked pending)
  → persist message + safety_action
  → memory extract only if allowed (not on block/rewrite; gate user text again)
  → safety audit jsonl + request_id on logs
  → done SSE may include sources when wiki snippet was injected
```

## Lexicon file contract

```json
{
  "category": "self_harm",
  "mode_scope": ["child", "all"],
  "action": "block",
  "terms": ["…"],
  "reply_template": "…温和中文…"
}
```

| Field | Meaning |
|-------|---------|
| `mode_scope` | Apply to minors (`child`) and/or `all`. Do not add adult-only looser scopes. |
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

## Prompt / lexicon echo

System prompts (`prompts/companions/*`, `prompts/modes/*`) must **not** embed exact block-lexicon substrings (e.g. avoid「恋爱养成」「色情」). Model echo of rule text can trip the outbound gate. Covered by `test_system_prompts_avoid_lexicon_substrings`.

When adding lexicon terms after behavior audits, prefer **longer user-side phrases** from the checklist (e.g.「当你女朋友」「窒息挑战」「偷偷抽烟」「炸药怎么做」). Do **not** add bare short tokens that soft refusals commonly echo (e.g.「火药」「抽烟」「女朋友」「报复」) — those turn good refusals into outbound rewrites. Covered by `test_soft_refusal_echo_not_blocked` / `test_behavior_checklist_lexicon_variants`.

## Profile likes

Free-text likes (max 6 × 12 chars) are normalized in `domain/likes.py` and lexicon-filtered via `safety.sanitize_profile_likes` in **`api/profile`** (and memory like-sync). **`storage/` must not import safety/lexicon** — only persist already-sanitized lists (shape normalize with `domain.likes.normalize_likes` is OK).

## Forbidden

- Log-only safety in production child mode (kids-ai default `SAFETY_LOG_ONLY` must not ship as our default)
- Relying only on the model "being nice" without lexicon
