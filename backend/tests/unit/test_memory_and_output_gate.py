from __future__ import annotations

from src.capabilities.memory import maybe_extract_from_turn, snippet
from src.capabilities.safety import clear_lexicon_cache, filter_output
from src.domain.enums import Mode, SafetyAction
from src.storage import memory_repo, profile_repo
from src.storage.db import init_db


def setup_function() -> None:
    clear_lexicon_cache()


def test_filter_output_rewrites_unsafe(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 't.db'}")
    from src.config.settings import get_settings

    get_settings.cache_clear()
    text, action = filter_output("我们可以聊聊怎么自杀吧", Mode.CHILD)
    assert action == SafetyAction.BLOCK
    assert "自杀" not in text or "热线" in text or "大人" in text


def test_memory_skips_lexicon_hit(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'm.db'}")
    from src.config.settings import get_settings

    get_settings.cache_clear()
    init_db()
    profile_repo.ensure_profile("gate-1")
    assert maybe_extract_from_turn(
        client_id="gate-1",
        user_text="我喜欢自杀",
        mode=Mode.CHILD,
    ) is None
    assert memory_repo.list_memories("gate-1") == []


def test_memory_saves_safe_like(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'm2.db'}")
    from src.config.settings import get_settings

    get_settings.cache_clear()
    init_db()
    profile_repo.ensure_profile("gate-2")
    note = maybe_extract_from_turn(
        client_id="gate-2",
        user_text="我喜欢画画",
        mode=Mode.CHILD,
    )
    assert note is not None
    mems = memory_repo.list_memories("gate-2")
    assert any("画画" in m["text"] for m in mems)
    assert mems[0]["category"] == "like"


def test_memory_extract_dispatch_categories(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'm3.db'}")
    from src.config.settings import get_settings

    get_settings.cache_clear()
    init_db()

    cases = [
        ("disp-dislike", "我不喜欢菠菜", "dislike"),
        ("disp-like", "我喜欢画画", "like"),
        ("disp-pref", "我叫小木", "preference"),
        ("disp-event", "今天去了公园", "event"),
        ("disp-dislike-over-like", "我不喜欢我喜欢的那种辣", "dislike"),
    ]
    for cid, text, expected in cases:
        profile_repo.ensure_profile(cid)
        note = maybe_extract_from_turn(client_id=cid, user_text=text, mode=Mode.CHILD)
        assert note is not None, text
        mems = memory_repo.list_memories(cid)
        assert mems[0]["category"] == expected, text


def test_memory_dedupes_repeated_like(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'm5.db'}")
    from src.config.settings import get_settings

    get_settings.cache_clear()
    init_db()
    profile_repo.ensure_profile("dedup-1")
    assert maybe_extract_from_turn(client_id="dedup-1", user_text="我喜欢画画", mode=Mode.CHILD)
    assert (
        maybe_extract_from_turn(client_id="dedup-1", user_text="我喜欢画画！", mode=Mode.CHILD)
        is None
    )
    assert len(memory_repo.list_memories("dedup-1")) == 1


def test_memory_remember_instruction(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'm6.db'}")
    from src.config.settings import get_settings

    get_settings.cache_clear()
    init_db()
    profile_repo.ensure_profile("rem-1")
    note = maybe_extract_from_turn(
        client_id="rem-1",
        user_text="帮我记住明天要带水彩笔",
        mode=Mode.CHILD,
    )
    assert note is not None
    mems = memory_repo.list_memories("rem-1")
    assert mems[0]["category"] == "preference"
    assert "水彩笔" in mems[0]["text"]


def test_memory_like_syncs_profile_likes(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'm7.db'}")
    from src.config.settings import get_settings

    get_settings.cache_clear()
    init_db()
    profile_repo.ensure_profile("like-sync-1")
    maybe_extract_from_turn(client_id="like-sync-1", user_text="我喜欢恐龙", mode=Mode.CHILD)
    profile = profile_repo.get_profile("like-sync-1")
    assert profile is not None
    assert "恐龙" in (profile.get("likes") or [])
    s = snippet(client_id="like-sync-1")
    assert "恐龙" in s


def test_snippet_orders_by_category(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'm4.db'}")
    from src.config.settings import get_settings

    get_settings.cache_clear()
    init_db()
    profile_repo.upsert_profile(
        "snip-1",
        nickname="小木",
        mode="child",
        companion_id="nuan",
        likes=["恐龙"],
    )
    # insert out of order: event first, then like, preference, dislike
    memory_repo.add_memory("snip-1", "今天去了动物园", category="event")
    memory_repo.add_memory("snip-1", "我喜欢画画", category="like")
    memory_repo.add_memory("snip-1", "我叫小木记一下", category="preference")
    memory_repo.add_memory("snip-1", "我不喜欢菠菜", category="dislike")
    s = snippet(client_id="snip-1")
    # nickname and likes first
    assert s.startswith("称呼 小木；喜欢 恐龙；")
    # then preference → like → dislike → event among memory texts
    pos_pref = s.index("我叫小木记一下")
    pos_like = s.index("我喜欢画画")
    pos_dis = s.index("我不喜欢菠菜")
    pos_evt = s.index("今天去了动物园")
    assert pos_pref < pos_like < pos_dis < pos_evt
