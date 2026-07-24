import {
  STICKER_H,
  STICKER_W,
  STICKY_COLORS,
  nodeCardDims,
  type BoardConnector,
  type BoardItem,
  type BoardNode,
  type BoardSticker,
  type BoardSticky,
  type BoardText,
} from "./types";
import type { DeckMeta } from "../contentTypes";

export function makeText(
  role: BoardText["role"],
  html: string,
  x: number,
  y: number,
): BoardText {
  return { kind: "text", id: `text-${role}`, role, html, x, y };
}

export function makeConnectors(nodeIds: string[], color = "#0d9488"): BoardConnector[] {
  const out: BoardConnector[] = [];
  for (let i = 0; i < nodeIds.length - 1; i++) {
    out.push({
      kind: "connector",
      id: `conn-${nodeIds[i]}-${nodeIds[i + 1]}`,
      fromId: nodeIds[i],
      toId: nodeIds[i + 1],
      color,
    });
  }
  return out;
}

function makeSticky(
  id: string,
  text: string,
  x: number,
  y: number,
  color: string,
): BoardSticky {
  return { kind: "sticky", id, text, x, y, color };
}

/**
 * Initial root layout: title aligned to first card, cards centered with responsive gap.
 * Copy comes entirely from DeckMeta — no hardcoded case study.
 */
export function layoutSlideBoard(
  meta: DeckMeta,
  nodeDefs: { id: string; sectionId: string }[],
  width: number,
  height: number,
): BoardItem[] {
  const w = Math.max(width, 960);
  const h = Math.max(height, 600);

  const n = Math.max(nodeDefs.length, 1);
  const { w: cardW, h: cardH } = nodeCardDims(n);
  const marginX = Math.round(Math.max(n >= 6 ? 20 : n >= 5 ? 28 : 48, w * (n >= 5 ? 0.02 : 0.05)));

  const targetRow = Math.min(w - marginX * 2, Math.max(cardW * n + 72 * (n - 1), w * 0.72));
  const minGap = n >= 6 ? 18 : n >= 5 ? 28 : n <= 4 ? 48 : 64;
  const gap = Math.round(
    Math.min(200, Math.max(minGap, (targetRow - cardW * n) / Math.max(n - 1, 1))),
  );
  const rowW = cardW * n + gap * Math.max(n - 1, 0);
  const startX = Math.round((w - rowW) / 2);

  const titleX = startX;
  const eyebrowY = Math.round(h * 0.1);
  const titleY = Math.round(h * 0.135);
  const ledeY = titleY + 118;
  const cardsY = Math.round(Math.min(h * 0.42, h - cardH - 48));

  const stickyW = 148;
  const stickyGap = 14;
  const stickyY = Math.round(h * 0.11);
  const stickyRight = w - marginX;
  const sticky2X = stickyRight - stickyW;
  const sticky1X = sticky2X - stickyW - stickyGap;

  const texts: BoardText[] = [
    makeText("eyebrow", meta.eyebrow, titleX, eyebrowY),
    makeText("title", meta.title, titleX, titleY),
    makeText("lede", meta.lede, titleX, ledeY),
  ];

  const seeds = meta.seedStickies ?? ["Reason → evidence.", "Then the proposal."];
  const seedStickies: BoardSticky[] = [
    makeSticky("sticky-seed-a", seeds[0], sticky1X, stickyY, STICKY_COLORS[0]),
    makeSticky("sticky-seed-b", seeds[1], sticky2X, stickyY + 18, STICKY_COLORS[1]),
  ];

  const nodes: BoardNode[] = nodeDefs.map((nDef, i) => ({
    kind: "node",
    id: nDef.id,
    sectionId: nDef.sectionId,
    x: startX + i * (cardW + gap),
    y: cardsY + (i % 2 === 0 ? 0 : 16),
    rotate: i % 2 === 0 ? -0.55 : 0.5,
    w: cardW,
    h: cardH,
  }));

  const connectorColor = meta.connectorColor ?? "#0d9488";

  const seedStickers: BoardSticker[] = (meta.stickers ?? []).map((s, i) => ({
    kind: "sticker",
    id: `sticker-${s.id}`,
    src: s.src,
    alt: s.alt,
    x: stickyRight - STICKER_W,
    y: cardsY - STICKER_H - 28 - i * (STICKER_H + 12),
    w: STICKER_W,
    h: STICKER_H,
    rotate: s.rotate ?? -6,
  }));

  return [
    ...texts,
    ...seedStickies,
    ...seedStickers,
    ...nodes,
    ...makeConnectors(
      nodeDefs.map((nDef) => nDef.id),
      connectorColor,
    ),
  ];
}
