"""Unit tests for optional Aliyun inbound moderation (mocked HTTP)."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from src.capabilities.moderation.acs3 import acs3_headers
from src.capabilities.moderation.check import check_input, hit_from_data
from src.capabilities.moderation.client import _endpoint_ok, fetch_moderation_data
from src.config.settings import Settings
from src.domain.enums import SafetyAction


def test_acs3_headers_stable_shape():
    body = b'{"Service":"query_security_check"}'
    kwargs = dict(
        method="POST",
        url="https://green-cip.cn-shanghai.aliyuncs.com/",
        access_key_id="AKIDtest",
        access_key_secret="secret",
        action="TextModerationPlus",
        version="2022-03-02",
        body=body,
        now="2026-07-29T05:00:00Z",
        nonce="fixed-nonce-1",
    )
    h1 = acs3_headers(**kwargs)
    h2 = acs3_headers(**kwargs)
    assert h1["host"] == "green-cip.cn-shanghai.aliyuncs.com"
    assert h1["content-type"] == "application/json"
    assert h1["x-acs-action"] == "TextModerationPlus"
    assert h1["x-acs-date"] == "2026-07-29T05:00:00Z"
    assert h1["Authorization"] == h2["Authorization"]
    assert "SignedHeaders=content-type;host;x-acs-action;" in h1["Authorization"]
    sig = h1["Authorization"].split("Signature=", 1)[1]
    assert len(sig) == 64
    assert all(c in "0123456789abcdef" for c in sig)


def test_endpoint_allowlist():
    assert _endpoint_ok("https://green-cip.cn-shanghai.aliyuncs.com")
    assert _endpoint_ok("https://green-cip.cn-beijing.aliyuncs.com/")
    assert not _endpoint_ok("http://green-cip.cn-shanghai.aliyuncs.com")
    assert not _endpoint_ok("https://evil.example.com")


def test_hit_from_data_high_risk():
    hit = hit_from_data(
        {
            "RiskLevel": "high",
            "Result": [{"Label": "contraband_act", "Confidence": 99}],
        },
        block_levels=frozenset({"high", "medium"}),
    )
    assert hit is not None
    assert hit.action == SafetyAction.BLOCK
    assert "contraband_act" in hit.category
    assert "换一个" in hit.reply


def test_hit_from_data_none_passes():
    assert (
        hit_from_data({"RiskLevel": "none", "Result": []}, block_levels=frozenset({"high", "medium"}))
        is None
    )


def test_hit_from_data_sensitive_s4():
    hit = hit_from_data(
        {"RiskLevel": "none", "SensitiveLevel": "S4", "Result": []},
        block_levels=frozenset({"high"}),
    )
    assert hit is not None


def test_hit_from_data_attack_high():
    hit = hit_from_data(
        {"RiskLevel": "low", "AttackLevel": "high", "Result": []},
        block_levels=frozenset({"high", "medium"}),
    )
    assert hit is not None


@pytest.mark.asyncio
async def test_check_input_skips_when_disabled():
    s = Settings(moderation_enabled=False, moderation_access_key_id="a", moderation_access_key_secret="b")
    with patch(
        "src.capabilities.moderation.check.fetch_moderation_data",
        new_callable=AsyncMock,
    ) as fetch:
        out = await check_input("随便聊聊", settings=s)
    assert out is None
    fetch.assert_not_awaited()


@pytest.mark.asyncio
async def test_check_input_skips_without_keys():
    s = Settings(moderation_enabled=True, moderation_access_key_id="", moderation_access_key_secret="")
    with patch(
        "src.capabilities.moderation.check.fetch_moderation_data",
        new_callable=AsyncMock,
    ) as fetch:
        out = await check_input("随便聊聊", settings=s)
    assert out is None
    fetch.assert_not_awaited()


@pytest.mark.asyncio
async def test_check_input_blocks_on_high():
    s = Settings(
        moderation_enabled=True,
        moderation_access_key_id="ak",
        moderation_access_key_secret="sk",
    )
    with patch(
        "src.capabilities.moderation.check.fetch_moderation_data",
        new_callable=AsyncMock,
        return_value={"RiskLevel": "high", "Result": [{"Label": "pornographic_adult"}]},
    ):
        out = await check_input("bad text", settings=s)
    assert out is not None
    assert out.action == SafetyAction.BLOCK


@pytest.mark.asyncio
async def test_check_input_fail_open_on_none_data():
    s = Settings(
        moderation_enabled=True,
        moderation_access_key_id="ak",
        moderation_access_key_secret="sk",
    )
    with patch(
        "src.capabilities.moderation.check.fetch_moderation_data",
        new_callable=AsyncMock,
        return_value=None,
    ):
        out = await check_input("hello", settings=s)
    assert out is None


@pytest.mark.asyncio
async def test_fetch_timeout_returns_none(monkeypatch):
    import httpx

    s = Settings(
        moderation_enabled=True,
        moderation_access_key_id="ak",
        moderation_access_key_secret="sk",
        moderation_endpoint="https://green-cip.cn-shanghai.aliyuncs.com",
    )

    class BoomClient:
        def __init__(self, *a, **k):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *a):
            return False

        async def post(self, *a, **k):
            raise httpx.TimeoutException("slow")

    monkeypatch.setattr("src.capabilities.moderation.client.httpx.AsyncClient", BoomClient)
    out = await fetch_moderation_data("测试", settings=s)
    assert out is None


@pytest.mark.asyncio
async def test_chat_moderation_block_skips_llm():
    from src.schemas.chat import ChatStreamRequest
    from src.services.chat import run_chat_stream
    from src.capabilities.safety import SafetyHit

    s = Settings(allow_mock_llm=True, llm_api_key="", moderation_enabled=True)
    req = ChatStreamRequest(
        message="今天天气真好",
        mode="child",
        companion_id="nuan",
        persist=False,
    )
    mod_hit = SafetyHit(
        category="moderation:contraband_act",
        action=SafetyAction.BLOCK,
        reply="这个话题我们换一个聊聊吧，我陪你说点更合适的事。",
    )
    with (
        patch("src.services.chat.safety_cap.check_input", return_value=None),
        patch(
            "src.services.chat.moderation_check",
            new_callable=AsyncMock,
            return_value=mod_hit,
        ),
        patch("src.services.chat.llm_cap.stream_chat_completion") as llm_mock,
    ):
        events = []
        async for ev in run_chat_stream(req, settings=s):
            events.append(ev)
    llm_mock.assert_not_called()
    deltas = [e.data.get("text", "") for e in events if e.event == "delta"]
    assert any("换一个" in t for t in deltas)
    done = [e for e in events if e.event == "done"][-1]
    assert done.data["safety_action"] == "block"


@pytest.mark.asyncio
async def test_chat_moderation_fail_open_still_streams():
    from src.schemas.chat import ChatStreamRequest
    from src.services.chat import run_chat_stream

    s = Settings(allow_mock_llm=True, llm_api_key="", moderation_enabled=True)
    req = ChatStreamRequest(
        message="今天好开心",
        mode="child",
        companion_id="nuan",
        persist=False,
    )
    with (
        patch("src.services.chat.safety_cap.check_input", return_value=None),
        patch(
            "src.services.chat.moderation_check",
            new_callable=AsyncMock,
            return_value=None,
        ),
    ):
        events = []
        async for ev in run_chat_stream(req, settings=s):
            events.append(ev)
    assert any(e.event == "delta" for e in events)
    assert any(e.event == "done" for e in events)
