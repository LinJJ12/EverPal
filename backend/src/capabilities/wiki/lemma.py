"""Colloquial → MediaWiki search terms (kids short questions)."""

from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

# Static data lives under src/data/ (same pattern as data/lexicon/)
_LEMMA_PATH = Path(__file__).resolve().parents[2] / "data" / "wiki" / "lemma_map.json"
_PUNCT_RE = re.compile(r"[\s?？!！。.~～、，,；;：:\"'“”‘’（）()【】\[\]…]+")


def normalize_lemma_key(text: str) -> str:
    t = (text or "").strip()
    t = _PUNCT_RE.sub("", t)
    return t


@lru_cache
def _load_map() -> dict[str, list[str]]:
    if not _LEMMA_PATH.is_file():
        return {}
    raw = json.loads(_LEMMA_PATH.read_text(encoding="utf-8"))
    out: dict[str, list[str]] = {}
    if not isinstance(raw, dict):
        return out
    for k, v in raw.items():
        key = normalize_lemma_key(str(k))
        if not key:
            continue
        if isinstance(v, str):
            terms = [v.strip()] if v.strip() else []
        elif isinstance(v, list):
            terms = [str(x).strip() for x in v if str(x).strip()]
        else:
            continue
        if terms:
            out[key] = terms[:3]
    return out


def clear_lemma_cache() -> None:
    _load_map.cache_clear()


def lemma_queries_for_message(text: str) -> list[str]:
    """
    Return search terms from lemma map.
    Prefer exact normalized key; else longest key that is a substring of the message key.
    """
    key = normalize_lemma_key(text)
    if not key:
        return []
    mapping = _load_map()
    if key in mapping:
        return list(mapping[key])
    best_k = ""
    for k in mapping:
        if k in key and len(k) > len(best_k):
            best_k = k
    if best_k:
        return list(mapping[best_k])
    return []
