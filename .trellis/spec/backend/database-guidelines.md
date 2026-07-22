# Backend Database / Persistence Guidelines

## MVP storage

| Entity | Storage | Notes |
|--------|---------|--------|
| Anonymous profile | SQLite or local+server anonymous id | `nickname`, `mode`, optional age band |
| Session / Message | SQLite | Include optional `safety_action` |
| Memory items | SQLite or jsonl | Categories: like / dislike / event / preference |
| Lexicon | Versioned files under `data/lexicon/` | Hot-reload preferred; not only DB |

## Rules

1. No real user accounts in phase 1 (PRD: no login).
2. Prefer simple schema; migrate to PostgreSQL only when needed (phase 2+).
3. Memory writes go through safety memory-gate rules (discard health/self-harm/PII patterns).
4. Do not store full raw prompts with secrets in message logs.

## Naming

- Tables/collections: `snake_case` plural (`sessions`, `messages`, `memories`)
- IDs: string ULIDs/UUIDs

## Forbidden

- Requiring email/phone schema for MVP
- Storing provider API keys in DB rows
