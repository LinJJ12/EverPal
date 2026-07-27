from __future__ import annotations

from urllib.parse import urlparse


def is_allowed_wikipedia_host(host: str | None) -> bool:
    """Reject lookalikes like evilwikipedia.org."""
    if not host:
        return False
    h = host.lower().rstrip(".")
    return h == "wikipedia.org" or h.endswith(".wikipedia.org")


def is_allowed_wikipedia_url(url: str) -> bool:
    try:
        parsed = urlparse((url or "").strip())
    except ValueError:
        return False
    if parsed.scheme != "https":
        return False
    if parsed.username or parsed.password:
        return False
    return is_allowed_wikipedia_host(parsed.hostname)
