from __future__ import annotations

from fastapi import APIRouter, Header, Request
from fastapi.responses import StreamingResponse

from src.lib.logging import get_request_id, new_request_id, set_request_id
from src.schemas.chat import ChatStreamRequest
from src.services.chat import encode_sse, run_chat_stream

router = APIRouter(prefix="/v1", tags=["chat"])


@router.post("/chat/stream")
async def chat_stream(
    body: ChatStreamRequest,
    request: Request,
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
) -> StreamingResponse:
    rid = (x_request_id or getattr(request.state, "request_id", None) or new_request_id()).strip()
    set_request_id(rid)

    async def gen():
        set_request_id(rid)
        async for ev in run_chat_stream(body):
            yield encode_sse(ev)

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "X-Request-Id": rid or get_request_id(),
        },
    )
