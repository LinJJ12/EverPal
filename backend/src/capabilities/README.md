# `backend/src/capabilities`

Reusable units invoked by `services/chat` (or thin API routes for speech).

| Module | Role |
|--------|------|
| `persona` / `memory` / `safety` / `llm` / `safe_stream` | Chat pipeline pieces |
| `speech/` | DashScope TTS/ASR package (shared client) |

Do not add a second chat orchestrator here — keep order in `services/chat.py`.
