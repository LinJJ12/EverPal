# `capabilities/moderation`

Optional **inbound** Aliyun AI Guardrails text check for `services/chat`
(after local lexicon, before wiki/LLM).

| File | Role |
|------|------|
| `acs3.py` | ACS3-HMAC-SHA256 request signing |
| `client.py` | `TextModerationPlus` HTTP (`query_security_check`) |
| `check.py` | Map `RiskLevel` / attack / sensitive → `SafetyHit` |

## Behaviour

- Default off: `MODERATION_ENABLED=false`
- Needs AccessKey id+secret (not `DASHSCOPE_API_KEY`)
- Fail-open on timeout / non-200 / sign errors
- Soft refusal copy is product-owned (not raw Aliyun Advice)

Do not add a second chat orchestrator here.
