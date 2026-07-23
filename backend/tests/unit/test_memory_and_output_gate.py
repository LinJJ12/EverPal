from __future__ import annotations

from src.capabilities.memory import maybe_extract_from_turn
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
    assert any("画画" in m["text"] for m in memory_repo.list_memories("gate-2"))
