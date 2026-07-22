# Bootstrap Task: Fill Project Development Guidelines

**Status: completed for greenfield baseline (2026-07-22).**

Specs were filled from product docs (`docs/PRD.md`, `docs/diagrams.md`, `docs/feasibility-kids-ai.md`) because application code does not exist yet. When `web/` and `server/` land, re-run `/trellis:update-spec` to replace planned examples with real file paths.

---

## Status

- [x] Fill backend guidelines
- [x] Fill frontend guidelines
- [x] Add code examples (planned shapes; update after scaffold)
- [x] Add product-constraints + safety-pipeline specs

---

## Notes for future sessions

1. Prefer `.trellis/spec/guides/product-constraints.md` on any chat/UI task.
2. Prefer `.trellis/spec/backend/safety-pipeline.md` on any chat pipeline task.
3. Do not treat `vendor/kids-ai` as the app runtime.
4. Archive this bootstrap task after human confirmation:

```bash
python ./.trellis/scripts/task.py finish
python ./.trellis/scripts/task.py archive 00-bootstrap-guidelines
```
