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

/** Arrow linking two elements (updates automatically when you move them) */
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
  | "competitor"
  | "solution";

export type ContentBlock = {
  label: string;
  text: string;
  /** fit = accent; default = muted label */
  tone?: "default" | "fit";
};

/** Content card in a deep-dive (persona, bug, idea, criterion…) */
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
  /** Tag color (bug vs limit vs idea) */
  tagKind?: "bug" | "limit" | "idea";
  accent?: "green" | "yellow" | "red";
  /** Typed blocks (persona / define) with a colored label */
  blocks?: ContentBlock[];
  /** Click opens a nested idea scene */
  openIdeaId?: string;
  /** Click opens a nested competitor guide */
  openCompetitorId?: string;
  /** Click opens a nested section (e.g. solution branch → deep dive) */
  openSectionId?: string;
  /** Click opens a zoom lightbox (image-only card) */
  zoomSrc?: string;
  /** Source link (icon in caption) */
  href?: string;
  /** Whiteboard rotation (degrees) */
  rotate?: number;
  /** Paper tint (sticky-like) */
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

/** PNG/SVG “sticker” frameless — draggable in DEV like a sticky */
export type BoardSticker = {
  kind: "sticker";
  id: string;
  x: number;
  y: number;
  src: string;
  alt?: string;
  rotate?: number;
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
  | BoardImage
  | BoardSticker;

export type PositionedItem = Exclude<BoardItem, BoardConnector | BoardStroke>;

export const STICKY_COLORS = ["#ffe08a", "#ffb4c4", "#b8e0d2", "#c5d4ff", "#ffd6a5"];

/**
 * Fallback for larger root boards (6 nodes). Boards with ≤4 use `nodeCardDims`.
 * Must stay aligned with `.wb-item .node` and `layout.ts`.
 */
export const NODE_CARD_W = 176;
export const NODE_CARD_H = 248;

/** Root-node dimensions based on the number of cards on the board */
export function nodeCardDims(count: number): { w: number; h: number } {
  if (count <= 4) return { w: 236, h: 312 };
  if (count === 5) return { w: 200, h: 280 };
  return { w: NODE_CARD_W, h: NODE_CARD_H };
}

export const CONTENT_CARD_W = 220;
export const CONTENT_CARD_H = 260;
export const IMAGE_CARD_W = 280;
export const IMAGE_CARD_H = 200;
export const STICKER_W = 140;
export const STICKER_H = 97;

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
    case "sticker":
      return { w: item.w ?? STICKER_W, h: item.h ?? STICKER_H };
    case "text":
      if (item.role === "title") return { w: 560, h: 150 };
      if (item.role === "lede") return { w: 520, h: 96 };
      return { w: 260, h: 28 };
  }
}

/** Edge-to-edge connection points, with padding from the element's border */
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
    item.kind === "image" ||
    item.kind === "sticker"
  );
}
