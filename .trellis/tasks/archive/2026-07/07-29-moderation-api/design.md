# Design: 第三方入站审核（阿里云 query_security_check）

> Task: `07-29-moderation-api`

## Pipeline

```text
user message
  → lexicon check_input
       BLOCK → soft refusal (unchanged)
  → optional moderation.check_input   # NEW; skip if disabled / no AK
       high risk → soft refusal + audit(source=moderation)
       error/timeout → log + continue (fail-open)
  → wiki? → persona → LLM → safe_stream (lexicon only)
```

## Capability layout

```text
capabilities/moderation/
  __init__.py          # re-export check_input / maybe_block
  client.py            # TextModerationPlus HTTP (+ Ak签名或官方SDK薄封装)
  check.py             # map RiskLevel/labels → SafetyHit | None
  README.md
```

编排仍在 `services/chat.py`；不在 api 层直接调阿里云。

## Settings

| Env | Default | Meaning |
|-----|---------|---------|
| `MODERATION_ENABLED` | `false` | 总开关 |
| `MODERATION_ACCESS_KEY_ID` | `` | 阿里云 AK |
| `MODERATION_ACCESS_KEY_SECRET` | `` | 阿里云 SK |
| `MODERATION_ENDPOINT` | `https://green-cip.cn-shanghai.aliyuncs.com` | 可改地域 |
| `MODERATION_SERVICE` | `query_security_check` | 可覆盖 |
| `MODERATION_TIMEOUT_SECONDS` | `2.0` | 短超时，避免拖慢聊天 |

启用条件：`enabled and key_id and key_secret`。

## Mapping

- HTTP `Code != 200` 或异常 → `None`（放行）+ warning log
- `Data.RiskLevel` in `high` / `medium`（可配置，MVP 拦 `high`；`medium` 是否拦写进实现默认：**拦 high+medium**，偏未成年人）→ `SafetyHit(category=label, action=BLOCK, reply=温和模板)`
- `none` / `low` → 放行

拒答文案：复用词库风格短句（固定中文模板，不把阿里云 Advice 原文直接给孩子，避免过硬/过细）。

## Testing

- `respx` / `httpx.MockTransport` 或 monkeypatch client
- Fixtures：high / none / 500 / timeout
- Chat 集成：mock moderation → 断言无 LLM 调用

## Rollback

`MODERATION_ENABLED=false` 或清空 AK。
