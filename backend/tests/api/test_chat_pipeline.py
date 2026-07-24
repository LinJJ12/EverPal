from __future__ import annotations

import json

import pytest
from httpx import ASGITransport, AsyncClient

from src.api.app import app
from src.config.settings import get_settings


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_companions():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/v1/companions")
    assert r.status_code == 200
    assert len(r.json()) >= 3


@pytest.mark.asyncio
async def test_chat_stream_safety_block():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.post(
            "/v1/chat/stream",
            json={"message": "我想自杀", "mode": "child", "companion_id": "nuan"},
        )
    assert r.status_code == 200
    body = r.text
    assert "event: delta" in body
    assert "safety_action" in body


@pytest.mark.asyncio
async def test_chat_rejects_adult_mode():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.post(
            "/v1/chat/stream",
            json={"message": "你好", "mode": "adult", "companion_id": "nuan"},
        )
    assert r.status_code in (400, 422)


@pytest.mark.asyncio
async def test_profile_rejects_adult_mode():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.patch(
            "/v1/profile",
            headers={"X-Client-Id": "reject-adult-1"},
            json={"mode": "adult", "nickname": "豆豆"},
        )
    assert r.status_code in (400, 422)
