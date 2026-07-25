from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]


def load_dotenv_if_present() -> None:
    env_path = BACKEND_ROOT / ".env"
    if env_path.is_file():
        load_dotenv(env_path, override=False)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(BACKEND_ROOT / ".env"), extra="ignore")

    host: str = "127.0.0.1"
    port: int = 8000
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    llm_base_url: str = "https://api.openai.com/v1"
    llm_api_key: str = ""
    llm_model: str = "gpt-4o-mini"
    llm_timeout_seconds: float = 60.0

    database_url: str = "sqlite:///./data/companion.db"
    allow_mock_llm: bool = False
    # Window size for gated streaming (chars). Smaller = faster first bytes; still lexicon-gated.
    output_flush_chars: int = 16

    # 百炼语音（与 LLM Key 解耦；空则前端回退浏览器）
    dashscope_api_key: str = ""
    dashscope_base_url: str = "https://dashscope.aliyuncs.com/api/v1"
    dashscope_compat_base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    tts_model: str = "qwen-audio-3.0-tts-flash"
    asr_model: str = "qwen3-asr-flash"
    tts_voice_nuan: str = "longanhuan_v3.6"
    tts_voice_tiao: str = "longjielidou_v3.6"
    tts_voice_cha: str = "longanhuan_v3.6"
    speech_timeout_seconds: float = 60.0
    speech_tts_max_chars: int = 2000
    speech_asr_max_bytes: int = 10 * 1024 * 1024

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def has_llm_key(self) -> bool:
        return bool(self.llm_api_key.strip())

    @property
    def has_dashscope_key(self) -> bool:
        return bool(self.dashscope_api_key.strip())

    def tts_voice_for(self, companion_id: str) -> str:
        cid = (companion_id or "nuan").strip().lower()
        mapping = {
            "nuan": self.tts_voice_nuan,
            "tiao": self.tts_voice_tiao,
            "cha": self.tts_voice_cha,
        }
        return mapping.get(cid, self.tts_voice_nuan)

    def tts_rate_for(self, companion_id: str) -> float:
        """Slight rate spread when 小暖/阿茶 share a voice."""
        cid = (companion_id or "nuan").strip().lower()
        if cid == "tiao":
            return 1.12
        if cid == "cha":
            return 0.88
        return 1.0


@lru_cache
def get_settings() -> Settings:
    load_dotenv_if_present()
    return Settings()
