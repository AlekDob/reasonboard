import type { Deck } from "./contentTypes";

/**
 * Demo deck — fictional SaaS “Northwind Analytics”.
 * Replace this file (or regenerate via the ReasonBoard AI skills) for your case.
 */
export const deck: Deck = {
  slides: [
    {
      id: "path",
      brandLeft: "ReasonBoard",
      brandRight: "demo",
      pill: "Slide 1 · How we reasoned",
      tone: "default",
      meta: {
        eyebrow: "The path",
        title: "From brief to options.<br /><em>Personas → gap → proof.</em>",
        lede: "Start from the ask (value, opportunities, actions), meet three users, then name what is missing today — so slide 2 is a response, not a feature dump.",
        seedStickies: ["Brief → users → gap.", "Then the proposal."],
      },
      sections: [
        {
          id: "brief",
          eyebrow: "01 · Brief",
          title: "What we were asked",
          summary: "Ops leaders want to know if their dashboards create value — and what to do next.",
          body: [
            "Northwind Analytics ships dozens of scheduled reports. Teams open them, skim, and still wonder: *are we winning?*",
            "The ask: help users see value, spot opportunities, and pick the next action — without another weekly status meeting.",
          ],
          takeaway: "The job is judgment + next step, not more charts.",
          methodNote: "Brief first. Features later.",
        },
        {
          id: "personas",
          eyebrow: "02 · Personas",
          title: "Three people, three blockers",
          summary: "Maya builds pipelines. Jordan prioritizes. Priya needs board-ready proof.",
          body: [
            "Same product, different jobs. If the answer only works for one of them, it is incomplete.",
          ],
          methodNote: "Discover before define.",
          personas: [
            {
              id: "maya",
              name: "Maya",
              role: "Analytics Engineer",
              about: "Owns dbt models and freshness SLAs for a mid-market SaaS.",
              dailyContext: "Lives in the warehouse + alert Slack. Rarely opens the BI UI except to debug.",
              problems: "When a metric drifts she rebuilds the model by hand — nobody applies the fix for her.",
              kpis: "Freshness, row counts, silent failures in downstream dashboards.",
              forSolution: "A proposed change she can approve — not a wall of advice.",
              image: "/visuals/demo/persona-maya.svg",
            },
            {
              id: "jordan",
              name: "Jordan",
              role: "Ops Manager",
              about: "Runs weekly ops reviews for three regions.",
              dailyContext: "Opens Northwind every morning, scrolls alerts, picks fights for the team.",
              problems: "Has to ask the AI the same questions every day. Nothing shows up unless he prompts.",
              kpis: "Time-to-action, backlog age, escalation rate.",
              forSolution: "A proactive inbox: top three things worth doing today.",
              image: "/visuals/demo/persona-jordan.svg",
            },
            {
              id: "priya",
              name: "Priya",
              role: "VP Operations",
              about: "Owns the ops budget and the board narrative.",
              dailyContext: "Cares about € and risk, not node graphs.",
              problems: "Pretty charts without a verified outcome story — hard to defend in board.",
              kpis: "Cost per incident avoided, ROI of tooling, trend vs baseline.",
              forSolution: "Evidence that closes the loop: before → after → €.",
              image: "/visuals/demo/persona-priya.svg",
            },
          ],
        },
        {
          id: "define",
          eyebrow: "03 · Define",
          title: "In one sentence",
          summary: "Problem, user, insight, success metrics — pinned before ideation.",
          body: ["If you cannot say this out loud in 20 seconds, you are not ready to design."],
          define: {
            problem:
              "Teams run analytics constantly but cannot tell if they create value, where to intervene, or what to do first.",
            user: "Maya (build), Jordan (prioritize), Priya (prove).",
            insight:
              "The gap is not “AI is dumb” — advice already exists if you ask. The gap is reactive, generic, non-applied, forgetful.",
            metrics:
              "Approved changes applied / month · value verified (€ or incidents avoided) · reused memory hits.",
          },
        },
        {
          id: "gap",
          eyebrow: "04 · Gap",
          title: "Reactive vs proactive",
          summary: "Today: you ask. Tomorrow: it notices, proposes, remembers.",
          body: [
            "Data → reports → chat assistant → **gap** → action on the real UI.",
            "Crossing the gap means: inbox, apply-after-approve, guides from real cases, memory.",
          ],
          takeaway: "Don't make them think of the question.",
          criteria: [
            { n: "1", title: "Goal", text: "Is the dashboard goal explicit?" },
            { n: "2", title: "Baseline", text: "Do we know what “good” looked like last month?" },
            { n: "3", title: "Funnel health", text: "Where does the flow break?" },
            { n: "4", title: "Trend", text: "Is it getting better or worse?" },
            { n: "5", title: "€ outcome", text: "Can we tie it to money or risk avoided?" },
          ],
          semaforo: {
            green: "Goal + baseline + healthy trend + verified outcome.",
            yellow: "Something drifted — investigate this week.",
            red: "Broken flow or unverified spend — act now.",
          },
        },
        {
          id: "competitive",
          eyebrow: "05 · Competitive",
          title: "What peers already do",
          summary: "Honest scan: reactive chat is table stakes; agents + memory are the frontier.",
          body: [
            "We map peers on a simple axis: reactive → proactive → agentic. No “first in the world” claims.",
          ],
          competitorNotes: [
            {
              id: "peer-chat",
              title: "PulseChat (fictional peer)",
              kind: "Peer",
              blurb: "Strong chat answers inside the product.",
              does: "Answers metric questions with citations to your warehouse.",
              validates: "Users already trust in-product AI for analysis.",
              goesFurther: "Still waits for a prompt — no inbox, no apply.",
              image: "/visuals/demo/comp-peer.svg",
            },
            {
              id: "enterprise",
              title: "Atlas Ops (fictional enterprise)",
              kind: "Enterprise",
              blurb: "Heavy agent workflows with approvals.",
              does: "Runs playbooks with human gates and audit logs.",
              validates: "Approve-then-apply is an accepted pattern at scale.",
              goesFurther: "Too heavy for mid-market; weak product memory of *you*.",
              image: "/visuals/demo/comp-enterprise.svg",
            },
          ],
        },
      ],
    },
    {
      id: "proposal",
      brandLeft: "ReasonBoard",
      brandRight: "demo",
      pill: "Slide 2 · The proposal",
      tone: "solution",
      meta: {
        eyebrow: "The proposal",
        title: "Northwind Pulse:<br /><em>notice · propose · remember</em>",
        lede: "Four muscles on top of chat: proactive inbox, improve-with-approve, case guides, and a brain — with a face, not a generic corner widget.",
        seedStickies: ["So:", "Pulse."],
      },
      sections: [
        {
          id: "idea",
          eyebrow: "01 · Idea",
          title: "Four muscles",
          summary: "Proactive · Improve · Guides · Brain — plus personality.",
          body: [
            "Chat stays. Pulse adds the muscles users were already asking for between the lines.",
          ],
          pairs: [
            {
              who: "Maya · node",
              problem: "Advice without apply means rebuilding by hand.",
              solution: "Propose a node/fix change → she approves → we apply.",
            },
            {
              who: "Jordan · queue",
              problem: "Must invent the question every morning.",
              solution: "Inbox with ranked routines — don't make him think.",
            },
            {
              who: "Priya · value",
              problem: "No board-proof loop.",
              solution: "Measure after change; show before/after in €.",
            },
          ],
        },
        {
          id: "proactive",
          eyebrow: "02 · Proactive",
          title: "Inbox, not prompt",
          summary: "Notifications and routines land where work already happens.",
          body: [
            "Don't make me think (Krug): Pulse sends what matters — you do not open chat to invent the ask.",
          ],
          takeaway: "Reactive chat is the baseline. Inbox is the leap.",
        },
        {
          id: "improve",
          eyebrow: "03 · Improve",
          title: "Propose → approve → apply",
          summary: "GenUI suggestions on the real surface, never silent writes.",
          body: [
            "Not only analysis: propose the change on the real UI. Human ok is the gate.",
          ],
        },
        {
          id: "guides",
          eyebrow: "04 · Guides",
          title: "Cases that adapt",
          summary: "Success patterns with KPIs — Pulse asks and fits your case.",
          body: [
            "Best practices as interactive guides, not PDFs nobody opens.",
          ],
        },
        {
          id: "brain",
          eyebrow: "05 · Brain",
          title: "Memory that compounds",
          summary: "User brain + company brain — reuse what it already knows.",
          body: [
            "Logged-in memory of preferences and company context so advice stops being generic.",
          ],
        },
        {
          id: "roadmap",
          eyebrow: "06 · Roadmap",
          title: "Ship in three phases",
          summary: "Inbox + GenUI advice → apply + brain → autonomy whitelist.",
          body: [
            "Phase 1 (1–2 mo): inbox/routines + GenUI advice + first guides.",
            "Phase 2 (3–4 mo): apply after approve + user/company brain + measure after.",
            "Phase 3 (5–6 mo+): whitelist autonomy + product personality.",
          ],
          takeaway: "Closed loops completed + verified value per account / month.",
          ideas: [
            {
              id: "idea-write",
              title: "Write tool with dry-run",
              blurb: "Preview diffs before apply.",
              detail: "Parked idea: always show a dry-run of mutations before the approve gate.",
              kind: "idea",
              ref: "Phase 2",
            },
            {
              id: "idea-context",
              title: "Context packs per team",
              blurb: "Team-scoped memory slices.",
              detail: "Company brain partitioned by team so Ops ≠ Finance advice.",
              kind: "idea",
              ref: "Phase 2",
            },
          ],
        },
      ],
    },
  ],
};
