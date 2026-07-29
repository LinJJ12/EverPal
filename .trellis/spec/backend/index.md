# Backend Development Guidelines

> Companion BFF: personas, memory, safety pipeline, OpenAI-compatible LLM proxy.
> References: `docs/PRD.md`, `docs/diagrams.md`, `docs/feasibility-kids-ai.md`.

---

## Overview

Backend is a **companion BFF**, not a multi-provider chat workbench. Users never configure models. Safety (prompt + lexicon) and persona injection are mandatory on the chat path.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Module organization and file layout | Filled (planned) |
| [Database Guidelines](./database-guidelines.md) | Persistence patterns | Filled (planned) |
| [Error Handling](./error-handling.md) | Error types, handling strategies | Filled (planned) |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, forbidden patterns | Filled (planned) |
| [Logging Guidelines](./logging-guidelines.md) | Structured logging, log levels | Filled (planned) |
| [Safety Pipeline](./safety-pipeline.md) | Prompt + lexicon gates | Filled (planned) |

---

## Hard product rules

1. API keys only on server (env / secrets).
2. Chat path always: **persona + mode → memory snippet → input lexicon → optional moderation → LLM stream → output lexicon**.
3. Do **not** vendor-fork `vendor/kids-ai` as the app; **adapt** `safety_gate` / `memory` ideas under MIT with attribution if copied.
4. No romance personas in `prompts/` or companion seed data.
5. Minors-only product: short replies + strict lexicon; mild feelings talk allowed in prompt, not a separate adult mode.

---

**Language**: Spec files in English; prompts and user-facing safety replies in Simplified Chinese.
