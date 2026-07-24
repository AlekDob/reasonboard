# ReasonBoard skills

Installable agent skills for the UX reasoning method + this whiteboard app.

When you open this repo in **Cursor / Claude Code**, skills under [`.claude/skills/`](../.claude/skills/) (symlinks here) are available automatically. You usually only need to **name the skill in the prompt**.

## Catalog

| Folder | Skill | When to use |
|--------|-------|-------------|
| [`ux/`](ux/) | UX reasoning | Any case study / product narrative — even without this UI |
| [`research/`](research/) | Competitive research | Live competitor pages via **agent-browser** |
| [`reasonboard/`](reasonboard/) | Deck writer | Produce / update `src/content.ts` for ReasonBoard |
| [`reasonboard-personas/`](reasonboard-personas/) | Personas | Three persona cards |
| [`reasonboard-competitive/`](reasonboard-competitive/) | Competitive notes | Typed `competitorNotes` |
| [`reasonboard-solution/`](reasonboard-solution/) | Solution | Muscles + roadmap |

## How to use (day to day)

1. Open the `reasonboard` project in the agent.  
2. Ask explicitly, e.g. *“Use the ux skill, then reasonboard…”*  
3. Confirm personas / outline when the agent pauses.  
4. Run `npm run dev` and open cards on the board.  

### Recommended flow

```text
ux  →  (optional) research  →  reasonboard  →  npm run dev
```

| Step | Skill | You get |
|------|-------|---------|
| 1 | `ux` | Interview + outline (brief → solution) |
| 2 | `research` | Screenshots in `public/visuals/competitive/` + note drafts |
| 3 | `reasonboard` | Typed `src/content.ts` the UI renders |

### Example prompts

**Full path**

> Use the **ux** skill for an AI inbox for ops dashboards. Three personas, honest gap vs chat-only tools, short solution outline.  
> Then **research**: capture public pages for Peer A and Peer B into `public/visuals/competitive/`.  
> Then **reasonboard**: replace `src/content.ts` with a two-slide EN deck.

**Deck only**

> Use **reasonboard**: rebuild the demo for a B2B scheduling product. Ask brief questions first.

**Method only (no UI)**

> Use the **ux** skill only — markdown outline, don’t touch `content.ts`.

## Global install (optional)

```bash
cd /path/to/reasonboard
for s in ux research reasonboard reasonboard-personas reasonboard-competitive reasonboard-solution; do
  ln -sfn "$(pwd)/skills/$s" "$HOME/.claude/skills/$s"
done
```

## Why not vendor full agent-browser?

`agent-browser` is a large system skill (Playwright CLI). Vendoring it would drift and bloat the repo. [`research/`](research/) is a **thin playbook**: check install, capture pages, drop assets into `public/visuals/`, fill `competitorNotes`.

Prerequisite: `npm i -g agent-browser` and `which agent-browser` on PATH.
