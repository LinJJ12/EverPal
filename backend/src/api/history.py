from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Path, Query

from src.domain.time_cn import parse_day, parse_month
from src.schemas.history import CalendarDayOut, CalendarOut, DaySessionOut, DaySessionsOut
from src.storage import history_repo

router = APIRouter(prefix="/v1/history", tags=["history"])


def _cid(client_id: str | None, x_client_id: str | None) -> str:
    cid = (client_id or x_client_id or "").strip()
    if not cid:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "missing_client_id", "message": "请提供 client_id（无登录设备标识）"}},
        )
    return cid


@router.get("/calendar", response_model=CalendarOut)
def get_calendar(
    month: str = Query(..., description="YYYY-MM"),
    client_id: str | None = Query(default=None),
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
) -> CalendarOut:
    cid = _cid(client_id, x_client_id)
    mo = parse_month(month)
    if not mo:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "validation_error", "message": "请使用正确的月份，例如 2026-07"}},
        )
    rows = history_repo.calendar_month(cid, mo)
    return CalendarOut(
        month=mo,
        days=[CalendarDayOut(**r) for r in rows],
    )


@router.get("/days/{day}/sessions", response_model=DaySessionsOut)
def get_day_sessions(
    day: str = Path(..., description="YYYY-MM-DD"),
    client_id: str | None = Query(default=None),
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
) -> DaySessionsOut:
    cid = _cid(client_id, x_client_id)
    d = parse_day(day)
    if not d:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "validation_error", "message": "请使用正确的日期，例如 2026-07-25"}},
        )
    mood = history_repo.mood_on_day(cid, d) or {}
    sessions = history_repo.sessions_on_day(cid, d)
    return DaySessionsOut(
        day=d,
        mood=mood.get("mood"),
        mood_label=mood.get("mood_label"),
        sessions=[DaySessionOut(**s) for s in sessions],
    )
