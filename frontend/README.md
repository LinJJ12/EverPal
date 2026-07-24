# Frontend

Vue 3 + Vite + TypeScript + Vue Router + Pinia.

- UI: ported from `demo/` product shell (`themes/cartoon/cartoon.css`)
- Chat: `POST /v1/chat/stream` SSE via `src/api/`
- Voice (browser): 「点我说话 / 说完了」+ each assistant bubble「朗读这条」; per-companion pitch/rate (`utils/companionVoice.ts`); transcript → composer → same send/safety path. Prefer Chromium for STT.
- Games: hub at `/games`; boards under `public/games/*.html`

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
