from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Literal

from src.storage import session_repo

router = APIRouter(prefix="/v1", tags=["sessions"])


class SessionCreate(BaseModel):
    companion_id: Literal["nuan", "tiao", "cha"] = "nuan"
    mode: Literal["child"] = "child"
    title: str = Field(default="", max_length=40)


class SessionOut(BaseModel):
    id: str
    client_id: str
    title: str
    companion_id: str
    mode: str
    updated_at: float
    messages: list[dict] = Field(default_factory=list)


def _cid(client_id: str | None, x_client_id: str | None) -> str:
    cid = (client_id or x_client_id or "").strip()
    if not cid:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "missing_client_id", "message": "请提供 client_id（无登录设备标识）"}},
        )
    return cid


@router.get("/sessions")
def list_sessions(
    client_id: str | None = Query(default=None),
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
) -> dict:
    cid = _cid(client_id, x_client_id)
    items = session_repo.list_sessions(cid)
    return {"sessions": items}


@router.post("/sessions", response_model=SessionOut)
def create_session(
    body: SessionCreate,
    client_id: str | None = Query(default=None),
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
) -> SessionOut:
    cid = _cid(client_id, x_client_id)
    s = session_repo.create_session(
        cid,
        companion_id=body.companion_id,
        mode=body.mode,
        title=body.title,
    )
    return SessionOut(**s)


@router.get("/sessions/{session_id}", response_model=SessionOut)
def get_session(
    session_id: str,
    client_id: str | None = Query(default=None),
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
) -> SessionOut:
    cid = _cid(client_id, x_client_id)
    s = session_repo.get_session(session_id)
    if not s or s.get("client_id") != cid:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "not_found", "message": "找不到这个会话"}},
        )
    return SessionOut(**s)


@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: str,
    client_id: str | None = Query(default=None),
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
) -> dict:
    cid = _cid(client_id, x_client_id)
    ok = session_repo.delete_session(session_id, cid)
    if not ok:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "not_found", "message": "找不到这个会话"}},
        )
    return {"ok": True}
