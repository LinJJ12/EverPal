from __future__ import annotations

import time
from typing import Any

from src.domain.moods import label_for, normalize_mood
from src.domain.time_cn import CN_TZ, today_day
from src.storage.db import db_session
from src.storage.profile_repo import ensure_profile

# Re-export for callers that imported CN_TZ / today_day from mood_repo.
__all__ = ["CN_TZ", "today_day", "get_mood", "upsert_mood"]


def get_mood(client_id: str, day: str | None = None) -> dict[str, Any] | None:
    cid = (client_id or "").strip()
    d = (day or today_day()).strip()
    if not cid or not d:
        return None
    with db_session() as conn:
        row = conn.execute(
            "SELECT client_id, day, mood, updated_at FROM daily_moods "
            "WHERE client_id=? AND day=?",
            (cid, d),
        ).fetchone()
        if not row:
            return None
        mid = normalize_mood(row["mood"])
        # Corrupt / legacy rows: treat as unchecked so the gate can re-ask.
        return {
            "client_id": row["client_id"],
            "day": row["day"],
            "mood": mid,
            "label": label_for(mid) or None,
            "updated_at": row["updated_at"],
        }


def upsert_mood(client_id: str, mood: str, *, day: str | None = None) -> dict[str, Any]:
    cid = (client_id or "").strip()
    mid = normalize_mood(mood)
    d = (day or today_day()).strip()
    if not cid or not mid or not d:
        raise ValueError("invalid_mood")
    ensure_profile(cid)
    now = time.time()
    with db_session() as conn:
        conn.execute(
            "INSERT INTO daily_moods (client_id, day, mood, updated_at) VALUES (?, ?, ?, ?) "
            "ON CONFLICT(client_id, day) DO UPDATE SET mood=excluded.mood, updated_at=excluded.updated_at",
            (cid, d, mid, now),
        )
    return {
        "client_id": cid,
        "day": d,
        "mood": mid,
        "label": label_for(mid),
        "updated_at": now,
    }
