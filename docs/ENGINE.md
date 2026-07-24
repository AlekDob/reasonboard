# Whiteboard engine

How `content.ts` becomes a pannable, zoomable board — and what's editable in DEV.

Source of truth: [`src/whiteboard/`](../src/whiteboard/). This doc explains the architecture; for the data model itself see [`docs/content-schema.md`](content-schema.md).

## Architecture

```
content.ts (Deck)
   │  typed Section[] / DeckMeta per slide
   ▼
layout.ts / deepDiveLayout.ts
   │  pure functions: content → positioned BoardItem[]
   ▼
Whiteboard.tsx (desktop) / MobileSlide.tsx (mobile)
   │  renders items, owns camera + scene state
   ▼
BoardItems.tsx / BoardSticker.tsx / sceneMotion.tsx
      presentational pieces (cards, stickers, connectors, motion)
```

- **`content.ts`** is the only file most users edit (or regenerate via the `reasonboard` skill). It's a plain typed `Deck` — no whiteboard concepts leak into it.
- **`layout.ts`** turns one slide's `DeckMeta` + section list into the *root* board: title/lede text items, seed stickies, one `BoardNode` per section, connectors between them, and optional `stickers` (frameless PNG/SVG decorations from `meta.stickers`).
- **`deepDiveLayout.ts`** turns a single `Section` into a *deep-dive* scene: persona cards, define cards, criteria, a traffic light, problem/solution pairs, bug/idea cards, competitor cards, image galleries, and `solutionNotes` (post-its with branches that either show more text inline or open another nested section via `openSectionId`). It also renders the idea-detail and competitor-detail scenes, plus the mobile-block equivalents (`mobileDeepBlocks`, `mobileIdeaBlocks`, `mobileCompetitorBlocks`).
- **`Whiteboard.tsx`** is the desktop freeform surface: it calls the layout functions, keeps a scene stack (`root → section → idea/competitor`, with sections able to nest via `fromSectionId` when opened from a solution branch), owns pan/zoom camera state per scene, and renders every `BoardItem` (nodes, stickies, content cards, images, stickers, text, connectors).
- **`MobileSlide.tsx` + `MobileDeepBoard.tsx`** render the same content model as a linear scrollable stack instead of a freeform canvas — no camera, no drag, but the same nested-section / competitor / idea navigation.

Everything downstream of `content.ts` is generic: there's no hardcoded copy, layout name, or product reference in the engine itself.

## DEV board editor

Gated entirely behind `isBoardEditor` (`import.meta.env.DEV` — see [`savedLayouts.ts`](../src/whiteboard/savedLayouts.ts)). In a `npm run dev` session on the root board or any deep-dive scene you get:

- **Select / multi-select** — click an item; Shift/Cmd/Ctrl-click adds to the selection.
- **Marquee** — drag on empty canvas to box-select multiple items (`.wb-marquee`).
- **Group drag** — drag any selected item and the whole selection moves together.
- **Inline edit** — double-click a sticky, text block, or content card to edit its copy in place (title / eyebrow / body / typed blocks).
- **Draw / sticky / arrow tools** — pencil strokes, post-its, and manual connectors between any two items (`FreeformToolbar`).
- **Stickers** — PNG/SVG images seeded from `meta.stickers`; select one to reveal a resize handle and a delete button.
- **Delete** — Backspace/Delete (or the × button) removes the selection; removals are tracked per-scene so a re-layout doesn't bring deleted items back.
- **Undo** — per-scene history stack.
- **Save / Reset** — see below.

None of this is available outside of DEV — production visitors get a read-only board (click-to-open, pan, zoom, lightbox) with no toolbar.

## Prod vs DEV behavior

| | DEV (`npm run dev`) | Prod (`npm run build` / static host) |
|---|---|---|
| Editing, marquee, drag, stickers | ✅ | ❌ (`isBoardEditor` is `false`) |
| `FreeformToolbar` | visible | hidden |
| Save / Reset | writes to disk via `vite-plugin-wb-save.ts` | not wired (no server) |
| Click to open a section/idea/competitor | ✅ | ✅ |
| Pan / zoom / lightbox | ✅ | ✅ |

## Scene keys & saved layouts

Every board a user can land on — the root, a section deep-dive, an idea, or a competitor guide — has a **scene key**, computed by `sceneKeyFor(slideId, scene)` in [`savedLayouts.ts`](../src/whiteboard/savedLayouts.ts):

```ts
sceneKeyFor("path", { type: "root" })                              // "path-root"
sceneKeyFor("path", { type: "section", id: "personas" })           // "path-personas"
sceneKeyFor("path", { type: "idea", sectionId: "x", ideaId: "y" }) // "path-idea--y"
sceneKeyFor("path", { type: "competitor", sectionId: "x", competitorId: "z" }) // "path-competitor--z"
```

`slideId` is the `id` field of the `DeckSlide` in `content.ts` — so scene keys are always derived from your content, never hardcoded.

Hitting **Save** in the toolbar POSTs the current item positions + camera to `/__wb-save` (a DEV-only Vite middleware registered by `reasonboard-wb-save`, see [`vite-plugin-wb-save.ts`](../vite-plugin-wb-save.ts)), which writes `src/whiteboard/saved-layouts/<sceneKey>.json`. On the next load, `mergeLayout()` overlays those saved positions/text onto the freshly computed layout from `content.ts` — so editing content doesn't erase manual tweaks, and tweaking positions doesn't require touching content.

**Reset** deletes that scene's saved file (`DELETE /__wb-save?key=...`) and re-runs the pure layout function.

`src/whiteboard/saved-layouts/` ships empty (`.gitkeep` only) — it's a personal workspace, not something to commit example layouts into.

## `diveNav` — the footer pager

[`diveNav.ts`](../src/diveNav.ts) is a tiny external store (`useSyncExternalStore`) that `Whiteboard.tsx` and `MobileSlide.tsx` publish to whenever the user is inside a deep-dive scene. `App.tsx` subscribes via `useDiveNav()` and swaps the footer from the normal slide pager to a "floor" pager:

- **↑** — go up a level (`goUp`, same as Esc/Back)
- **← / →** — step through siblings at the current level (`goPrev` / `goNext`) — e.g. other sections on the root, or other ideas/competitors inside a section
- The counter shows `Floor 1` (sections) or `Floor 2` (idea/competitor detail) plus a position indicator

When `diveNav` is `null`, the footer falls back to the normal slide-to-slide pager and PageUp/PageDown/arrow keys paginate slides instead.

There's also an optional, fully generic **nudge**: if a `DeckSlide.nudgeNextAfterId` matches the section id that was just closed on the root, a `reasonboard:nudge-next` event ([`nudge.ts`](../src/nudge.ts)) briefly animates the "next slide" button. It's opt-in per slide via content — the engine has no hardcoded coupling to any specific section.

## How the skills relate

The `.claude/skills/reasonboard*` skills ([`skills/`](../skills/)) only ever write `src/content.ts` (and occasionally seed `public/visuals/`) — they never touch the whiteboard engine. That separation is intentional: regenerating a deck for a new case study should never require understanding `Whiteboard.tsx`, and improving the engine should never require rewriting a skill. See [`skills/README.md`](../skills/README.md) for the skill index and [`docs/content-schema.md`](content-schema.md) for the exact fields the skills populate.
