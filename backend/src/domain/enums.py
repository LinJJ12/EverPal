from __future__ import annotations

from enum import StrEnum


class Mode(StrEnum):
    CHILD = "child"
    ADULT = "adult"


class SafetyAction(StrEnum):
    NONE = "none"
    BLOCK = "block"
    REWRITE = "rewrite"
    WATCH = "watch"


COMPANION_IDS = ("nuan", "tiao", "cha")
