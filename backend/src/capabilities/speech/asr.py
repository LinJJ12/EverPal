from __future__ import annotations

import base64
from typing import Any

import httpx

from src.capabilities.speech.client import auth_headers, dashscope_http_client, require_dashscope_key
from src.config.settings import Settings, get_settings
from src.lib.exceptions import AppError
from src.lib.logging import get_logger

log = get_logger("capabilities.speech.asr")

_MIME_BY_EXT = {
    "wav": "audio/wav",
    "mp3": "audio/mpeg",
    "mpeg": "audio/mpeg",
    "mp4": "audio/mp4",
    "m4a": "audio/mp4",
    "webm": "audio/webm",
    "ogg": "audio/ogg",
    "opus": "audio/ogg",
}


def guess_audio_mime(filename: str | None, content_type: str | None) -> str:
    ct = (content_type or "").split(";")[0].strip().lower()
    if ct.startswith("audio/"):
        return ct
    name = (filename or "").lower()
    for ext, mime in _MIME_BY_EXT.items():
        if name.endswith(f".{ext}"):
            return mime
    return "audio/webm"


def _extract_transcript(data: dict[str, Any]) -> str:
    if data.get("error"):
        err = data.get("error")
        code = ""
        if isinstance(err, dict):
            code = str(err.get("code") or err.get("type") or "")
        elif isinstance(err, str):
            code = err
        log.warning("asr upstream error code=%s", code or "?")
        if any(x in code.lower() for x in ("apikey", "unauthorized", "forbidden", "quota")):
            raise AppError(
                "speech_unavailable",
                "云端听写暂不可用，试试浏览器说话或打字聊",
                503,
            )
        raise AppError("speech_upstream", "没听清，再试一次或打字吧", 502)

    choices = data.get("choices") or []
    if choices:
        msg = choices[0].get("message") or {}
        content = msg.get("content")
        if isinstance(content, str) and content.strip():
            return content.strip()
        if isinstance(content, list):
            parts: list[str] = []
            for item in content:
                if isinstance(item, dict):
                    t = item.get("text") or item.get("content")
                    if isinstance(t, str) and t.strip():
                        parts.append(t.strip())
                elif isinstance(item, str) and item.strip():
                    parts.append(item.strip())
            if parts:
                return "".join(parts)
    output = data.get("output") or {}
    if isinstance(output.get("text"), str) and output["text"].strip():
        return output["text"].strip()
    raise AppError("speech_upstream", "没听清，再试一次或打字吧", 502)


async def transcribe_audio(
    *,
    audio: bytes,
    filename: str | None = None,
    content_type: str | None = None,
    settings: Settings | None = None,
) -> str:
    s = settings or get_settings()
    key = require_dashscope_key(s, kind="asr")
    if not audio:
        raise AppError("validation_error", "没听到声音，再试一次吧", 400)
    if len(audio) > s.speech_asr_max_bytes:
        raise AppError("validation_error", "这段话有点长，缩短一点再试试", 400)

    mime = guess_audio_mime(filename, content_type)
    data_uri = f"data:{mime};base64,{base64.b64encode(audio).decode('ascii')}"
    base = s.dashscope_compat_base_url.rstrip("/")
    url = f"{base}/chat/completions"
    payload: dict[str, Any] = {
        "model": s.asr_model,
        "stream": False,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_audio",
                        "input_audio": {"data": data_uri},
                    }
                ],
            }
        ],
        "asr_options": {"language": "zh", "enable_itn": False},
    }

    try:
        async with dashscope_http_client(s) as client:
            resp = await client.post(url, headers=auth_headers(key), json=payload)
            if resp.status_code in (401, 403):
                raise AppError(
                    "speech_unavailable",
                    "云端听写暂不可用，试试浏览器说话或打字聊",
                    503,
                )
            if resp.status_code >= 400:
                log.warning("asr upstream status=%s", resp.status_code)
                raise AppError("speech_upstream", "没听清，再试一次或打字吧", 502)
            try:
                data = resp.json()
            except Exception as exc:
                raise AppError("speech_upstream", "没听清，再试一次或打字吧", 502) from exc
            return _extract_transcript(data)
    except AppError:
        raise
    except httpx.HTTPError as exc:
        log.warning("asr http error: %s", type(exc).__name__)
        raise AppError("speech_upstream", "没听清，再试一次或打字吧", 502) from exc
