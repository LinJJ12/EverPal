"""In-memory sliding-window rate limiter (single-process)."""

from __future__ import annotations

import threading
import time
from collections import deque


class SlidingWindowLimiter:
    """Per-key sliding-window counter. Thread-safe; state lives in one process."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._hits: dict[str, deque[float]] = {}
        self._last_prune = 0.0

    def allow(self, key: str, *, limit: int, window_seconds: float) -> bool:
        now = time.monotonic()
        with self._lock:
            self._prune(now, window_seconds)
            q = self._hits.setdefault(key, deque())
            while q and q[0] <= now - window_seconds:
                q.popleft()
            if len(q) >= limit:
                return False
            q.append(now)
            return True

    def _prune(self, now: float, window_seconds: float) -> None:
        # Occasional sweep so keys from one-off IPs don't accumulate forever.
        if now - self._last_prune < window_seconds and len(self._hits) < 10_000:
            return
        cutoff = now - window_seconds
        for k in [k for k, q in self._hits.items() if not q or q[-1] <= cutoff]:
            self._hits.pop(k, None)
        self._last_prune = now
