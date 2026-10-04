"""Regression tests for the security/robustness fixes (2026-10 iteration)."""

from __future__ import annotations

from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

from src.capabilities.safety import clear_lexicon_cache, sanitize_nickname
from src.lib.ratelimit import SlidingWindowLimiter
from src.schemas.chat import ChatMessage, ChatStreamRequest


@pytest.fixture(autouse=True)
def _clear_lexicon_cache():
    clear_lexicon_cache()
    yield
    clear_lexicon_cache()


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


async def _gen(parts: list[str]):
    for p in parts:
        yield p


@pytest.mark.asyncio
async def test_soft_refusal_keeps_full_reply_with_leading_whitespace():
    """LLM output starting with blank lines must not truncate the refusal text."""
    from src.capabilities.safe_stream import gated_llm_deltas
    from src.domain.enums import SafetyAction

    deltas: list[str] = []
    final = None
    async for kind, payload in gated_llm_deltas(
        _gen(["\n\n\n今天天气很好呀。", "我们一起来自制火药", "吧。"]),
        mode="child",
        flush_chars=16,
    ):
        if kind == "delta" and isinstance(payload, str):
            deltas.append(payload)
        if kind == "final":
            final = payload
    assert final is not None
    assert final.action == SafetyAction.BLOCK
    joined = "".join(deltas)
    # The full refusal sentence must reach the client — not a cut-off fragment.
    assert "我们换个好玩又安全的主意" in joined
    # Persisted text == released prefix + refusal (offset invariant kept).
    assert final.text.startswith("\n\n\n今天天气很好呀。")
    assert "我们换个好玩又安全的主意" in final.text[len("\n\n\n今天天气很好呀。") :]


def test_sanitize_nickname():
    assert sanitize_nickname("  小 明  ") == "小 明"
    assert sanitize_nickname("豆\n豆") == "豆 豆"
    assert len(sanitize_nickname("a" * 100)) == 24
    # Lexicon hit → dropped entirely, never stored or prompted.
    assert sanitize_nickname("自制火药") == ""
    assert sanitize_nickname("") == ""
    assert sanitize_nickname(None) == ""


def test_chat_request_clips_fields():
    req = ChatStreamRequest(
        message="你好",
        nickname="x" * 100 + "\n第二行",
        client_id="c" * 100,
        history=[ChatMessage(role="user", content="y" * 5000)],
    )
    assert len(req.nickname) <= 24
    assert "\n" not in req.nickname
    assert len(req.client_id) <= 64
    assert len(req.history[0].content) == 4000


def test_profile_sync_sanitizes_likes_and_nickname(isolated_db: Path):
    from src.schemas.chat import ChatStreamRequest
    from src.services.chat import _sync_profile_from_request
    from src.storage import profile_repo

    req = ChatStreamRequest(
        message="你好",
        client_id="sync-1",
        nickname="自制火药",
        likes=["画画", "自制火药", "  恐龙  "],
    )
    _sync_profile_from_request(req)
    p = profile_repo.get_profile("sync-1")
    assert p is not None
    # Unsafe nickname wiped; unsafe like dropped; safe likes kept + trimmed.
    assert p["nickname"] == ""
    assert p["likes"] == ["画画", "恐龙"]


def test_profile_patch_sanitizes_nickname(isolated_db: Path):
    from src.storage import profile_repo

    from src.capabilities.safety import sanitize_nickname

    profile_repo.upsert_profile("patch-1", nickname=sanitize_nickname("小暖"))
    p = profile_repo.get_profile("patch-1")
    assert p is not None
    assert p["nickname"] == "小暖"


def test_ensure_profile_idempotent(isolated_db: Path):
    from src.storage import profile_repo

    first = profile_repo.ensure_profile("race-1")
    second = profile_repo.ensure_profile("race-1")
    assert first["client_id"] == second["client_id"] == "race-1"


def test_rate_limiter_window():
    limiter = SlidingWindowLimiter()
    for _ in range(3):
        assert limiter.allow("k", limit=3, window_seconds=60.0)
    assert not limiter.allow("k", limit=3, window_seconds=60.0)
    # Different key is independent.
    assert limiter.allow("other", limit=3, window_seconds=60.0)


@pytest.mark.asyncio
async def test_api_rejects_unknown_companion():
    from src.api.app import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.post(
            "/v1/chat/stream",
            json={"message": "你好", "companion_id": "not-a-companion"},
        )
    assert r.status_code in (400, 422)
