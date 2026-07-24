# Product Constraints (玖伴)

> Binding decisions from `docs/PRD.md`. If code conflicts with this file, **this file wins** until the PRD is revised.

## Brand (provisional)

- **Name**: 玖伴
- **Meaning**: 九久相伴，永远有人回应
- **Icon**: `demo/assets/brand/logo.png` (transparent)

## Audience

- Primary: **minors under 18**, mainly elementary and junior-high students (~6–15)
- Not primary: adults seeking venting/companionship modes; developers wanting a multi-model workbench

## Phase-1 must

- Web, cartoon skin
- No login
- **Single minors experience** (no adult mode switch)
- Official companions (warm roles only; no romance)
- Light memory (nickname, preferences)
- Mild “talk about feelings” allowed inside minors prompt (empathy + steer to trusted adults) — **not** an adult treehole mode
- Safety = prompt rules + lexicon (minors-strict)
- Server-managed LLM (OpenAI-compatible)
- UX reference ships as HTML `demo/` **product shell**; formal app roots are **`frontend/`** + **`backend/`**
- Demo UI must read as a companion product, not an internal PRD/Tour presenter pack
- Do not put LLM API keys in `frontend/`; lexicon and prompt assembly live in `backend/`

## Phase-1 must not

- Adult / child dual mode UI or looser adult safety path
- Login / phone auth
- Parental consent flow (deferred)
- Romance / dating characters
- Multi-model user UI
- RAG / MCP workbench features as product entry
- Third-party moderation API (optional later)
- Shipping `vendor/kids-ai` as the product

## Decision test for new features

Ask: **Does this increase safe companionship for elementary/junior-high kids?**  
If it only helps adults or power users, defer or reject.
