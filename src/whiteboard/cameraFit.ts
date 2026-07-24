import { isPositioned, itemSize, type BoardItem } from "./types";

export type Cam = { scale: number; x: number; y: number };

/**
 * Zoom/pan iniziali così il contenuto della scena entra nella viewport
 * (con padding per topbar + toolbar). Cap a 1 = mai zoom-in forzato.
 */
export function fitCameraToItems(
  items: BoardItem[],
  viewW: number,
  viewH: number,
  opts?: { padX?: number; padTop?: number; padBottom?: number; minScale?: number; maxScale?: number },
): Cam {
  const padX = opts?.padX ?? 48;
  const padTop = opts?.padTop ?? 88;
  const padBottom = opts?.padBottom ?? 110;
  const minScale = opts?.minScale ?? 0.55;
  const maxScale = opts?.maxScale ?? 1;

  const positioned = items.filter(isPositioned);
  if (!positioned.length || viewW < 80 || viewH < 80) {
    return { scale: 1, x: 0, y: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const it of positioned) {
    // Hint di navigazione: non allarga il frame
    if (it.kind === "sticky" && it.id.startsWith("st-hint-")) continue;
    const s = itemSize(it);
    minX = Math.min(minX, it.x);
    minY = Math.min(minY, it.y);
    maxX = Math.max(maxX, it.x + s.w);
    maxY = Math.max(maxY, it.y + s.h);
  }

  if (!Number.isFinite(minX) || maxX <= minX || maxY <= minY) {
    return { scale: 1, x: 0, y: 0 };
  }

  const contentW = maxX - minX;
  const contentH = maxY - minY;
  const availW = Math.max(120, viewW - padX * 2);
  const availH = Math.max(120, viewH - padTop - padBottom);

  const scale = Math.min(maxScale, Math.max(minScale, Math.min(availW / contentW, availH / contentH)));

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const viewCx = viewW / 2;
  const viewCy = padTop + availH / 2;

  return {
    scale,
    x: viewCx - cx * scale,
    y: viewCy - cy * scale,
  };
}
