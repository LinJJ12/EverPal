from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

MAX_HISTORY_CHARS = 4000
MAX_NICKNAME_CHARS = 24
MAX_ID_CHARS = 64


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"] = "user"
    # Clip instead of rejecting: an over-long stored reply must not break the next turn.
    content: str = Field(default="", max_length=8000)

    @field_validator("content")
    @classmethod
    def _clip_content(cls, v: str) -> str:
        return v[:MAX_HISTORY_CHARS]


class ChatStreamRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    mode: Literal["child"] = "child"
    companion_id: Literal["nuan", "tiao", "cha"] = "nuan"
    nickname: str = ""
    likes: list[str] = Field(default_factory=list, max_length=12)
    history: list[ChatMessage] = Field(default_factory=list, max_length=40)
    # Optional device/browser id for server-side profile/session (no login)
    client_id: str = ""
    session_id: str = ""
    persist: bool = True
    # Explicit encyclopedia mode from UI (kids tap「百科」); no silent auto-search.
    use_wiki: bool = False

    @field_validator("nickname")
    @classmethod
    def _clip_nickname(cls, v: str) -> str:
        # Collapse newlines (never carry them into the system prompt), then clip.
        return " ".join(v.split())[:MAX_NICKNAME_CHARS]

    @field_validator("client_id", "session_id")
    @classmethod
    def _clip_ids(cls, v: str) -> str:
        return " ".join(v.split())[:MAX_ID_CHARS]
