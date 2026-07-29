"""Aliyun OpenAPI ACS3-HMAC-SHA256 signing (TextModerationPlus)."""

from __future__ import annotations

import hashlib
import hmac
import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse

# Match Green CIP / OpenAPI JSON body convention (no charset in signed value).
_CONTENT_TYPE = "application/json"


def _sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _hmac_sha256(key: bytes | str, msg: str) -> bytes:
    kb = key.encode("utf-8") if isinstance(key, str) else key
    return hmac.new(kb, msg.encode("utf-8"), hashlib.sha256).digest()


def acs3_headers(
    *,
    method: str,
    url: str,
    access_key_id: str,
    access_key_secret: str,
    action: str,
    version: str,
    body: bytes,
    now: str | None = None,
    nonce: str | None = None,
) -> dict[str, str]:
    """Build Authorization + x-acs-* headers for a JSON POST body."""
    parsed = urlparse(url)
    host = (parsed.netloc or "").lower()
    uri = parsed.path or "/"
    payload_hash = _sha256_hex(body)
    date = now or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    sig_nonce = nonce or str(uuid.uuid4())

    # content-type + host + x-acs-* must be signed (Aliyun ACS3).
    signed = {
        "content-type": _CONTENT_TYPE,
        "host": host,
        "x-acs-action": action,
        "x-acs-content-sha256": payload_hash,
        "x-acs-date": date,
        "x-acs-signature-nonce": sig_nonce,
        "x-acs-version": version,
    }
    signed_header_names = sorted(signed.keys())
    canonical_headers = "".join(f"{k}:{signed[k].strip()}\n" for k in signed_header_names)
    signed_headers = ";".join(signed_header_names)
    canonical_request = "\n".join(
        [
            method.upper(),
            uri,
            "",  # no query
            canonical_headers,
            signed_headers,
            payload_hash,
        ]
    )
    string_to_sign = "ACS3-HMAC-SHA256\n" + _sha256_hex(canonical_request.encode("utf-8"))
    signature = _hmac_sha256(access_key_secret, string_to_sign).hex()
    authorization = (
        f"ACS3-HMAC-SHA256 Credential={access_key_id},"
        f"SignedHeaders={signed_headers},Signature={signature}"
    )
    out = {k: v for k, v in signed.items()}
    out["Authorization"] = authorization
    return out
