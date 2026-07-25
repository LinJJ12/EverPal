# `components/mood`

Chat-entry mood check-in UI (no HTTP).

| File | Use |
|------|-----|
| `MoodGate.vue` | Full-screen pick of today's mood (6 options; emoji / sticker) |
| `MoodSticker.vue` | Inline SVG sticker faces |
| `moodOptions.ts` | Mood ids, labels, quotes, face-style localStorage |

HTTP: [`api/mood.ts`](../../api/mood.ts). Gate wiring: `composables/useMoodGate` + ChatView / MemoryView.
