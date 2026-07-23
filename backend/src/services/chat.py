from __future__ import annotations

import json
from collections.abc import AsyncIterator
from dataclasses import dataclass

from src.capabilities import llm as llm_cap
from src.capabilities import memory as memory_cap
from src.capabilities import persona as persona_cap
from src.capabilities import safety as safety_cap
from src.capabilities.safe_stream import gated_llm_deltas
from src.config.settings import Settings, get_settings
from src.domain.enums import Mode, SafetyAction
from src.lib.exceptions import AppError
from src.lib.logging import get_logger, get_request_id, write_safety_audit
from src.schemas.chat import ChatStreamRequest
from src.storage import profile_repo, session_repo

log = get_logger("services.chat")


@dataclass
class StreamEvent:
    event: str
    data: dict


def _sync_profile_from_request(req: ChatStreamRequest) -> None:
    cid = (req.client_id or "").strip()
    if not cid:
        return
    kwargs: dict = {}
    if req.nickname.strip():
        kwargs["nickname"] = req.nickname
    if req.likes:
        kwargs["likes"] = req.likes
    if req.mode:
        kwargs["mode"] = req.mode
    if req.companion_id:
        kwargs["companion_id"] = req.companion_id
    if kwargs:
        profile_repo.upsert_profile(cid, **kwargs)
    else:
        profile_repo.ensure_profile(cid)


def _ensure_session(req: ChatStreamRequest, mode: Mode, companion_id: str) -> str | None:
    cid = (req.client_id or "").strip()
    if not cid or not req.persist:
        return None
    sid = (req.session_id or "").strip()
    if sid:
        existing = session_repo.get_session(sid)
        if existing and existing.get("client_id") == cid:
            return sid
    created = session_repo.create_session(
        cid,
        companion_id=companion_id,
        mode=mode.value,
        title=(req.message or "")[:24],
    )
    return created["id"]


def _persist_turn(
    *,
    session_id: str | None,
    user_text: str,
    assistant_text: str,
    safety_action: str,
    client_id: str,
    mode: Mode,
) -> None:
    if not session_id:
        return
    try:
        session_repo.append_messages(
            session_id,
            [
                {"role": "user", "content": user_text, "safety_action": "none"},
                {
                    "role": "assistant",
                    "content": assistant_text,
                    "safety_action": safety_action,
                },
            ],
            title_hint=user_text[:24],
        )
        if safety_action in (SafetyAction.BLOCK.value, SafetyAction.REWRITE.value):
            return
        memory_cap.maybe_extract_from_turn(
            client_id=client_id,
            user_text=user_text,
            assistant_text=assistant_text,
            mode=mode,
        )
    except Exception as exc:  # noqa: BLE001
        log.warning("persist failed: %s", type(exc).__name__)


def _audit(
    *,
    phase: str,
    mode: Mode,
    companion_id: str,
    action: str,
    category: str | None = None,
    user_text: str = "",
    session_id: str | None = None,
) -> None:
    write_safety_audit(
        {
            "phase": phase,
            "mode": mode.value,
            "companion_id": companion_id,
            "safety_action": action,
            "category": category,
            "user_text": user_text,
            "session_id": session_id,
        }
    )


async def run_chat_stream(
    req: ChatStreamRequest,
    *,
    settings: Settings | None = None,
) -> AsyncIterator[StreamEvent]:
    s = settings or get_settings()
    mode = Mode(req.mode)
    companion_id = req.companion_id or "nuan"
    client_id = (req.client_id or "").strip()
    flush_chars = max(16, int(getattr(s, "output_flush_chars", 48) or 48))

    log.info(
        "chat start mode=%s companion=%s persist=%s",
        mode.value,
        companion_id,
        bool(client_id and req.persist),
    )

    if client_id and req.persist:
        try:
            _sync_profile_from_request(req)
        except Exception as exc:  # noqa: BLE001
            log.warning("profile sync failed: %s", type(exc).__name__)

    session_id = None
    if client_id and req.persist:
        try:
            session_id = _ensure_session(req, mode, companion_id)
        except Exception as exc:  # noqa: BLE001
            log.warning("session ensure failed: %s", type(exc).__name__)

    meta = {
        "companion_id": companion_id,
        "mode": mode.value,
        "safety_action": SafetyAction.NONE.value,
        "session_id": session_id,
        "client_id": client_id or None,
        "request_id": get_request_id(),
    }
    yield StreamEvent("meta", meta)

    hit = safety_cap.check_input(req.message, mode)
    if hit and hit.action == SafetyAction.BLOCK:
        _audit(
            phase="input",
            mode=mode,
            companion_id=companion_id,
            action=hit.action.value,
            category=hit.category,
            user_text=req.message,
            session_id=session_id,
        )
        yield StreamEvent(
            "meta",
            {**meta, "safety_action": hit.action.value, "category": hit.category},
        )
        yield StreamEvent("delta", {"text": hit.reply})
        _persist_turn(
            session_id=session_id,
            user_text=req.message,
            assistant_text=hit.reply,
            safety_action=hit.action.value,
            client_id=client_id,
            mode=mode,
        )
        yield StreamEvent(
            "done",
            {
                "safety_action": hit.action.value,
                "session_id": session_id,
                "request_id": get_request_id(),
            },
        )
        return

    profile_nick = req.nickname
    profile_likes = list(req.likes)
    if client_id:
        p = profile_repo.get_profile(client_id)
        if p:
            if not profile_nick:
                profile_nick = p.get("nickname") or ""
            if not profile_likes:
                profile_likes = list(p.get("likes") or [])

    mem = memory_cap.snippet(
        nickname=profile_nick,
        likes=profile_likes,
        client_id=client_id,
    )
    try:
        system = persona_cap.build_system(
            companion_id=companion_id,
            mode=mode,
            nickname=profile_nick,
            likes=profile_likes,
            memory_snippet=mem,
        )
    except AppError as exc:
        yield StreamEvent("error", {"code": exc.code, "message": exc.message})
        return

    history_msgs: list[dict[str, str]] = []
    if session_id and not req.history:
        stored = session_repo.get_session(session_id)
        if stored:
            for m in (stored.get("messages") or [])[-20:]:
                role = m.get("role")
                if role in ("user", "assistant"):
                    history_msgs.append({"role": role, "content": m.get("content") or ""})
    else:
        for m in req.history[-20:]:
            if m.role == "system":
                continue
            role = "assistant" if m.role == "assistant" else "user"
            history_msgs.append({"role": role, "content": m.content})
    history_msgs.append({"role": "user", "content": req.message})

    token_iter = llm_cap.stream_chat_completion(
        system=system,
        messages=history_msgs,
        settings=s,
    )

    assistant_out = ""
    action = SafetyAction.NONE
    category: str | None = None
    try:
        async for kind, payload in gated_llm_deltas(
            token_iter, mode=mode, flush_chars=flush_chars
        ):
            if kind == "delta" and isinstance(payload, str):
                yield StreamEvent("delta", {"text": payload})
            elif kind == "final" and not isinstance(payload, str):
                assistant_out = payload.text
                action = payload.action
                category = payload.category
    except AppError as exc:
        yield StreamEvent("error", {"code": exc.code, "message": exc.message})
        return

    if action != SafetyAction.NONE:
        _audit(
            phase="output",
            mode=mode,
            companion_id=companion_id,
            action=action.value,
            category=category,
            user_text=req.message,
            session_id=session_id,
        )
        log.warning("output safety action=%s category=%s", action.value, category)

    _persist_turn(
        session_id=session_id,
        user_text=req.message,
        assistant_text=assistant_out,
        safety_action=action.value,
        client_id=client_id,
        mode=mode,
    )

    log.info("chat done action=%s session=%s", action.value, session_id)
    yield StreamEvent(
        "done",
        {
            "safety_action": action.value,
            "session_id": session_id,
            "request_id": get_request_id(),
        },
    )


def encode_sse(event: StreamEvent) -> str:
    return f"event: {event.event}\ndata: {json.dumps(event.data, ensure_ascii=False)}\n\n"
