from __future__ import annotations

from pydantic import BaseModel


class CompanionOut(BaseModel):
    id: str
    name: str
    role: str
    blurb: str
