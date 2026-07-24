from __future__ import annotations

from enum import StrEnum


class Mode(StrEnum):
    """Product is minors-only; keep a single mode value for profiles/sessions."""

    CHILD = "child"

    @classmethod
    def coerce(cls, value: object) -> Mode:
        """Map any legacy/unknown value to CHILD (never raise on 'adult')."""
        if isinstance(value, cls):
            return value
        raw = str(value or "").strip().lower()
        try:
            return cls(raw)
        except ValueError:
            return cls.CHILD


class SafetyAction(StrEnum):
    NONE = "none"
    BLOCK = "block"
    REWRITE = "rewrite"
    WATCH = "watch"


COMPANION_IDS = ("nuan", "tiao", "cha")
