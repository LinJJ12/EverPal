from __future__ import annotations

from pydantic import BaseModel, Field


class MoodOut(BaseModel):
    day: str
    mood: str | None = None
    label: str | None = None


class MoodPut(BaseModel):
    mood: str = Field(min_length=1, max_length=32)
