from __future__ import annotations

from pydantic import BaseModel


class CalendarDayOut(BaseModel):
    day: str
    has_chat: bool = False
    session_count: int = 0
    mood: str | None = None
    mood_label: str | None = None


class CalendarOut(BaseModel):
    month: str
    days: list[CalendarDayOut]


class DaySessionOut(BaseModel):
    id: str
    title: str = ""
    companion_id: str
    updated_at: float
    message_count_that_day: int = 0


class DaySessionsOut(BaseModel):
    day: str
    mood: str | None = None
    mood_label: str | None = None
    sessions: list[DaySessionOut]
