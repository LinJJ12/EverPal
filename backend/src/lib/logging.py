from __future__ import annotations

import json
import logging
import uuid
from contextvars import ContextVar
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from src.config.settings import BACKEND_ROOT

_request_id: ContextVar[str] = ContextVar("request_id", default="-")
_configured = False


def new_request_id() -> str:
    return uuid.uuid4().hex[:16]


def set_request_id(rid: str) -> None:
    _request_id.set(rid or "-")


def get_request_id() -> str:
    return _request_id.get()


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id()  # type: ignore[attr-defined]
        return True


def get_logger(name: str = "jiuban") -> logging.Logger:
    global _configured
    logger = logging.getLogger(name)
    if not _configured:
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s %(levelname)s [%(name)s] rid=%(request_id)s %(message)s",
        )
        root = logging.getLogger()
        rid_filter = RequestIdFilter()
        for handler in root.handlers:
            handler.addFilter(rid_filter)
        # Also cover loggers that add handlers later
        logging.getLogger().addFilter(rid_filter)
        _configured = True
    return logger


def _logs_dir() -> Path:
    d = BACKEND_ROOT / "resource" / "logs"
    d.mkdir(parents=True, exist_ok=True)
    return d


def write_safety_audit(event: dict[str, Any]) -> None:
    """Append-only safety audit line (no API keys; truncate user text)."""
    payload = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "request_id": get_request_id(),
        **event,
    }
    user = payload.get("user_text")
    if isinstance(user, str) and len(user) > 120:
        payload["user_text"] = user[:120] + "…"
    path = _logs_dir() / "safety_audit.jsonl"
    try:
        with path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(payload, ensure_ascii=False) + "\n")
    except OSError:
        get_logger("audit").warning("safety audit write failed")
