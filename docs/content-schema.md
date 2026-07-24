# Content schema

Source of truth: [`src/contentTypes.ts`](../src/contentTypes.ts)  
Demo deck: [`src/content.ts`](../src/content.ts)

## Deck

```ts
type Deck = { slides: DeckSlide[] }

type DeckSlide = {
  id: string
  brandLeft: string
  brandRight: string
  pill: string
  meta: DeckMeta
  sections: Section[]
  tone?: "default" | "solution"
}

type DeckMeta = {
  eyebrow: string
  title: string   // HTML: <br />, <em>
  lede: string
  seedStickies?: [string, string]
  connectorColor?: string
  stickers?: DeckMetaSticker[]   // frameless PNG/SVG seeded top-right of the root board
}
```

## Section

A deep-diveable card on the root board (unless `onRoot: false` — then it's reachable only via another section, e.g. a solution branch). Optional payloads drive auto-layout:

| Field | Renders as |
|-------|------------|
| `body`, `takeaway`, `methodNote` (+ `methodTitle` / `methodEyebrow`) | Text + stickies |
| `personas` | Persona cards |
| `define` | Four define cards |
| `criteria` / `semaforo` | Criteria + traffic light |
| `competitorNotes` | Competitor list → detail |
| `pairs` | Problem / solution cards |
| `ideas` / `bugs` | Openable idea/bug list |
| `solutionNotes` | Post-its with branches (memory text, or `openSectionId` → nested deep dive) |
| `image` / `images` | Hero / gallery |

## Persona

`about` · `dailyContext` · `problems` · `kpis` · `forSolution` · `image`

## CompetitorNote

`does` · `validates` · `goesFurther` · `image` (+ optional `href`, `images`)

## Authoring tips

1. Keep root cards to **4–7** per slide.
2. Write like a PM stand-up, not an agent-tooling paper.
3. Prefer Italian *or* English consistently inside one deck (demo is EN).
4. Regenerate via `.claude/skills/reasonboard` instead of hand-editing when exploring a new domain.
