---
type: feature-doc
project: reasonboard
stack: React + Vite + Framer Motion
created: 2026-07-24
last_verified: 2026-07-24
status: active
tags: [dive-nav, sibling-nav, footer-pager, deep-dive, floor, nudge]
---

## Dive Sibling Nav
**Purpose:** Inside a deep-dive, the footer slide pager becomes sibling navigation + go-up, with floor label and position counter.
**Stack:** React / TypeScript

### Files
| Type | Path | Exports/Purpose |
|------|------|-----------------|
| Store/State | `src/diveNav.ts` | `DiveNavState`, `setDiveNav`, `clearDiveNav`, `useDiveNav` |
| Component | `src/App.tsx` | Footer `.nav-dive` + sibling keys when active |
| Component | `src/whiteboard/Whiteboard.tsx` | Publish/clear diveNav from `scene` |
| Component | `src/MobileSlide.tsx` | Publish/clear from open section / idea / competitor |
| Util | `src/nudge.ts` | `NUDGE_NEXT_EVENT`, `nudgeNextSlide` |
| Component | `src/SlideAdvanceHint.tsx` | Optional arrow overlay (generic `sourceSelector`; unwired by default) |
| Config | `src/index.css` | `.nav-dive`, `.dive-counter`, `.dive-floor`, `.dive-pos`, `.slide-advance-hint` |

### Data Flow
```
[open section|idea|competitor]
  → Whiteboard|MobileSlide setDiveNav({ floor, index, total, go* })
  → useDiveNav() in App
  → footer ↑ ← Floor N · i/t →
  → goPrev|goNext|goUp | keys
[scene root | closed]
  → clearDiveNav() → normal slide pager
```

### Floors
| Floor | When | ← → siblings | ↑ / Esc |
|-------|------|--------------|---------|
| — (null) | Root board | — (slide pager) | — |
| **1** | `section` scene | Other sections with `onRoot !== false` | Back to root |
| **2** | `idea` / `competitor` / nested section (`fromSectionId`) | Ideas or competitors of parent (nested: total 1) | Parent section |

### Key Functions
| Signature | Role |
|-----------|------|
| `setDiveNav(state \| null) → void` | Publish footer controller (module singleton) |
| `clearDiveNav() → void` | Restore slide pager |
| `useDiveNav() → DiveNavState \| null` | `useSyncExternalStore` for App |
| `nudgeNextSlide() → void` | Dispatch `reasonboard:nudge-next` |

### State
| State | Meaning |
|-------|---------|
| `DiveNavState.floor` | `1` \| `2` |
| `DiveNavState.index` / `total` | 0-based sibling position |
| module `state` in `diveNav.ts` | Cross-tree singleton (App ↔ Whiteboard/Mobile) |

### UI (footer)
| Element | Behavior |
|---------|----------|
| `↑` | `goUp()` |
| `←` / `→` | Sibling prev/next; disabled at edges |
| `Floor {n}` | Label above counter |
| `{i} / {total}` | Sibling position |

### Keyboard (App, only if `diveNav`)
| Key | Action |
|-----|--------|
| `←` / PageUp | `goPrev` |
| `→` / PageDown | `goNext` |
| `↑` | `goUp` |
| Esc | Whiteboard / MobileDeepBoard `goBack` |
| F | fullscreen (unchanged) |

### Optional nudge
| Piece | Note |
|-------|------|
| Content | `DeckSlide.nudgeNextAfterId` |
| Trigger | Closing that section’s deep-dive on root |
| Event | `reasonboard:nudge-next` |
| Hint UI | `SlideAdvanceHint` — configurable selector; not hard-coupled to a section id |

### Gotchas
| Issue | Fix |
|-------|-----|
| Effect deps on `ideas = open?.ideas ?? []` | Derive lists **inside** effect from `sections` (avoid new `[]` each render) |
| Slide keys while diving | When `diveNav` set, arrows go to siblings not slides |
| Unmount slide | `return () => clearDiveNav()` in register effect |
| Nested `fromSectionId` | Floor 2, total 1, ↑ only |

### Related
- Scene stack: `001-deep-dive-whiteboard.md`
- Engine overview: `docs/ENGINE.md`
