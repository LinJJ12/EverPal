from __future__ import annotations

import base64
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient, Response

from src.api.app import app
from src.capabilities.speech.asr import guess_audio_mime, transcribe_audio
from src.capabilities.speech.client import is_allowed_audio_url
from src.capabilities.speech.tts import synthesize_speech
from src.config.settings import Settings, get_settings
from src.lib.exceptions import AppError


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def _speech_settings(**kwargs) -> Settings:
    base = dict(
        dashscope_api_key="sk-test",
        dashscope_base_url="https://example.test/api/v1",
        dashscope_compat_base_url="https://example.test/compatible-mode/v1",
        tts_model="qwen-audio-3.0-tts-flash",
        asr_model="qwen3-asr-flash",
        tts_voice_nuan="longanhuan_v3.6",
        tts_voice_tiao="longjielidou_v3.6",
        tts_voice_cha="longanhuan_v3.6",
        speech_timeout_seconds=5.0,
    )
    base.update(kwargs)
    return Settings(**base)


@pytest.mark.asyncio
async def test_tts_no_key():
    s = _speech_settings(dashscope_api_key="")
    with pytest.raises(AppError) as ei:
        await synthesize_speech(text="你好", companion_id="nuan", settings=s)
    assert ei.value.code == "speech_unavailable"
    assert ei.value.http_status == 503


@pytest.mark.asyncio
async def test_tts_success_url_download():
    s = _speech_settings()
    audio_bytes = b"ID3fake-mp3"

    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None
    mock_client.post = AsyncMock(
        return_value=Response(
            200,
            json={
                "output": {
                    "audio": {
                        "url": "https://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/a.mp3",
                        "data": "",
                    }
                }
            },
        )
    )
    mock_client.get = AsyncMock(
        return_value=Response(200, content=audio_bytes, headers={"content-type": "audio/mpeg"})
    )

    with patch("src.capabilities.speech.tts.httpx.AsyncClient", return_value=mock_client):
        data, ctype = await synthesize_speech(text="你好呀", companion_id="tiao", settings=s)

    assert data == audio_bytes
    assert ctype == "audio/mpeg"
    body = mock_client.post.await_args.kwargs["json"]
    assert body["model"] == "qwen-audio-3.0-tts-flash"
    assert body["input"]["voice"] == "longjielidou_v3.6"


@pytest.mark.asyncio
async def test_tts_success_base64():
    s = _speech_settings()
    raw = b"RIFF-wav"
    b64 = base64.b64encode(raw).decode()

    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None
    mock_client.post = AsyncMock(
        return_value=Response(200, json={"output": {"audio": {"data": b64, "url": ""}}})
    )

    with patch("src.capabilities.speech.tts.httpx.AsyncClient", return_value=mock_client):
        data, ctype = await synthesize_speech(text="你好", companion_id="nuan", settings=s)

    assert data == raw
    assert ctype == "audio/wav"


@pytest.mark.asyncio
async def test_asr_no_key():
    s = _speech_settings(dashscope_api_key="")
    with pytest.raises(AppError) as ei:
        await transcribe_audio(audio=b"abc", settings=s)
    assert ei.value.code == "speech_unavailable"


@pytest.mark.asyncio
async def test_asr_success():
    s = _speech_settings()
    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None
    mock_client.post = AsyncMock(
        return_value=Response(
            200,
            json={"choices": [{"message": {"content": "今天天气真好"}}]},
        )
    )

    with patch("src.capabilities.speech.asr.httpx.AsyncClient", return_value=mock_client):
        text = await transcribe_audio(
            audio=b"\x00\x01",
            filename="a.webm",
            content_type="audio/webm",
            settings=s,
        )

    assert text == "今天天气真好"
    payload = mock_client.post.await_args.kwargs["json"]
    assert payload["model"] == "qwen3-asr-flash"
    assert payload["messages"][0]["content"][0]["input_audio"]["data"].startswith(
        "data:audio/webm;base64,"
    )


def test_guess_audio_mime():
    assert guess_audio_mime("x.webm", None) == "audio/webm"
    assert guess_audio_mime(None, "audio/wav; codecs=1") == "audio/wav"


def test_allowed_audio_url():
    assert is_allowed_audio_url(
        "https://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/a.mp3?Expires=1"
    )
    assert not is_allowed_audio_url("http://127.0.0.1/secret")
    assert not is_allowed_audio_url("https://evil.example/a.mp3")
    assert not is_allowed_audio_url("file:///etc/passwd")


@pytest.mark.asyncio
async def test_tts_rejects_ssrf_url():
    s = _speech_settings()
    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None
    mock_client.post = AsyncMock(
        return_value=Response(
            200,
            json={"output": {"audio": {"url": "http://127.0.0.1/meta", "data": ""}}},
        )
    )
    mock_client.get = AsyncMock()

    with patch("src.capabilities.speech.tts.httpx.AsyncClient", return_value=mock_client):
        with pytest.raises(AppError) as ei:
            await synthesize_speech(text="你好", companion_id="nuan", settings=s)
    assert ei.value.code == "speech_upstream"
    mock_client.get.assert_not_awaited()


@pytest.mark.asyncio
async def test_tts_business_error_status():
    s = _speech_settings()
    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None
    mock_client.post = AsyncMock(
        return_value=Response(
            200,
            json={"status_code": 400, "code": "InvalidParameter", "message": "bad"},
        )
    )

    with patch("src.capabilities.speech.tts.httpx.AsyncClient", return_value=mock_client):
        with pytest.raises(AppError) as ei:
            await synthesize_speech(text="你好", companion_id="nuan", settings=s)
    assert ei.value.code == "speech_upstream"


@pytest.mark.asyncio
async def test_api_asr_too_large(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DASHSCOPE_API_KEY", "sk-test")
    monkeypatch.setenv("SPEECH_ASR_MAX_BYTES", "16")
    get_settings.cache_clear()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.post(
            "/v1/speech/asr",
            files={"file": ("a.webm", b"x" * 32, "audio/webm")},
        )
    assert r.status_code == 400
    assert r.json()["error"]["code"] == "validation_error"


@pytest.mark.asyncio
async def test_api_tts_unavailable(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DASHSCOPE_API_KEY", "")
    get_settings.cache_clear()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.post("/v1/speech/tts", json={"text": "你好", "companion_id": "nuan"})
    assert r.status_code == 503
    assert r.json()["error"]["code"] == "speech_unavailable"


@pytest.mark.asyncio
async def test_api_asr_unavailable(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DASHSCOPE_API_KEY", "")
    get_settings.cache_clear()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.post(
            "/v1/speech/asr",
            files={"file": ("a.webm", b"\x00\x01", "audio/webm")},
        )
    assert r.status_code == 503
    assert r.json()["error"]["code"] == "speech_unavailable"
