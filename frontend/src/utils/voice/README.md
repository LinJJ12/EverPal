# `utils/voice`

Browser-side helpers for hybrid speech (cloud first, Web Speech fallback).

| File | Use |
|------|-----|
| `browser.ts` | Web Speech detection, transcript sanitize |
| `companionVoice.ts` | Browser TTS pitch/rate/voice pick |
| `mediaRecorder.ts` | Mic capture for cloud ASR |
| `speakProgress.ts` | Karaoke helpers: duration estimate + ratio→char mapping |

HTTP lives in `api/speech.ts`. UI entry: `components/voice/VoiceTalkButton.vue`.  
Read-aloud: `useSpeechSynthesis` → `progressRatio` karaoke + `pause`/`resume`/`speak`(restart) → `ChatBubble`.
