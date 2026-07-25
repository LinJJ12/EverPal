"""Cloud speech (DashScope TTS / ASR)."""

from src.capabilities.speech.asr import transcribe_audio
from src.capabilities.speech.tts import synthesize_speech

__all__ = ["synthesize_speech", "transcribe_audio"]
