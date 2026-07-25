from __future__ import annotations

from src.domain.moods import MOOD_IDS, label_for, normalize_mood


def test_normalize_and_labels():
    assert normalize_mood("Happy") == "happy"
    assert normalize_mood("hope") == "hope"
    assert normalize_mood("excited") is None
    assert label_for("hope") == "期待"
    assert label_for("nope") == ""
    assert "hope" in MOOD_IDS
    assert len(MOOD_IDS) == 6
