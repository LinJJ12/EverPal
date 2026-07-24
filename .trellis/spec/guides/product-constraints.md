# Product Constraints (玖伴)

> Binding decisions from `docs/PRD.md`. If code conflicts with this file, **this file wins** until the PRD is revised.

## Brand (provisional)

- **Name**: 玖伴
- **Meaning**: 九久相伴，永远有人回应
- **Icon**: `demo/assets/brand/logo.png` (transparent)

## Audience

- Primary: **minors under 18**, mainly elementary and junior-high students (~6–15)
- Not primary: adults seeking venting/companionship modes; developers wanting a multi-model workbench

## Phase-1 status

**Feature-complete for internal testing** (2026-07-24). Not an external launch. Known deferred for release: Docker / trial deploy package, formal safety sample report.

## Phase-1 must (delivered)

- Web, cartoon skin
- No login
- **Single minors experience** (no adult mode switch)
- Official companions (warm roles only; no romance)
- Light memory (nickname, preferences, categorized memories)
- Mild “talk about feelings” allowed inside minors prompt (empathy + steer to trusted adults) — **not** an adult treehole mode
- Safety = prompt rules + lexicon (minors-strict)
- Server-managed LLM (OpenAI-compatible)
- UX reference ships as HTML `demo/` **product shell**; formal app roots are **`frontend/`** + **`backend/`**
- Demo UI must read as a companion product, not an internal PRD/Tour presenter pack
- Do not put LLM API keys in `frontend/`; lexicon and prompt assembly live in `backend/`

## Phase-1 must not (still binding)

- Adult / child dual mode UI or looser adult safety path
- Romance / dating characters
- Multi-model user UI
- RAG / MCP workbench features as product entry
- Shipping `vendor/kids-ai` as the product
- Adult-oriented second skin

## Phase-2 near-term

| Priority | Item | Status |
|----------|------|--------|
| P0 | Voice companion: push-to-talk STT + read-aloud TTS (chat page, Chinese-first, no login) | **Done (browser Web Speech)** — no `capabilities/speech` yet |
| P1 | Stronger long-term memory + daily mood check-in | Next |
| P1 | Safe story library / official topic packs (after memory) | Planned |
| P2 | Optional third-party moderation API; optional encyclopedia with **minors** safety gate | Deferred |
| Later stage | Login / family account; parental consent & panel | Deferred |
| Cancelled | Adult-oriented neutral skin | — |

Voice STT text must go through the same safety path as typed input. Keys stay in `backend/.env` only (LLM). Browser speech uses Web Speech APIs — no cloud speech keys in `frontend/`.

## Decision test for new features

Ask: **Does this increase safe companionship for elementary/junior-high kids?**  
If it only helps adults or power users, defer or reject.
