"""China (UTC+8) calendar-day helpers — shared by mood and history."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

CN_TZ = timezone(timedelta(hours=8))


def today_day() -> str:
    return datetime.now(CN_TZ).strftime("%Y-%m-%d")


def day_from_ts(ts: float) -> str:
    return datetime.fromtimestamp(float(ts), CN_TZ).strftime("%Y-%m-%d")


def parse_month(month: str) -> str | None:
    """Return normalized YYYY-MM or None if invalid."""
    m = (month or "").strip()
    if len(m) != 7 or m[4] != "-":
        return None
    try:
        y, mo = int(m[:4]), int(m[5:7])
        if y < 2000 or y > 2100 or mo < 1 or mo > 12:
            return None
    except ValueError:
        return None
    return f"{y:04d}-{mo:02d}"


def parse_day(day: str) -> str | None:
    d = (day or "").strip()
    if len(d) != 10 or d[4] != "-" or d[7] != "-":
        return None
    try:
        y, mo, dd = int(d[:4]), int(d[5:7]), int(d[8:10])
        datetime(y, mo, dd, tzinfo=CN_TZ)
    except ValueError:
        return None
    return f"{y:04d}-{mo:02d}-{dd:02d}"
