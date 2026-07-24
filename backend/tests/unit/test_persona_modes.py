from __future__ import annotations

from src.capabilities.persona import build_system, list_companions
from src.domain.enums import Mode


def test_three_companions_no_romance_names():
    comps = list_companions()
    assert len(comps) >= 3
    blob = " ".join(c["name"] + c["blurb"] for c in comps)
    assert "恋爱" not in blob
    assert "大人树洞" not in blob


def test_minors_prompt_loaded():
    text = build_system(companion_id="nuan", mode=Mode.CHILD, nickname="小木")
    assert "未成年人陪伴" in text or "儿童" in text or "小学生" in text
    assert "成人模式" not in text
    assert "心事" in text or "共情" in text or "倾诉" in text or "家长" in text


def test_mode_coerce_legacy_adult():
    assert Mode.coerce("adult") is Mode.CHILD
    assert Mode.coerce("ADULT") is Mode.CHILD
    assert Mode.coerce("") is Mode.CHILD
    # Must not raise / load adult prompt
    text = build_system(companion_id="cha", mode="adult", nickname="豆豆")
    assert "成人模式" not in text
    assert "阿茶" in text or "听" in text
