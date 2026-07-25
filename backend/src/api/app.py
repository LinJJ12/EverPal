from __future__ import annotations

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
from src.storage.db import init_db

log = get_logger("api")


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        rid = (request.headers.get("X-Request-Id") or new_request_id()).strip()
        set_request_id(rid)
        request.state.request_id = rid
        response = await call_next(request)
        response.headers["X-Request-Id"] = rid
        return response


app = FastAPI(title="玖伴 BFF", version="0.1.0")

settings = get_settings()
init_db()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestIdMiddleware)

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
