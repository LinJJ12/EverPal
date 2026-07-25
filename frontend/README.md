# Frontend

Vue 3 + Vite + TypeScript + Vue Router + Pinia.

- UI: ported from `demo/` product shell (`themes/cartoon/cartoon.css`)
- Chat: `POST /v1/chat/stream` SSE via `src/api/`
- Voice: cloud TTS/ASR via `api/speech.ts` when backend has `DASHSCOPE_*`; browser Web Speech fallback (`utils/voice/`). 「点我说话」+ bubble「朗读这条」; transcript → composer → same send/safety path.
- Games: hub at `/games` (`utils/gamesMeta.ts`); boards under `public/games/` (see that folder’s README). Check with `npm run test:games`.

Backend uses Conda env **`chatbot`** — see `docs/dev-setup.md`.

## Run

```powershell
# terminal 1
conda activate chatbot
cd backend
python main.py

# terminal 2
cd frontend
copy .env.example .env
npm install
npm run dev
```

Open http://localhost:5173 . Only `VITE_API_BASE_URL` in frontend `.env` (no LLM keys).
