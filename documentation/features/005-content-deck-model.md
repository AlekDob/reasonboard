---
type: feature-doc
project: reasonboard
stack: React + Vite + TypeScript
created: 2026-07-24
last_verified: 2026-07-24
status: active
tags: [content-model, deck, schema, skills]
---

## Content Deck Model
**Purpose:** Typed `Deck` in `content.ts` is the only content source the engine and AI skills write; whiteboard never hardcodes case copy.
**Stack:** TypeScript

### Files
| Type | Path | Exports/Purpose |
|------|------|-----------------|
| Model/Type | `src/contentTypes.ts` | `Deck`, `DeckSlide`, `DeckMeta`, `Section`, personas, competitors, `SolutionNote`… |
| Config | `src/content.ts` | Demo Northwind deck |
| Config | `docs/content-schema.md` | Human schema guide |
| Config | `docs/method.md` | UX method narrative |
| Service | `skills/reasonboard*/SKILL.md` | Agents that regenerate `content.ts` only |

### Data Flow
```
[ux | research | reasonboard skills]
  → write src/content.ts (+ optional public/visuals/)
  → layoutSlideBoard / layoutDeepDive
  → Whiteboard | MobileSlide
```

### Key types
| Type | Role |
|------|------|
| `Deck` | `{ slides: DeckSlide[] }` |
| `DeckSlide` | `id`, brands, `meta`, `sections`, optional `nudgeNextAfterId` |
| `DeckMeta` | Root chrome: eyebrow/title/lede, seed stickies, connectors, stickers |
| `Section` | Deep-diveable unit; `onRoot?: false` for nested-only |
| `SolutionNote` / `SolutionBranch` | Pillar answers + optional nested open |
| `Persona` | Uses `dailyContext` (generic day-to-day field) |
| `CompetitorNote` | Uses `goesFurther` (where we can go further) |

### Gotchas
| Issue | Fix |
|-------|------|
| Skills touching engine | Skills must only write `content.ts` / visuals |
| Product-specific field names | Keep generic (`dailyContext`, `goesFurther`) |
| Nested-only sections | Set `onRoot: false` so they don’t appear as root nodes |

### Related
- Engine: `docs/ENGINE.md`
- Deep-dive: `001-deep-dive-whiteboard.md`
- Skills index: `skills/README.md`
