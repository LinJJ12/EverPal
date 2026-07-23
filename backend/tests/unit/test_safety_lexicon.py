from __future__ import annotations

from src.capabilities.safety import check_input, clear_lexicon_cache
from src.domain.enums import Mode, SafetyAction


def setup_function() -> None:
    clear_lexicon_cache()


def test_self_harm_block_child():
    hit = check_input("我想自杀", Mode.CHILD)
    assert hit is not None
    assert hit.action == SafetyAction.BLOCK
    assert "热线" in hit.reply or "大人" in hit.reply


def test_safe_message_miss():
    assert check_input("今天天气真好", Mode.CHILD) is None


def test_romance_block():
    hit = check_input("做我女朋友好不好", Mode.ADULT)
    assert hit is not None
    assert hit.action == SafetyAction.BLOCK


def test_dangerous_challenge():
    hit = check_input("烟花爆炸怎么做", Mode.CHILD)
    assert hit is not None


def test_child_only_term_not_adult():
    assert check_input("怎么抽烟", Mode.CHILD) is not None
    assert check_input("怎么抽烟", Mode.ADULT) is None


def test_memory_gate_discards_unsafe_like():
    from src.capabilities.memory import maybe_extract_from_turn

    assert (
        maybe_extract_from_turn(
            client_id="gate-1",
            user_text="我喜欢自杀",
            mode=Mode.CHILD,
        )
        is None
    )
