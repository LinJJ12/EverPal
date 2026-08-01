from __future__ import annotations

import json
import time
from typing import Any

from src.storage.db import db_session


def ensure_profile(client_id: str) -> dict[str, Any]:
    cid = (client_id or "").strip()
    if not cid:
        raise ValueError("client_id required")
    now = time.time()
    with db_session() as conn:
        row = conn.execute(
            "SELECT * FROM profiles WHERE client_id = ?", (cid,)
        ).fetchone()
        if row:
            return _row_to_profile(row)
        conn.execute(
            "INSERT INTO profiles (client_id, nickname, mode, companion_id, likes_json, updated_at) "
            "VALUES (?, '', 'child', 'nuan', '[]', ?)",
            (cid, now),
        )
        row = conn.execute(
            "SELECT * FROM profiles WHERE client_id = ?", (cid,)
        ).fetchone()
        return _row_to_profile(row)


def get_profile(client_id: str) -> dict[str, Any] | None:
    cid = (client_id or "").strip()
    if not cid:
        return None
    with db_session() as conn:
        row = conn.execute(
            "SELECT * FROM profiles WHERE client_id = ?", (cid,)
        ).fetchone()
        return _row_to_profile(row) if row else None


def upsert_profile(
    client_id: str,
    *,
    nickname: str | None = None,
    mode: str | None = None,
    companion_id: str | None = None,
    likes: list[str] | None = None,
) -> dict[str, Any]:
    profile = ensure_profile(client_id)
    nick = profile["nickname"] if nickname is None else nickname.strip()
    md = "child" if mode is None else _normalize_mode(mode)
    comp = profile["companion_id"] if companion_id is None else companion_id
    like_list = profile["likes"] if likes is None else _normalize_likes(likes)
    now = time.time()
    with db_session() as conn:
        conn.execute(
            "UPDATE profiles SET nickname=?, mode=?, companion_id=?, likes_json=?, updated_at=? "
            "WHERE client_id=?",
            (nick, md, comp, json.dumps(like_list, ensure_ascii=False), now, client_id.strip()),
        )
        row = conn.execute(
            "SELECT * FROM profiles WHERE client_id = ?", (client_id.strip(),)
        ).fetchone()
        return _row_to_profile(row)


def _normalize_mode(mode: str | None) -> str:
    return "child"


_MAX_PROFILE_LIKES = 6
_MAX_LIKE_CHARS = 12


def _normalize_likes(likes: list[str] | None) -> list[str]:
    """Kids may type free-text likes; keep short, unique, capped; drop lexicon hits."""
    # Local import: avoid storage↔capabilities import cycles at module load.
    from src.capabilities.safety import check_input

    out: list[str] = []
    for raw in likes or []:
        text = " ".join(str(raw).strip().split())[:_MAX_LIKE_CHARS]
        if not text or text in out:
            continue
        if check_input(text, "child") is not None:
            continue
        out.append(text)
        if len(out) >= _MAX_PROFILE_LIKES:
            break
    return out


def _row_to_profile(row: Any) -> dict[str, Any]:
    likes = json.loads(row["likes_json"] or "[]")
    raw = likes if isinstance(likes, list) else []
    return {
        "client_id": row["client_id"],
        "nickname": row["nickname"] or "",
        "mode": _normalize_mode(row["mode"]),
        "companion_id": row["companion_id"] or "nuan",
        "likes": _normalize_likes([str(x) for x in raw]),
        "updated_at": row["updated_at"],
    }
