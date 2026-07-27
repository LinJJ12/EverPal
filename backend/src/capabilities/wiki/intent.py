from __future__ import annotations

import re

# Factual / encyclopedia-ish cues (minors companion Chinese).
# Avoid broad location chitchat like「你在哪」— that is not encyclopedia intent.
_INTENT_PATTERNS = (
    r"为什么",
    r"为啥",
    r"是什么",
    r"什么是",
    r"啥是",
    r"什么叫",
    r"啥叫",
    r"谁发明",
    r"谁发现",
    r"怎么形成",
    r"如何形成",
    r"怎样形成",
    r"有多大",
    r"有多高",
    r"多少度",
    r"位于哪",
    r"百科",
    r"科普",
    r"解释一下",
    r"讲讲.{0,12}是",
)

_INTENT_RE = re.compile("|".join(_INTENT_PATTERNS))

_WHY_IS_RE = re.compile(r"为什么(?P<sub>.+?)是(?P<pred>.+?)的?[?？!！。.~～]*$")

# Pure chat / emotion — do not search even if a cue substring appears oddly.
_CHITCHAT_RE = re.compile(
    r"^(你好|您好|嗨|哈喽|在吗|早上好|晚安|谢谢|谢谢你|好的|嗯嗯|哈哈|"
    r"今天好开心|好难过|我想你了|陪我聊会|无聊|"
    r"你在哪[里儿]?|在哪[里儿]?呀?)[\s!！。.~～]*$",
    re.I,
)


def looks_like_encyclopedia_question(text: str) -> bool:
    """Heuristic gate: factual question → True; greetings / venting → False."""
    msg = (text or "").strip()
    if len(msg) < 4 or len(msg) > 200:
        return False
    if _CHITCHAT_RE.match(msg):
        return False
    return bool(_INTENT_RE.search(msg))


def search_query_from_message(text: str) -> str:
    """Light cleanup for MediaWiki opensearch (keep Chinese content words)."""
    q = (text or "").strip()
    q = re.sub(r"^(请帮我|麻烦|能不能|可以|请问)+", "", q)
    for pat in (
        r"为什么",
        r"为啥",
        r"是什么意思",
        r"是什么",
        r"什么是",
        r"啥是",
        r"什么叫",
        r"啥叫",
        r"谁发明了?",
        r"谁发现了?",
        r"解释一下",
        r"讲讲",
        r"告诉我",
        r"[?？!！。.~～]+$",
    ):
        q = re.sub(pat, " ", q)
    q = re.sub(r"\s+", " ", q).strip(" 的了呢啊呀嘛")
    return q.strip() or (text or "").strip()[:64]


def search_queries_from_message(text: str) -> list[str]:
    """
    Candidate queries for MediaWiki search.
    Expand「为什么X是Y的」into keyword queries; keep natural text as fallback.
    """
    raw = (text or "").strip()
    raw_stripped = re.sub(r"[?？!！。.~～]+$", "", raw).strip()
    cleaned = search_query_from_message(text)
    extras: list[str] = []
    m = _WHY_IS_RE.search(raw_stripped)
    if m:
        sub = (m.group("sub") or "").strip()
        pred = (m.group("pred") or "").strip()
        if sub and pred:
            extras.append(f"{sub} {pred}")
            if sub in {"天", "天空"} and ("蓝" in pred or "藍" in pred):
                extras.append("天空 蓝色")
                extras.append("天空")
            elif len(sub) <= 2:
                extras.append(sub)
    out: list[str] = []
    for q in (*extras, raw_stripped, cleaned):
        q = (q or "").strip()
        if q and q not in out:
            out.append(q[:80])
    return out
