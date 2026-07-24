export type Tool = "select" | "pencil" | "sticky" | "arrow";

export type Point = { x: number; y: number };

export type BoardNode = {
  kind: "node";
  id: string;
  sectionId: string;
  x: number;
  y: number;
  rotate: number;
  /** Override layout; default NODE_CARD_W / NODE_CARD_H */
  w?: number;
  h?: number;
};

export type BoardSticky = {
  kind: "sticky";
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
};

/** Freccia che collega due elementi (si aggiorna quando li sposti) */
export type BoardConnector = {
  kind: "connector";
  id: string;
  fromId: string;
  toId: string;
  color: string;
};

export type BoardStroke = {
  kind: "stroke";
  id: string;
  points: Point[];
  color: string;
};

export type BoardText = {
  kind: "text";
  id: string;
  x: number;
  y: number;
  role: "eyebrow" | "title" | "lede";
  html: string;
};

export type ContentCardVariant =
  | "persona"
  | "criterion"
  | "bug"
  | "idea"
  | "body"
  | "semaforo"
  | "define"
  | "image"
  | "competitor";

export type ContentBlock = {
  label: string;
  text: string;
  /** fit = accent; default = muted label */
  tone?: "default" | "fit";
};

/** Card contenuto in deep-dive (persona, bug, idea, criterio…) */
export type BoardContentCard = {
  kind: "contentCard";
  id: string;
  x: number;
  y: number;
  variant: ContentCardVariant;
  title: string;
  text: string;
  eyebrow?: string;
  image?: string;
  tag?: string;
  /** Colore tag (bug vs limit vs idea) */
  tagKind?: "bug" | "limit" | "idea";
  accent?: "green" | "yellow" | "red";
  /** Blocchi tipizzati (persona / define) con label colorata */
  blocks?: ContentBlock[];
  /** Click apre scena idea nested */
  openIdeaId?: string;
  /** Click apre guida competitor nested */
  openCompetitorId?: string;
  /** Click apre lightbox zoom (card solo-immagine) */
  zoomSrc?: string;
  /** Link fonte (icona in caption) */
  href?: string;
  /** Rotazione whiteboard (gradi) */
  rotate?: number;
  /** Tinta carta (sticky-like) */
  paper?: "cream" | "blush" | "mint" | "sky" | "peach" | "butter" | "white";
  w?: number;
  h?: number;
};

export type BoardImage = {
  kind: "image";
  id: string;
  x: number;
  y: number;
  src: string;
  caption?: string;
  href?: string;
  eyebrow?: string;
  w?: number;
  h?: number;
};

export type BoardItem =
  | BoardNode
  | BoardSticky
  | BoardConnector
  | BoardStroke
  | BoardText
  | BoardContentCard
  | BoardImage;

export type PositionedItem = Exclude<BoardItem, BoardConnector | BoardStroke>;

export const STICKY_COLORS = ["#ffe08a", "#ffb4c4", "#b8e0d2", "#c5d4ff", "#ffd6a5"];

/**
 * Fallback / slide 2 (6 nodi). Slide 1 (≤4) usa `nodeCardDims`.
 * Deve restare allineato a `.wb-item .node` e a `layout.ts`.
 */
export const NODE_CARD_W = 176;
export const NODE_CARD_H = 248;

/** Dimensioni root-node in base al numero di card sulla lavagna */
export function nodeCardDims(count: number): { w: number; h: number } {
  if (count <= 4) return { w: 236, h: 312 };
  if (count === 5) return { w: 200, h: 280 };
  return { w: NODE_CARD_W, h: NODE_CARD_H };
}

export const CONTENT_CARD_W = 220;
export const CONTENT_CARD_H = 260;
export const IMAGE_CARD_W = 280;
export const IMAGE_CARD_H = 200;

export function itemSize(item: PositionedItem): { w: number; h: number } {
  switch (item.kind) {
    case "node":
      return {
        w: item.w ?? NODE_CARD_W,
        h: item.h ?? NODE_CARD_H,
      };
    case "sticky":
      return { w: 148, h: 118 };
    case "contentCard":
      return {
        w: item.w ?? (item.variant === "persona" ? 240 : CONTENT_CARD_W),
        h: item.h ?? (item.variant === "persona" ? 480 : CONTENT_CARD_H),
      };
    case "image":
      return { w: item.w ?? IMAGE_CARD_W, h: item.h ?? IMAGE_CARD_H };
    case "text":
      if (item.role === "title") return { w: 560, h: 150 };
      if (item.role === "lede") return { w: 520, h: 96 };
      return { w: 260, h: 28 };
  }
}

/** Punti di aggancio bordo → bordo, con padding dal bordo dell’elemento */
export function connectionPoints(
  from: PositionedItem,
  to: PositionedItem,
  pad = 14,
): { x1: number; y1: number; x2: number; y2: number } {
  const a = itemSize(from);
  const b = itemSize(to);
  const acx = from.x + a.w / 2;
  const acy = from.y + a.h / 2;
  const bcx = to.x + b.w / 2;
  const bcy = to.y + b.h / 2;
  const dx = bcx - acx;
  const dy = bcy - acy;

  let x1: number;
  let y1: number;
  let x2: number;
  let y2: number;

  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx >= 0) {
      x1 = from.x + a.w + pad;
      y1 = acy;
      x2 = to.x - pad;
      y2 = bcy;
    } else {
      x1 = from.x - pad;
      y1 = acy;
      x2 = to.x + b.w + pad;
      y2 = bcy;
    }
  } else if (dy >= 0) {
    x1 = acx;
    y1 = from.y + a.h + pad;
    x2 = bcx;
    y2 = to.y - pad;
  } else {
    x1 = acx;
    y1 = from.y - pad;
    x2 = bcx;
    y2 = to.y + b.h + pad;
  }

  return { x1, y1, x2, y2 };
}

export function isPositioned(item: BoardItem): item is PositionedItem {
  return (
    item.kind === "node" ||
    item.kind === "sticky" ||
    item.kind === "text" ||
    item.kind === "contentCard" ||
    item.kind === "image"
  );
}
