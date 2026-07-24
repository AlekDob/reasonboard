---
name: research
description: >-
  Capture competitive evidence for a UX / ReasonBoard case using agent-browser:
  open product pages, take screenshots, extract honest notes (does / validates /
  goes further). Use when the user wants live competitor research, peer scans,
  teardown screenshots, or to fill competitorNotes with real captures — not
  inventing screenshots. Requires agent-browser CLI when available.
---

# Competitive research (agent-browser)

Thin playbook on top of **agent-browser**. Do not re-implement a browser stack here.

## When to use

- User named real competitors / peers  
- Need screenshots for `public/visuals/` and `competitorNotes`  
- Validating “what the market already does” before overclaiming  

## Setup (first)

```bash
which agent-browser || echo "NOT_INSTALLED"
```

If missing: `npm install -g agent-browser` (Node 18+), then re-check PATH.

If the full **agent-browser** skill is installed on the machine, **read and follow it** for snapshot/ref interaction details. This skill only adds ReasonBoard-specific capture rules.

## Capture loop (per competitor)

1. Agree the URL and what “honest” means (marketing page vs logged-in product).  
2. `agent-browser open <url>`  
3. Snapshot → navigate to the relevant surface  
4. Screenshot into the project:

```bash
mkdir -p public/visuals/competitive
agent-browser screenshot public/visuals/competitive/<slug>.png
```

5. Write a `CompetitorNote` draft:

| Field | Meaning |
|-------|---------|
| `does` | What they actually show |
| `validates` | Which of *our* ideas this supports |
| `goesFurther` | Where we can go further (maps to solution) |

6. Prefer 2–4 peers. Stop when the axis is clear.

## Rules

- Label access level (public page vs demo account).  
- No fake screenshots. If login blocks you, note it and use a public page or a clearly fictional peer.  
- Don’t paste marketing slogans as `validates`.  
- After captures, offer to fold notes into `src/content.ts` via `reasonboard-competitive` / `reasonboard`.

## Done when

Screenshots exist on disk and each note has does · validates · goesFurther tied to the gap.
