from __future__ import annotations

from pydantic import BaseModel, Field


class TtsIn(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    companion_id: str = "nuan"


class AsrOut(BaseModel):
    text: str
