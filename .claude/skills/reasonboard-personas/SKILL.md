---
name: reasonboard-personas
description: >-
  Draft three ReasonBoard personas (builder, prioritizer, executive shapes)
  with about, dailyContext, problems, kpis, forSolution. Use when building
  or refining the personas section of a ReasonBoard deck.
---

# ReasonBoard — personas

Produce **exactly three** personas unless the user asks otherwise.

## Shape

```ts
{
  id: string        // kebab-case
  name: string
  role: string
  about: string     // who / company context
  dailyContext: string  // how they use the product day to day
  problems: string
  kpis: string
  forSolution: string   // how the proposal helps them
  image: string     // e.g. /visuals/demo/persona-maya.svg
}
```

## Role shapes (default)

1. **Builder / specialist** — needs where to intervene + apply-after-approve  
2. **Manager / prioritizer** — needs ranked next actions without inventing the prompt  
3. **Executive / buyer** — needs verified value / board-proof story  

## Rules

- Concrete problems, not archetypes (“busy marketer”).
- `forSolution` must map to later solution sections.
- Keep each field to 1–3 sentences.
- Present a markdown table for confirmation before writing `content.ts`.
