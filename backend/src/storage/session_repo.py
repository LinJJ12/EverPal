from __future__ import annotations

import time
import uuid
from typing import Any

from src.storage.db import db_session
from src.storage.profile_repo import ensure_profile


def create_session(
    client_id: str,
    *,
    companion_id: str,
    mode: str,
    title: str = "",
) -> dict[str, Any]:
    cid = (client_id or "").strip()
    if not cid:
        raise ValueError("client_id required")
    ensure_profile(cid)
    sid = "s_" + uuid.uuid4().hex[:12]
    now = time.time()
    title_s = (title or "").strip() or "新会话"
    with db_session() as conn:
        conn.execute(
            "INSERT INTO sessions (id, client_id, title, companion_id, mode, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (sid, cid, title_s, companion_id, mode, now),
        )
    return get_session(sid) or {
        "id": sid,
        "client_id": cid,
        "title": title_s,
        "companion_id": companion_id,
        "mode": mode,
        "updated_at": now,
        "messages": [],
    }


def list_sessions(client_id: str, *, limit: int = 20) -> list[dict[str, Any]]:
    cid = (client_id or "").strip()
    if not cid:
        return []
    with db_session() as conn:
        rows = conn.execute(
            "SELECT id, client_id, title, companion_id, mode, updated_at FROM sessions "
            "WHERE client_id=? ORDER BY updated_at DESC LIMIT ?",
            (cid, limit),
        ).fetchall()
        return [_session_row(r, messages=[]) for r in rows]


def get_session(session_id: str) -> dict[str, Any] | None:
    sid = (session_id or "").strip()
    if not sid:
        return None
    with db_session() as conn:
        row = conn.execute(
            "SELECT id, client_id, title, companion_id, mode, updated_at FROM sessions WHERE id=?",
            (sid,),
        ).fetchone()
        if not row:
            return None
        msgs = conn.execute(
            "SELECT role, content, safety_action, created_at FROM messages "
            "WHERE session_id=? ORDER BY id ASC",
            (sid,),
        ).fetchall()
        messages = [
            {
                "role": m["role"],
                "content": m["content"],
                "safety_action": m["safety_action"],
                "created_at": m["created_at"],
            }
            for m in msgs
        ]
        return _session_row(row, messages=messages)


def append_messages(
    session_id: str,
    items: list[dict[str, str]],
    *,
    title_hint: str | None = None,
) -> dict[str, Any] | None:
    sid = (session_id or "").strip()
    if not sid or not items:
        return get_session(sid)
    now = time.time()
    with db_session() as conn:
        row = conn.execute(
            "SELECT id FROM sessions WHERE id=?", (sid,)
        ).fetchone()
        if not row:
            return None
        for it in items:
            conn.execute(
                "INSERT INTO messages (session_id, role, content, safety_action, created_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (
                    sid,
                    it.get("role", "user"),
                    it.get("content", ""),
                    it.get("safety_action", "none"),
                    now,
                ),
            )
        if title_hint and title_hint.strip():
            conn.execute(
                "UPDATE sessions SET title=?, updated_at=? WHERE id=? AND (title='' OR title='新会话')",
                (title_hint.strip()[:40], now, sid),
            )
        else:
            conn.execute(
                "UPDATE sessions SET updated_at=? WHERE id=?",
                (now, sid),
            )
    return get_session(sid)


def delete_session(session_id: str, client_id: str) -> bool:
    sid = (session_id or "").strip()
    cid = (client_id or "").strip()
    if not sid or not cid:
        return False
    with db_session() as conn:
        row = conn.execute(
            "SELECT id FROM sessions WHERE id=? AND client_id=?",
            (sid, cid),
        ).fetchone()
        if not row:
            return False
        conn.execute("DELETE FROM messages WHERE session_id=?", (sid,))
        conn.execute("DELETE FROM sessions WHERE id=?", (sid,))
        return True


def _session_row(row: Any, *, messages: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "client_id": row["client_id"],
        "title": row["title"],
        "companion_id": row["companion_id"],
        "mode": row["mode"],
        "updated_at": row["updated_at"],
        "messages": messages,
    }
