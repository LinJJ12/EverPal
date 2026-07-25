"""Pure mood id / label rules — no I/O."""

from __future__ import annotations

MOOD_IDS = frozenset({"happy", "calm", "tired", "sad", "angry", "hope"})
MOOD_LABELS: dict[str, str] = {
    "happy": "开心",
    "calm": "平静",
    "tired": "有点累",
    "sad": "难过",
    "angry": "生气",
    "hope": "期待",
}


def normalize_mood(mood: str | None) -> str | None:
    m = (mood or "").strip().lower()
    if m in MOOD_IDS:
        return m
    return None


def label_for(mood: str | None) -> str:
    mid = normalize_mood(mood)
    if not mid:
        return ""
    return MOOD_LABELS[mid]
