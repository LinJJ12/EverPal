from __future__ import annotations

import pytest

from src.capabilities.safe_stream import gated_llm_deltas
from src.capabilities.safety import clear_lexicon_cache
from src.domain.enums import Mode, SafetyAction


def setup_function() -> None:
    clear_lexicon_cache()


async def _gen(parts: list[str]):
    for p in parts:
        yield p


@pytest.mark.asyncio
async def test_gated_stream_flushes_safe_text():
    deltas: list[str] = []
    final = None
    async for kind, payload in gated_llm_deltas(
        _gen(["你", "好", "呀", "，", "今", "天", "真", "好", "。"]),
        mode=Mode.CHILD,
        flush_chars=4,
    ):
        if kind == "delta" and isinstance(payload, str):
            deltas.append(payload)
        if kind == "final":
            final = payload
    assert "".join(deltas)
    assert final is not None
    assert final.action == SafetyAction.NONE
    assert "好" in final.text


@pytest.mark.asyncio
async def test_gated_stream_blocks_unsafe_before_flush():
    deltas: list[str] = []
    final = None
    # Keep chunks small so "自杀" is only in pending until force flush at end
    async for kind, payload in gated_llm_deltas(
        _gen(["我想", "自杀", "。"]),
        mode=Mode.CHILD,
        flush_chars=80,
    ):
        if kind == "delta" and isinstance(payload, str):
            deltas.append(payload)
        if kind == "final":
            final = payload
    assert final is not None
    assert final.action == SafetyAction.BLOCK
    joined = "".join(deltas)
    # soft refusal should appear; instructional suicide content should not be the whole body
    assert "自杀" not in joined or "热线" in joined or "大人" in joined
