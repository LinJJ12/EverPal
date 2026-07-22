# Backend Quality Guidelines

## Must

- OpenAI-compatible streaming path works with server-side key
- Child vs adult system prompts differ (length, vocabulary, safety strength)
- Official companions ≥2, **zero romance roles**
- Unit tests for lexicon hits (self-harm, sexual, violence, PII solicitation)

## Forbidden

| Pattern | Why |
|---------|-----|
| Fork kids-ai as runtime app | Wrong product shape; JP/Anthropic coupled |
| AGPL bases as sole dependency | License risk for closed distribution |
| Skipping output lexicon on stream | Child safety regression |
| Teaching-lecture every turn | Adult venting / companion PRD |
| Exposing multi-model router UI APIs | Out of scope |

## Testing minimum

- `safety` lexicon: block + rewrite cases for child mode
- `memory` snippet builder does not inject discarded categories
- Chat orchestrator integration test with mocked LLM

## Review checklist

- [ ] Pipeline order preserved
- [ ] Chinese soft refusals
- [ ] No login requirement introduced accidentally
- [ ] Attribution comment if copying MIT kids-ai snippets
