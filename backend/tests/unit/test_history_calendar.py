from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import pytest

from src.domain.time_cn import CN_TZ, day_from_ts, parse_day, parse_month


@pytest.fixture()
def isolated_db(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_file = tmp_path / "history.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_file}")
    monkeypatch.setenv("ALLOW_MOCK_LLM", "true")
    monkeypatch.setenv("LLM_API_KEY", "")
    from src.config.settings import get_settings

    get_settings.cache_clear()
    from src.storage.db import init_db

    init_db()
    yield db_file
    get_settings.cache_clear()


def test_time_cn_parsers():
    assert parse_month("2026-07") == "2026-07"
    assert parse_month("2026-13") is None
    assert parse_day("2026-07-25") == "2026-07-25"
    assert parse_day("2026-02-30") is None
    # 2026-07-24 16:00 UTC = 2026-07-25 00:00 CN
    ts = datetime(2026, 7, 24, 16, 0, 0, tzinfo=timezone.utc).timestamp()
    assert day_from_ts(ts) == "2026-07-25"


def _insert_message(session_id: str, role: str, content: str, created_at: float) -> None:
    from src.storage.db import db_session

    with db_session() as conn:
        conn.execute(
            "INSERT INTO messages (session_id, role, content, safety_action, created_at) "
            "VALUES (?, ?, ?, 'none', ?)",
            (session_id, role, content, created_at),
        )


def test_calendar_aggregates_message_days_and_mood(isolated_db: Path):
    from src.storage import history_repo, mood_repo, session_repo

    sid = session_repo.create_session("hist-1", companion_id="nuan", mode="child", title="跨日")["id"]
    t24 = datetime(2026, 7, 24, 10, 0, 0, tzinfo=CN_TZ).timestamp()
    t25 = datetime(2026, 7, 25, 9, 0, 0, tzinfo=CN_TZ).timestamp()
    _insert_message(sid, "user", "昨天", t24)
    _insert_message(sid, "assistant", "嗯", t24)
    _insert_message(sid, "user", "今天", t25)

    mood_repo.upsert_mood("hist-1", "hope", day="2026-07-25")
    mood_repo.upsert_mood("hist-1", "calm", day="2026-07-26")

    days = {d["day"]: d for d in history_repo.calendar_month("hist-1", "2026-07")}
    assert days["2026-07-24"]["has_chat"] is True
    assert days["2026-07-24"]["session_count"] == 1
    assert days["2026-07-25"]["has_chat"] is True
    assert days["2026-07-25"]["mood"] == "hope"
    assert days["2026-07-25"]["mood_label"] == "期待"
    assert days["2026-07-26"]["has_chat"] is False
    assert days["2026-07-26"]["mood"] == "calm"

    sess = history_repo.sessions_on_day("hist-1", "2026-07-25")
    assert len(sess) == 1
    assert sess[0]["id"] == sid
    assert sess[0]["message_count_that_day"] == 1
    assert sess[0]["companion_id"] == "nuan"

    assert history_repo.sessions_on_day("hist-1", "2026-07-26") == []
    only_mood = history_repo.mood_on_day("hist-1", "2026-07-26")
    assert only_mood and only_mood["mood"] == "calm"


def test_corrupt_mood_only_day_omitted(isolated_db: Path):
    from src.storage import history_repo
    from src.storage.db import db_session
    from src.storage.profile_repo import ensure_profile

    ensure_profile("bad-mood")
    with db_session() as conn:
        conn.execute(
            "INSERT INTO daily_moods (client_id, day, mood, updated_at) VALUES (?, ?, ?, ?)",
            ("bad-mood", "2026-07-10", "not-a-mood", 1.0),
        )
    assert history_repo.calendar_month("bad-mood", "2026-07") == []
    assert history_repo.mood_on_day("bad-mood", "2026-07-10") is None
