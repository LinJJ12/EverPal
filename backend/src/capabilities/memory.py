from __future__ import annotations

import re

from src.capabilities import safety as safety_cap
from src.domain.enums import Mode
from src.storage import memory_repo, mood_repo, profile_repo

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
_REMEMBER_MARKERS = ("帮我记住", "请记住", "记一下", "别忘了")
_EVENT_DAY_MARKERS = ("今天", "昨天")
_EVENT_ACTION_MARKERS = ("去了", "发生了", "参加了")

_LIKE_OBJECT_RE = re.compile(r"(?:我喜欢|我爱)(?P<obj>.+)$")
_PUNCT_RE = re.compile(r"[\s?？!！。.~～、，,；;：:\"'“”‘’]+")
_MAX_LIKES = 12


def _detect_category(text: str) -> str | None:
    """Priority: dislike > like > remember > preference > event."""
    if any(m in text for m in _DISLIKE_MARKERS):
        return "dislike"
    if any(m in text for m in _LIKE_MARKERS):
        return "like"
    if any(m in text for m in _REMEMBER_MARKERS):
        return "preference"
    if any(m in text for m in _PREFERENCE_MARKERS):
        return "preference"
    has_day = any(m in text for m in _EVENT_DAY_MARKERS)
    has_action = any(m in text for m in _EVENT_ACTION_MARKERS)
    if has_day and has_action:
        return "event"
    return None


def extract_like_object(text: str) -> str | None:
    """「我喜欢画画」→「画画」."""
    t = (text or "").strip()
    m = _LIKE_OBJECT_RE.search(t)
    if not m:
        return None
    obj = (m.group("obj") or "").strip()
    obj = _PUNCT_RE.sub("", obj)
    obj = obj.strip(" 的了呢啊呀嘛吧哦")
    if not obj or len(obj) > 16:
        return None
    return obj


def _sync_like_to_profile(client_id: str, user_text: str) -> None:
    obj = extract_like_object(user_text)
    if not obj:
        return
    profile = profile_repo.ensure_profile(client_id)
    likes = [str(x).strip() for x in (profile.get("likes") or []) if str(x).strip()]
    if obj in likes:
        return
    likes = [obj, *[x for x in likes if x != obj]][:_MAX_LIKES]
    profile_repo.upsert_profile(client_id, likes=likes)


def snippet(
    *,
    nickname: str = "",
    likes: list[str] | None = None,
    extra: str = "",
    client_id: str = "",
) -> str:
    """Light memory snippet for system prompt.

    Order: nickname → profile likes → today mood → memories preference→like→dislike→event
    (within category: newer first). Total memory lines capped at 5.
    """
    bits: list[str] = []
    nick = nickname
    like_list = list(likes or [])
    mem_bits: list[str] = []
    mood_bit = ""
    if client_id.strip():
        profile = profile_repo.get_profile(client_id) or profile_repo.ensure_profile(client_id)
        if not nick:
            nick = profile.get("nickname") or ""
        if not like_list:
            like_list = list(profile.get("likes") or [])
        today = mood_repo.get_mood(client_id)
        if today and today.get("label"):
            mood_bit = (
                f"今日心情：{today['label']}。"
                "可轻轻关心，不要每句提起，不要追问为什么。"
            )
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
    if mood_bit:
        bits.append(mood_bit)
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
    Dedupes near-identical notes; syncs like objects into profile.likes.
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
    if memory_repo.has_similar_memory(cid, note):
        if category == "like":
            _sync_like_to_profile(cid, t)
        return None
    memory_repo.add_memory(cid, note, category=category)
    if category == "like":
        _sync_like_to_profile(cid, t)
    return note
