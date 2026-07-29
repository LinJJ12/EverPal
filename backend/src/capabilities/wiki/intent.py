from __future__ import annotations

import re

from src.capabilities.wiki.lemma import lemma_queries_for_message

# Factual / encyclopedia-ish cues (legacy helpers; product trigger is UI「百科」).
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
    r"咋来的",
    r"从哪来",
    r"有多大",
    r"有多高",
    r"多少度",
    r"位于哪",
    r"百科",
    r"科普",
    r"解释一下",
    r"讲讲",
)

_INTENT_RE = re.compile("|".join(_INTENT_PATTERNS))

_WHY_IS_RE = re.compile(
    r"(?:为什么|为啥)(?P<sub>.+?)是(?P<pred>.+?)的?[?？!！。.~～]*$"
)

_TOPIC_PATTERNS = (
    re.compile(r"^(?:请问|请|帮我)?(?:什么是|啥是|什么叫|啥叫)(?P<topic>.+)$"),
    re.compile(r"^(?P<topic>.+?)(?:是什么|是啥|叫什么)(?:意思)?$"),
    re.compile(r"^(?:请|帮我)?解释一下(?P<topic>.+)$"),
    re.compile(r"^(?:请|帮我)?讲讲(?P<topic>.+)$"),
    re.compile(r"^(?P<topic>.+?)咋来的$"),
    re.compile(r"^(?P<topic>.+?)(?:是)?从哪[里儿]?来的?$"),
)

# Shared function words — never use alone for relevance.
_STOPWORDS = frozenset(
    {
        "的",
        "了",
        "呢",
        "吗",
        "嘛",
        "啊",
        "呀",
        "吧",
        "么",
        "什麼",
        "什么",
        "是",
        "叫",
        "有",
        "在",
        "与",
        "和",
        "及",
        "或",
        "对",
        "从",
        "到",
        "为",
        "被",
        "把",
        "给",
        "让",
        "请",
        "问",
        "一下",
        "怎么",
        "怎样",
        "如何",
        "为何",
        "为啥",
        "为什么",
        "百科",
        "科普",
        "解释",
        "讲讲",
        "告诉",
        "我",
        "你",
        "一下",
        "咋",
    }
)

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
    """Light cleanup for MediaWiki search (keep Chinese content words)."""
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
        r"咋回事",
        r"咋来的",
        r"咋",
        r"从哪[里儿]?来的?",
        r"[?？!！。.~～]+$",
    ):
        q = re.sub(pat, " ", q)
    q = re.sub(r"\s+", " ", q).strip(" 的了呢啊呀嘛")
    return q.strip() or (text or "").strip()[:64]


def extract_topic(text: str) -> str:
    """
    Core subject of a kids question, e.g.「什么是性」→「性」,「恐龙是什么」→「恐龙」.
    Used for search preference and title relevance (must appear in wiki title).
    """
    raw = (text or "").strip()
    raw = re.sub(r"[?？!！。.~～]+$", "", raw).strip()
    for cre in _TOPIC_PATTERNS:
        m = cre.match(raw)
        if m:
            topic = (m.group("topic") or "").strip(" 的了呢啊呀嘛")
            if topic and topic not in _STOPWORDS:
                return topic[:40]
    cleaned = search_query_from_message(text)
    if cleaned and cleaned not in _STOPWORDS:
        return cleaned[:40]
    return ""


def search_queries_from_message(text: str) -> list[str]:
    """
    Candidate queries for MediaWiki search.
    Prefer lemma map + extracted topic so short/colloquial asks hit encyclopedia titles.
    """
    raw = (text or "").strip()
    raw_stripped = re.sub(r"[?？!！。.~～]+$", "", raw).strip()
    lemma_extras = lemma_queries_for_message(text)
    topic = extract_topic(text)
    cleaned = search_query_from_message(text)
    extras: list[str] = list(lemma_extras)
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
    # Prefer expanded keyword queries before the raw clause (「天是蓝的」is noisy on zhwiki).
    for q in (*extras, topic, cleaned, raw_stripped):
        q = (q or "").strip()
        if not q or q in _STOPWORDS:
            continue
        if q not in out:
            out.append(q[:80])
    return out
