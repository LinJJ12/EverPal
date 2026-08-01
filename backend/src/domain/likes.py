"""Pure profile-likes normalization (no I/O, no lexicon)."""

from __future__ import annotations

MAX_PROFILE_LIKES = 6
MAX_LIKE_CHARS = 12


def normalize_likes(likes: list[str] | None) -> list[str]:
    """Dedupe, trim, cap length/count. Caller may pre-filter unsafe terms."""
    out: list[str] = []
    for raw in likes or []:
        text = " ".join(str(raw).strip().split())[:MAX_LIKE_CHARS]
        if not text or text in out:
            continue
        out.append(text)
        if len(out) >= MAX_PROFILE_LIKES:
            break
    return out
