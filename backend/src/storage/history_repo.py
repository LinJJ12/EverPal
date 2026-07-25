"""Read-only history calendar aggregations (message-day + daily moods)."""

from __future__ import annotations

from typing import Any

from src.domain.moods import label_for, normalize_mood
from src.storage.db import db_session

# SQLite: unix epoch → China calendar day (UTC+8).
_CN_DAY = "date(m.created_at, 'unixepoch', '+8 hours')"


def calendar_month(client_id: str, month: str) -> list[dict[str, Any]]:
    """Sparse list of days in YYYY-MM that have chat and/or mood."""
    cid = (client_id or "").strip()
    mo = (month or "").strip()
    if not cid or len(mo) != 7:
        return []
    prefix = mo + "%"
    by_day: dict[str, dict[str, Any]] = {}

    with db_session() as conn:
        chat_rows = conn.execute(
            f"""
            SELECT {_CN_DAY} AS day,
                   COUNT(DISTINCT m.session_id) AS session_count
            FROM messages m
            JOIN sessions s ON s.id = m.session_id
            WHERE s.client_id = ?
              AND m.role IN ('user', 'assistant')
              AND {_CN_DAY} LIKE ?
            GROUP BY day
            """,
            (cid, prefix),
        ).fetchall()
        for row in chat_rows:
            day = row["day"]
            by_day[day] = {
                "day": day,
                "has_chat": True,
                "session_count": int(row["session_count"] or 0),
                "mood": None,
                "mood_label": None,
            }

        mood_rows = conn.execute(
            "SELECT day, mood FROM daily_moods WHERE client_id=? AND day LIKE ?",
            (cid, prefix),
        ).fetchall()
        for row in mood_rows:
            day = row["day"]
            mid = normalize_mood(row["mood"])
            if not mid:
                continue
            label = label_for(mid) or None
            if day not in by_day:
                by_day[day] = {
                    "day": day,
                    "has_chat": False,
                    "session_count": 0,
                    "mood": mid,
                    "mood_label": label,
                }
            else:
                by_day[day]["mood"] = mid
                by_day[day]["mood_label"] = label

    return [by_day[k] for k in sorted(by_day.keys())]


def sessions_on_day(client_id: str, day: str) -> list[dict[str, Any]]:
    cid = (client_id or "").strip()
    d = (day or "").strip()
    if not cid or not d:
        return []
    with db_session() as conn:
        rows = conn.execute(
            f"""
            SELECT s.id AS id,
                   s.title AS title,
                   s.companion_id AS companion_id,
                   s.updated_at AS updated_at,
                   COUNT(*) AS message_count_that_day,
                   MAX(m.created_at) AS last_msg_at
            FROM messages m
            JOIN sessions s ON s.id = m.session_id
            WHERE s.client_id = ?
              AND m.role IN ('user', 'assistant')
              AND {_CN_DAY} = ?
            GROUP BY s.id
            ORDER BY last_msg_at DESC
            """,
            (cid, d),
        ).fetchall()
        return [
            {
                "id": row["id"],
                "title": row["title"] or "",
                "companion_id": row["companion_id"],
                "updated_at": float(row["updated_at"] or 0),
                "message_count_that_day": int(row["message_count_that_day"] or 0),
            }
            for row in rows
        ]


def mood_on_day(client_id: str, day: str) -> dict[str, Any] | None:
    cid = (client_id or "").strip()
    d = (day or "").strip()
    if not cid or not d:
        return None
    with db_session() as conn:
        row = conn.execute(
            "SELECT mood FROM daily_moods WHERE client_id=? AND day=?",
            (cid, d),
        ).fetchone()
        if not row:
            return None
        mid = normalize_mood(row["mood"])
        if not mid:
            return None
        return {"mood": mid, "mood_label": label_for(mid) or None}
