from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Query

from src.domain.moods import MOOD_IDS, normalize_mood
from src.domain.time_cn import today_day
from src.schemas.mood import MoodOut, MoodPut
from src.storage import mood_repo

router = APIRouter(prefix="/v1/mood", tags=["mood"])


def _cid(client_id: str | None, x_client_id: str | None) -> str:
    cid = (client_id or x_client_id or "").strip()
    if not cid:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "missing_client_id", "message": "请提供 client_id（无登录设备标识）"}},
        )
    return cid


@router.get("/today", response_model=MoodOut)
def get_today(
    client_id: str | None = Query(default=None),
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
) -> MoodOut:
    cid = _cid(client_id, x_client_id)
    day = today_day()
    row = mood_repo.get_mood(cid, day)
    if not row:
        return MoodOut(day=day, mood=None, label=None)
    return MoodOut(day=row["day"], mood=row["mood"], label=row["label"])


@router.put("/today", response_model=MoodOut)
def put_today(
    body: MoodPut,
    client_id: str | None = Query(default=None),
    x_client_id: str | None = Header(default=None, alias="X-Client-Id"),
) -> MoodOut:
    cid = _cid(client_id, x_client_id)
    mid = normalize_mood(body.mood)
    if not mid or mid not in MOOD_IDS:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "validation_error", "message": "请选一个今天的心情"}},
        )
    row = mood_repo.upsert_mood(cid, mid)
    return MoodOut(day=row["day"], mood=row["mood"], label=row["label"])
