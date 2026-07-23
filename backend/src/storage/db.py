from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager

from src.config.settings import BACKEND_ROOT, get_settings
from pathlib import Path

_SCHEMA = """
CREATE TABLE IF NOT EXISTS profiles (
  client_id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL DEFAULT '',
  mode TEXT NOT NULL DEFAULT 'child',
  companion_id TEXT NOT NULL DEFAULT 'nuan',
  likes_json TEXT NOT NULL DEFAULT '[]',
  updated_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at REAL NOT NULL,
  FOREIGN KEY (client_id) REFERENCES profiles(client_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  companion_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  updated_at REAL NOT NULL,
  FOREIGN KEY (client_id) REFERENCES profiles(client_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  safety_action TEXT NOT NULL DEFAULT 'none',
  created_at REAL NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_memories_client ON memories(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_client ON sessions(client_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, id);
"""


def data_dir() -> Path:
    d = BACKEND_ROOT / "data"
    d.mkdir(parents=True, exist_ok=True)
    return d


def resolve_sqlite_path() -> Path:
    url = get_settings().database_url
    if url.startswith("sqlite:///"):
        rel = url.removeprefix("sqlite:///")
        path = Path(rel)
        if not path.is_absolute():
            path = BACKEND_ROOT / path
        path.parent.mkdir(parents=True, exist_ok=True)
        return path
    return data_dir() / "companion.db"


def connect() -> sqlite3.Connection:
    path = resolve_sqlite_path()
    # timeout mitigates "database is locked" under concurrent FastAPI workers/requests
    conn = sqlite3.connect(path, check_same_thread=False, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA busy_timeout = 30000")
    return conn


def init_db() -> None:
    with connect() as conn:
        conn.executescript(_SCHEMA)
        conn.commit()


@contextmanager
def db_session() -> Iterator[sqlite3.Connection]:
    # Schema is created at app startup (and in tests via init_db); avoid CREATE on every call
    conn = connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
