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
}
```

## Section

A deep-diveable card on the root board. Optional payloads drive auto-layout:

| Field | Renders as |
|-------|------------|
| `body`, `takeaway`, `methodNote` | Text + stickies |
| `personas` | Persona cards |
| `define` | Four define cards |
| `criteria` / `semaforo` | Criteria + traffic light |
| `competitorNotes` | Competitor list → detail |
| `pairs` | Problem / solution cards |
| `ideas` / `bugs` | Openable idea/bug list |
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
