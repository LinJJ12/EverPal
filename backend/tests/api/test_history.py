from __future__ import annotations

from datetime import datetime
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

from src.domain.time_cn import CN_TZ


@pytest.fixture()
def isolated_db(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_file = tmp_path / "history_api.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_file}")
    monkeypatch.setenv("ALLOW_MOCK_LLM", "true")
    monkeypatch.setenv("LLM_API_KEY", "")
    from src.config.settings import get_settings

    get_settings.cache_clear()
    from src.storage.db import init_db

    init_db()
    yield db_file
    get_settings.cache_clear()


def _insert_message(session_id: str, role: str, content: str, created_at: float) -> None:
    from src.storage.db import db_session

    with db_session() as conn:
        conn.execute(
            "INSERT INTO messages (session_id, role, content, safety_action, created_at) "
            "VALUES (?, ?, ?, 'none', ?)",
            (session_id, role, content, created_at),
        )


@pytest.mark.asyncio
async def test_api_history_calendar_and_day(isolated_db: Path):
    from src.api.app import app
    from src.storage import mood_repo, session_repo

    sid = session_repo.create_session("api-hist", companion_id="nuan", mode="child", title="测")["id"]
    t = datetime(2026, 7, 25, 12, 0, 0, tzinfo=CN_TZ).timestamp()
    _insert_message(sid, "user", "hi", t)
    mood_repo.upsert_mood("api-hist", "happy", day="2026-07-25")

    headers = {"X-Client-Id": "api-hist"}
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        bad = await client.get("/v1/history/calendar", headers=headers, params={"month": "xx"})
        assert bad.status_code == 400
        assert "月份" in bad.json()["error"]["message"]

        no_cid = await client.get("/v1/history/calendar", params={"month": "2026-07"})
        assert no_cid.status_code == 400
        assert no_cid.json()["error"]["code"] == "missing_client_id"

        r = await client.get("/v1/history/calendar", headers=headers, params={"month": "2026-07"})
        assert r.status_code == 200
        body = r.json()
        assert body["month"] == "2026-07"
        assert any(
            d["day"] == "2026-07-25" and d["has_chat"] and d["mood"] == "happy" for d in body["days"]
        )

        bad_day = await client.get("/v1/history/days/2026-02-30/sessions", headers=headers)
        assert bad_day.status_code == 400
        assert "日期" in bad_day.json()["error"]["message"]

        d = await client.get("/v1/history/days/2026-07-25/sessions", headers=headers)
        assert d.status_code == 200
        assert d.json()["mood"] == "happy"
        assert len(d.json()["sessions"]) == 1
        assert d.json()["sessions"][0]["id"] == sid
        assert d.json()["sessions"][0]["companion_id"] == "nuan"


@pytest.mark.asyncio
async def test_api_history_after_delete_session(isolated_db: Path):
    from src.api.app import app
    from src.storage import mood_repo, session_repo

    sid = session_repo.create_session("del-hist", companion_id="tiao", mode="child", title="删")["id"]
    t = datetime(2026, 7, 20, 10, 0, 0, tzinfo=CN_TZ).timestamp()
    _insert_message(sid, "user", "hi", t)
    mood_repo.upsert_mood("del-hist", "calm", day="2026-07-20")

    headers = {"X-Client-Id": "del-hist"}
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        before = await client.get("/v1/history/calendar", headers=headers, params={"month": "2026-07"})
        assert any(d["day"] == "2026-07-20" and d["has_chat"] for d in before.json()["days"])

        deleted = await client.delete(f"/v1/sessions/{sid}", headers=headers)
        assert deleted.status_code == 200

        after = await client.get("/v1/history/calendar", headers=headers, params={"month": "2026-07"})
        day = next(d for d in after.json()["days"] if d["day"] == "2026-07-20")
        assert day["has_chat"] is False
        assert day["mood"] == "calm"

        sess = await client.get("/v1/history/days/2026-07-20/sessions", headers=headers)
        assert sess.json()["sessions"] == []
        assert sess.json()["mood"] == "calm"
