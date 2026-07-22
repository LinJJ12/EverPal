# Frontend Development Guidelines

> Companion Chatbot (PRD v0.3): warm cartoon Web H5 for kids + ordinary adults.
> Source of truth until app code lands: `docs/PRD.md`, `docs/diagrams.md`.

---

## Overview

Frontend is a **mobile-first cartoon companion UI**. Hide all LLM/provider config from end users. No login in MVP.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Module organization and file layout | Filled (planned) |
| [Component Guidelines](./component-guidelines.md) | Component patterns, props, composition | Filled (planned) |
| [Hook Guidelines](./hook-guidelines.md) | Custom hooks, data fetching patterns | Filled (planned) |
| [State Management](./state-management.md) | Local state, global state, server state | Filled (planned) |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, forbidden patterns | Filled (planned) |
| [Type Safety](./type-safety.md) | Type patterns, validation | Filled (planned) |

---

## Product UI hard rules (always apply)

1. **Cartoon skin is default** (phase 1). Neutral adult skin is phase 2.
2. **No model picker, temperature, API key, or endpoint UI** for end users.
3. **Child / adult mode** affects copy size, topic cards, and safety tone — not a developer settings panel.
4. **No romance / dating character UI.**
5. Errors use plain Chinese, never raw HTTP/API messages.
6. Prefer large tap targets; phone is the primary device.

---

**Language**: Spec files in English; user-facing product copy in Simplified Chinese.
