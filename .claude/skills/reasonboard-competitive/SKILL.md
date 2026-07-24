---
name: reasonboard-competitive
description: >-
  Draft ReasonBoard competitorNotes on a reactive→proactive→agentic axis
  with does, validates, goesFurther. Use when scanning peers for a deck.
---

# ReasonBoard — competitive

## Axis

Map notes on: **reactive → proactive → agentic** (and peer vs enterprise).

## Shape

```ts
{
  id: string
  title: string
  kind: string      // Peer | Enterprise | Measurement…
  blurb: string     // one line on the list card
  does: string
  validates: string // why this supports our thesis
  goesFurther: string // where we can go further
  href?: string
  image: string
  images?: { src: string; caption?: string; href?: string }[]
}
```

## Rules

- 2–4 notes max for a sharp board.
- No “first in the world.” No fragile survey ROI as a pillar.
- If the user lacks public product access, use **clearly fictional** peers labeled as such (like the demo).
- `validates` ≠ copy their marketing; say what pattern it proves.
- `goesFurther` must connect to the solution muscles on slide 2.
