"""Map Aliyun moderation Data → SafetyHit (or None to continue)."""

from __future__ import annotations

from src.capabilities.moderation.client import fetch_moderation_data
from src.capabilities.safety import SafetyHit
from src.config.settings import Settings, get_settings
from src.domain.enums import SafetyAction
from src.lib.logging import get_logger

log = get_logger("capabilities.moderation")

_SOFT_REPLY = "这个话题我们换一个聊聊吧，我陪你说点更合适的事。"


def hit_from_data(data: dict, *, block_levels: frozenset[str]) -> SafetyHit | None:
    """Pure mapper — used by tests without HTTP."""
    if not data:
        return None

    risk = str(data.get("RiskLevel") or "none").strip().lower()
    attack = str(data.get("AttackLevel") or "none").strip().lower()
    sensitive = str(data.get("SensitiveLevel") or "S0").strip().upper()

    levels = block_levels or frozenset({"high", "medium"})
    block = risk in levels or attack in levels
    # PII-like sensitive tiers: always treat as block for minors product.
    if sensitive in ("S3", "S4"):
        block = True

    if not block:
        return None

    label = "moderation"
    results = data.get("Result") or []
    if isinstance(results, list) and results:
        first = results[0] if isinstance(results[0], dict) else {}
        label = str(first.get("Label") or label)
    advice = data.get("Advice") or []
    if isinstance(advice, list) and advice and isinstance(advice[0], dict):
        hit_label = advice[0].get("HitLabel")
        if hit_label:
            label = str(hit_label)

    return SafetyHit(
        category=f"moderation:{label}"[:80],
        action=SafetyAction.BLOCK,
        reply=_SOFT_REPLY,
    )


async def check_input(
    text: str,
    *,
    settings: Settings | None = None,
    chat_id: str | None = None,
) -> SafetyHit | None:
    """
    Optional third-party input gate after lexicon.
    Disabled / missing AK / errors → None (fail-open).
    """
    s = settings or get_settings()
    if not s.moderation_ready:
        return None
    msg = (text or "").strip()
    if len(msg) < 1:
        return None

    try:
        data = await fetch_moderation_data(msg, settings=s, chat_id=chat_id)
    except Exception as exc:  # noqa: BLE001
        log.warning("moderation unexpected: %s", type(exc).__name__)
        return None

    if data is None:
        return None

    hit = hit_from_data(data, block_levels=s.moderation_block_levels)
    if hit:
        log.info("moderation block category=%s risk=%s", hit.category, data.get("RiskLevel"))
    return hit
