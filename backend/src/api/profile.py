from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Literal

from src.capabilities.safety import sanitize_profile_likes
from src.storage import memory_repo, profile_repo

router = APIRouter(prefix="/v1", tags=["profile"])


class ProfileOut(BaseModel):
    client_id: str
    nickname: str = ""
    mode: str = "child"
    companion_id: str = "nuan"
    likes: list[str] = Field(default_factory=list)
    memories: list[dict] = Field(default_factory=list)


class ProfilePatch(BaseModel):
    nickname: str | None = None
    mode: Literal["child"] | None = None
    companion_id: str | None = None
    likes: list[str] | None = None


def _cid(client_id: str | None, x_client_id: str | None) -> str:
    cid = (client_id or x_client_id or "").strip()
    if not cid:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "missing_client_id", "message": "请提供 client_id（无登录设备标识）"}},
        )
    return cid


@router.get("/profile", response_model=ProfileOut)
def get_profile(
    client_id: str | None = Query(default=None),
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
) -> ProfileOut:
    cid = _cid(client_id, x_client_id)
    p = profile_repo.ensure_profile(cid)
    mems = memory_repo.list_memories(cid)
    return ProfileOut(
        client_id=cid,
        nickname=p["nickname"],
        mode=p["mode"],
        companion_id=p["companion_id"],
        likes=p["likes"],
        memories=mems,
    )


@router.patch("/profile", response_model=ProfileOut)
def patch_profile(
    body: ProfilePatch,
    client_id: str | None = Query(default=None),
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
) -> ProfileOut:
    cid = _cid(client_id, x_client_id)
    likes = None if body.likes is None else sanitize_profile_likes(body.likes)
    p = profile_repo.upsert_profile(
        cid,
        nickname=body.nickname,
        mode=body.mode,
        companion_id=body.companion_id,
        likes=likes,
    )
    mems = memory_repo.list_memories(cid)
    return ProfileOut(
        client_id=cid,
        nickname=p["nickname"],
        mode=p["mode"],
        companion_id=p["companion_id"],
        likes=p["likes"],
        memories=mems,
    )


@router.delete("/profile/memories/{memory_id}")
def delete_memory(
    memory_id: int,
    client_id: str | None = Query(default=None),
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
) -> dict:
    cid = _cid(client_id, x_client_id)
    ok = memory_repo.delete_memory(cid, memory_id)
    if not ok:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "not_found", "message": "这条记忆不在了"}},
        )
    return {"ok": True, "id": memory_id}


@router.delete("/profile/memories")
def clear_memories(
    client_id: str | None = Query(default=None),
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
) -> dict:
    cid = _cid(client_id, x_client_id)
    n = memory_repo.clear_memories(cid)
    return {"ok": True, "cleared": n}
