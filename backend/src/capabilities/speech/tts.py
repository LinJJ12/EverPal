from __future__ import annotations

import base64
from typing import Any

import httpx

from src.capabilities.speech.client import (
    auth_headers,
    dashscope_http_client,
    is_allowed_audio_url,
    require_dashscope_key,
)
from src.config.settings import Settings, get_settings
from src.domain.enums import COMPANION_IDS
from src.lib.exceptions import AppError
from src.lib.logging import get_logger

log = get_logger("capabilities.speech.tts")


def _raise_if_business_error(data: dict[str, Any]) -> None:
    status = data.get("status_code")
    if status is not None:
        try:
            if int(status) >= 400:
                raise AppError("speech_upstream", "现在读不了，稍后再试", 502)
        except (TypeError, ValueError):
            pass
    code = data.get("code")
    if code is None or code == "":
        return
    code_s = str(code)
    if code_s in ("200", "Success", "success", "OK", "ok", "0"):
        return
    if any(x in code_s.lower() for x in ("apikey", "unauthorized", "forbidden", "quota", "throttl")):
        raise AppError(
            "speech_unavailable",
            "云端朗读暂不可用，试试浏览器朗读或稍后再试",
            503,
        )
    raise AppError("speech_upstream", "现在读不了，稍后再试", 502)


def _parse_tts_payload(data: dict[str, Any]) -> tuple[bytes, str]:
    """Extract audio bytes + content-type, or empty bytes + https URL to download."""
    _raise_if_business_error(data)

    output = data.get("output") or {}
    audio = output.get("audio") or {}
    if isinstance(audio, dict):
        b64 = (audio.get("data") or "").strip()
        if b64:
            try:
                raw = base64.b64decode(b64, validate=False)
            except Exception as exc:
                raise AppError("speech_upstream", "现在读不了，稍后再试", 502) from exc
            if not raw:
                raise AppError("speech_upstream", "现在读不了，稍后再试", 502)
            return raw, "audio/wav"
        url = (audio.get("url") or "").strip()
        if url:
            return b"", url

    for key in ("audio_url", "url"):
        url = (output.get(key) or data.get(key) or "").strip()
        if isinstance(url, str) and url.startswith("http"):
            return b"", url

    raise AppError("speech_upstream", "现在读不了，稍后再试", 502)


async def synthesize_speech(
    *,
    text: str,
    companion_id: str,
    settings: Settings | None = None,
) -> tuple[bytes, str]:
    """Return (audio_bytes, content_type)."""
    s = settings or get_settings()
    key = require_dashscope_key(s, kind="tts")
    raw = (text or "").strip()
    if not raw:
        raise AppError("validation_error", "请先说点什么再朗读", 400)
    if len(raw) > s.speech_tts_max_chars:
        raw = raw[: s.speech_tts_max_chars] + "…"

    cid = (companion_id or "nuan").strip().lower()
    if cid not in COMPANION_IDS:
        raise AppError("invalid_companion", "伙伴不正确", 400)

    voice = s.tts_voice_for(cid)
    rate = s.tts_rate_for(cid)
    base = s.dashscope_base_url.rstrip("/")
    url = f"{base}/services/audio/tts/SpeechSynthesizer"
    payload: dict[str, Any] = {
        "model": s.tts_model,
        "input": {
            "text": raw,
            "voice": voice,
            "format": "mp3",
            "sample_rate": 24000,
            "rate": rate,
        },
    }

    try:
        async with dashscope_http_client(s) as client:
            resp = await client.post(url, headers=auth_headers(key), json=payload)
            if resp.status_code >= 400:
                log.warning("tts upstream status=%s", resp.status_code)
                raise AppError("speech_upstream", "现在读不了，稍后再试", 502)
            try:
                data = resp.json()
            except Exception as exc:
                raise AppError("speech_upstream", "现在读不了，稍后再试", 502) from exc

            audio_bytes, second = _parse_tts_payload(data)
            if second.startswith("http"):
                if not is_allowed_audio_url(second):
                    log.warning("tts rejected audio host")
                    raise AppError("speech_upstream", "现在读不了，稍后再试", 502)
                audio_resp = await client.get(second)
                if audio_resp.status_code >= 400 or not audio_resp.content:
                    log.warning("tts audio download status=%s", audio_resp.status_code)
                    raise AppError("speech_upstream", "现在读不了，稍后再试", 502)
                ctype = audio_resp.headers.get("content-type") or "audio/mpeg"
                return audio_resp.content, ctype.split(";")[0].strip() or "audio/mpeg"
            if not audio_bytes:
                raise AppError("speech_upstream", "现在读不了，稍后再试", 502)
            return audio_bytes, second or "audio/mpeg"
    except AppError:
        raise
    except httpx.HTTPError as exc:
        log.warning("tts http error: %s", type(exc).__name__)
        raise AppError("speech_upstream", "现在读不了，稍后再试", 502) from exc
