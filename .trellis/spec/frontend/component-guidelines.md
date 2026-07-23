# Frontend Component Guidelines

## Patterns

1. **Named exports** for components; one primary component per file.
2. Props interface **above** the component, suffix `Props`.
3. Keep chat bubbles **presentational**; streaming logic lives in hooks/pages.
4. Topic cards are first-class: empty chat must offer ≥3 actionable topics.

## Example shape (planned)

```tsx
// frontend/src/components/chat/TopicCards.tsx
export interface TopicCardsProps {
  topics: { id: string; label: string }[];
  onSelect: (id: string) => void;
}

export function TopicCards({ topics, onSelect }: TopicCardsProps) {
  return (
    <div className="topic-cards">
      {topics.map((t) => (
        <button key={t.id} type="button" onClick={() => onSelect(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
```

## Do

- Large hit areas (≥40px) for child mode
- Companion avatar + name visible in chat header
- Soft, cartoon-friendly visuals; low information density

## Don't

- Default-export page-sized components from `components/`
- Expose developer knobs (model, temperature) in any component
- Romance / dating character cards
- Card grids that look like an admin dashboard

## Anti-patterns

```tsx
// BAD — exposes tooling UI
<select value={model} onChange={...}>{models.map(...)}</select>

// GOOD — companion picker only
<CompanionPicker companions={officialCompanions} value={id} onChange={setId} />
```
