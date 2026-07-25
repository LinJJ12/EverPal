# `capabilities/speech`

Cloud voice for 玖伴 (DashScope / 百炼).

| File | Responsibility |
|------|----------------|
| `client.py` | Key gate, HTTP client, audio URL allowlist |
| `tts.py` | Text → audio bytes (`qwen-audio-*-tts-*`) |
| `asr.py` | Audio → transcript (`qwen3-asr-*`) |

HTTP surface: `api/speech.py` → `/v1/speech/tts` · `/v1/speech/asr`.  
Config: `DASHSCOPE_*` / `TTS_*` / `ASR_*` in `backend/.env`.  
Frontend falls back to browser Web Speech when these fail.
