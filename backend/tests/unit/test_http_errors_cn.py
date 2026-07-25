"""Probe unknown route error body (expect Chinese, not English Not Found)."""
from __future__ import annotations

from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture()
def isolated_db(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_file = tmp_path / "err.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_file}")
    monkeypatch.setenv("ALLOW_MOCK_LLM", "true")
    monkeypatch.setenv("LLM_API_KEY", "")
    from src.config.settings import get_settings

    get_settings.cache_clear()
    from src.storage.db import init_db

    init_db()
    yield db_file
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_unknown_route_returns_chinese_not_english(isolated_db: Path):
    from src.api.app import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/v1/does-not-exist", headers={"X-Client-Id": "x"})
    assert r.status_code == 404
    body = r.json()
    msg = body["error"]["message"]
    assert "Not Found" not in msg
    assert any("\u4e00" <= ch <= "\u9fff" for ch in msg)
