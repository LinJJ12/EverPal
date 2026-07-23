from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass

from src.capabilities import safety as safety_cap
from src.domain.enums import Mode, SafetyAction

_FLUSH_PUNCT = set("。！？；\n.!?;")


@dataclass
class SafeStreamResult:
    text: str
    action: SafetyAction
    category: str | None = None


async def gated_llm_deltas(
    token_iter: AsyncIterator[str],
    *,
    mode: Mode | str,
    flush_chars: int = 48,
) -> AsyncIterator[tuple[str, str | SafeStreamResult]]:
    """Windowed output gate: flush only lexicon-safe prefixes to the client.

    Yields ("delta", text) for safe chunks, then ("final", SafeStreamResult).
    On mid-stream hit: keeps already-flushed safe prefix, appends soft refusal.
    """
    released = ""
    pending = ""
    mode_e = Mode(mode) if not isinstance(mode, Mode) else mode

    def try_flush(force: bool = False) -> tuple[str | None, SafeStreamResult | None]:
        nonlocal released, pending
        if not pending:
            return None, None
        should = force or len(pending) >= flush_chars or (
            len(pending) >= 8 and pending[-1] in _FLUSH_PUNCT
        )
        if not should:
            return None, None

        if force:
            cut = len(pending)
        else:
            cut = min(len(pending), flush_chars)
            punct_at = -1
            for i, ch in enumerate(pending[:flush_chars]):
                if ch in _FLUSH_PUNCT:
                    punct_at = i + 1
            if punct_at >= 8:
                cut = punct_at

        chunk = pending[:cut]
        rest = pending[cut:]
        candidate = released + chunk
        hit = safety_cap.check_input(candidate, mode_e)
        if hit and hit.action in (SafetyAction.BLOCK, SafetyAction.REWRITE):
            pending = ""
            soft = hit.reply
            full = (released + ("\n\n" if released else "") + soft).strip()
            return None, SafeStreamResult(
                text=full, action=hit.action, category=hit.category
            )
        released += chunk
        pending = rest
        return chunk, None

    async for piece in token_iter:
        pending += piece
        while True:
            delta, rewrite = try_flush(force=False)
            if rewrite is not None:
                suffix = rewrite.text[len(released) :] if released else rewrite.text
                if suffix:
                    yield ("delta", suffix)
                yield ("final", rewrite)
                return
            if delta:
                yield ("delta", delta)
                continue
            break

    delta, rewrite = try_flush(force=True)
    if rewrite is not None:
        suffix = rewrite.text[len(released) :] if released else rewrite.text
        if suffix:
            yield ("delta", suffix)
        yield ("final", rewrite)
        return
    if delta:
        yield ("delta", delta)

    filtered, action = safety_cap.filter_output(released, mode_e)
    if action != SafetyAction.NONE and filtered != released:
        yield ("delta", "\n\n" + filtered)
        yield ("final", SafeStreamResult(text=filtered, action=action, category=None))
        return
    yield ("final", SafeStreamResult(text=released, action=SafetyAction.NONE))
