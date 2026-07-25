from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class TtsIn(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    companion_id: str = "nuan"

    @field_validator("text")
    @classmethod
    def text_not_blank(cls, v: str) -> str:
        if not (v or "").strip():
            raise ValueError("请先说点什么再朗读")
        return v


class AsrOut(BaseModel):
    text: str
