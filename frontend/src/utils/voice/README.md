# `utils/voice`

Browser-side helpers for hybrid speech (cloud first, Web Speech fallback).

| File | Use |
|------|-----|
| `browser.ts` | Web Speech detection, transcript sanitize |
| `companionVoice.ts` | Browser TTS pitch/rate/voice pick |
| `mediaRecorder.ts` | Mic capture for cloud ASR |

HTTP lives in `api/speech.ts`. UI entry: `components/voice/VoiceTalkButton.vue`.
