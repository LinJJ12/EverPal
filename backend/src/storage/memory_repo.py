from __future__ import annotations

import re
import time
from typing import Any

from src.storage.db import db_session
from src.storage.profile_repo import ensure_profile

VALID_CATEGORIES = frozenset({"like", "dislike", "event", "preference"})
DEFAULT_CATEGORY = "preference"
_PUNCT_RE = re.compile(r"[\s?？!！。.~～、，,；;：:\"'“”‘’]+")


def normalize_category(category: str | None) -> str:
    cat = (category or "").strip().lower()
    if cat in VALID_CATEGORIES:
        return cat
    return DEFAULT_CATEGORY


def normalize_memory_text(text: str) -> str:
    """Collapse whitespace/punct for near-duplicate detection."""
    t = (text or "").strip()
    t = _PUNCT_RE.sub("", t)
    return t[:40]


def list_memories(client_id: str, *, limit: int = 8) -> list[dict[str, Any]]:
    cid = (client_id or "").strip()
    if not cid:
        return []
    with db_session() as conn:
        rows = conn.execute(
            "SELECT id, text, category, created_at FROM memories WHERE client_id=? "
            "ORDER BY created_at DESC LIMIT ?",
            (cid, limit),
        ).fetchall()
        return [
            {
                "id": r["id"],
                "text": r["text"],
                "category": normalize_category(r["category"]),
                "created_at": r["created_at"],
            }
            for r in rows
        ]


def has_similar_memory(client_id: str, text: str, *, keep: int = 8) -> bool:
    key = normalize_memory_text(text)
    if not key:
        return False
    for m in list_memories(client_id, limit=keep):
        if normalize_memory_text(m.get("text") or "") == key:
            return True
    return False


def add_memory(
    client_id: str,
    text: str,
    *,
    category: str = DEFAULT_CATEGORY,
    keep: int = 8,
) -> list[dict[str, Any]]:
    cid = (client_id or "").strip()
    body = (text or "").strip()
    if not cid or not body:
        return list_memories(cid, limit=keep)
    if has_similar_memory(cid, body, keep=keep):
        return list_memories(cid, limit=keep)
    cat = normalize_category(category)
    ensure_profile(cid)
    now = time.time()
    with db_session() as conn:
        conn.execute(
            "INSERT INTO memories (client_id, text, category, created_at) VALUES (?, ?, ?, ?)",
            (cid, body[:200], cat, now),
        )
        # trim old
        conn.execute(
            "DELETE FROM memories WHERE client_id=? AND id NOT IN ("
            "SELECT id FROM memories WHERE client_id=? ORDER BY created_at DESC LIMIT ?"
            ")",
            (cid, cid, keep),
        )
    return list_memories(cid, limit=keep)


def clear_memories(client_id: str) -> int:
    cid = (client_id or "").strip()
    if not cid:
        return 0
    with db_session() as conn:
        cur = conn.execute("DELETE FROM memories WHERE client_id=?", (cid,))
        return cur.rowcount


def delete_memory(client_id: str, memory_id: int) -> bool:
    cid = (client_id or "").strip()
    if not cid or memory_id is None:
        return False
    try:
        mid = int(memory_id)
    except (TypeError, ValueError):
        return False
    with db_session() as conn:
        cur = conn.execute(
            "DELETE FROM memories WHERE client_id=? AND id=?",
            (cid, mid),
        )
        return cur.rowcount > 0
