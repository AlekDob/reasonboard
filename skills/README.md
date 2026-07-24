# ReasonBoard skills

Installable agent skills for the UX reasoning method + this whiteboard app.

| Folder | Skill | When to use |
|--------|-------|-------------|
| [`ux/`](ux/) | UX reasoning | Any case study / product narrative — even without this UI |
| [`research/`](research/) | Competitive research | Live competitor pages via **agent-browser** |
| [`reasonboard/`](reasonboard/) | Deck writer | Produce / update `src/content.ts` for ReasonBoard |
| [`reasonboard-personas/`](reasonboard-personas/) | Personas | Three persona cards |
| [`reasonboard-competitive/`](reasonboard-competitive/) | Competitive notes | Typed `competitorNotes` |
| [`reasonboard-solution/`](reasonboard-solution/) | Solution | Muscles + roadmap |

## Recommended flow

1. **`ux`** — interview + method (brief → solution outline)  
2. **`research`** — optional screenshots of peers (needs `agent-browser`)  
3. **`reasonboard`** — write the typed deck the UI can open  

## Why not vendor full agent-browser?

`agent-browser` is a large system skill (Playwright CLI). Vendoring it would drift and bloat the repo. `skills/research` is a **thin playbook**: check install, capture pages, drop assets into `public/visuals/`, fill `competitorNotes`.
