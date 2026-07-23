from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

import httpx

from src.config.llm import create_llm_http_client
from src.config.settings import Settings, get_settings
from src.lib.exceptions import AppError
from src.lib.logging import get_logger

log = get_logger("capabilities.llm")


async def stream_chat_completion(
    *,
    system: str,
    messages: list[dict[str, str]],
    settings: Settings | None = None,
) -> AsyncIterator[str]:
    s = settings or get_settings()
    if not s.has_llm_key:
        if s.allow_mock_llm:
            async for chunk in _mock_stream(messages):
                yield chunk
            return
        raise AppError(
            "upstream_unavailable",
            "现在有点忙，稍后再试一下吧",
            503,
        )

    payload: dict[str, Any] = {
        "model": s.llm_model,
        "stream": True,
        "messages": [{"role": "system", "content": system}, *messages],
    }
    client = create_llm_http_client(s)
    try:
        async with client.stream("POST", "/chat/completions", json=payload) as resp:
            if resp.status_code >= 400:
                log.warning("llm upstream status=%s", resp.status_code)
                await resp.aread()
                raise AppError(
                    "upstream_unavailable",
                    "现在有点忙，稍后再试一下吧",
                    503,
                )
            async for line in resp.aiter_lines():
                if not line:
                    continue
                if line.startswith("data:"):
                    data = line[5:].strip()
                else:
                    data = line.strip()
                if not data or data == "[DONE]":
                    if data == "[DONE]":
                        break
                    continue
                try:
                    obj = json.loads(data)
                except json.JSONDecodeError:
                    continue
                choices = obj.get("choices") or []
                if not choices:
                    continue
                delta = (choices[0].get("delta") or {}).get("content")
                if delta:
                    yield delta
    except AppError:
        raise
    except httpx.HTTPError as exc:
        log.warning("llm http error: %s", type(exc).__name__)
        raise AppError(
            "upstream_unavailable",
            "现在有点忙，稍后再试一下吧",
            503,
        ) from exc
    finally:
        await client.aclose()


async def _mock_stream(messages: list[dict[str, str]]) -> AsyncIterator[str]:
    last = ""
    for m in reversed(messages):
        if m.get("role") == "user":
            last = (m.get("content") or "")[:40]
            break
    text = f"嗯，我听见啦。你刚说的是「{last or '…'}」。想听短故事，还是继续聊这个？"
    for ch in text:
        yield ch
