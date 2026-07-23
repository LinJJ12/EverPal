from __future__ import annotations

from src.capabilities import safety as safety_cap
from src.domain.enums import Mode
from src.storage import memory_repo, profile_repo


def snippet(
    *,
    nickname: str = "",
    likes: list[str] | None = None,
    extra: str = "",
    client_id: str = "",
) -> str:
    """Light memory snippet for system prompt."""
    bits: list[str] = []
    nick = nickname
    like_list = list(likes or [])
    if client_id.strip():
        profile = profile_repo.get_profile(client_id) or profile_repo.ensure_profile(client_id)
        if not nick:
            nick = profile.get("nickname") or ""
        if not like_list:
            like_list = list(profile.get("likes") or [])
        for m in memory_repo.list_memories(client_id, limit=5):
            bits.append(m["text"])
    if nick.strip():
        bits.insert(0, f"称呼 {nick.strip()}")
    if like_list:
        bits.insert(1 if nick.strip() else 0, "喜欢 " + "、".join(like_list[:5]))
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
    for marker in ("我喜欢", "我爱", "我叫", "我的名字是"):
        if marker in t:
            note = t[:80]
            memory_repo.add_memory(cid, note)
            return note
    return None
