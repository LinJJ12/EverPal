from __future__ import annotations

from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture()
def isolated_db(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_file = tmp_path / "mood.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_file}")
    monkeypatch.setenv("ALLOW_MOCK_LLM", "true")
    monkeypatch.setenv("LLM_API_KEY", "")
    from src.config.settings import get_settings

    get_settings.cache_clear()
    from src.storage.db import init_db

    init_db()
    yield db_file
    get_settings.cache_clear()


def test_mood_upsert_and_snippet(isolated_db: Path):
    from src.capabilities.memory import snippet
    from src.storage import mood_repo, profile_repo

    profile_repo.ensure_profile("mood-1")
    assert mood_repo.get_mood("mood-1") is None
    row = mood_repo.upsert_mood("mood-1", "tired")
    assert row["mood"] == "tired"
    assert row["label"] == "有点累"
    assert mood_repo.get_mood("mood-1")["mood"] == "tired"
    mood_repo.upsert_mood("mood-1", "happy")
    assert mood_repo.get_mood("mood-1")["mood"] == "happy"
    s = snippet(client_id="mood-1", nickname="阿木")
    assert "今日心情：开心" in s
    assert "不要每句提起" in s

    mood_repo.upsert_mood("mood-1", "hope")
    assert "今日心情：期待" in snippet(client_id="mood-1", nickname="阿木")


def test_corrupt_mood_row_treated_as_unset(isolated_db: Path):
    """Legacy/invalid mood strings must not skip the check-in gate."""
    import time

    from src.storage import mood_repo, profile_repo
    from src.storage.db import db_session

    profile_repo.ensure_profile("corrupt-1")
    day = mood_repo.today_day()
    with db_session() as conn:
        conn.execute(
            "INSERT INTO daily_moods (client_id, day, mood, updated_at) VALUES (?, ?, ?, ?)",
            ("corrupt-1", day, "excited", time.time()),
        )
    row = mood_repo.get_mood("corrupt-1")
    assert row is not None
    assert row["mood"] is None
    assert row["label"] is None


def test_delete_memory(isolated_db: Path):
    from src.storage import memory_repo, profile_repo

    profile_repo.ensure_profile("del-1")
    memory_repo.add_memory("del-1", "我喜欢画画", category="like")
    mems = memory_repo.list_memories("del-1")
    assert len(mems) == 1
    mid = mems[0]["id"]
    assert memory_repo.delete_memory("del-1", mid) is True
    assert memory_repo.list_memories("del-1") == []
    assert memory_repo.delete_memory("del-1", mid) is False


@pytest.mark.asyncio
async def test_api_mood_and_delete_memory(isolated_db: Path):
    from src.api.app import app

    headers = {"X-Client-Id": "api-mood-1"}
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r0 = await client.get("/v1/mood/today", headers=headers)
        assert r0.status_code == 200
        assert r0.json()["mood"] is None

        r1 = await client.put("/v1/mood/today", headers=headers, json={"mood": "sad"})
        assert r1.status_code == 200
        assert r1.json()["mood"] == "sad"
        assert r1.json()["label"] == "难过"

        r2 = await client.get("/v1/mood/today", headers=headers)
        assert r2.json()["mood"] == "sad"

        r_hope = await client.put("/v1/mood/today", headers=headers, json={"mood": "hope"})
        assert r_hope.status_code == 200
        assert r_hope.json()["mood"] == "hope"
        assert r_hope.json()["label"] == "期待"

        bad = await client.put("/v1/mood/today", headers=headers, json={"mood": "excited"})
        assert bad.status_code == 400

        # seed a memory via profile path: use repo
        from src.storage import memory_repo

        memory_repo.add_memory("api-mood-1", "我喜欢小猫", category="like")
        mems = memory_repo.list_memories("api-mood-1")
        mid = mems[0]["id"]

        d = await client.delete(f"/v1/profile/memories/{mid}", headers=headers)
        assert d.status_code == 200
        assert d.json()["ok"] is True

        d2 = await client.delete(f"/v1/profile/memories/{mid}", headers=headers)
        assert d2.status_code == 404
