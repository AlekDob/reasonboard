# ReasonBoard method

A reusable UX reasoning flow. Fill a deck — don’t dump features.

```
Brief → Personas → Define → Gap → Competitive → Solution → Roadmap
```

## 1. Brief

Capture the ask in plain language:

- What **value** should users see?
- What **opportunities** should they spot?
- What **actions** should they take?

If you cannot say this in 20 seconds, you are not ready to design.

## 2. Personas

Usually **three** people with different jobs (and blockers):

| Role shape | Needs |
|------------|--------|
| Builder / specialist | Where to intervene — and someone who **applies** after approve |
| Manager / prioritizer | What to do first — **without inventing the question** every morning |
| Executive / buyer | Whether it pays — **evidence that survives a board** |

Each persona needs: about · day-to-day · problems · KPIs · solution fit.

## 3. Define (one sentence each)

Pin before ideation:

1. **Problem**
2. **User**
3. **Insight** (what is actually missing — often not “AI is dumb”)
4. **Success metrics**

## 4. Gap

Name the gap on a simple spine:

`data → reports → chat → **gap** → action on the real UI`

Common gap pattern: advice exists if you ask, but the product is reactive, generic, non-applied, forgetful.

Optional: health criteria + traffic light (goal · baseline · funnel · trend · € outcome).

## 5. Competitive

Honest scan. Prefer axes over feature bingo:

- Reactive → proactive → agentic
- Peer vs enterprise

For each note: what they do · why it validates you · where you go further.  
No “first in the world.” Fragile claims stay out of the thesis.

## 6. Solution + roadmap

Answer the gap with a few clear muscles (inbox, apply-after-approve, guides, memory… — whatever fits **your** case).

Ship in phases. Park side ideas as `ideas[]` so they don’t dilute the core.

---

## How this maps to the UI

| Method step | Content field |
|-------------|----------------|
| Brief / narrative | `body`, `summary`, `takeaway`, `methodNote` |
| Personas | `personas[]` |
| Define | `define` |
| Health check | `criteria`, `semaforo` |
| Competitive | `competitorNotes[]` |
| Side ideas | `ideas[]` |
| Problem→solution | `pairs[]` |

Write everything in `src/content.ts`. The whiteboard renders it.

See also: [content-schema.md](./content-schema.md) · Italian summary: [method.it.md](./method.it.md)
