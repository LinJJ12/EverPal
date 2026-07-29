from __future__ import annotations

from unittest.mock import AsyncMock, patch

import httpx
import pytest

from src.capabilities.wiki.client import (
    WikiPage,
    fetch_page_extract,
    page_url,
    score_title_for_query,
    title_covers_topic,
)
from src.capabilities.wiki.hosts import is_allowed_wikipedia_host, is_allowed_wikipedia_url
from src.capabilities.wiki.intent import (
    extract_topic,
    looks_like_encyclopedia_question,
    search_queries_from_message,
    search_query_from_message,
)
from src.capabilities.wiki.lookup import maybe_lookup, sources_for_sse
from src.capabilities.wiki.lookup import WikiLookup, WikiSource
from src.config.settings import Settings, get_settings
from src.domain.enums import Mode


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_intent_encyclopedia_vs_chitchat():
    assert looks_like_encyclopedia_question("为什么天是蓝的？")
    assert looks_like_encyclopedia_question("什么是恐龙？")
    assert looks_like_encyclopedia_question("谁发明了电灯")
    assert not looks_like_encyclopedia_question("今天好开心")
    assert not looks_like_encyclopedia_question("你好")
    assert not looks_like_encyclopedia_question("嗯")
    # Location chitchat must not trigger wiki
    assert not looks_like_encyclopedia_question("你在哪里")
    assert not looks_like_encyclopedia_question("你在哪")


def test_search_query_strips_question_shell():
    q = search_query_from_message("为什么天是蓝的？")
    assert "天" in q
    assert "为什么" not in q


def test_extract_topic_colloquial():
    assert extract_topic("讲讲恐龙") == "恐龙"
    assert extract_topic("彩虹咋来的") == "彩虹"
    assert extract_topic("雨从哪来的") == "雨"


def test_search_queries_lemma_sky_colloquial():
    qs = search_queries_from_message("天为啥蓝？")
    assert "天空 蓝色" in qs or "天空" in qs
    lemma_hit = next(q for q in ("天空 蓝色", "天空") if q in qs)
    raw = "天为啥蓝"
    if raw in qs:
        assert qs.index(lemma_hit) < qs.index(raw)


def test_search_queries_talk_about_dinosaur():
    qs = search_queries_from_message("讲讲恐龙")
    assert qs[0] == "恐龙" or "恐龙" in qs[:2]


def test_search_queries_prefer_topic_first():
    qs = search_queries_from_message("什么是性？")
    assert qs[0] == "性"


def test_search_queries_prefer_natural_question():
    qs = search_queries_from_message("为什么天是蓝的？")
    assert "天空 蓝色" in qs or "天空" in qs


def test_title_relevance_rejects_math_for_sex_question():
    assert extract_topic("什么是性？") == "性"
    assert not title_covers_topic("什么是数学？", "性")
    assert not title_covers_topic("什么是数学", "性")
    assert not title_covers_topic("什么是数学？", "什么是性")
    assert not title_covers_topic("急性肠胃炎", "性")
    assert title_covers_topic("性别", "性")
    assert title_covers_topic("恐龙", "恐龙")
    # Shared question shell must not count as relevance
    assert score_title_for_query("什么是数学？", "什么是性", topic="性") < 0


def test_score_title_prefers_sky_over_frog():
    sky = score_title_for_query("天空", "天空 蓝色", topic="天空")
    frog = score_title_for_query("天蓝丛蛙", "天是蓝的", topic="天是蓝的")
    anime = score_title_for_query("知道天空有多藍的人啊", "天空 蓝色", topic="天空 蓝色")
    assert sky >= 4
    assert frog < 0
    assert sky > anime


def test_search_queries_sky_expansions_before_clause():
    qs = search_queries_from_message("为什么天是蓝的？")
    assert "天空" in qs or "天空 蓝色" in qs
    # Expanded keywords should appear before the noisy clause「天是蓝的」
    if "天是蓝的" in qs and "天空" in qs:
        assert qs.index("天空") < qs.index("天是蓝的") or (
            "天空 蓝色" in qs and qs.index("天空 蓝色") < qs.index("天是蓝的")
        )


def test_page_url():
    url = page_url("天空", api_base="https://zh.wikipedia.org/w/api.php")
    assert url == "https://zh.wikipedia.org/wiki/%E5%A4%A9%E7%A9%BA"
    assert is_allowed_wikipedia_url(url)


def test_host_allowlist_rejects_lookalike():
    assert is_allowed_wikipedia_host("zh.wikipedia.org")
    assert is_allowed_wikipedia_host("wikipedia.org")
    assert not is_allowed_wikipedia_host("evilwikipedia.org")
    assert not is_allowed_wikipedia_host("zh.wikipedia.org.evil.com")
    assert not is_allowed_wikipedia_url("http://zh.wikipedia.org/wiki/x")
    assert not is_allowed_wikipedia_url("https://evilwikipedia.org/wiki/x")
    assert is_allowed_wikipedia_url("https://zh.wikipedia.org/wiki/天空")


@pytest.mark.asyncio
async def test_maybe_lookup_disabled():
    s = Settings(wiki_enabled=False)
    out = await maybe_lookup("为什么天是蓝的", mode=Mode.CHILD, settings=s)
    assert out is None


@pytest.mark.asyncio
async def test_maybe_lookup_skips_chitchat():
    s = Settings(wiki_enabled=True)
    with patch(
        "src.capabilities.wiki.lookup.wiki_client.fetch_page_extract",
        new_callable=AsyncMock,
    ) as fetch:
        out = await maybe_lookup("今天好开心呀", mode=Mode.CHILD, settings=s)
    assert out is None
    fetch.assert_not_awaited()


@pytest.mark.asyncio
async def test_maybe_lookup_success():
    s = Settings(wiki_enabled=True, wiki_max_chars=200)
    page = WikiPage(
        title="天空",
        extract="天空是大气层看起来的样子。",
        url="https://zh.wikipedia.org/wiki/%E5%A4%A9%E7%A9%BA",
    )
    with patch(
        "src.capabilities.wiki.lookup.wiki_client.fetch_page_extract",
        new_callable=AsyncMock,
        return_value=page,
    ):
        out = await maybe_lookup("为什么天是蓝的", mode=Mode.CHILD, settings=s)
    assert out is not None
    assert out.sources[0].title == "天空"
    assert "天空" in out.prompt_block()
    assert sources_for_sse(out)


@pytest.mark.asyncio
async def test_maybe_lookup_rejects_bad_source_url():
    s = Settings(wiki_enabled=True)
    page = WikiPage(
        title="天空",
        extract="天空是大气层看起来的样子。",
        url="https://evilwikipedia.org/wiki/x",
    )
    with patch(
        "src.capabilities.wiki.lookup.wiki_client.fetch_page_extract",
        new_callable=AsyncMock,
        return_value=page,
    ):
        out = await maybe_lookup("为什么天是蓝的", mode=Mode.CHILD, settings=s)
    assert out is None


@pytest.mark.asyncio
async def test_maybe_lookup_filters_unsafe_extract():
    s = Settings(wiki_enabled=True)
    page = WikiPage(
        title="测试",
        extract="请不要自我伤害，这是危险的。",
        url="https://zh.wikipedia.org/wiki/x",
    )
    with patch(
        "src.capabilities.wiki.lookup.wiki_client.fetch_page_extract",
        new_callable=AsyncMock,
        return_value=page,
    ):
        out = await maybe_lookup("什么是测试", mode=Mode.CHILD, settings=s)
    assert out is None


@pytest.mark.asyncio
async def test_fetch_rejects_non_wikipedia_api_base():
    s = Settings(
        wiki_enabled=True,
        wiki_api_base="https://evil.example/w/api.php",
        wiki_timeout_seconds=1.0,
    )
    out = await fetch_page_extract("天空", settings=s)
    assert out is None


@pytest.mark.asyncio
async def test_fetch_page_extract_http_error_returns_none():
    s = Settings(wiki_enabled=True, wiki_timeout_seconds=1.0)
    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None
    mock_client.get = AsyncMock(side_effect=httpx.ConnectError("offline"))

    with patch("src.capabilities.wiki.client.httpx.AsyncClient", return_value=mock_client):
        out = await fetch_page_extract("天空", settings=s)
    assert out is None


@pytest.mark.asyncio
async def test_chat_done_includes_sources():
    from src.schemas.chat import ChatStreamRequest
    from src.services.chat import run_chat_stream

    s = Settings(allow_mock_llm=True, llm_api_key="", wiki_enabled=True)
    lookup = WikiLookup(
        snippet="摘要内容。",
        sources=[WikiSource(title="天空", url="https://zh.wikipedia.org/wiki/x")],
    )
    req = ChatStreamRequest(
        message="为什么天是蓝的",
        mode="child",
        companion_id="nuan",
        persist=False,
        use_wiki=True,
    )
    events = []
    with patch(
        "src.services.chat.maybe_lookup",
        new_callable=AsyncMock,
        return_value=lookup,
    ) as wiki_mock:
        async for ev in run_chat_stream(req, settings=s):
            events.append(ev)
    wiki_mock.assert_awaited()
    assert wiki_mock.await_args.kwargs.get("force") is True
    done = [e for e in events if e.event == "done"][-1]
    assert done.data.get("sources")
    assert done.data["sources"][0]["title"] == "天空"


@pytest.mark.asyncio
async def test_chat_skips_wiki_without_use_wiki_flag():
    from src.schemas.chat import ChatStreamRequest
    from src.services.chat import run_chat_stream

    s = Settings(allow_mock_llm=True, llm_api_key="", wiki_enabled=True)
    req = ChatStreamRequest(
        message="为什么天是蓝的",
        mode="child",
        companion_id="nuan",
        persist=False,
        use_wiki=False,
    )
    wiki_mock = AsyncMock(return_value=None)
    with patch("src.services.chat.maybe_lookup", wiki_mock):
        events = []
        async for ev in run_chat_stream(req, settings=s):
            events.append(ev)
    wiki_mock.assert_not_awaited()
    done = [e for e in events if e.event == "done"][-1]
    assert "sources" not in done.data


@pytest.mark.asyncio
async def test_chat_done_omits_sources_when_no_wiki():
    from src.schemas.chat import ChatStreamRequest
    from src.services.chat import run_chat_stream

    s = Settings(allow_mock_llm=True, llm_api_key="", wiki_enabled=True)
    req = ChatStreamRequest(
        message="今天好开心呀",
        mode="child",
        companion_id="nuan",
        persist=False,
        use_wiki=True,
    )
    events = []
    with patch(
        "src.services.chat.maybe_lookup",
        new_callable=AsyncMock,
        return_value=None,
    ):
        async for ev in run_chat_stream(req, settings=s):
            events.append(ev)
    done = [e for e in events if e.event == "done"][-1]
    assert "sources" not in done.data


@pytest.mark.asyncio
async def test_chat_skips_wiki_on_input_rewrite():
    from src.capabilities.safety import SafetyHit
    from src.domain.enums import SafetyAction
    from src.schemas.chat import ChatStreamRequest
    from src.services.chat import run_chat_stream

    s = Settings(allow_mock_llm=True, llm_api_key="", wiki_enabled=True)
    req = ChatStreamRequest(
        message="什么是恋爱",
        mode="child",
        companion_id="nuan",
        persist=False,
        use_wiki=True,
    )
    hit = SafetyHit(
        category="romance_boundary",
        action=SafetyAction.REWRITE,
        reply="我们聊点别的吧。",
    )
    wiki_mock = AsyncMock(return_value=None)
    with (
        patch("src.services.chat.safety_cap.check_input", return_value=hit),
        patch("src.services.chat.maybe_lookup", wiki_mock),
    ):
        events = []
        async for ev in run_chat_stream(req, settings=s):
            events.append(ev)
    wiki_mock.assert_not_awaited()
    assert any(e.event == "done" for e in events)


@pytest.mark.asyncio
async def test_maybe_lookup_drops_irrelevant_page_for_topic():
    """Regression:「什么是性」must not accept「什么是数学」as a source."""
    s = Settings(wiki_enabled=True)
    page = WikiPage(
        title="什么是数学？",
        extract="数学是研究数量等的科学。",
        url="https://zh.wikipedia.org/wiki/x",
    )
    with patch(
        "src.capabilities.wiki.lookup.wiki_client.fetch_page_extract",
        new_callable=AsyncMock,
        return_value=page,
    ):
        out = await maybe_lookup("什么是性？", mode=Mode.CHILD, settings=s, force=True)
    assert out is None
