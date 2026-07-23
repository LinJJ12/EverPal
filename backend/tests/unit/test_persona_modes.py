from __future__ import annotations

from src.capabilities.persona import build_system, list_companions
from src.domain.enums import Mode


def test_three_companions_no_romance_names():
    comps = list_companions()
    assert len(comps) >= 3
    blob = " ".join(c["name"] + c["blurb"] for c in comps)
    assert "恋爱" not in blob


def test_child_adult_prompts_differ():
    child = build_system(companion_id="nuan", mode=Mode.CHILD, nickname="小木")
    adult = build_system(companion_id="nuan", mode=Mode.ADULT, nickname="小木")
    assert "儿童模式" in child
    assert "成人模式" in adult
    assert child != adult
