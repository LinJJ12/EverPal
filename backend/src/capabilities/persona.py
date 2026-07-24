from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from src.domain.enums import COMPANION_IDS, Mode
from src.lib.exceptions import AppError

PROMPTS = Path(__file__).resolve().parents[1] / "prompts"

COMPANION_META = {
    "nuan": {
        "id": "nuan",
        "name": "小暖",
        "role": "温柔陪伴型",
        "blurb": "耐心、鼓励，会讲短故事，适合睡前和慢慢聊。",
    },
    "tiao": {
        "id": "tiao",
        "name": "跳跳",
        "role": "活泼玩伴型",
        "blurb": "爱提问、爱小游戏，无聊的时候特别管用。",
    },
    "cha": {
        "id": "cha",
        "name": "阿茶",
        "role": "稳重听友型",
        "blurb": "少说教、多倾听，愿意听你说说心里话。",
    },
}


@lru_cache
def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8").strip()


def list_companions() -> list[dict]:
    return [COMPANION_META[i] for i in COMPANION_IDS]


def build_system(
    *,
    companion_id: str,
    mode: Mode | str,
    nickname: str = "",
    likes: list[str] | None = None,
    memory_snippet: str = "",
) -> str:
    cid = (companion_id or "nuan").strip()
    if cid not in COMPANION_META:
        raise AppError("invalid_companion", "伙伴不正确", 400)
    mode_e = Mode.coerce(mode)
    companion = _read(PROMPTS / "companions" / f"{cid}.md")
    mode_prompt = _read(PROMPTS / "modes" / f"{mode_e.value}.md")
    parts = [companion, mode_prompt]
    name = (nickname or "").strip() or "朋友"
    like_bit = "、".join((likes or [])[:3])
    profile = f"用户昵称：{name}。"
    if like_bit:
        profile += f" 已知喜好：{like_bit}。"
    parts.append(profile)
    if memory_snippet.strip():
        parts.append(f"近期记忆摘要：{memory_snippet.strip()}")
    parts.append("用简体中文回复。不要输出 Markdown 标题堆砌。")
    return "\n\n".join(parts)
