from __future__ import annotations

from pathlib import Path

import pytest


def test_resolve_sqlite_absolute_url_ignores_backend_root(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
):
    """Docker compose uses sqlite:////app/data/... so the volume mount always wins."""
    abs_db = (tmp_path / "vol" / "companion.db").resolve()
    # URI form: sqlite: + absolute path → four slashes on POSIX-style paths
    uri_path = abs_db.as_posix()
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{uri_path}")
    from src.config.settings import get_settings

    get_settings.cache_clear()
    from src.storage.db import resolve_sqlite_path

    got = resolve_sqlite_path()
    assert got == abs_db
    assert got.parent.is_dir()
    get_settings.cache_clear()


def test_resolve_sqlite_four_slash_unix_style(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    target = tmp_path / "data" / "companion.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{target.as_posix()}")
    from src.config.settings import get_settings

    get_settings.cache_clear()
    from src.storage.db import resolve_sqlite_path

    assert resolve_sqlite_path() == target.resolve()
    get_settings.cache_clear()
