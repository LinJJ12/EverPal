# Product Constraints (玖伴)

> Binding decisions from `docs/PRD.md` v0.4. If code conflicts with this file, **this file wins** until the PRD is revised.

## Brand (provisional)

- **Name**: 玖伴
- **Meaning**: 九久相伴，永远有人回应
- **Icon**: `demo/assets/brand/logo.png` (transparent)

## Audience

- Primary: elementary-age children (~6–12) and ordinary non-technical adults
- Not primary: developers wanting a multi-model workbench

## Phase-1 must

- Web, cartoon skin
- No login
- Child / adult modes
- Official companions (warm roles only)
- Light memory (nickname, preferences)
- Safety = prompt rules + lexicon
- Server-managed LLM (OpenAI-compatible)
- UX reference ships as HTML `demo/` **product shell**; formal app roots are **`frontend/`** + **`backend/`** (see `docs/directory-structure.md`)
- Demo UI must read as a companion product, not an internal PRD/Tour presenter pack
- Do not put LLM API keys in `frontend/`; lexicon and prompt assembly live in `backend/`

## Phase-1 must not

- Login / phone auth
- Parental consent flow (deferred)
- Romance / dating characters
- Multi-model user UI
- RAG / MCP workbench features as product entry
- Third-party moderation API (optional later)
- Shipping `vendor/kids-ai` as the product

## Reference docs in repo

| Doc | Use |
|-----|-----|
| `docs/PRD.md` | Requirements |
| `docs/diagrams.md` | Flows / architecture |
| `docs/directory-structure.md` | `frontend/` + `backend/` folder & file contracts |
| `demo/README.md` | How to run the HTML demo |
| `docs/feasibility-kids-ai.md` | What to copy vs discard from kids-ai |
| `docs/research-companions.md` | Landscape |

## Decision test for new features

Ask: **Does this increase safe companionship for kids/ordinary adults?**  
If it only helps power users or tooling, defer or reject.
