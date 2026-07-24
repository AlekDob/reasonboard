---
type: feature-doc
project: reasonboard
stack: React + Vite + Framer Motion
created: 2026-07-24
last_verified: 2026-07-24
status: active
tags: [whiteboard, camera, zoom, pan, toolbar]
---

## Whiteboard Camera & Tools
**Purpose:** Desktop board navigation: pinch-zoom, pan (scroll / hold Space), zoom badge reset; in DEV camera can persist with layout Save.
**Stack:** React / Framer Motion / TypeScript

### Files
| Type | Path | Exports/Purpose |
|------|------|-----------------|
| Component | `src/whiteboard/Whiteboard.tsx` | `cam`, wheel, space-pan, hydrate camera |
| Component | `src/whiteboard/FreeformToolbar.tsx` | Tools + select↔hand morph + Save (DEV) |
| Service | `src/whiteboard/savedLayouts.ts` | `getSavedCamera`, `persistScene(..., camera)` |
| Util | `src/whiteboard/cameraFit.ts` | `fitCameraToItems` |
| Config | `src/index.css` | `.wb-camera`, `.wb-space-pan`, `.ff-tool.is-pan` |
| Config | `src/App.tsx` | Footer hint pinch / Space |

### Data Flow
```
[Pinch / ctrl+wheel] → zoom toward cursor (0.4–2.6) → cam
[Two-finger scroll] → pan cam.x/y
[Hold Space] → spaceHeld → pointer-capture pan → toolbar hand
[Click zoom %] → resetCam()
[Scene change] → saved camera OR root identity OR fitCameraToItems
[DEV Save] → camera in scene JSON (see 003)
[DEV Reset] → delete JSON → default cam
```

### Key Functions
| Signature | Role |
|-----------|------|
| `fitCameraToItems(items, w, h) → Cam` | Initial zoom/pan (cap ≤100%) if no saved camera |
| `localPoint(e) → Point` | Client → world `((xy - cam) / scale)` |
| `startPan(e)` | Space-pan from any target (capture) |
| `resetCam()` | Root → 1×; deep-dive → re-fit |
| `getSavedCamera(sceneKey)` | Persisted framing |

### State
| State | Meaning |
|-------|---------|
| `cam` | `{ scale, x, y }` |
| `camRef` | Sync read in pointer handlers |
| `spaceHeld` / `panning` | Space-pan mode / active drag |
| `tool` | `select` \| `pencil` \| `sticky` \| `arrow` |

### Toolbar UX
| Condition | UI |
|-----------|-----|
| Default select | Cursor icon |
| `spacePan` | Crossfade → hand; other tools disabled |
| `panning` | `.ff-pan-pulse` |
| DEV only | Save / Reset buttons |

### CSS hooks
| Class | Role |
|-------|------|
| `.wb-camera` | `translate + scale`, origin 0 0 |
| `.wb-space-pan` / `.wb-panning` | grab / grabbing |
| `.wb-zoom-badge` | % + reset |
| `.topbar-wb` | Glass header |

### Gotchas
| Issue | Fix |
|-------|-----|
| Wheel scrolls page | `{ passive: false }` + preventDefault on pinch/pan |
| Space in textarea | Ignore if target is `textarea,input,[contenteditable]` |
| Draw/drag under zoom | Always `/ scale` via `localPoint` |
| Saved vs fit | Saved wins; Reset deletes JSON |

### Config
- Zoom range: `0.4` … `2.6`
- Fit scale: `0.55` … `1.0`
- Related: `003-whiteboard-local-editor.md`
