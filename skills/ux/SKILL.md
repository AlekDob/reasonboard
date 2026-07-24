---
name: ux
description: >-
  Run a structured UX reasoning flow: brief → personas → define → gap →
  competitive → solution → roadmap. Use whenever the user is building a product
  case study, interview narrative, competitive teardown, opportunity brief, or
  wants to turn messy product thinking into a clear argument — even if they
  never mention ReasonBoard. Prefer this skill over dumping feature lists.
  Triggers include: UX case, product narrative, how we reasoned, personas,
  define brief, gap analysis, competitive scan, solution pillars, roadmap for a
  pitch.
---

# UX reasoning

Turn messy product thinking into a **traceable argument**. Features come last.

## Why this exists

Stakeholders trust a path (who hurt · what’s missing · why this fix) more than a slide of capabilities. This skill keeps that path honest and short.

## Output shapes

Pick one based on context (ask if unclear):

1. **Outline only** — markdown sections for a doc or talk  
2. **ReasonBoard deck** — hand off to the `reasonboard` skill to write `src/content.ts`  
3. **Both** — outline first, then deck after user ok  

## Flow (confirm between major steps)

### 1. Questions (5–8 max)

1. Product / domain in one sentence  
2. Primary user? Secondary?  
3. Value / opportunities / actions they need  
4. What exists today?  
5. Honest gap (not “AI is dumb”)  
6. 2–4 peers or enterprise refs  
7. Language: EN or IT  
8. Working title for the proposal  

### 2. Personas (default: 3)

Shapes that usually cover a product:

| Shape | Needs |
|-------|--------|
| Builder / specialist | Where to intervene + apply after approve |
| Manager / prioritizer | What to do first without inventing the prompt |
| Executive / buyer | Verified value / board-proof story |

Each persona: about · day-to-day · problems · KPIs · solution fit.  
Show a short table → wait for ok.

### 3. Define (one sentence each)

Problem · User · Insight · Success metrics.

### 4. Gap

Spine: `data → reports → chat/tools → **gap** → action on the real UI`.

Name the gap in plain language. Optional: health criteria + traffic light.

### 5. Competitive

Axis: reactive → proactive → agentic (peer vs enterprise).  

For live pages and screenshots, call the **`research`** skill (agent-browser).  
No “first in the world.” Fragile survey ROI is not a pillar.

### 6. Solution + roadmap

Few muscles that **answer the gap**. Phased ship plan. Park side ideas separately so they don’t dilute the thesis.

## Voice

Write like a PM stand-up. Prefer: “only after you approve”, “shows up without asking”, “proof in €”. Avoid empty AI jargon.

## Hand-off to ReasonBoard

If the user wants the whiteboard UI, after the outline is approved invoke **`reasonboard`** (and specialists) to write typed content matching `src/contentTypes.ts`.

## Done when

The user can explain the path in ~60 seconds, and every solution muscle maps to a persona pain or competitive gap.
