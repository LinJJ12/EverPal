"""Shared DashScope HTTP helpers for TTS/ASR (keys stay in Settings)."""

from __future__ import annotations

from urllib.parse import urlparse

import httpx

from src.config.settings import Settings
from src.lib.exceptions import AppError

_ALLOWED_AUDIO_HOST_SUFFIXES = (
    ".aliyuncs.com",
    ".aliyun.com",
)


def require_dashscope_key(settings: Settings, *, kind: str) -> str:
    """kind: 'tts' | 'asr' — only affects Chinese fallback copy."""
    key = settings.dashscope_api_key.strip()
    if key:
        return key
    if kind == "asr":
        raise AppError(
            "speech_unavailable",
            "云端听写暂不可用，试试浏览器说话或打字聊",
            503,
        )
    raise AppError(
        "speech_unavailable",
        "云端朗读暂不可用，试试浏览器朗读或稍后再试",
        503,
    )


def is_allowed_audio_url(url: str) -> bool:
    """Only fetch TTS result URLs from Aliyun OSS-like hosts (SSRF guard)."""
    try:
        parsed = urlparse((url or "").strip())
    except Exception:
        return False
    if parsed.scheme not in ("http", "https"):
        return False
    host = (parsed.hostname or "").lower()
    if not host or "@" in (parsed.netloc or ""):
        return False
    return any(host == suf[1:] or host.endswith(suf) for suf in _ALLOWED_AUDIO_HOST_SUFFIXES)


def dashscope_http_client(settings: Settings) -> httpx.AsyncClient:
    return httpx.AsyncClient(
        timeout=httpx.Timeout(settings.speech_timeout_seconds),
        follow_redirects=False,
    )


def auth_headers(api_key: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
