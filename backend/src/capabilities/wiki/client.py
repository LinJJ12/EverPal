from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import quote, urlparse

import httpx

from src.capabilities.wiki.hosts import is_allowed_wikipedia_host, is_allowed_wikipedia_url
from src.config.settings import Settings, get_settings
from src.lib.logging import get_logger

log = get_logger("capabilities.wiki.client")

_DEFAULT_UA = "JiubanCompanion/1.0 (kids encyclopedia assist; https://github.com/LinJJ12/chatbot)"


@dataclass(frozen=True)
class WikiPage:
    title: str
    extract: str
    url: str


def page_url(title: str, *, api_base: str) -> str:
    """Build a canonical article URL from wiki API base."""
    root = api_base.split("/w/api.php")[0].rstrip("/")
    slug = quote(title.replace(" ", "_"), safe="()'")
    return f"{root}/wiki/{slug}"


def _resolved_api_base(settings: Settings) -> str | None:
    api = (getattr(settings, "wiki_api_base", None) or "https://zh.wikipedia.org/w/api.php").strip()
    try:
        parsed = urlparse(api)
    except ValueError:
        return None
    if parsed.scheme != "https" or not parsed.hostname:
        log.warning("wiki api base rejected scheme/host")
        return None
    if not is_allowed_wikipedia_host(parsed.hostname):
        log.warning("wiki api base host not allowlisted: %s", parsed.hostname)
        return None
    return api


def _query_tokens(query: str) -> list[str]:
    parts = []
    for chunk in (query or "").replace("　", " ").split():
        chunk = chunk.strip()
        if len(chunk) >= 1:
            parts.append(chunk)
    # Also single CJK chars from short tokens for overlap (天/蓝)
    extras: list[str] = []
    for p in parts:
        if len(p) <= 4:
            extras.extend(list(p))
    return list(dict.fromkeys([*parts, *extras]))


def score_title_for_query(title: str, query: str) -> int:
    """Prefer short, overlapping encyclopedia titles over long media titles."""
    t = (title or "").strip()
    q = (query or "").strip()
    if not t or not q:
        return -100
    score = 0
    if t == q or t in q:
        score += 12
    for tok in _query_tokens(q):
        if tok and tok in t:
            score += 3 if len(tok) > 1 else 1
    # Penalize long / “作品名” style titles common in noisy search hits.
    if len(t) > 10:
        score -= 4
    if len(t) > 16:
        score -= 4
    return score


def _pick_best_title(candidates: list[str], query: str) -> str | None:
    best: str | None = None
    best_score = 0
    for title in candidates:
        s = score_title_for_query(title, query)
        if s > best_score:
            best_score = s
            best = title
    # Require a minimum overlap so「天蓝丛蛙」does not win for「天是蓝的」.
    if best is None or best_score < 3:
        return None
    return best


async def _search_titles(
    client: httpx.AsyncClient,
    api: str,
    query: str,
) -> list[str]:
    """Full-text search first, then opensearch suggestions."""
    titles: list[str] = []
    sr = await client.get(
        api,
        params={
            "action": "query",
            "list": "search",
            "srsearch": query,
            "srlimit": 5,
            "srnamespace": 0,
            "format": "json",
            "formatversion": 2,
        },
    )
    if sr.status_code < 400 and is_allowed_wikipedia_host(urlparse(str(sr.url)).hostname):
        pages = ((sr.json() or {}).get("query") or {}).get("search") or []
        for p in pages:
            title = str(p.get("title") or "").strip()
            if title:
                titles.append(title)

    if not titles:
        os_resp = await client.get(
            api,
            params={
                "action": "opensearch",
                "search": query,
                "limit": 5,
                "namespace": 0,
                "format": "json",
            },
        )
        if os_resp.status_code < 400 and is_allowed_wikipedia_host(
            urlparse(str(os_resp.url)).hostname
        ):
            os_data = os_resp.json()
            raw = os_data[1] if isinstance(os_data, list) and len(os_data) > 1 else []
            titles.extend(str(t).strip() for t in raw if str(t).strip())
    return titles


async def fetch_page_extract(
    query: str,
    *,
    settings: Settings | None = None,
) -> WikiPage | None:
    """Search → intro extract. Returns None on any soft failure."""
    s = settings or get_settings()
    q = (query or "").strip()
    if not q:
        return None
    timeout = float(getattr(s, "wiki_timeout_seconds", 3.0) or 3.0)
    api = _resolved_api_base(s)
    if not api:
        return None
    max_chars = max(80, int(getattr(s, "wiki_max_chars", 600) or 600))

    headers = {"User-Agent": _DEFAULT_UA, "Accept": "application/json"}
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            headers=headers,
            follow_redirects=True,
        ) as client:
            candidates = await _search_titles(client, api, q)
            title = _pick_best_title(candidates, q)
            if not title:
                return None

            ex_resp = await client.get(
                api,
                params={
                    "action": "query",
                    "prop": "extracts",
                    "exintro": 1,
                    "explaintext": 1,
                    "redirects": 1,
                    "titles": title,
                    "format": "json",
                    "formatversion": 2,
                },
            )
            if ex_resp.status_code >= 400:
                log.warning("wiki extracts status=%s", ex_resp.status_code)
                return None
            if not is_allowed_wikipedia_host(urlparse(str(ex_resp.url)).hostname):
                log.warning("wiki extracts redirected off allowlist")
                return None
            pages = ((ex_resp.json() or {}).get("query") or {}).get("pages") or []
            if not pages:
                return None
            page = pages[0]
            if page.get("missing"):
                return None
            extract = (page.get("extract") or "").strip()
            if not extract:
                return None
            if len(extract) > max_chars:
                extract = extract[: max_chars - 1].rstrip() + "…"
            final_title = (page.get("title") or title).strip()
            url = page_url(final_title, api_base=api)
            if not is_allowed_wikipedia_url(url):
                log.warning("wiki article url rejected")
                return None
            return WikiPage(
                title=final_title,
                extract=extract,
                url=url,
            )
    except httpx.HTTPError as exc:
        log.warning("wiki http error: %s", type(exc).__name__)
        return None
    except (TypeError, ValueError, IndexError, KeyError) as exc:
        log.warning("wiki parse error: %s", type(exc).__name__)
        return None
