from __future__ import annotations

import re
from dataclasses import dataclass

from src.capabilities import safety as safety_cap
from src.capabilities.wiki import client as wiki_client
from src.capabilities.wiki.hosts import is_allowed_wikipedia_url
from src.capabilities.wiki.intent import (
    looks_like_encyclopedia_question,
    search_queries_from_message,
)
from src.config.settings import Settings, get_settings
from src.domain.enums import Mode, SafetyAction
from src.lib.logging import get_logger

log = get_logger("capabilities.wiki")


@dataclass(frozen=True)
class WikiSource:
    title: str
    url: str


@dataclass(frozen=True)
class WikiLookup:
    snippet: str
    sources: list[WikiSource]

    def prompt_block(self) -> str:
        src = self.sources[0] if self.sources else None
        title = src.title if src else "百科"
        return (
            "【百科摘要·仅供参考】\n"
            f"标题：{title}\n"
            f"摘要：{self.snippet}\n"
            "请用伙伴口吻、短句向小朋友解释；不要编造摘要以外的具体数据；"
            "不要输出 Markdown 链接或网址。"
        )


def _sanitize_text(text: str, *, max_len: int) -> str:
    """Flatten control chars so extract cannot break prompt structure."""
    t = (text or "").replace("\x00", "")
    t = re.sub(r"[\r\n\t]+", " ", t)
    t = re.sub(r" {2,}", " ", t).strip()
    if len(t) > max_len:
        t = t[: max_len - 1].rstrip() + "…"
    return t


def _sources_payload(lookup: WikiLookup) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for s in lookup.sources:
        if not is_allowed_wikipedia_url(s.url):
            continue
        title = _sanitize_text(s.title, max_len=120) or "维基百科"
        out.append({"title": title, "url": s.url.strip()})
    return out


async def maybe_lookup(
    message: str,
    *,
    mode: Mode | str = Mode.CHILD,
    settings: Settings | None = None,
    force: bool = False,
) -> WikiLookup | None:
    """
    Server-side wiki tool: MediaWiki → lexicon on extract.
    When ``force`` is False, also requires encyclopedia-like wording (legacy/tests).
    Product path: UI sets use_wiki → chat calls with force=True.
    Returns None to silently skip injection.
    """
    s = settings or get_settings()
    if not bool(getattr(s, "wiki_enabled", True)):
        return None
    if not force and not looks_like_encyclopedia_question(message):
        return None
    if force and len((message or "").strip()) < 2:
        return None

    queries = search_queries_from_message(message)
    page = None
    used_query = ""
    for query in queries[:3]:
        page = await wiki_client.fetch_page_extract(query, settings=s)
        if page is not None:
            used_query = query
            break
    if page is None:
        log.info("wiki miss queries=%r", [q[:40] for q in queries])
        return None
    log.debug("wiki matched query=%r", used_query[:40])

    mode_e = Mode.coerce(mode)
    title = _sanitize_text(page.title, max_len=120)
    extract = _sanitize_text(page.extract, max_len=int(getattr(s, "wiki_max_chars", 600) or 600))
    if not title or not extract:
        return None
    if not is_allowed_wikipedia_url(page.url):
        log.info("wiki url rejected after fetch")
        return None

    hit = safety_cap.check_input(extract, mode_e)
    if hit and hit.action in (SafetyAction.BLOCK, SafetyAction.REWRITE):
        log.info("wiki extract blocked category=%s", hit.category)
        return None

    th = safety_cap.check_input(title, mode_e)
    if th and th.action in (SafetyAction.BLOCK, SafetyAction.REWRITE):
        log.info("wiki title blocked category=%s", th.category)
        return None

    lookup = WikiLookup(
        snippet=extract,
        sources=[WikiSource(title=title, url=page.url.strip())],
    )
    log.info("wiki hit title=%s force=%s", title, force)
    return lookup


def sources_for_sse(lookup: WikiLookup) -> list[dict[str, str]]:
    return _sources_payload(lookup)
