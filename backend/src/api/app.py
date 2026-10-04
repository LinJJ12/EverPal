from __future__ import annotations

import re

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware

from src.api import chat, companions, health, history, mood, profile, sessions, speech
from src.config.settings import get_settings
from src.lib.exceptions import AppError, client_error_body
from src.lib.logging import get_logger, new_request_id, set_request_id
from src.lib.ratelimit import SlidingWindowLimiter
from src.storage.db import init_db

log = get_logger("api")

_REQUEST_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
_LIMITER = SlidingWindowLimiter()
# Endpoints that trigger paid upstream calls (LLM / TTS / ASR) — abuse costs money.
_RATE_LIMITED_PATHS = frozenset({"/v1/chat/stream", "/v1/speech/tts", "/v1/speech/asr"})


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        raw = (request.headers.get("X-Request-Id") or "").strip()
        # Only accept well-formed ids: never echo arbitrary client data into logs.
        rid = raw if _REQUEST_ID_RE.fullmatch(raw) else new_request_id()
        set_request_id(rid)
        request.state.request_id = rid
        response = await call_next(request)
        response.headers["X-Request-Id"] = rid
        return response


class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    """Reject oversized bodies before Starlette buffers/spools them."""

    async def dispatch(self, request: Request, call_next):
        settings = get_settings()
        raw_len = request.headers.get("content-length") or ""
        if raw_len.isdigit() and int(raw_len) > settings.max_body_bytes:
            return JSONResponse(
                status_code=413,
                content=client_error_body("payload_too_large", "内容太大啦，分几次试试吧"),
            )
        return await call_next(request)


class PaidEndpointRateLimitMiddleware(BaseHTTPMiddleware):
    """Per-IP sliding-window limit on paid upstream endpoints (fail-open off)."""

    async def dispatch(self, request: Request, call_next):
        settings = get_settings()
        if (
            settings.rate_limit_enabled
            and request.method == "POST"
            and request.url.path in _RATE_LIMITED_PATHS
        ):
            ip = request.client.host if request.client else "unknown"
            key = f"{ip}|{request.url.path}"
            if not _LIMITER.allow(
                key, limit=settings.rate_limit_per_minute, window_seconds=60.0
            ):
                return JSONResponse(
                    status_code=429,
                    content=client_error_body("rate_limited", "休息一会儿，等下再来聊吧"),
                )
        return await call_next(request)


app = FastAPI(title="玖伴 Everpal BFF", version="0.1.0")

settings = get_settings()
init_db()
# Middleware runs outermost-last-added: CORS must stay outermost so error
# responses (413/429) still carry CORS headers for cross-origin dev clients.
app.add_middleware(RequestIdMiddleware)
app.add_middleware(BodySizeLimitMiddleware)
app.add_middleware(PaidEndpointRateLimitMiddleware)
cors_origins = settings.cors_origin_list
if cors_origins:
    # No cookies are used anywhere; never combine wildcard origins with credentials.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(health.router)
app.include_router(companions.router)
app.include_router(chat.router)
app.include_router(sessions.router)
app.include_router(profile.router)
app.include_router(mood.router)
app.include_router(history.router)
app.include_router(speech.router)


@app.exception_handler(AppError)
async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.http_status,
        content=client_error_body(exc.code, exc.message),
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    # Keep a Chinese default; only surface our own ValueError copy, never raw Pydantic English.
    message = "请先说点什么再发送"
    try:
        errs = exc.errors()
        if errs:
            ctx = errs[0].get("ctx") or {}
            err_obj = ctx.get("error")
            if isinstance(err_obj, Exception):
                text = str(err_obj).strip()
                if text:
                    message = text
            else:
                msg = str(errs[0].get("msg") or "")
                if "Value error," in msg:
                    tail = msg.split("Value error,", 1)[-1].strip()
                    if tail:
                        message = tail
    except Exception:
        pass
    return JSONResponse(
        status_code=400,
        content=client_error_body("validation_error", message),
    )


@app.exception_handler(StarletteHTTPException)
async def http_error_handler(
    _request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    detail = exc.detail
    if isinstance(detail, dict) and "error" in detail:
        return JSONResponse(status_code=exc.status_code, content=detail)
    if isinstance(detail, dict) and "code" in detail and "message" in detail:
        return JSONResponse(
            status_code=exc.status_code,
            content=client_error_body(str(detail["code"]), str(detail["message"])),
        )
    # Starlette/FastAPI defaults are English ("Not Found"); never surface them.
    raw = detail if isinstance(detail, str) else ""
    has_cjk = any("\u4e00" <= ch <= "\u9fff" for ch in raw)
    if has_cjk:
        message = raw
    elif exc.status_code == 404:
        message = "找不到这项内容"
    else:
        message = "请求无法完成"
    code = "not_found" if exc.status_code == 404 else "request_error"
    return JSONResponse(
        status_code=exc.status_code,
        content=client_error_body(code, message),
    )
