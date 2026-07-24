import type { CompetitorNote, IdeaItem, ModalSection } from "../contentTypes";
import { makeText } from "./layout";
import {
  CONTENT_CARD_H,
  CONTENT_CARD_W,
  IMAGE_CARD_H,
  IMAGE_CARD_W,
  STICKY_COLORS,
  type BoardContentCard,
  type BoardItem,
  type BoardSticky,
  type ContentBlock,
} from "./types";

function sticky(
  id: string,
  text: string,
  x: number,
  y: number,
  color: string,
): BoardSticky {
  return { kind: "sticky", id, text, x, y, color };
}

function card(partial: Omit<BoardContentCard, "kind">): BoardContentCard {
  return { kind: "contentCard", ...partial };
}

/** Leggera inclinazione “appiccicata sulla lavagna” */
function tilt(i: number): number {
  const angles = [-1.2, 0.9, -0.55, 1.1, -0.9, 0.7, -0.4, 1.3];
  return angles[i % angles.length];
}

const PAPERS = ["cream", "blush", "mint", "sky", "peach", "white"] as const;

function paperFor(i: number): BoardContentCard["paper"] {
  return PAPERS[i % PAPERS.length];
}

/**
 * Distribuisce le card sulla larghezza utile (centrate, gap equi),
 * così non restano ammassate a sinistra.
 */
function spreadRow(
  count: number,
  cardW: number,
  left: number,
  right: number,
  y: number,
  opts?: { maxGap?: number; minGap?: number; wobble?: boolean },
): { x: number; y: number }[] {
  if (count <= 0) return [];
  const maxGap = opts?.maxGap ?? 88;
  const minGap = opts?.minGap ?? 28;
  const usable = Math.max(cardW, right - left);
  if (count === 1) {
    return [{ x: left + (usable - cardW) / 2, y }];
  }
  const idealGap = (usable - cardW * count) / (count - 1);
  const gap = Math.min(maxGap, Math.max(minGap, idealGap));
  const rowW = cardW * count + gap * (count - 1);
  const origin = left + Math.max(0, (usable - rowW) / 2);
  return Array.from({ length: count }, (_, i) => ({
    x: origin + i * (cardW + gap),
    y: y + (opts?.wobble && i % 2 === 1 ? 8 : 0),
  }));
}

function spreadRows(
  count: number,
  cardW: number,
  left: number,
  right: number,
  y: number,
  rowH: number,
  opts?: { maxGap?: number; minGap?: number; wobble?: boolean },
): { x: number; y: number }[] {
  const usable = right - left;
  const cols = Math.max(
    1,
    Math.min(count, Math.floor((usable + (opts?.minGap ?? 28)) / (cardW + (opts?.minGap ?? 28)))),
  );
  const out: { x: number; y: number }[] = [];
  let i = 0;
  let row = 0;
  while (i < count) {
    const n = Math.min(cols, count - i);
    const rowPos = spreadRow(n, cardW, left, right, y + row * (rowH + 24), opts);
    rowPos.forEach((p) => out.push(p));
    i += n;
    row += 1;
  }
  return out;
}

/**
 * Layout freeform per deep-dive sezione: titoli + card/post-it/immagini.
 * Mantiene **grassetto** nel testo (RichText).
 */
export function layoutDeepDive(
  section: ModalSection,
  width: number,
  _height: number,
): BoardItem[] {
  const w = Math.max(width, 960);
  const marginX = Math.round(Math.max(40, w * 0.04));
  const left = marginX;
  const right = w - marginX;
  const titleX = left;
  const items: BoardItem[] = [];

  const showHeroImage = Boolean(section.image && !section.competitorNotes?.length);
  const heroW = showHeroImage ? Math.min(300, w * 0.26) : 0;
  const headerTop = 44;
  const hasMethod = Boolean(section.methodNote);

  items.push(makeText("eyebrow", section.eyebrow, titleX, headerTop));
  items.push(
    makeText("title", section.title.replace(/\n/g, "<br />"), titleX, headerTop + 28),
  );
  items.push({
    kind: "text",
    id: `text-lede-${section.id}`,
    role: "lede",
    html: section.summary,
    x: titleX,
    y: hasMethod && !showHeroImage ? headerTop + 124 : headerTop + 152,
  });

  if (showHeroImage && section.image) {
    items.push(
      card({
        id: `cc-img-hero-${section.id}`,
        x: right - heroW,
        y: headerTop,
        variant: "image",
        title: "",
        text: "",
        image: section.image,
        zoomSrc: section.image,
        rotate: 1.2,
        paper: "cream",
        w: heroW,
        h: 220,
      }),
    );
  }

  // Fascia header: titolo/lede a sx — i contenuti partono sotto
  let cursorY = headerTop + 236;
  let hintUnderMethod = false;

  const hintText = section.ideas?.length
    ? "Click an idea → detail\nClick image → zoom\nEsc / Back = exit"
    : section.competitorNotes?.length
      ? "Open a card → competitor guide\n(What they do / Validates us / We go further)\nSource opens the official page"
      : "Click image → zoom\nEsc or Back to return\nPinch / ctrl+scroll = zoom";

  if (section.methodNote) {
    const mw = Math.min(276, Math.max(236, (right - left) * 0.26));
    const mh = 148;
    const methodY = showHeroImage ? cursorY : headerTop;
    const methodX = right - mw;
    items.push(
      card({
        id: `cc-method-${section.id}`,
        x: methodX,
        y: methodY,
        variant: "body",
        title: "Method",
        text: section.methodNote,
        eyebrow: "Metodo",
        rotate: -1.2,
        paper: "butter",
        w: mw,
        h: mh,
      }),
    );

    // Post-it blu sotto la gialla (alto a destra)
    const stickyW = 148;
    const stickyH = 118;
    const stickyGap = 14;
    items.push(
      sticky(
        `st-hint-${section.id}`,
        hintText,
        methodX + mw - stickyW,
        methodY + mh + stickyGap,
        STICKY_COLORS[3],
      ),
    );
    hintUnderMethod = true;
    cursorY = methodY + mh + stickyGap + stickyH + 28;
  }

  if (section.personas?.length) {
    const cw = Math.min(280, Math.max(248, (right - left - 72) / section.personas.length));
    const ch = 520;
    const positions = spreadRow(section.personas.length, cw, left, right, cursorY, {
      maxGap: 48,
      minGap: 24,
      wobble: true,
    });
    section.personas.forEach((p, i) => {
      const pos = positions[i];
      items.push(
        card({
          id: `cc-persona-${p.id}`,
          x: pos.x,
          y: pos.y,
          variant: "persona",
          title: p.name,
          eyebrow: p.role,
          text: "",
          image: p.image,
          zoomSrc: p.image,
          blocks: [
            { label: "Who", text: p.about },
            { label: "Day to day", text: p.dailyContext },
            { label: "Problems", text: p.problems },
            { label: "Analysis & KPIs", text: p.kpis },
            { label: "Solution fit", text: p.forSolution, tone: "fit" },
          ],
          rotate: tilt(i),
          paper: paperFor(i),
          w: cw,
          h: ch,
        }),
      );
    });
    cursorY += ch + 40;
  }

  if (section.define) {
    const defs: [string, string][] = [
      ["Problem", section.define.problem],
      ["User", section.define.user],
      ["Insight", section.define.insight],
      ["Success metrics", section.define.metrics],
    ];
    const cw = 210;
    const ch = 190;
    const positions = spreadRow(defs.length, cw, left, right, cursorY, {
      maxGap: 40,
      minGap: 20,
      wobble: true,
    });
    defs.forEach(([title, text], i) => {
      const pos = positions[i];
      items.push(
        card({
          id: `cc-define-${i}`,
          x: pos.x,
          y: pos.y,
          variant: "define",
          title,
          text,
          rotate: tilt(i + 2),
          paper: paperFor(i + 1),
          w: cw,
          h: ch,
        }),
      );
    });
    cursorY += ch + 32;
  }

  if (section.bugs?.length) {
    const cw = CONTENT_CARD_W + 16;
    const ch = CONTENT_CARD_H + 24;
    const positions = spreadRows(section.bugs.length, cw, left, right, cursorY, ch, {
      maxGap: 48,
      minGap: 24,
      wobble: true,
    });
    section.bugs.forEach((b, i) => {
      const pos = positions[i];
      items.push(
        card({
          id: `cc-bug-${b.id}`,
          x: pos.x,
          y: pos.y,
          variant: "bug",
          title: b.title,
          text: b.detail,
          tag: b.kind === "limit" ? "Limite" : "Bug / grounding",
          tagKind: b.kind === "limit" ? "limit" : "bug",
          eyebrow: String(i + 1).padStart(2, "0"),
          rotate: tilt(i + 1),
          paper: paperFor(i),
          w: cw,
          h: ch,
        }),
      );
    });
    const rows = Math.ceil(
      section.bugs.length /
        Math.max(1, Math.floor((right - left) / (CONTENT_CARD_W + 40))),
    );
    cursorY += rows * (ch + 24) + 16;
  }

  if (section.ideas?.length) {
    const cw = CONTENT_CARD_W + 28;
    const positions = spreadRows(
      section.ideas.length,
      cw,
      left,
      right,
      cursorY,
      CONTENT_CARD_H + 80,
      {
        maxGap: 48,
        minGap: 24,
        wobble: true,
      },
    );
    let maxRowH = 0;
    section.ideas.forEach((idea, i) => {
      const pos = positions[i];
      const thumb = idea.images?.[0]?.src;
      const isBug = idea.kind === "bug";
      const ch = thumb ? CONTENT_CARD_H + 72 : CONTENT_CARD_H + 16;
      maxRowH = Math.max(maxRowH, ch);
      items.push(
        card({
          id: `cc-idea-${idea.id}`,
          x: pos.x,
          y: pos.y,
          variant: "idea",
          title: idea.title,
          text: idea.blurb,
          image: thumb,
          tag: isBug ? "Bug da segnalare" : "Idea",
          tagKind: isBug ? "bug" : "idea",
          eyebrow: idea.ref
            ? `${idea.ref} · ${String(i + 1).padStart(2, "0")}`
            : String(i + 1).padStart(2, "0"),
          openIdeaId: idea.id,
          rotate: tilt(i),
          paper: isBug ? "blush" : i % 2 === 0 ? "sky" : "mint",
          w: cw,
          h: ch,
        }),
      );
    });
    const cols = Math.max(
      1,
      Math.floor((right - left) / (cw + 40)),
    );
    const rows = Math.ceil(section.ideas.length / cols);
    cursorY += rows * (maxRowH + 28) + 16;
  }

  if (section.images?.length && !section.competitorNotes?.length) {
    const iw = Math.min(IMAGE_CARD_W + 40, (right - left - 40) / 2);
    const ih = IMAGE_CARD_H + 48;
    const positions = spreadRows(section.images.length, iw, left, right, cursorY, ih, {
      maxGap: 40,
      minGap: 24,
      wobble: true,
    });
    section.images.forEach((img, i) => {
      const pos = positions[i];
      items.push(
        card({
          id: `cc-img-gal-${section.id}-${i}`,
          x: pos.x,
          y: pos.y,
          variant: "image",
          title: "",
          text: "",
          image: img.src,
          zoomSrc: img.src,
          tag: img.caption,
          href: img.href,
          rotate: tilt(i + 3),
          paper: "cream",
          w: iw,
          h: ih,
        }),
      );
    });
    cursorY += Math.ceil(section.images.length / 2) * (ih + 24) + 12;
  }

  if (section.competitorNotes?.length) {
    const cw = CONTENT_CARD_W + 36;
    const positions = spreadRows(
      section.competitorNotes.length,
      cw,
      left,
      right,
      cursorY,
      CONTENT_CARD_H + 80,
      { maxGap: 44, minGap: 22, wobble: true },
    );
    let maxRowH = 0;
    section.competitorNotes.forEach((note, i) => {
      const pos = positions[i];
      const ch = CONTENT_CARD_H + 72;
      maxRowH = Math.max(maxRowH, ch);
      items.push(
        card({
          id: `cc-comp-${note.id}`,
          x: pos.x,
          y: pos.y,
          variant: "competitor",
          title: note.title,
          text: note.blurb,
          eyebrow: String(i + 1).padStart(2, "0"),
          tag: note.kind,
          tagKind: "idea",
          image: note.image,
          openCompetitorId: note.id,
          href: note.href,
          rotate: tilt(i + 4),
          paper: paperFor(i + 2),
          w: cw,
          h: ch,
        }),
      );
    });
    const cols = Math.max(1, Math.floor((right - left) / (cw + 40)));
    cursorY += Math.ceil(section.competitorNotes.length / cols) * (maxRowH + 28) + 16;
  }

  if (section.criteria?.length) {
    const cw = 220;
    const ch = 210;
    const positions = spreadRows(section.criteria.length, cw, left, right, cursorY, ch, {
      maxGap: 36,
      minGap: 20,
      wobble: true,
    });
    section.criteria.forEach((c, i) => {
      const pos = positions[i];
      items.push(
        card({
          id: `cc-crit-${c.n}`,
          x: pos.x,
          y: pos.y,
          variant: "criterion",
          title: c.title,
          text: c.text,
          eyebrow: c.n,
          rotate: tilt(i),
          paper: paperFor(i),
          w: cw,
          h: ch,
        }),
      );
    });
    const rows = Math.ceil(
      section.criteria.length / Math.max(1, Math.floor((right - left) / (cw + 36))),
    );
    cursorY += rows * (ch + 24) + 16;
  }

  if (section.semaforo) {
    const chips: [string, string, "green" | "yellow" | "red"][] = [
      ["Verde", section.semaforo.green, "green"],
      ["Giallo", section.semaforo.yellow, "yellow"],
      ["Rosso", section.semaforo.red, "red"],
    ];
    const cw = 200;
    const positions = spreadRow(chips.length, cw, left, right, cursorY, {
      maxGap: 48,
      minGap: 24,
      wobble: true,
    });
    chips.forEach(([label, text, accent], i) => {
      const pos = positions[i];
      items.push(
        card({
          id: `cc-semaforo-${accent}`,
          x: pos.x,
          y: pos.y,
          variant: "semaforo",
          title: label,
          text,
          accent,
          eyebrow: "Regola pratica",
          rotate: tilt(i + 4),
          paper: accent === "green" ? "mint" : accent === "yellow" ? "peach" : "blush",
          w: cw,
          h: 140,
        }),
      );
    });
    cursorY += 160;
  }

  // Coppie problema → soluzione (posti colori diversi) + mockup GenUI
  if (section.pairs?.length) {
    const hasMockups = section.pairs.some((p) => p.mockup);
    const pw = Math.min(168, Math.max(148, (right - left - 80) / (section.pairs.length * 2 + 0.5)));
    const sw = pw;
    const pairGap = 10;
    const pairW = pw + pairGap + sw;
    const ph = 168;
    const positions = spreadRow(section.pairs.length, pairW, left, right, cursorY, {
      maxGap: 36,
      minGap: 16,
      wobble: true,
    });
    section.pairs.forEach((pair, i) => {
      const pos = positions[i];
      items.push(
        card({
          id: `cc-pair-p-${section.id}-${i}`,
          x: pos.x,
          y: pos.y,
          variant: "body",
          title: "",
          text: pair.problem,
          eyebrow: `Problem · ${pair.who}`,
          rotate: tilt(i),
          paper: "blush",
          w: pw,
          h: ph,
        }),
      );
      items.push(
        card({
          id: `cc-pair-s-${section.id}-${i}`,
          x: pos.x + pw + pairGap,
          y: pos.y + (i % 2 === 0 ? 6 : -4),
          variant: "body",
          title: "",
          text: pair.solution,
          eyebrow: "Solution",
          rotate: tilt(i + 3),
          paper: "mint",
          w: sw,
          h: ph,
        }),
      );
    });
    cursorY += ph + 28;

    if (hasMockups) {
      const iw = Math.min(IMAGE_CARD_W + 20, (right - left - 48) / Math.min(3, section.pairs.length));
      const ih = IMAGE_CARD_H + 40;
      const mockPositions = spreadRow(
        section.pairs.filter((p) => p.mockup).length,
        iw,
        left,
        right,
        cursorY,
        { maxGap: 32, minGap: 16, wobble: true },
      );
      let mi = 0;
      section.pairs.forEach((pair, i) => {
        if (!pair.mockup) return;
        const pos = mockPositions[mi++];
        items.push(
          card({
            id: `cc-pair-mock-${section.id}-${i}`,
            x: pos.x,
            y: pos.y,
            variant: "image",
            title: "",
            text: "",
            image: pair.mockup,
            zoomSrc: pair.mockup,
            tag: pair.mockupCaption ?? `Mockup · ${pair.who}`,
            rotate: tilt(i + 1),
            paper: "cream",
            w: iw,
            h: ih,
          }),
        );
      });
      cursorY += ih + 28;
    }
  }

  // Body + takeaway sulla stessa fascia, spalmati
  {
    const extras: { id: string; title: string; text: string; eyebrow?: string; paper: BoardContentCard["paper"] }[] =
      section.body.map((line, i) => ({
        id: `cc-body-${section.id}-${i}`,
        title: "",
        text: line,
        paper: paperFor(i + 3),
      }));
    if (section.takeaway) {
      extras.push({
        id: `cc-takeaway-${section.id}`,
        title: "In sintesi",
        text: section.takeaway,
        eyebrow: "Takeaway",
        paper: section.pairs?.length ? "sky" : "blush",
      });
    }
    if (extras.length) {
      const bw = Math.min(300, Math.max(220, (right - left - 48) / Math.min(extras.length, 3)));
      const bh = section.pairs?.length ? 130 : section.personas?.length ? 144 : 160;
      const positions = spreadRows(extras.length, bw, left, right, cursorY, bh, {
        maxGap: 40,
        minGap: 22,
        wobble: true,
      });
      extras.forEach((ex, i) => {
        const pos = positions[i];
        items.push(
          card({
            id: ex.id,
            x: pos.x,
            y: pos.y,
            variant: "body",
            title: ex.title,
            text: ex.text,
            eyebrow: ex.eyebrow,
            rotate: tilt(i + 2),
            paper: ex.paper,
            w: bw,
            h: bh,
          }),
        );
      });
      const rows = Math.ceil(extras.length / Math.max(1, Math.floor((right - left) / (bw + 32))));
      cursorY += rows * (bh + 20) + 12;
    }
  }

  if (!hintUnderMethod) {
    items.push(
      sticky(`st-hint-${section.id}`, hintText, left, cursorY + 16, STICKY_COLORS[3]),
    );
  }

  return items;
}

export function layoutIdeaDetail(
  idea: IdeaItem,
  index: number,
  width: number,
  height: number,
): BoardItem[] {
  const w = Math.max(width, 960);
  const h = Math.max(height, 600);
  const marginX = 48;
  const items: BoardItem[] = [];

  const kindLabel = idea.kind === "bug" ? "Bug da segnalare" : "Idea";
  const eyebrow = idea.ref
    ? `${kindLabel} · ${idea.ref} · ${String(index + 1).padStart(2, "0")}`
    : `${kindLabel} · ${String(index + 1).padStart(2, "0")}`;

  items.push(makeText("eyebrow", eyebrow, marginX, 56));
  items.push(makeText("title", idea.title, marginX, 88));
  items.push({
    kind: "text",
    id: `text-lede-idea-${idea.id}`,
    role: "lede",
    html: idea.detail,
    x: marginX,
    y: 200,
  });

  let cursorY = 320;
  if (idea.images?.length) {
    const left = marginX;
    const right = w - marginX;
    const iw = Math.min(IMAGE_CARD_W + 40, (right - left - 40) / Math.min(2, idea.images.length));
    const ih = IMAGE_CARD_H + 48;
    const positions = spreadRows(idea.images.length, iw, left, right, cursorY, ih, {
      maxGap: 40,
      minGap: 24,
      wobble: true,
    });
    idea.images.forEach((img, i) => {
      const pos = positions[i];
      items.push(
        card({
          id: `cc-img-idea-${idea.id}-${i}`,
          x: pos.x,
          y: pos.y,
          variant: "image",
          title: "",
          text: "",
          image: img.src,
          zoomSrc: img.src,
          tag: img.caption,
          href: img.href,
          rotate: tilt(i + 1),
          paper: "cream",
          w: iw,
          h: ih,
        }),
      );
    });
    cursorY += Math.ceil(idea.images.length / 2) * (ih + 24);
  }

  items.push(
    sticky(
      `st-idea-hint-${idea.id}`,
      "Esc / Back → idea list",
      marginX,
      Math.max(cursorY + 24, h - 140),
      "#ffe08a",
    ),
  );

  return items;
}

/** Competitor guide: screenshot + what they do / validates us / we go further */
export function layoutCompetitorDetail(
  note: CompetitorNote,
  index: number,
  width: number,
  height: number,
): BoardItem[] {
  const w = Math.max(width, 960);
  const h = Math.max(height, 600);
  const marginX = 48;
  const left = marginX;
  const right = w - marginX;
  const items: BoardItem[] = [];

  const eyebrow = `Guida competitor · ${note.kind} · ${String(index + 1).padStart(2, "0")}`;
  items.push(makeText("eyebrow", eyebrow, marginX, 56));
  items.push(makeText("title", note.title, marginX, 88));
  items.push({
    kind: "text",
    id: `text-lede-comp-${note.id}`,
    role: "lede",
    html: note.does,
    x: marginX,
    y: 200,
  });

  let cursorY = 320;

  const guideCards: { title: string; text: string; paper: BoardContentCard["paper"]; tone?: "fit" }[] = [
    { title: "Validates us", text: note.validates, paper: "mint" },
    { title: "We go further", text: note.goesFurther, paper: "sky", tone: "fit" },
  ];
  {
    const cw = Math.min(320, (right - left - 40) / 2);
    const ch = 200;
    const positions = spreadRow(guideCards.length, cw, left, right, cursorY, {
      maxGap: 40,
      minGap: 24,
      wobble: true,
    });
    guideCards.forEach((g, i) => {
      const pos = positions[i];
      items.push(
        card({
          id: `cc-comp-guide-${note.id}-${i}`,
          x: pos.x,
          y: pos.y,
          variant: "competitor",
          title: g.title,
          text: g.text,
          eyebrow: g.tone === "fit" ? "Our take" : "Market",
          rotate: tilt(i + 1),
          paper: g.paper,
          w: cw,
          h: ch,
        }),
      );
    });
    cursorY += ch + 36;
  }

  const shots: { src: string; caption?: string; href?: string }[] = [
    { src: note.image, caption: "Product page screenshot", href: note.href },
    ...(note.images ?? []),
  ];
  {
    const iw = Math.min(IMAGE_CARD_W + 40, (right - left - 40) / Math.min(2, shots.length));
    const ih = IMAGE_CARD_H + 48;
    const positions = spreadRows(shots.length, iw, left, right, cursorY, ih, {
      maxGap: 40,
      minGap: 24,
      wobble: true,
    });
    shots.forEach((img, i) => {
      const pos = positions[i];
      items.push(
        card({
          id: `cc-comp-shot-${note.id}-${i}`,
          x: pos.x,
          y: pos.y,
          variant: "image",
          title: "",
          text: "",
          image: img.src,
          zoomSrc: img.src,
          tag: img.caption,
          href: img.href ?? note.href,
          rotate: tilt(i + 2),
          paper: "cream",
          w: iw,
          h: ih,
        }),
      );
    });
    cursorY += Math.ceil(shots.length / 2) * (ih + 24);
  }

  items.push(
    sticky(
      `st-comp-hint-${note.id}`,
      "Esc / Back → competitor list\nSource → official page",
      marginX,
      Math.max(cursorY + 24, h - 140),
      "#ffe08a",
    ),
  );

  return items;
}

/** Flusso mobile: stessa mappa concettuale, ordine lineare per scroll */
export type MobileDeepBlock =
  | { type: "header"; eyebrow: string; title: string; summary: string }
  | {
      type: "card";
      variant: BoardContentCard["variant"];
      title: string;
      text: string;
      eyebrow?: string;
      image?: string;
      tag?: string;
      tagKind?: BoardContentCard["tagKind"];
      accent?: "green" | "yellow" | "red";
      blocks?: ContentBlock[];
      openIdeaId?: string;
      openCompetitorId?: string;
      zoomSrc?: string;
      href?: string;
    }
  | { type: "sticky"; text: string; color: string }
  | { type: "image"; src: string; caption?: string; href?: string; eyebrow?: string };

export function mobileDeepBlocks(section: ModalSection): MobileDeepBlock[] {
  const blocks: MobileDeepBlock[] = [
    {
      type: "header",
      eyebrow: section.eyebrow,
      title: section.title,
      summary: section.summary,
    },
  ];

  if (section.image && !section.competitorNotes?.length) {
    blocks.push({
      type: "card",
      variant: "image",
      title: "",
      text: "",
      image: section.image,
      zoomSrc: section.image,
    });
  }

  if (section.methodNote) {
    blocks.push({
      type: "sticky",
      text: `Method\n${section.methodNote}`,
      color: "#ffe08a",
    });
    blocks.push({
      type: "sticky",
      text: "Click image → zoom\nEsc or Back to return\nPinch / ctrl+scroll = zoom",
      color: "#c5d4ff",
    });
  }

  section.personas?.forEach((p) => {
    blocks.push({
      type: "card",
      variant: "persona",
      title: p.name,
      eyebrow: p.role,
      text: "",
      image: p.image,
      zoomSrc: p.image,
      blocks: [
        { label: "Who", text: p.about },
        { label: "Day to day", text: p.dailyContext },
        { label: "Problems", text: p.problems },
        { label: "Analysis & KPIs", text: p.kpis },
        { label: "Solution fit", text: p.forSolution, tone: "fit" },
      ],
    });
  });

  section.pairs?.forEach((pair) => {
    blocks.push({
      type: "card",
      variant: "body",
      title: "",
      text: pair.problem,
      eyebrow: `Problem · ${pair.who}`,
    });
    blocks.push({
      type: "card",
      variant: "body",
      title: "",
      text: pair.solution,
      eyebrow: "Solution",
    });
    if (pair.mockup) {
      blocks.push({
        type: "card",
        variant: "image",
        title: "",
        text: "",
        image: pair.mockup,
        zoomSrc: pair.mockup,
        tag: pair.mockupCaption ?? `Mockup · ${pair.who}`,
      });
    }
  });

  if (section.define) {
    (
      [
        ["Problem", section.define.problem],
        ["User", section.define.user],
        ["Insight", section.define.insight],
        ["Success metrics", section.define.metrics],
      ] as const
    ).forEach(([title, text]) => {
      blocks.push({
        type: "card",
        variant: "define",
        title,
        text,
      });
    });
  }

  section.bugs?.forEach((b, i) => {
    blocks.push({
      type: "card",
      variant: "bug",
      title: b.title,
      text: b.detail,
      tag: b.kind === "limit" ? "Limite" : "Bug / grounding",
      tagKind: b.kind === "limit" ? "limit" : "bug",
      eyebrow: String(i + 1).padStart(2, "0"),
    });
  });

  section.ideas?.forEach((idea, i) => {
    blocks.push({
      type: "card",
      variant: "idea",
      title: idea.title,
      text: idea.blurb,
      image: idea.images?.[0]?.src,
      tag: idea.kind === "bug" ? "Bug da segnalare" : "Idea",
      tagKind: idea.kind === "bug" ? "bug" : "idea",
      eyebrow: idea.ref
        ? `${idea.ref} · ${String(i + 1).padStart(2, "0")}`
        : String(i + 1).padStart(2, "0"),
      openIdeaId: idea.id,
    });
  });

  section.images?.forEach((img) => {
    if (section.competitorNotes?.length) return;
    blocks.push({
      type: "card",
      variant: "image",
      title: "",
      text: "",
      image: img.src,
      zoomSrc: img.src,
      tag: img.caption,
      href: img.href,
    });
  });

  section.competitorNotes?.forEach((note, i) => {
    blocks.push({
      type: "card",
      variant: "competitor",
      title: note.title,
      text: note.blurb,
      eyebrow: String(i + 1).padStart(2, "0"),
      tag: note.kind,
      tagKind: "idea",
      image: note.image,
      openCompetitorId: note.id,
      href: note.href,
    });
  });

  section.criteria?.forEach((c) => {
    blocks.push({
      type: "card",
      variant: "criterion",
      title: c.title,
      text: c.text,
      eyebrow: c.n,
    });
  });

  if (section.semaforo) {
    (
      [
        ["Verde", section.semaforo.green, "green"],
        ["Giallo", section.semaforo.yellow, "yellow"],
        ["Rosso", section.semaforo.red, "red"],
      ] as const
    ).forEach(([label, text, accent]) => {
      blocks.push({
        type: "card",
        variant: "semaforo",
        title: label,
        text,
        accent,
        eyebrow: "Regola pratica",
      });
    });
  }

  section.body.forEach((line) => {
    blocks.push({
      type: "card",
      variant: "body",
      title: "",
      text: line,
    });
  });

  if (section.takeaway) {
    blocks.push({
      type: "card",
      variant: "body",
      title: "In sintesi",
      text: section.takeaway,
      eyebrow: "Takeaway",
    });
  }

  return blocks;
}

export function mobileCompetitorBlocks(
  note: CompetitorNote,
  index: number,
): MobileDeepBlock[] {
  const blocks: MobileDeepBlock[] = [
    {
      type: "header",
      eyebrow: `Competitor guide · ${note.kind} · ${String(index + 1).padStart(2, "0")}`,
      title: note.title,
      summary: note.does,
    },
    {
      type: "card",
      variant: "competitor",
      title: "Validates us",
      text: note.validates,
      eyebrow: "Market",
    },
    {
      type: "card",
      variant: "competitor",
      title: "We go further",
      text: note.goesFurther,
      eyebrow: "Our take",
    },
    {
      type: "card",
      variant: "image",
      title: "",
      text: "",
      image: note.image,
      zoomSrc: note.image,
      tag: "Product page screenshot",
      href: note.href,
    },
  ];
  note.images?.forEach((img) => {
    blocks.push({
      type: "card",
      variant: "image",
      title: "",
      text: "",
      image: img.src,
      zoomSrc: img.src,
      tag: img.caption,
      href: img.href ?? note.href,
    });
  });
  return blocks;
}

export function mobileIdeaBlocks(idea: IdeaItem, index: number): MobileDeepBlock[] {
  const kindLabel = idea.kind === "bug" ? "Bug da segnalare" : "Idea";
  const blocks: MobileDeepBlock[] = [
    {
      type: "header",
      eyebrow: idea.ref
        ? `${kindLabel} · ${idea.ref} · ${String(index + 1).padStart(2, "0")}`
        : `${kindLabel} · ${String(index + 1).padStart(2, "0")}`,
      title: idea.title,
      summary: idea.detail,
    },
  ];
  idea.images?.forEach((img) => {
    blocks.push({
      type: "card",
      variant: "image",
      title: "",
      text: "",
      image: img.src,
      zoomSrc: img.src,
      tag: img.caption,
      href: img.href,
    });
  });
  return blocks;
}
