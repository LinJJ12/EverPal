from __future__ import annotations

from fastapi import APIRouter

from src.capabilities.persona import list_companions
from src.schemas.companion import CompanionOut

router = APIRouter(prefix="/v1", tags=["companions"])


@router.get("/companions", response_model=list[CompanionOut])
def get_companions() -> list[CompanionOut]:
    return [CompanionOut(**c) for c in list_companions()]
