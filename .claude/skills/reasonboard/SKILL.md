---
name: reasonboard
description: >-
  Orchestrate a ReasonBoard UX case: ask domain questions, draft personas,
  competitive notes, solution sections, and write typed src/content.ts.
  Use when the user wants a new reasoning deck, case study board, or to
  regenerate content for the ReasonBoard whiteboard.
---

# ReasonBoard orchestrator

Turn a domain into a **typed deck** the whiteboard can open — not a markdown essay.

## Before you start

1. Read `docs/method.md` and `docs/content-schema.md`.
2. Read `src/contentTypes.ts` (source of truth for types).
3. Skim the current `src/content.ts` structure (two slides is the default shape).

## Flow (stop for confirmation between major steps)

### Step 1 — Questions (5–8)

Ask only what you need:

1. Product / domain in one sentence
2. Who is the primary user? Secondary?
3. What are they trying to achieve (value / opportunities / actions)?
4. What exists today (chat, reports, agents…)?
5. What is the honest gap?
6. 2–4 peers or enterprise refs (names ok; no overclaims)
7. Language for the deck: EN (default) or IT
8. Working title for the proposal

### Step 2 — Personas

Draft **3** personas. Call the `reasonboard-personas` skill pattern (or follow that SKILL).  
Show a short table → wait for user ok → continue.

### Step 3 — Define + gap

Write `define` (problem / user / insight / metrics) and a gap section with optional `criteria` + `semaforo`.

### Step 4 — Competitive

Draft 2–4 `competitorNotes`. Prefer fictional or clearly labeled peers if the user has no public refs. Use `reasonboard-competitive`.

### Step 5 — Solution

Draft slide 2 sections (muscles that answer the gap) + phased roadmap. Use `reasonboard-solution`.

### Step 6 — Write `src/content.ts`

Replace or update `src/content.ts` so it:

- Exports `export const deck: Deck`
- Typechecks against `contentTypes.ts`
- Uses `DeckMeta` for titles/ledes/seed stickies (no hardcoded layout switch)
- Keeps root sections to **4–7** per slide
- Uses placeholder SVGs under `/visuals/demo/` or omits images when missing

Then run `npm run build` (or `npx tsc -b`) and fix type errors.

## Voice

Write like a product stand-up. Avoid: gated, grounded, north star as a label, closed loop without explanation, skill-name chains in user-facing copy.

## Done when

- `npm run build` passes
- User can `npm run dev` and open personas / competitive / solution deep-dives
