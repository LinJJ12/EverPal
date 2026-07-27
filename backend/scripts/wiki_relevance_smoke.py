"""Live smoke for wiki relevance (network). Run: PYTHONPATH=. python scripts/wiki_relevance_smoke.py"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.capabilities.wiki.lookup import maybe_lookup
from src.config.settings import Settings
from src.domain.enums import Mode


CASES = [
    ("什么是恐龙？", ["恐龙"]),
    ("为什么天是蓝的", ["天空"]),
    ("什么是性？", None),  # may hit 性/性别; must NOT be 数学
]


async def main() -> int:
    s = Settings(wiki_enabled=True, wiki_timeout_seconds=8)
    bad = 0
    for msg, expect_any in CASES:
        r = await maybe_lookup(msg, mode=Mode.CHILD, settings=s, force=True)
        title = r.sources[0].title if r else ""
        print(f"{msg!r} => {title or 'none'}")
        if "数学" in title:
            print("  FAIL: math false positive")
            bad += 1
        if expect_any is not None and r is not None:
            if not any(x in title for x in expect_any):
                print(f"  WARN: expected one of {expect_any}")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
