<p align="center">
  <img src="public/visuals/readme/logo.png" width="96" alt="ReasonBoard logo" />
</p>

<h1 align="center">ReasonBoard</h1>

<p align="center">
  <strong>Turn UX reasoning into a freeform whiteboard</strong><br />
  Personas, competitive scans, and solutions you can <em>open</em> — not just slides you flip.
</p>

<p align="center">
  <img src="public/visuals/readme/hero.png" width="920" alt="ReasonBoard whiteboard hero" />
</p>

<p align="center">
  <a href="#quick-start"><img src="https://img.shields.io/badge/quick%20start-npm%20run%20dev-0d9488?style=flat-square" alt="Quick start" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-111111?style=flat-square" alt="MIT" /></a>
  <a href="docs/method.md"><img src="https://img.shields.io/badge/method-Brief%20→%20Solution-0f766e?style=flat-square" alt="Method" /></a>
  <a href="https://github.com/AlekDob/reasonboard"><img src="https://img.shields.io/badge/github-AlekDob%2Freasonboard-111111?style=flat-square" alt="GitHub" /></a>
</p>

---

## What is this?

**ReasonBoard** is an open-source kit for presenting *how you reasoned* — not a feature dump.

You (or an AI skill) fill a typed deck: brief → personas → define → gap → competitive → solution.  
The app turns that into a **pannable whiteboard**: open a card, dive into post-its and evidence, climb back out. Same content works on desktop canvas and mobile stack.

Use it for product strategy, interview case studies, UX audits, competitive teardowns — any domain.

## Why not just slides?

| Slides | ReasonBoard |
|--------|-------------|
| Linear flip | Freeform path you can rearrange |
| Flat bullets | Deep-dive scenes (personas, competitors, ideas) |
| Copy pasted by hand | Typed `content.ts` + optional AI skills |
| One layout | Desktop whiteboard + mobile fallback |

## Method

```
Brief → Personas → Define → Gap → Competitive → Solution → Roadmap
```

<p align="center">
  <img src="public/visuals/readme/method-flow.png" width="880" alt="ReasonBoard method flow" />
</p>

1. **Brief** — value, opportunities, actions (20 seconds out loud)
2. **Personas** — usually three blockers (build / prioritize / prove)
3. **Define** — problem · user · insight · metrics
4. **Gap** — what’s missing today (often: reactive, generic, non-applied, forgetful)
5. **Competitive** — honest axis, no “first in the world”
6. **Solution** — few clear muscles + phased roadmap

Full write-up: [`docs/method.md`](docs/method.md) · IT: [`docs/method.it.md`](docs/method.it.md)

## Scene stack

Root board → section deep-dive → idea / competitor detail. Esc / Back climbs out.

<p align="center">
  <img src="public/visuals/readme/scene-stack.png" width="720" alt="Nested whiteboard scenes" />
</p>

## Quick start

```bash
git clone https://github.com/AlekDob/reasonboard.git
cd reasonboard
npm install
npm run dev
```

Open http://127.0.0.1:5173/

**Controls (desktop):** Space = pan · pinch / ctrl+scroll = zoom · Open = deep-dive · PageUp/Down = slide · F = fullscreen

## Bring your own case

1. Edit [`src/content.ts`](src/content.ts) — or ask an agent with the ReasonBoard skills  
2. Keep types from [`src/contentTypes.ts`](src/contentTypes.ts)  
3. Drop images in `public/visuals/`  

Schema: [`docs/content-schema.md`](docs/content-schema.md)

### AI skills (Cursor / Claude)

Point an agent at this repo and run the orchestrator skill:

| Skill | Does |
|-------|------|
| `reasonboard` | Asks 5–8 domain questions → drafts the whole deck → writes `content.ts` |
| `reasonboard-personas` | Three persona cards (builder / prioritizer / executive) |
| `reasonboard-competitive` | Competitor notes on reactive → proactive → agentic |
| `reasonboard-solution` | Solution muscles + phased roadmap |

Skills live in [`.claude/skills/`](.claude/skills/).

## Demo deck

Ships with a fictional SaaS case — **Northwind Analytics / Northwind Pulse** — so you can click around with zero customer data. Replace it when you’re ready.

## Stack

- React 19 + Vite + TypeScript  
- Framer Motion  
- Plain CSS with `--rb-*` tokens (teal accent — no purple AI slop)  
- Static deploy (Vercel-ready via `vercel.json`)

## Deploy

```bash
npm run build
# npm run preview
# or connect the repo to Vercel / any static host serving dist/
```

## Layout

```
reasonboard/
├── docs/                 # method + schema
├── .claude/skills/       # AI authoring skills
├── public/visuals/       # demo + README art
└── src/
    ├── content.ts        # ← your deck (swap this)
    ├── contentTypes.ts
    ├── App.tsx
    └── whiteboard/       # freeform engine
```

## License

MIT © [Alek](https://github.com/AlekDob)
