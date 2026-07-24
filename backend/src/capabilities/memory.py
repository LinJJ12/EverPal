from __future__ import annotations

from src.capabilities import safety as safety_cap
from src.domain.enums import Mode
from src.storage import memory_repo, profile_repo

# Snippet order among memory rows (lower = earlier in prompt)
_SNIPPET_CATEGORY_ORDER = {
    "preference": 0,
    "like": 1,
    "dislike": 2,
    "event": 3,
}

_DISLIKE_MARKERS = ("我不喜欢", "我讨厌")
_LIKE_MARKERS = ("我喜欢", "我爱")
_PREFERENCE_MARKERS = ("我叫", "我的名字是")
_EVENT_DAY_MARKERS = ("今天", "昨天")
_EVENT_ACTION_MARKERS = ("去了", "发生了", "参加了")


def _detect_category(text: str) -> str | None:
    """Priority: dislike > like > preference > event. Returns None if no rule hits."""
    if any(m in text for m in _DISLIKE_MARKERS):
        return "dislike"
    if any(m in text for m in _LIKE_MARKERS):
        return "like"
    if any(m in text for m in _PREFERENCE_MARKERS):
        return "preference"
    has_day = any(m in text for m in _EVENT_DAY_MARKERS)
    has_action = any(m in text for m in _EVENT_ACTION_MARKERS)
    if has_day and has_action:
        return "event"
    return None


def snippet(
    *,
    nickname: str = "",
    likes: list[str] | None = None,
    extra: str = "",
    client_id: str = "",
) -> str:
    """Light memory snippet for system prompt.

    Order: nickname → profile likes → memories preference→like→dislike→event
    (within category: newer first). Total memory lines capped at 5.
    """
    bits: list[str] = []
    nick = nickname
    like_list = list(likes or [])
    mem_bits: list[str] = []
    if client_id.strip():
        profile = profile_repo.get_profile(client_id) or profile_repo.ensure_profile(client_id)
        if not nick:
            nick = profile.get("nickname") or ""
        if not like_list:
            like_list = list(profile.get("likes") or [])
        mems = memory_repo.list_memories(client_id, limit=8)
        mems_sorted = sorted(
            mems,
            key=lambda m: (
                _SNIPPET_CATEGORY_ORDER.get(
                    memory_repo.normalize_category(m.get("category")),
                    99,
                ),
                -float(m.get("created_at") or 0),
            ),
        )
        for m in mems_sorted[:5]:
            mem_bits.append(m["text"])
    if nick.strip():
        bits.append(f"称呼 {nick.strip()}")
    if like_list:
        bits.append("喜欢 " + "、".join(like_list[:5]))
    bits.extend(mem_bits)
    if extra.strip():
        bits.append(extra.strip())
    return "；".join(bits)


def maybe_extract_from_turn(
    *,
    client_id: str,
    user_text: str,
    assistant_text: str = "",
    mode: Mode | str = Mode.CHILD,
) -> str | None:
    """Rule-based light extract (no extra LLM). Returns saved text or None.

    Memory-gate: discard if user text hits lexicon (health / self-harm / PII / etc.).
    """
    _ = assistant_text  # reserved for future extractors
    cid = (client_id or "").strip()
    if not cid:
        return None
    t = (user_text or "").strip()
    if not t:
        return None
    if safety_cap.check_input(t, mode):
        return None
    category = _detect_category(t)
    if category is None:
        return None
    note = t[:80]
    memory_repo.add_memory(cid, note, category=category)
    return note
