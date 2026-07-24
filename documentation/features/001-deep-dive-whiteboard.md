---
type: feature-doc
project: reasonboard
stack: React + Vite + Framer Motion
created: 2026-07-24
last_verified: 2026-07-24
status: active
tags: [deep-dive, scene-stack, content-cards, solution-notes, whiteboard, mobile]
---

## Deep Dive Whiteboard
**Purpose:** Open a root node → second (and third) board context with typed cards + stickies; not a modal popup.
**Stack:** React / Vite / Framer Motion / TypeScript

### Files
| Type | Path | Exports/Purpose |
|------|------|-----------------|
| Model/Type | `src/contentTypes.ts` | `Section`, `Persona`, `SolutionNote`, `SolutionBranch`, `IdeaItem`, `CompetitorNote`, `Deck` |
| Config | `src/content.ts` | Demo `deck` (swap per case) |
| Util | `src/RichText.tsx` | `RichText`, `TitleHtml` |
| Service | `src/whiteboard/layout.ts` | `layoutSlideBoard(meta, sections, …)` root board |
| Service | `src/whiteboard/deepDiveLayout.ts` | `layoutDeepDive`, `layoutIdeaDetail`, `layoutCompetitorDetail`, `mobileDeepBlocks` |
| Component | `src/whiteboard/BoardItems.tsx` | `ContentCardView`, `BoardImageView`, `BoardTextView`, `MobileContentCard` |
| Component | `src/whiteboard/ImageLightbox.tsx` | Image zoom overlay |
| Component | `src/whiteboard/Whiteboard.tsx` | Scene stack + dive items + diveNav publish |
| Motion | `src/whiteboard/sceneMotion.tsx` | `EnterWrap`, `sceneMotion`, `AnimatedConnector` |
| Component | `src/whiteboard/MobileDeepBoard.tsx` | Immersive overlay ≤1366px |
| Component | `src/MobileSlide.tsx` | Mobile stack + diveNav |
| Component | `src/DeckSlideView.tsx` | Desktop vs mobile switch per slide |
| Config | `src/index.css` | `.wb-cc-*`, `.wb-deep-*`, paper tints |

### Data Flow
```
[Open / short-click root node]
  → scene section + layoutDeepDive
  → [Open idea|competitor|openSectionId]
  → scene idea|competitor|nested section
  → Esc / ← Board → parent|root
  → optional nudgeNextAfterId → reasonboard:nudge-next
```

Footer siblings: `documentation/features/004-dive-sibling-nav.md`.

### Key Functions
| Signature | Role |
|-----------|------|
| `layoutSlideBoard(meta, sections, w, h) → BoardItem[]` | Root: text + nodes + connectors + stickers |
| `layoutDeepDive(section, w, h) → BoardItem[]` | Section deep-dive layout |
| `layoutIdeaDetail(idea, index, w, h) → BoardItem[]` | Idea detail scene |
| `layoutCompetitorDetail(note, …) → BoardItem[]` | Competitor guide scene |
| `mobileDeepBlocks(section) → MobileDeepBlock[]` | Same content, linear mobile |
| `EnterWrap({ enabled, delay, sceneToken })` | One-shot stagger per scene |
| `sceneMotion(dir, reduce)` | Zoom in/out between scenes |

### State (Whiteboard)
| State | Meaning |
|-------|---------|
| `scene` | `root` \| `section(+fromSectionId?)` \| `idea` \| `competitor` |
| `rootItems` / `diveItems` | Separate boards; root kept while diving |
| `navDir` | `"in"` \| `"out"` for scene motion |
| `frontId` | z-index bring-to-front (no array reorder) |

### Board item kinds (deep)
| Kind / variant | Use |
|----------------|-----|
| `contentCard` + `persona` | Photo + blocks (`dailyContext`, problems, KPIs, forSolution) |
| `contentCard` + `define` / `criterion` / `bug` / `idea` / `body` / `semaforo` | Typed copy + tags |
| `contentCard` + `solution` | Solution-note post-it; branches may set `openSectionId` |
| `contentCard` + `competitor` | List card → Open → competitor scene |
| `contentCard` + `image` | Image-only; click → lightbox |
| `sticky` / `text` / `image` / `connector` | Notes, chrome, evidence, links |

### Content card open fields
| Field | Opens |
|-------|-------|
| `openIdeaId` | Idea scene |
| `openCompetitorId` | Competitor scene |
| `openSectionId` | Nested section (`fromSectionId` parent) |
| `zoomSrc` | Lightbox |

### Section content flags
| Field | Note |
|-------|------|
| `onRoot?: false` | Nested-only (no root node) |
| `methodTitle` / `methodEyebrow` | Method sticky labels |
| `solutionNotes[]` | Pillar answers + optional `branches` |

### Gotchas
| Issue | Fix |
|-------|-----|
| Drag → transparent card | Don’t reorder array; `frontId` z-index; `EnterWrap` once per `sceneToken` |
| Crowded left | `spreadRow` / `spreadRows` in deepDiveLayout |
| Nested section Esc | Pop to `fromSectionId` parent, not always root |
| Field names | `dailyContext` / `goesFurther` — not product-specific aliases |

### Related
- Camera: `002-whiteboard-camera-pan.md`
- DEV editor: `003-whiteboard-local-editor.md`
- Dive pager: `004-dive-sibling-nav.md`
- Narrative: `docs/ENGINE.md`
