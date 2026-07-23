from __future__ import annotations

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
    memory_repo.add_memory("dev-1", "我喜欢恐龙")
    mems = memory_repo.list_memories("dev-1")
    assert mems[0]["text"] == "我喜欢恐龙"
    n = memory_repo.clear_memories("dev-1")
    assert n >= 1
    assert memory_repo.list_memories("dev-1") == []


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
