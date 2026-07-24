from __future__ import annotations

import sqlite3
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

# Isolate DB before app import side effects in other tests — patch via env + cache clear
@pytest.fixture()
def isolated_db(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_file = tmp_path / "test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_file}")
    monkeypatch.setenv("ALLOW_MOCK_LLM", "true")
    monkeypatch.setenv("LLM_API_KEY", "")
    from src.config.settings import get_settings

    get_settings.cache_clear()
    from src.storage.db import init_db

    init_db()
    yield db_file
    get_settings.cache_clear()


def test_profile_and_memory_roundtrip(isolated_db: Path):
    from src.storage import memory_repo, profile_repo

    p = profile_repo.upsert_profile(
        "dev-1",
        nickname="小木",
        mode="child",
        companion_id="tiao",
        likes=["画画", "恐龙"],
    )
    assert p["nickname"] == "小木"
    assert "画画" in p["likes"]
    memory_repo.add_memory("dev-1", "我喜欢恐龙", category="like")
    mems = memory_repo.list_memories("dev-1")
    assert mems[0]["text"] == "我喜欢恐龙"
    assert mems[0]["category"] == "like"
    n = memory_repo.clear_memories("dev-1")
    assert n >= 1
    assert memory_repo.list_memories("dev-1") == []


def test_memory_category_roundtrip_and_normalize(isolated_db: Path):
    from src.storage import memory_repo, profile_repo

    profile_repo.ensure_profile("cat-1")
    memory_repo.add_memory("cat-1", "我不喜欢菠菜", category="dislike")
    memory_repo.add_memory("cat-1", "我叫小木", category="preference")
    memory_repo.add_memory("cat-1", "垃圾类别", category="nope")
    mems = {m["text"]: m["category"] for m in memory_repo.list_memories("cat-1")}
    assert mems["我不喜欢菠菜"] == "dislike"
    assert mems["我叫小木"] == "preference"
    assert mems["垃圾类别"] == "preference"


def test_memories_category_migration(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    """Old DBs without category get ALTER + default preference on init_db."""
    db_file = tmp_path / "legacy.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_file}")
    monkeypatch.setenv("ALLOW_MOCK_LLM", "true")
    monkeypatch.setenv("LLM_API_KEY", "")
    from src.config.settings import get_settings

    get_settings.cache_clear()

    conn = sqlite3.connect(db_file)
    conn.executescript(
        """
        CREATE TABLE profiles (
          client_id TEXT PRIMARY KEY,
          nickname TEXT NOT NULL DEFAULT '',
          mode TEXT NOT NULL DEFAULT 'child',
          companion_id TEXT NOT NULL DEFAULT 'nuan',
          likes_json TEXT NOT NULL DEFAULT '[]',
          updated_at REAL NOT NULL
        );
        CREATE TABLE memories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id TEXT NOT NULL,
          text TEXT NOT NULL,
          created_at REAL NOT NULL,
          FOREIGN KEY (client_id) REFERENCES profiles(client_id)
        );
        INSERT INTO profiles (client_id, nickname, mode, companion_id, likes_json, updated_at)
        VALUES ('legacy-1', '', 'child', 'nuan', '[]', 1.0);
        INSERT INTO memories (client_id, text, created_at) VALUES ('legacy-1', '旧记忆', 1.0);
        """
    )
    conn.commit()
    conn.close()

    from src.storage.db import init_db
    from src.storage import memory_repo

    init_db()
    mems = memory_repo.list_memories("legacy-1")
    assert len(mems) == 1
    assert mems[0]["text"] == "旧记忆"
    assert mems[0]["category"] == "preference"
    memory_repo.add_memory("legacy-1", "新喜欢", category="like")
    by_text = {m["text"]: m["category"] for m in memory_repo.list_memories("legacy-1")}
    assert by_text["新喜欢"] == "like"
    get_settings.cache_clear()


def test_session_append(isolated_db: Path):
    from src.storage import session_repo

    s = session_repo.create_session("dev-2", companion_id="nuan", mode="child", title="")
    sid = s["id"]
    session_repo.append_messages(
        sid,
        [
            {"role": "user", "content": "你好", "safety_action": "none"},
            {"role": "assistant", "content": "嗨", "safety_action": "none"},
        ],
        title_hint="你好",
    )
    got = session_repo.get_session(sid)
    assert got is not None
    assert len(got["messages"]) == 2
    assert got["title"] == "你好"


@pytest.mark.asyncio
async def test_api_profile_and_chat_persist(isolated_db: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("ALLOW_MOCK_LLM", "true")
    monkeypatch.setenv("LLM_API_KEY", "")
    from src.config.settings import get_settings

    get_settings.cache_clear()
    # Re-import app after settings — use existing app but settings refreshed
    from src.api.app import app

    transport = ASGITransport(app=app)
    headers = {"X-Client-Id": "html-client-1"}
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.patch(
            "/v1/profile",
            headers=headers,
            json={"nickname": "小木", "likes": ["太空"], "companion_id": "tiao"},
        )
        assert r.status_code == 200
        assert r.json()["nickname"] == "小木"

        r2 = await client.post(
            "/v1/chat/stream",
            json={
                "message": "我喜欢画画",
                "mode": "child",
                "companion_id": "tiao",
                "client_id": "html-client-1",
                "persist": True,
            },
        )
        assert r2.status_code == 200
        assert "event: done" in r2.text
        assert "session_id" in r2.text

        r3 = await client.get("/v1/sessions", headers=headers)
        assert r3.status_code == 200
        sessions = r3.json()["sessions"]
        assert len(sessions) >= 1

        r4 = await client.get("/v1/profile", headers=headers)
        assert r4.status_code == 200
        mems = r4.json()["memories"]
        assert any("画画" in (m.get("text") or "") for m in mems)
        hit = next(m for m in mems if "画画" in (m.get("text") or ""))
        assert hit.get("category") == "like"
