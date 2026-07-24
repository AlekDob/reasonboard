import type { BoardItem, BoardSticky } from "./types";

export const isBoardEditor = import.meta.env.DEV;

export type BoardCamera = {
  scale: number;
  x: number;
  y: number;
};

export type SavedLayoutFile = {
  version: 1;
  sceneKey: string;
  items: BoardItem[];
  /** Default view (zoom + pan) captured on Save */
  camera?: BoardCamera;
  /** IDs the user deleted (don't restore them from the fresh layout) */
  removedIds?: string[];
};

type Scene =
  | { type: "root" }
  | { type: "section"; id: string; fromSectionId?: string }
  | { type: "idea"; sectionId: string; ideaId: string }
  | { type: "competitor"; sectionId: string; competitorId: string };

const SCENE_KEY_RE = /^[a-z0-9][a-z0-9-]{0,120}$/;

/** Mutable cache: updated after Save/Reset without waiting for HMR. */
const memory = new Map<string, SavedLayoutFile>();

const modules = import.meta.glob<SavedLayoutFile>("./saved-layouts/*.json", {
  eager: true,
  import: "default",
});

for (const [path, data] of Object.entries(modules)) {
  if (!data?.sceneKey || !Array.isArray(data.items)) continue;
  const fromPath = path.match(/\/([^/]+)\.json$/)?.[1];
  const key = data.sceneKey || fromPath;
  if (key && SCENE_KEY_RE.test(key)) {
    memory.set(key, {
      version: 1,
      sceneKey: key,
      items: data.items,
      camera: normalizeCamera(data.camera),
      removedIds: Array.isArray(data.removedIds)
        ? data.removedIds.filter((id): id is string => typeof id === "string")
        : undefined,
    });
  }
}

function normalizeCamera(cam: unknown): BoardCamera | undefined {
  if (!cam || typeof cam !== "object") return undefined;
  const c = cam as Record<string, unknown>;
  const scale = Number(c.scale);
  const x = Number(c.x);
  const y = Number(c.y);
  if (!Number.isFinite(scale) || scale <= 0) return undefined;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  return { scale, x, y };
}

export function isValidSceneKey(key: string): boolean {
  return SCENE_KEY_RE.test(key);
}

export function sceneKeyFor(
  slideId: string,
  scene: Scene,
): string {
  if (scene.type === "root") return `${slideId}-root`;
  if (scene.type === "section") return `${slideId}-${scene.id}`;
  if (scene.type === "idea") return `${slideId}-idea--${scene.ideaId}`;
  return `${slideId}-competitor--${scene.competitorId}`;
}

export function getSavedLayout(sceneKey: string): SavedLayoutFile | null {
  const saved = memory.get(sceneKey);
  return saved
    ? {
        version: 1,
        sceneKey: saved.sceneKey,
        items: structuredClone(saved.items),
        camera: saved.camera ? { ...saved.camera } : undefined,
        removedIds: saved.removedIds ? [...saved.removedIds] : undefined,
      }
    : null;
}

export function getSavedItems(sceneKey: string): BoardItem[] | null {
  const saved = memory.get(sceneKey);
  return saved ? structuredClone(saved.items) : null;
}

export function getSavedCamera(sceneKey: string): BoardCamera | null {
  const cam = memory.get(sceneKey)?.camera;
  return cam ? { ...cam } : null;
}

export function getSavedRemovedIds(sceneKey: string): string[] {
  return memory.get(sceneKey)?.removedIds
    ? [...memory.get(sceneKey)!.removedIds!]
    : [];
}

export function rememberSavedLayout(sceneKey: string, file: SavedLayoutFile) {
  memory.set(sceneKey, {
    version: 1,
    sceneKey,
    items: structuredClone(file.items),
    camera: file.camera ? { ...file.camera } : undefined,
    removedIds: file.removedIds ? [...file.removedIds] : undefined,
  });
}

export function forgetSavedItems(sceneKey: string) {
  memory.delete(sceneKey);
}

export function hasSavedItems(sceneKey: string): boolean {
  return memory.has(sceneKey);
}

/** Applies saved positions/text onto the fresh layout (content from content.ts). */
export function mergeLayout(
  fresh: BoardItem[],
  saved: BoardItem[] | null,
  removedIds: string[] = [],
): BoardItem[] {
  const removed = new Set(removedIds);
  const baseFresh = fresh.filter((i) => !removed.has(i.id));
  if (!saved?.length) return baseFresh;

  const savedById = new Map(saved.map((i) => [i.id, i]));
  const freshIds = new Set(baseFresh.map((i) => i.id));

  const merged: BoardItem[] = baseFresh.map((f) => {
    const s = savedById.get(f.id);
    if (!s || s.kind !== f.kind) return f;
    return applySavedFields(f, s);
  });

  for (const s of saved) {
    if (freshIds.has(s.id) || removed.has(s.id)) continue;
    if (s.kind === "sticky" || s.kind === "stroke" || s.kind === "sticker") {
      merged.push(structuredClone(s));
      continue;
    }
    if (s.kind === "connector") {
      const ids = new Set(merged.map((m) => m.id));
      if (ids.has(s.fromId) && ids.has(s.toId)) {
        merged.push(structuredClone(s));
      }
    }
  }

  return merged;
}

function applySavedFields(fresh: BoardItem, saved: BoardItem): BoardItem {
  if (fresh.kind === "node" && saved.kind === "node") {
    return {
      ...fresh,
      x: saved.x,
      y: saved.y,
      rotate: saved.rotate,
      w: saved.w ?? fresh.w,
      h: saved.h ?? fresh.h,
    };
  }
  if (fresh.kind === "text" && saved.kind === "text") {
    return {
      ...fresh,
      x: saved.x,
      y: saved.y,
      html: saved.html,
    };
  }
  if (fresh.kind === "sticky" && saved.kind === "sticky") {
    return {
      ...fresh,
      x: saved.x,
      y: saved.y,
      text: saved.text,
      color: saved.color,
    } satisfies BoardSticky;
  }
  if (fresh.kind === "contentCard" && saved.kind === "contentCard") {
    return {
      ...fresh,
      x: saved.x,
      y: saved.y,
      rotate: saved.rotate ?? fresh.rotate,
      w: saved.w ?? fresh.w,
      h: saved.h ?? fresh.h,
      paper: saved.paper ?? fresh.paper,
      title: saved.title,
      text: saved.text,
      eyebrow: saved.eyebrow ?? fresh.eyebrow,
      blocks: saved.blocks ?? fresh.blocks,
    };
  }
  if (fresh.kind === "image" && saved.kind === "image") {
    return {
      ...fresh,
      x: saved.x,
      y: saved.y,
      w: saved.w ?? fresh.w,
      h: saved.h ?? fresh.h,
      caption: saved.caption ?? fresh.caption,
    };
  }
  if (fresh.kind === "sticker" && saved.kind === "sticker") {
    return {
      ...fresh,
      x: saved.x,
      y: saved.y,
      w: saved.w ?? fresh.w,
      h: saved.h ?? fresh.h,
      rotate: saved.rotate ?? fresh.rotate,
      src: saved.src ?? fresh.src,
      alt: saved.alt ?? fresh.alt,
    };
  }
  if (fresh.kind === "connector" && saved.kind === "connector") {
    return { ...fresh, color: saved.color };
  }
  if (fresh.kind === "stroke" && saved.kind === "stroke") {
    return {
      ...fresh,
      points: structuredClone(saved.points),
      color: saved.color,
    };
  }
  return fresh;
}

export async function persistScene(
  sceneKey: string,
  items: BoardItem[],
  camera?: BoardCamera,
  removedIds?: string[],
): Promise<void> {
  if (!isBoardEditor) {
    throw new Error("Save layout only in localhost (dev)");
  }
  if (!isValidSceneKey(sceneKey)) {
    throw new Error(`Invalid scene key: ${sceneKey}`);
  }
  const body: SavedLayoutFile = {
    version: 1,
    sceneKey,
    items,
    camera: camera ? { ...camera } : undefined,
    removedIds: removedIds?.length ? [...removedIds] : undefined,
  };
  const res = await fetch("/__wb-save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Save failed (${res.status})`);
  }
  rememberSavedLayout(sceneKey, body);
}

export async function deletePersistedScene(sceneKey: string): Promise<void> {
  if (!isBoardEditor) {
    throw new Error("Reset layout only in localhost (dev)");
  }
  if (!isValidSceneKey(sceneKey)) {
    throw new Error(`Invalid scene key: ${sceneKey}`);
  }
  const res = await fetch(`/__wb-save?key=${encodeURIComponent(sceneKey)}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Reset failed (${res.status})`);
  }
  forgetSavedItems(sceneKey);
}
