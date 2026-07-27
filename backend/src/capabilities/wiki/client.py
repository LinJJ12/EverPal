from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import quote, urlparse

import httpx

from src.capabilities.wiki.hosts import is_allowed_wikipedia_host, is_allowed_wikipedia_url
from src.capabilities.wiki.intent import _STOPWORDS, extract_topic
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


def content_tokens(text: str) -> list[str]:
    """Tokens usable for soft scoring — never bare stopwords."""
    parts: list[str] = []
    for chunk in (text or "").replace("　", " ").split():
        chunk = chunk.strip()
        if len(chunk) >= 1 and chunk not in _STOPWORDS:
            parts.append(chunk)
    extras: list[str] = []
    for p in parts:
        if 2 <= len(p) <= 6:
            for i in range(len(p) - 1):
                bigram = p[i : i + 2]
                if bigram not in _STOPWORDS:
                    extras.append(bigram)
    return list(dict.fromkeys([*parts, *extras]))


def title_covers_topic(title: str, topic: str) -> bool:
    """
    Hard gate: wiki title must actually be about the asked topic.
    Prevents「什么是性」→「什么是数学」via shared「什么/是」.
    """
    t = (title or "").strip()
    topic = (topic or "").strip()
    # Peel question shells so「什么是性」is checked as「性」.
    topic = extract_topic(topic) or topic
    topic = topic.strip()
    if not t or not topic or topic in _STOPWORDS:
        return False
    if topic in t:
        if len(topic) == 1:
            # Single-char topics are easy false positives (e.g.「性」in「急性…」).
            return t.startswith(topic) or t.endswith(topic) or len(t) <= 3
        return True
    # Multi-char topic: require a 2-char content slice (not function-word glue).
    if len(topic) >= 2:
        glue = set("的了呢吗嘛啊呀吧么什是叫有在与和及或对从到为被把给让我你")
        for i in range(len(topic) - 1):
            piece = topic[i : i + 2]
            if piece in _STOPWORDS:
                continue
            if all(c in glue for c in piece):
                continue
            if piece in t:
                return True
    return False


def score_title_for_query(title: str, query: str, *, topic: str = "") -> int:
    """Prefer short, topic-overlapping encyclopedia titles."""
    t = (title or "").strip()
    q = (query or "").strip()
    if not t or not q:
        return -100
    topic = (topic or extract_topic(q) or q).strip()
    if not title_covers_topic(t, topic):
        return -100

    score = 0
    if t == topic or t == q:
        score += 24
    elif topic in t and len(t) <= len(topic) + 2:
        score += 16
    elif topic in t:
        score += 8
    # Exact encyclopedia lemma (e.g. title「天空」 for query「天空 蓝色」).
    for tok in content_tokens(topic) or content_tokens(q):
        if tok and t == tok:
            score += 18
        elif tok and tok in t:
            score += 4 if len(tok) > 1 else 1
    if len(t) <= 4:
        score += 8
    elif len(t) <= 8:
        score += 2
    if len(t) > 10:
        score -= 8
    if len(t) > 16:
        score -= 10
    return score


def _pick_best_title(candidates: list[str], query: str, *, topic: str) -> str | None:
    best: str | None = None
    best_score = 0
    for title in candidates:
        if not title_covers_topic(title, topic):
            continue
        s = score_title_for_query(title, query, topic=topic)
        if s > best_score:
            best_score = s
            best = title
    # Require a real topic hit (covers_topic already); score floor avoids empty titles.
    if best is None or best_score < 4:
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
            "srlimit": 8,
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
                "limit": 8,
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
    topic: str = "",
    settings: Settings | None = None,
) -> WikiPage | None:
    """Search → intro extract. Returns None on any soft failure or irrelevant hit."""
    s = settings or get_settings()
    q = (query or "").strip()
    if not q:
        return None
    topic = (topic or extract_topic(q) or q).strip()
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
            title = _pick_best_title(candidates, q, topic=topic)
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
            final_title = (page.get("title") or title).strip()
            # Re-check after redirects (e.g. search hit → unrelated redirect target).
            if not title_covers_topic(final_title, topic):
                log.info(
                    "wiki title irrelevant after resolve topic=%r title=%r",
                    topic[:20],
                    final_title[:40],
                )
                return None
            if len(extract) > max_chars:
                extract = extract[: max_chars - 1].rstrip() + "…"
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
