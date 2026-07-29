"""Aliyun Green TextModerationPlus HTTP client."""

from __future__ import annotations

import json
from urllib.parse import urlparse

import httpx

from src.capabilities.moderation.acs3 import acs3_headers
from src.config.settings import Settings
from src.lib.logging import get_logger

log = get_logger("capabilities.moderation.client")

_ACTION = "TextModerationPlus"
_VERSION = "2022-03-02"
_MAX_CHARS = 2000


def _endpoint_ok(url: str) -> bool:
    try:
        p = urlparse((url or "").strip())
    except ValueError:
        return False
    if p.scheme != "https" or not p.hostname:
        return False
    host = p.hostname.lower()
    return host == "green-cip.cn-shanghai.aliyuncs.com" or (
        host.startswith("green-cip.") and host.endswith(".aliyuncs.com")
    )


async def fetch_moderation_data(
    content: str,
    *,
    settings: Settings,
    chat_id: str | None = None,
) -> dict | None:
    """
    Call TextModerationPlus; return Data object on Code==200.
    Any failure → None (caller fail-opens).
    """
    text = (content or "").strip()
    if not text:
        return None
    if len(text) > _MAX_CHARS:
        text = text[:_MAX_CHARS]

    endpoint = (settings.moderation_endpoint or "").strip().rstrip("/")
    if not _endpoint_ok(endpoint):
        log.warning("moderation endpoint rejected")
        return None

    ak = settings.moderation_access_key_id.strip()
    sk = settings.moderation_access_key_secret.strip()
    if not ak or not sk:
        return None

    service_params: dict[str, str] = {"content": text}
    if chat_id:
        service_params["chatId"] = chat_id[:64]

    body_obj = {
        "Service": (settings.moderation_service or "query_security_check").strip(),
        "ServiceParameters": json.dumps(service_params, ensure_ascii=False),
    }
    body = json.dumps(body_obj, ensure_ascii=False).encode("utf-8")
    url = endpoint + "/"
    try:
        headers = acs3_headers(
            method="POST",
            url=url,
            access_key_id=ak,
            access_key_secret=sk,
            action=_ACTION,
            version=_VERSION,
            body=body,
        )
    except Exception as exc:  # noqa: BLE001
        log.warning("moderation sign failed: %s", type(exc).__name__)
        return None

    timeout = httpx.Timeout(float(settings.moderation_timeout_seconds or 2.0))
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=False) as client:
            resp = await client.post(url, content=body, headers=headers)
    except httpx.TimeoutException:
        log.warning("moderation timeout")
        return None
    except httpx.HTTPError as exc:
        log.warning("moderation http error: %s", type(exc).__name__)
        return None

    if resp.status_code >= 400:
        log.warning("moderation http status=%s", resp.status_code)
        return None

    try:
        payload = resp.json()
    except Exception:
        log.warning("moderation non-json body")
        return None

    code = payload.get("Code")
    if code != 200 and code != "200":
        log.warning("moderation code=%s message=%s", code, payload.get("Message"))
        return None

    data = payload.get("Data")
    return data if isinstance(data, dict) else None
