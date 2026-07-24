from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"] = "user"
    content: str


class ChatStreamRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    mode: Literal["child"] = "child"
    companion_id: str = "nuan"
    nickname: str = ""
    likes: list[str] = Field(default_factory=list)
    history: list[ChatMessage] = Field(default_factory=list, max_length=40)
    # Optional device/browser id for server-side profile/session (no login)
    client_id: str = ""
    session_id: str = ""
    persist: bool = True
