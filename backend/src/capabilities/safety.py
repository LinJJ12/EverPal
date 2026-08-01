from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from src.domain.enums import Mode, SafetyAction

LEXICON_DIR = Path(__file__).resolve().parents[1] / "data" / "lexicon"


@dataclass(frozen=True)
class SafetyHit:
    category: str
    action: SafetyAction
    reply: str


@lru_cache
def _load_rules() -> list[dict]:
    rules: list[dict] = []
    if not LEXICON_DIR.is_dir():
        return rules
    for path in sorted(LEXICON_DIR.glob("*.json")):
        rules.append(json.loads(path.read_text(encoding="utf-8")))
    return rules


def clear_lexicon_cache() -> None:
    _load_rules.cache_clear()


def check_input(text: str, mode: Mode | str) -> SafetyHit | None:
    mode_s = Mode.coerce(mode)
    lowered = (text or "").strip()
    if not lowered:
        return None
    for rule in _load_rules():
        scope = rule.get("mode_scope") or ["all"]
        if "all" not in scope and mode_s.value not in scope:
            continue
        action = SafetyAction(rule.get("action", "block"))
        if action == SafetyAction.WATCH:
            continue
        for term in rule.get("terms") or []:
            if term and term in lowered:
                return SafetyHit(
                    category=rule.get("category", "unknown"),
                    action=action,
                    reply=rule.get("reply_template")
                    or "我们换个更合适的话题聊聊吧。",
                )
    return None


def filter_output(text: str, mode: Mode | str) -> tuple[str, SafetyAction]:
    """Post-check assistant text; rewrite on hit."""
    hit = check_input(text, mode)
    if hit and hit.action in (SafetyAction.BLOCK, SafetyAction.REWRITE):
        return hit.reply, hit.action
    return text, SafetyAction.NONE


def sanitize_profile_likes(likes: list[str] | None, mode: Mode | str = Mode.CHILD) -> list[str]:
    """Drop lexicon hits, then apply domain normalize (cap/dedupe). Used by api + memory sync."""
    from src.domain.likes import MAX_LIKE_CHARS, MAX_PROFILE_LIKES, normalize_likes

    safe: list[str] = []
    for raw in likes or []:
        text = " ".join(str(raw).strip().split())[:MAX_LIKE_CHARS]
        if not text or text in safe:
            continue
        if check_input(text, mode) is not None:
            continue
        safe.append(text)
        if len(safe) >= MAX_PROFILE_LIKES:
            break
    return normalize_likes(safe)
