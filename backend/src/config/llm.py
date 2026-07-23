"""LLM client factory — the only place that builds the upstream HTTP client."""

from __future__ import annotations

import httpx

from src.config.settings import Settings, get_settings


def create_llm_http_client(settings: Settings | None = None) -> httpx.AsyncClient:
    s = settings or get_settings()
    headers: dict[str, str] = {"Content-Type": "application/json"}
    if s.llm_api_key.strip():
        headers["Authorization"] = f"Bearer {s.llm_api_key.strip()}"
    return httpx.AsyncClient(
        base_url=s.llm_base_url.rstrip("/"),
        headers=headers,
        timeout=httpx.Timeout(s.llm_timeout_seconds),
    )
