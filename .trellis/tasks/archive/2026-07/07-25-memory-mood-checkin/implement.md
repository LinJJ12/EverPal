# Implement: 07-25-memory-mood-checkin

## Order

1. Backend: `daily_moods` schema + `mood_repo` + GET/PUT `/v1/mood/today` + unit tests  
2. Backend: inject mood into `memory.snippet` / chat system path + tests  
3. Backend: `DELETE /v1/profile/memories/{id}` + tests  
4. Frontend: `api/mood.ts` + `MoodGate.vue` + `ChatView` gate + change entry  
5. Frontend: `MemoryView` mood row + per-item delete  
6. Docs: `directory-structure.md` / README / product-constraints P1 status  
7. `trellis-check` + hand test checklist

## Validation

```powershell
conda activate chatbot
cd backend
python -m pytest tests -q

cd ../frontend
npm run build
```

Hand: first `/chat` of day → pick mood → chat; MemoryView change + delete one memory.

## Risks

- ChatView bootstrap races with session load — gate should not block session restore forever; show gate above chat chrome.
- Timezone: document UTC+8 "today" in API README.

## Before `task.py start`

- [x] prd converged  
- [x] design.md  
- [x] implement.md  
- [x] user approves implementation  

## Done checklist (implementation)

- [x] Backend moods + API + snippet  
- [x] DELETE memory by id  
- [x] MoodGate + ChatView + MemoryView  
- [x] pytest + frontend build (run before handoff)  
