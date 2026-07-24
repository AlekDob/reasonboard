---
type: feature-doc
project: reasonboard
stack: React + Vite + Framer Motion
created: 2026-07-24
last_verified: 2026-07-24
status: active
tags: [whiteboard, local-editor, multi-select, marquee, save-layout, stickers, vite]
---

## Whiteboard Local Editor
**Purpose:** DEV-only board editor: multi-select, marquee, inline edit, draw/sticky/arrow, stickers, Save/Reset per scene. Production stays read-only (open / pan / zoom / lightbox).
**Stack:** React / Vite / TypeScript

### Gate
| Flag | Condition | Behavior |
|------|-----------|----------|
| `isBoardEditor` | `import.meta.env.DEV` | Toolbar, drag, multi-select, edit, delete, Save/Reset, arrows, stickers controls |

Exported from `src/whiteboard/savedLayouts.ts`. Single gate (unlike forked variants that split delete/persist/arrows).

### Files
| Type | Path | Exports/Purpose |
|------|------|-----------------|
| Service | `src/whiteboard/savedLayouts.ts` | `isBoardEditor`, `sceneKeyFor`, `mergeLayout`, `persistScene`, `deletePersistedScene`, `getSaved*` |
| Middleware | `vite-plugin-wb-save.ts` | `POST/DELETE /__wb-save` in `configureServer` only |
| Config | `vite.config.ts` | Registers `reasonboard-wb-save` |
| Config | `src/whiteboard/saved-layouts/.gitkeep` | Empty dir; JSON files are local workspace (don’t commit examples) |
| Component | `src/whiteboard/Whiteboard.tsx` | Hydrate, multi-select, edit, delete, Save |
| Component | `src/whiteboard/FreeformToolbar.tsx` | Tools + Save/Reset |
| Component | `src/whiteboard/BoardItems.tsx` | Inline edit fields |
| Component | `src/whiteboard/BoardSticker.tsx` | Frameless PNG/SVG + resize/delete (DEV) |
| Model/Type | `src/whiteboard/types.ts` | `BoardSticker`, `BoardItem`, `itemSize` |
| Config | `src/index.css` | `.wb-selected`, `.wb-marquee`, `.wb-cc-edit-*`, `.wb-sticker*`, `.ff-tool-save` |

### Scene keys
| Scene | Key pattern |
|-------|-------------|
| Root | `{slideId}-root` |
| Section deep-dive | `{slideId}-{sectionId}` |
| Idea nested | `{slideId}-idea--{ideaId}` |
| Competitor nested | `{slideId}-competitor--{competitorId}` |

`slideId` = `DeckSlide.id` from `content.ts` (never hardcoded `s1`/`s2`).

### Saved JSON schema
| Field | Type | Note |
|-------|------|------|
| `version` | `1` | |
| `sceneKey` | string | `^[a-z0-9][a-z0-9-]{0,120}$` |
| `items` | `BoardItem[]` | Positions + edited text + user sticky/stroke/connector/sticker |
| `camera?` | `{ scale, x, y }` | Default framing |
| `removedIds?` | `string[]` | Deleted ids — don’t restore from fresh layout |

### Data Flow
```
[Save] → persistScene(key, items, cam, removedIds) → POST /__wb-save → saved-layouts/{key}.json + memory
[Open scene] → layout* fresh → mergeLayout(fresh, saved.items, removedIds) → state
[Camera] → saved camera OR fit/identity
[Reset] → DELETE /__wb-save → algorithmic layout + default cam
```

### Multi-select (select tool, DEV)
| Input | Action |
|-------|--------|
| Shift / Cmd / Ctrl + click | Toggle selection (no open) |
| Drag empty canvas | Marquee; Shift = additive |
| Drag item already selected | Move whole group |
| Click empty / Esc | Clear selection (Esc exits edit first) |
| Backspace / Delete | Remove selected (not root `node`s) |

### Inline edit (DEV)
| Target | How |
|--------|-----|
| Sticky | Double-click (synthetic `lastTap`) → textarea |
| `text` (eyebrow/title/lede) | Dbl → textarea (raw html ok) |
| `contentCard` | Dbl → title/eyebrow + text/blocks |
| Esc / click empty | Exit edit |

### Stickers
| Piece | Note |
|-------|------|
| Seed | `DeckMeta.stickers[]` → root layout |
| Kind | `BoardSticker` — frameless img |
| DEV | Select → resize handle + × delete |
| Persist | Positions/size via Save merge |

### Pointer UX (select)
| Input | DEV | Prod |
|-------|-----|------|
| Drag item | Move (group if multi) | No (read-only) |
| Short click + `zoomSrc` | Lightbox after `DBL_MS` | Same |
| Double-click ~320ms | Inline edit | No edit |
| Idea/competitor | Open via **Open** button | Same |
| Root node short click | Open section | Same |

### Merge rules
| Case | Behavior |
|------|----------|
| Same `id` | Position + edited fields from saved; structure from fresh |
| Sticky/stroke/connector/sticker only in saved | Kept |
| `id` in `removedIds` | Not restored from fresh |
| New id only in fresh | Added |

### Key Functions
| Signature | Role |
|-----------|------|
| `sceneKeyFor(slideId, scene) → string` | File key |
| `mergeLayout(fresh, saved, removedIds) → BoardItem[]` | Hydrate |
| `persistScene(key, items, cam?, removedIds?) → Promise` | Write JSON |
| `deletePersistedScene(key) → Promise` | Reset |
| `isBoardEditor` | DEV gate |

### State (Whiteboard extras)
| State | Meaning |
|-------|---------|
| `selectedIds` | Multi-selection |
| `marqueeBox` | Live marquee rect |
| `editingId` | Inline edit target |
| `removedIds` + per-scene ref | Deletes before Save |
| `saveBusy` / `saveLabel` | Save feedback |

### Gotchas
| Issue | Fix |
|-------|------|
| Native dblclick eaten by capture | Synthetic dbl via `lastTap` + `DBL_MS` (320) |
| Zoom vs dbl→edit | Delayed lightbox; second tap cancels timer → edit |
| Delete without `removedIds` | Card returns on refresh from fresh layout |
| Plugin only DEV | No `/__wb-save` on Vercel/preview |
| Commit layouts | Keep `saved-layouts/` empty in git; personal only |

### Config
- Endpoint: `POST/DELETE /__wb-save`
- Dir: `src/whiteboard/saved-layouts/`
- Plugin name: `reasonboard-wb-save`
- Accent swatch: `#0d9488`
