# Product Constraints (Companion Chatbot)

> Binding decisions from `docs/PRD.md` v0.3. If code conflicts with this file, **this file wins** until the PRD is revised.

## Audience

- Primary: elementary-age children (~6–12) and ordinary non-technical adults
- Not primary: developers wanting a multi-model workbench

## Phase-1 must

- Web (mobile-first), cartoon skin
- No login
- Child / adult modes
- Official companions (warm roles only)
- Light memory (nickname, preferences)
- Safety = prompt rules + lexicon
- Server-managed LLM (OpenAI-compatible)

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
| `docs/feasibility-kids-ai.md` | What to copy vs discard from kids-ai |
| `docs/research-companions.md` | Landscape |

## Decision test for new features

Ask: **Does this increase safe companionship for kids/ordinary adults?**  
If it only helps power users or tooling, defer or reject.
