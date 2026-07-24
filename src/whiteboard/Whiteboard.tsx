import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DeckMeta, ModalSection } from "../contentTypes";
import { clearDiveNav, setDiveNav } from "../diveNav";
import { NodeArt } from "../NodeArt";
import { nudgeNextSlide } from "../nudge";
import {
  BoardImageView,
  BoardTextView,
  ContentCardView,
  shortBlurb,
} from "./BoardItems";
import { BoardStickerView } from "./BoardSticker";
import { fitCameraToItems } from "./cameraFit";
import { layoutCompetitorDetail, layoutDeepDive, layoutIdeaDetail } from "./deepDiveLayout";
import { FreeformToolbar } from "./FreeformToolbar";
import { ImageLightbox } from "./ImageLightbox";
import { layoutSlideBoard } from "./layout";
import {
  deletePersistedScene,
  getSavedCamera,
  getSavedItems,
  getSavedRemovedIds,
  hasSavedItems,
  isBoardEditor,
  mergeLayout,
  persistScene,
  sceneKeyFor,
} from "./savedLayouts";
import {
  AnimatedConnector,
  EnterWrap,
  COLLAPSE_MS,
  collapseToward,
  sceneMotion,
  stackCenter,
  type NavDir,
} from "./sceneMotion";
import {
  connectionPoints,
  isPositioned,
  itemSize,
  type BoardConnector,
  type BoardItem,
  type BoardSticky,
  type Point,
  type Tool,
} from "./types";

type Props = {
  sections: ModalSection[];
  meta: DeckMeta;
  /** Used as the scene-key prefix for saved layouts (usually the slide id) */
  slideId: string;
  /** After closing this section's deep-dive on root, dispatch reasonboard:nudge-next */
  nudgeNextAfterId?: string;
};

/** Readable text on dark post-its (e.g. black swatch). */
function stickyInk(bg: string): string {
  const hex = bg.replace("#", "");
  if (hex.length !== 6) return "#1a1a1a";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.45 ? "#f5f5f5" : "#1a1a1a";
}

type Scene =
  | { type: "root" }
  | { type: "section"; id: string; fromSectionId?: string }
  | { type: "idea"; sectionId: string; ideaId: string }
  | { type: "competitor"; sectionId: string; competitorId: string };

let uid = 0;
const nid = () => `b-${Date.now()}-${uid++}`;

export function Whiteboard({ sections, meta, slideId, nudgeNextAfterId }: Props) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const laidOut = useRef(false);
  const reduce = useReducedMotion();
  const nodeDefs = useMemo(
    () =>
      sections
        .filter((s) => s.onRoot !== false)
        .map((s) => ({ id: `node-${s.id}`, sectionId: s.id })),
    [sections],
  );
  const nodeKey = nodeDefs.map((n) => n.sectionId).join("|");

  const [rootItems, setRootItems] = useState<BoardItem[]>(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1440;
    const h = typeof window !== "undefined" ? window.innerHeight : 900;
    const key = sceneKeyFor(slideId, { type: "root" });
    const fresh = layoutSlideBoard(meta, nodeDefs, w, h);
    return mergeLayout(fresh, getSavedItems(key), getSavedRemovedIds(key));
  });
  const [diveItems, setDiveItems] = useState<BoardItem[]>([]);
  const [scene, setScene] = useState<Scene>({ type: "root" });
  const currentSceneKey = sceneKeyFor(slideId, scene);
  const [navDir, setNavDir] = useState<NavDir>("in");
  const [sceneReady, setSceneReady] = useState(false);
  const [collapsing, setCollapsing] = useState(false);
  const pendingNav = useRef<null | (() => void)>(null);
  const [cam, setCam] = useState({ scale: 1, x: 0, y: 0 });
  const camRef = useRef(cam);
  camRef.current = cam;
  const [rootHistory, setRootHistory] = useState<BoardItem[][]>([]);
  const [diveHistory, setDiveHistory] = useState<BoardItem[][]>([]);

  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState("#0d9488");
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveLabel, setSaveLabel] = useState<string | undefined>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<string[]>(() =>
    getSavedRemovedIds(sceneKeyFor(slideId, { type: "root" })),
  );
  const removedBySceneRef = useRef<Record<string, string[]>>({
    [sceneKeyFor(slideId, { type: "root" })]: getSavedRemovedIds(
      sceneKeyFor(slideId, { type: "root" }),
    ),
  });
  const removedIdsRef = useRef<string[]>([]);
  removedIdsRef.current = removedIds;

  const setRemovedIdsForScene = (key: string, ids: string[]) => {
    removedBySceneRef.current[key] = ids;
    setRemovedIds(ids);
  };
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);
  const selectedConnectorRef = useRef<string | null>(null);
  selectedConnectorRef.current = selectedConnector;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedIdsRef = useRef<string[]>([]);
  selectedIdsRef.current = selectedIds;
  const [marqueeBox, setMarqueeBox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [panning, setPanning] = useState(false);
  const [frontId, setFrontId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{
    src: string;
    caption?: string;
    href?: string;
  } | null>(null);
  const spaceHeldRef = useRef(false);
  const panDrag = useRef<{ ox: number; oy: number; cx: number; cy: number } | null>(null);
  const resizeDrag = useRef<{
    id: string;
    ox: number;
    oy: number;
    ow: number;
    oh: number;
    oxPos: number;
    oyPos: number;
    aspect: number;
  } | null>(null);

  const drag = useRef<{
    id: string;
    sectionId?: string;
    openIdeaId?: string;
    openCompetitorId?: string;
    openSectionId?: string;
    zoomSrc?: string;
    zoomCaption?: string;
    zoomHref?: string;
    ox: number;
    oy: number;
    /** Origins x/y for each id being moved (group drag) */
    origins: Record<string, { x: number; y: number }>;
    additive: boolean;
    dragging: boolean;
  } | null>(null);
  const marquee = useRef<{
    ox: number;
    oy: number;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    additive: boolean;
  } | null>(null);
  const drawing = useRef<string | null>(null);
  const moved = useRef(false);
  const DRAG_THRESHOLD = 6;
  const lastTap = useRef<{ id: string; t: number } | null>(null);
  const pendingZoom = useRef<ReturnType<typeof setTimeout> | null>(null);
  const DBL_MS = 320;

  const inDive = scene.type !== "root";
  const items = inDive ? diveItems : rootItems;
  const setItems = inDive ? setDiveItems : setRootItems;
  const history = inDive ? diveHistory : rootHistory;
  const setHistory = inDive ? setDiveHistory : setRootHistory;
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const surfaceSize = () => {
    const el = surfaceRef.current;
    if (!el) {
      return {
        width: typeof window !== "undefined" ? window.innerWidth : 1440,
        height: typeof window !== "undefined" ? window.innerHeight : 900,
      };
    }
    const { width, height } = el.getBoundingClientRect();
    return { width: Math.max(width, 960), height: Math.max(height, 600) };
  };

  const buildFreshForScene = useCallback(
    (next: Scene): BoardItem[] => {
      const { width, height } = surfaceSize();
      if (next.type === "root") {
        return layoutSlideBoard(meta, nodeDefs, width, height);
      }
      if (next.type === "section") {
        const section = sections.find((s) => s.id === next.id);
        return section ? layoutDeepDive(section, width, height) : [];
      }
      if (next.type === "idea") {
        const section = sections.find((s) => s.id === next.sectionId);
        const idea = section?.ideas?.find((i) => i.id === next.ideaId);
        const index = section?.ideas?.findIndex((i) => i.id === next.ideaId) ?? 0;
        return section && idea ? layoutIdeaDetail(idea, index, width, height) : [];
      }
      const section = sections.find((s) => s.id === next.sectionId);
      const note = section?.competitorNotes?.find((n) => n.id === next.competitorId);
      const index =
        section?.competitorNotes?.findIndex((n) => n.id === next.competitorId) ?? 0;
      return section && note ? layoutCompetitorDetail(note, index, width, height) : [];
    },
    [meta, nodeDefs, sections],
  );

  const hydrateScene = useCallback(
    (next: Scene): BoardItem[] => {
      const fresh = buildFreshForScene(next);
      const key = sceneKeyFor(slideId, next);
      const removed =
        removedBySceneRef.current[key] ?? getSavedRemovedIds(key);
      removedBySceneRef.current[key] = removed;
      setRemovedIds(removed);
      return mergeLayout(fresh, getSavedItems(key), removed);
    },
    [buildFreshForScene, slideId],
  );

  const openSection = useCallback(
    (sectionId: string, fromSectionId?: string) => {
      if (collapsing) return;
      const section = sections.find((s) => s.id === sectionId);
      if (!section) return;
      const next: Scene = {
        type: "section",
        id: sectionId,
        ...(fromSectionId ? { fromSectionId } : {}),
      };
      setDiveItems(hydrateScene(next));
      setDiveHistory([]);
      setEditingId(null);
      setLinkFrom(null);
      setSelectedConnector(null);
      setTool("select");
      setNavDir("in");
      setSceneReady(true);
      setScene(next);
    },
    [sections, collapsing, hydrateScene],
  );

  const openIdea = useCallback(
    (sectionId: string, ideaId: string) => {
      if (collapsing) return;
      const section = sections.find((s) => s.id === sectionId);
      const idea = section?.ideas?.find((i) => i.id === ideaId);
      if (!section || !idea) return;
      const next: Scene = { type: "idea", sectionId, ideaId };
      setDiveItems(hydrateScene(next));
      setDiveHistory([]);
      setEditingId(null);
      setLinkFrom(null);
      setSelectedConnector(null);
      setTool("select");
      setNavDir("in");
      setSceneReady(true);
      setScene(next);
    },
    [sections, collapsing, hydrateScene],
  );

  const openCompetitor = useCallback(
    (sectionId: string, competitorId: string) => {
      if (collapsing) return;
      const section = sections.find((s) => s.id === sectionId);
      const note = section?.competitorNotes?.find((n) => n.id === competitorId);
      if (!section || !note) return;
      const next: Scene = { type: "competitor", sectionId, competitorId };
      setDiveItems(hydrateScene(next));
      setDiveHistory([]);
      setEditingId(null);
      setLinkFrom(null);
      setSelectedConnector(null);
      setTool("select");
      setNavDir("in");
      setSceneReady(true);
      setScene(next);
    },
    [sections, collapsing, hydrateScene],
  );

  const performGoBack = useCallback(() => {
    if (scene.type === "idea" || scene.type === "competitor") {
      const section = sections.find((s) => s.id === scene.sectionId);
      if (!section) {
        setNavDir("out");
        setSceneReady(true);
        setScene({ type: "root" });
        return;
      }
      const next: Scene = { type: "section", id: scene.sectionId };
      setDiveItems(hydrateScene(next));
      setDiveHistory([]);
      setNavDir("out");
      setSceneReady(true);
      setScene(next);
      return;
    }
    if (scene.type === "section") {
      if (scene.fromSectionId) {
        const parent = sections.find((s) => s.id === scene.fromSectionId);
        if (parent) {
          const next: Scene = { type: "section", id: scene.fromSectionId };
          setDiveItems(hydrateScene(next));
          setDiveHistory([]);
          setNavDir("out");
          setSceneReady(true);
          setScene(next);
          return;
        }
      }
      const closed = scene.id;
      setNavDir("out");
      setSceneReady(true);
      setScene({ type: "root" });
      setDiveItems([]);
      setDiveHistory([]);
      if (nudgeNextAfterId && closed === nudgeNextAfterId) {
        nudgeNextSlide();
      }
    }
  }, [scene, sections, nudgeNextAfterId, hydrateScene]);

  const goBack = useCallback(() => {
    if (scene.type === "root" || collapsing) return;
    // First collapse elements to center, then go up a level
    pendingNav.current = performGoBack;
    setNavDir("out");
    setCollapsing(true);
  }, [scene.type, collapsing, performGoBack]);

  useEffect(() => {
    if (!collapsing) return;
    const t = window.setTimeout(() => {
      const fn = pendingNav.current;
      pendingNav.current = null;
      setCollapsing(false);
      fn?.();
    }, reduce ? 80 : COLLAPSE_MS);
    return () => window.clearTimeout(t);
  }, [collapsing, reduce]);

  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;

    const apply = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width < 40 || height < 40) return;
      laidOut.current = true;
      const fresh = layoutSlideBoard(meta, nodeDefs, width, height);
      const key = sceneKeyFor(slideId, { type: "root" });
      const removed =
        removedBySceneRef.current[key] ?? getSavedRemovedIds(key);
      removedBySceneRef.current[key] = removed;
      setRemovedIds(removed);
      setRootItems(mergeLayout(fresh, getSavedItems(key), removed));
      setRootHistory([]);
    };

    // Always relayout when sections/slide change (avoids ghost nodes/arrows).
    // Doesn't re-run on resize once laid out — preserves saved/edited positions.
    apply();
    const ro = new ResizeObserver(() => {
      if (!laidOut.current) apply();
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideId, nodeKey]);

  useEffect(() => {
    document.body.classList.toggle("wb-deep-open", inDive);
    return () => document.body.classList.remove("wb-deep-open");
  }, [inDive]);

  // Footer pager: siblings + go up a level
  useEffect(() => {
    if (scene.type === "root") {
      clearDiveNav();
      return;
    }

    let ids: string[] = [];
    let index = 0;
    let floor: 1 | 2 = 1;
    let goTo = (_id: string) => {};

    if (scene.type === "section") {
      if (scene.fromSectionId) {
        floor = 2;
        ids = [scene.id];
        index = 0;
        goTo = () => {};
      } else {
        floor = 1;
        ids = sections.filter((s) => s.onRoot !== false).map((s) => s.id);
        index = ids.indexOf(scene.id);
        goTo = (id) => openSection(id);
      }
    } else if (scene.type === "idea") {
      floor = 2;
      const section = sections.find((s) => s.id === scene.sectionId);
      ids = (section?.ideas ?? []).map((i) => i.id);
      index = ids.indexOf(scene.ideaId);
      const sectionId = scene.sectionId;
      goTo = (id) => openIdea(sectionId, id);
    } else {
      floor = 2;
      const section = sections.find((s) => s.id === scene.sectionId);
      ids = (section?.competitorNotes ?? []).map((n) => n.id);
      index = ids.indexOf(scene.competitorId);
      const sectionId = scene.sectionId;
      goTo = (id) => openCompetitor(sectionId, id);
    }

    const safeIndex = Math.max(0, index);
    setDiveNav({
      floor,
      index: safeIndex,
      total: Math.max(ids.length, 1),
      goPrev: () => {
        if (collapsing || safeIndex <= 0) return;
        goTo(ids[safeIndex - 1]!);
      },
      goNext: () => {
        if (collapsing || safeIndex >= ids.length - 1) return;
        goTo(ids[safeIndex + 1]!);
      },
      goUp: () => {
        if (collapsing) return;
        goBack();
      },
    });

    return () => clearDiveNav();
  }, [
    scene,
    sections,
    collapsing,
    openSection,
    openIdea,
    openCompetitor,
    goBack,
  ]);

  useEffect(() => {
    if (!inDive && !lightbox && !isBoardEditor) return;
    const onKey = (e: KeyboardEvent) => {
      const inField = Boolean(
        (e.target as HTMLElement)?.closest?.("textarea,input,[contenteditable=true]"),
      );
      if (e.key === "Escape") {
        if (inField && editingId) {
          e.preventDefault();
          e.stopPropagation();
          setEditingId(null);
          return;
        }
        if ((e.target as HTMLElement)?.closest?.("textarea,input")) return;
        if (lightbox) {
          e.preventDefault();
          e.stopPropagation();
          setLightbox(null);
          return;
        }
        if (isBoardEditor && editingId) {
          e.preventDefault();
          e.stopPropagation();
          setEditingId(null);
          return;
        }
        if (isBoardEditor && selectedIdsRef.current.length) {
          e.preventDefault();
          e.stopPropagation();
          setSelectedIds([]);
          return;
        }
        if (inDive) {
          e.preventDefault();
          e.stopPropagation();
          goBack();
        }
        return;
      }
      if (
        isBoardEditor &&
        !inField &&
        (e.key === "Backspace" || e.key === "Delete")
      ) {
        if (selectedConnectorRef.current) {
          e.preventDefault();
          deleteItem(selectedConnectorRef.current);
          return;
        }
        if (selectedIdsRef.current.length) {
          e.preventDefault();
          deleteSelected();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [inDive, goBack, lightbox, editingId]);

  // Camera: use saved view if present, otherwise fit / identity
  useEffect(() => {
    setFrontId(null);
    setSelectedIds([]);
    setSelectedConnector(null);
    setEditingId(null);
    setMarqueeBox(null);
    marquee.current = null;
    const key = sceneKeyFor(slideId, scene);
    const removed =
      removedBySceneRef.current[key] ?? getSavedRemovedIds(key);
    removedBySceneRef.current[key] = removed;
    setRemovedIds(removed);
    const savedCam = getSavedCamera(key);
    if (savedCam) {
      setCam(savedCam);
      return;
    }
    if (scene.type === "root") {
      setCam({ scale: 1, x: 0, y: 0 });
      return;
    }
    const el = surfaceRef.current;
    const rect = el?.getBoundingClientRect();
    const width =
      rect && rect.width >= 40
        ? rect.width
        : typeof window !== "undefined"
          ? window.innerWidth
          : 1440;
    const height =
      rect && rect.height >= 40
        ? rect.height
        : typeof window !== "undefined"
          ? window.innerHeight
          : 900;
    setCam(fitCameraToItems(diveItems, width, height));
  }, [
    slideId,
    scene.type === "root"
      ? "root"
      : scene.type === "section"
        ? `section-${scene.id}`
        : scene.type === "idea"
          ? `idea-${scene.ideaId}`
          : `competitor-${scene.competitorId}`,
  ]);

  // Trackpad: pinch (ctrl+wheel) = zoom; two fingers = pan
  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const isPinch = e.ctrlKey || e.metaKey;
      if (!isPinch && Math.abs(e.deltaX) < 0.5 && Math.abs(e.deltaY) < 0.5) return;

      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      setCam((prev) => {
        if (isPinch) {
          const factor = Math.exp(-e.deltaY * 0.012);
          const next = Math.min(2.6, Math.max(0.4, prev.scale * factor));
          const wx = (mx - prev.x) / prev.scale;
          const wy = (my - prev.y) / prev.scale;
          return {
            scale: next,
            x: mx - wx * next,
            y: my - wy * next,
          };
        }
        return {
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        };
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const resetCam = () => {
    if (scene.type === "root") {
      setCam({ scale: 1, x: 0, y: 0 });
      return;
    }
    const el = surfaceRef.current;
    const rect = el?.getBoundingClientRect();
    const width = rect && rect.width >= 40 ? rect.width : window.innerWidth;
    const height = rect && rect.height >= 40 ? rect.height : window.innerHeight;
    setCam(fitCameraToItems(diveItems, width, height));
  };

  // Hold Space = pan mode (like Figma)
  useEffect(() => {
    const isTyping = (t: EventTarget | null) =>
      Boolean((t as HTMLElement | null)?.closest?.("textarea,input,[contenteditable=true]"));

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      if (isTyping(e.target)) return;
      if (e.repeat) return;
      e.preventDefault();
      spaceHeldRef.current = true;
      setSpaceHeld(true);
      drag.current = null;
      drawing.current = null;
      setLinkFrom(null);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      spaceHeldRef.current = false;
      setSpaceHeld(false);
      panDrag.current = null;
      setPanning(false);
    };

    const onBlur = () => {
      spaceHeldRef.current = false;
      setSpaceHeld(false);
      panDrag.current = null;
      setPanning(false);
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const pushHistory = useCallback(
    (prev: BoardItem[]) => {
      setHistory((h) => [...h.slice(-30), prev]);
    },
    [setHistory],
  );

  const localPoint = (e: React.PointerEvent | PointerEvent): Point => {
    const el = surfaceRef.current!;
    const r = el.getBoundingClientRect();
    const { scale, x, y } = camRef.current;
    return {
      x: (e.clientX - r.left - x) / scale,
      y: (e.clientY - r.top - y) / scale,
    };
  };

  const onUndo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      const next = [...h];
      const prev = next.pop()!;
      setItems(prev);
      return next;
    });
  };

  const onClearDrawings = () => {
    if (!isBoardEditor) return;
    setItems((curr) => {
      pushHistory(curr);
      return curr.filter((i) => i.kind !== "stroke");
    });
  };

  const onSaveLayout = useCallback(async () => {
    if (!isBoardEditor || saveBusy) return;
    setSaveBusy(true);
    setSaveLabel(undefined);
    try {
      await persistScene(
        currentSceneKey,
        items,
        camRef.current,
        removedIdsRef.current,
      );
      setSaveLabel("Saved");
      window.setTimeout(() => setSaveLabel(undefined), 1600);
    } catch (err) {
      console.error(err);
      setSaveLabel("Error");
      window.setTimeout(() => setSaveLabel(undefined), 2200);
    } finally {
      setSaveBusy(false);
    }
  }, [currentSceneKey, items, saveBusy]);

  const onResetLayout = useCallback(async () => {
    if (!isBoardEditor || saveBusy) return;
    const ok = window.confirm(
      "Reset this scene to the automatic layout? The saved file will be deleted.",
    );
    if (!ok) return;
    setSaveBusy(true);
    try {
      await deletePersistedScene(currentSceneKey);
      const fresh = buildFreshForScene(scene);
      setItems(fresh);
      setHistory([]);
      setEditingId(null);
      setRemovedIdsForScene(currentSceneKey, []);
      setSelectedIds([]);
      const { width, height } = surfaceSize();
      if (scene.type === "root") {
        setCam({ scale: 1, x: 0, y: 0 });
      } else {
        setCam(fitCameraToItems(fresh, width, height));
      }
      setSaveLabel("Reset");
      window.setTimeout(() => setSaveLabel(undefined), 1600);
    } catch (err) {
      console.error(err);
      setSaveLabel("Error");
      window.setTimeout(() => setSaveLabel(undefined), 2200);
    } finally {
      setSaveBusy(false);
    }
  }, [currentSceneKey, scene, buildFreshForScene, setItems, setHistory, saveBusy]);

  const bringFront = (itemId: string) => {
    // z-index only: don't reorder the array (breaks EnterWrap / opacity)
    setFrontId(itemId);
  };

  const isAdditiveClick = (e: React.PointerEvent | PointerEvent) =>
    e.shiftKey || e.metaKey || e.ctrlKey;

  const toggleSelectedId = (itemId: string) => {
    setSelectedIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    );
  };

  const itemsInMarquee = (box: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  }): string[] => {
    const left = Math.min(box.x0, box.x1);
    const top = Math.min(box.y0, box.y1);
    const right = Math.max(box.x0, box.x1);
    const bottom = Math.max(box.y0, box.y1);
    return items.filter(isPositioned).flatMap((it) => {
      const { w, h } = itemSize(it);
      const overlaps =
        it.x < right && it.x + w > left && it.y < bottom && it.y + h > top;
      return overlaps ? [it.id] : [];
    });
  };

  const startDrag = (
    e: React.PointerEvent,
    itemId: string,
    opts?: {
      sectionId?: string;
      openIdeaId?: string;
      openCompetitorId?: string;
      openSectionId?: string;
      zoomSrc?: string;
      zoomCaption?: string;
      zoomHref?: string;
    },
  ) => {
    if (spaceHeldRef.current) return;
    if (tool !== "select") return;
    if (
      (e.target as HTMLElement).closest(
        "textarea,input,button.wb-item-del,button.wb-sticker-resize,button.node-cta,button.wb-cc-open-btn,button.wb-cc-photo-btn,button.wb-cc-media-btn,a.wb-source-link",
      )
    ) {
      return;
    }
    e.stopPropagation();
    const item = items.find((x) => x.id === itemId);
    if (!item || !isPositioned(item)) return;
    moved.current = false;
    setSelectedConnector(null);
    marquee.current = null;
    setMarqueeBox(null);

    const additive = isBoardEditor && isAdditiveClick(e);
    const current = selectedIdsRef.current;
    let moveIds: string[];

    if (additive) {
      moveIds = [itemId];
    } else if (isBoardEditor && current.includes(itemId) && current.length > 1) {
      moveIds = current.filter((id) => {
        const it = items.find((x) => x.id === id);
        return it && isPositioned(it);
      });
    } else {
      moveIds = [itemId];
      if (isBoardEditor) setSelectedIds([itemId]);
    }

    const origins: Record<string, { x: number; y: number }> = {};
    for (const id of moveIds) {
      const it = items.find((x) => x.id === id);
      if (it && isPositioned(it)) origins[id] = { x: it.x, y: it.y };
    }

    drag.current = {
      id: itemId,
      sectionId: opts?.sectionId,
      openIdeaId: opts?.openIdeaId,
      openCompetitorId: opts?.openCompetitorId,
      openSectionId: opts?.openSectionId,
      zoomSrc: opts?.zoomSrc,
      zoomCaption: opts?.zoomCaption,
      zoomHref: opts?.zoomHref,
      ox: e.clientX,
      oy: e.clientY,
      origins,
      additive,
      dragging: false,
    };
    surfaceRef.current?.setPointerCapture(e.pointerId);
  };

  const startStickerResize = (e: React.PointerEvent, itemId: string) => {
    if (!isBoardEditor || tool !== "select") return;
    const item = items.find((x) => x.id === itemId);
    if (!item || item.kind !== "sticker") return;
    e.stopPropagation();
    e.preventDefault();
    const { w, h } = itemSize(item);
    pushHistory(items);
    bringFront(itemId);
    setSelectedIds([itemId]);
    resizeDrag.current = {
      id: itemId,
      ox: e.clientX,
      oy: e.clientY,
      ow: w,
      oh: h,
      oxPos: item.x,
      oyPos: item.y,
      aspect: w / Math.max(h, 1),
    };
    moved.current = true;
    surfaceRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (panDrag.current) {
      const p = panDrag.current;
      setCam({
        scale: camRef.current.scale,
        x: p.cx + (e.clientX - p.ox),
        y: p.cy + (e.clientY - p.oy),
      });
      return;
    }

    if (resizeDrag.current) {
      const r = resizeDrag.current;
      const s = camRef.current.scale;
      const dx = (e.clientX - r.ox) / s;
      const dy = (e.clientY - r.oy) / s;
      // Top-right handle: right/up = bigger (locked aspect ratio)
      const delta = Math.max(dx, -dy);
      const minW = 48;
      const maxW = 480;
      const newW = Math.min(maxW, Math.max(minW, r.ow + delta));
      const newH = newW / r.aspect;
      // Anchored at bottom-left: top-right moves with the handle
      const newY = r.oyPos + r.oh - newH;
      setItems((curr) =>
        curr.map((it) =>
          it.id === r.id && it.kind === "sticker"
            ? { ...it, w: newW, h: newH, y: newY }
            : it,
        ),
      );
      return;
    }

    if (marquee.current) {
      const p = localPoint(e);
      marquee.current.x1 = p.x;
      marquee.current.y1 = p.y;
      const m = marquee.current;
      setMarqueeBox({
        x: Math.min(m.x0, m.x1),
        y: Math.min(m.y0, m.y1),
        w: Math.abs(m.x1 - m.x0),
        h: Math.abs(m.y1 - m.y0),
      });
      return;
    }

    if (drawing.current) {
      const p = localPoint(e);
      setItems((curr) =>
        curr.map((it) => {
          if (it.id !== drawing.current || it.kind !== "stroke") return it;
          return { ...it, points: [...it.points, p] };
        }),
      );
      return;
    }

    if (!drag.current) return;
    const d = drag.current;
    const dx = e.clientX - d.ox;
    const dy = e.clientY - d.oy;
    const dist = Math.hypot(dx, dy);

    if (!d.dragging) {
      if (dist < DRAG_THRESHOLD) return;
      if (!isBoardEditor) return;
      d.dragging = true;
      moved.current = true;
      if (pendingZoom.current) {
        clearTimeout(pendingZoom.current);
        pendingZoom.current = null;
      }
      lastTap.current = null;
      surfaceRef.current?.setPointerCapture(e.pointerId);
      pushHistory(items);
      bringFront(d.id);
    }

    if (!isBoardEditor) return;

    const s = camRef.current.scale;
    setItems((curr) =>
      curr.map((it) => {
        const o = d.origins[it.id];
        if (!o || !isPositioned(it)) return it;
        return { ...it, x: o.x + dx / s, y: o.y + dy / s };
      }),
    );
  };

  const onPointerUp = () => {
    if (panDrag.current) {
      panDrag.current = null;
      setPanning(false);
    }

    if (resizeDrag.current) {
      resizeDrag.current = null;
      return;
    }

    if (marquee.current) {
      const m = marquee.current;
      marquee.current = null;
      setMarqueeBox(null);
      const w = Math.abs(m.x1 - m.x0);
      const h = Math.abs(m.y1 - m.y0);
      if (w < DRAG_THRESHOLD && h < DRAG_THRESHOLD) {
        if (!m.additive) {
          setSelectedIds([]);
          setEditingId(null);
        }
      } else {
        const hit = itemsInMarquee(m);
        setSelectedIds((prev) =>
          m.additive ? Array.from(new Set([...prev, ...hit])) : hit,
        );
      }
      return;
    }

    const d = drag.current;
    drag.current = null;
    drawing.current = null;

    if (
      d &&
      !d.dragging &&
      !moved.current &&
      tool === "select" &&
      !spaceHeldRef.current
    ) {
      if (d.additive) {
        toggleSelectedId(d.id);
        return;
      }

      const now = performance.now();
      const isDbl =
        Boolean(lastTap.current) &&
        lastTap.current!.id === d.id &&
        now - lastTap.current!.t < DBL_MS;

      if (isDbl && isBoardEditor) {
        if (pendingZoom.current) {
          clearTimeout(pendingZoom.current);
          pendingZoom.current = null;
        }
        lastTap.current = null;
        setEditingId(d.id);
        return;
      }
      lastTap.current = { id: d.id, t: now };

      const openZoom = () => {
        if (!d.zoomSrc) return;
        setLightbox({
          src: d.zoomSrc,
          caption: d.zoomCaption,
          href: d.zoomHref,
        });
      };

      // DEV: zoom yes (delayed if it could be dbl→edit); idea/competitor via Open button
      if (isBoardEditor) {
        if (d.zoomSrc) {
          if (pendingZoom.current) clearTimeout(pendingZoom.current);
          pendingZoom.current = setTimeout(() => {
            pendingZoom.current = null;
            openZoom();
          }, DBL_MS);
          return;
        }
        if (d.sectionId && scene.type === "root") {
          openSection(d.sectionId);
        }
        return;
      }

      if (d.openIdeaId && scene.type === "section") {
        openIdea(scene.id, d.openIdeaId);
        return;
      }
      if (d.openCompetitorId && scene.type === "section") {
        openCompetitor(scene.id, d.openCompetitorId);
        return;
      }
      if (d.openSectionId && scene.type === "section") {
        openSection(d.openSectionId, scene.id);
        return;
      }
      if (d.zoomSrc) {
        openZoom();
        return;
      }
      if (d.sectionId && scene.type === "root") {
        openSection(d.sectionId);
      }
    }
  };

  const tryConnect = (targetId: string) => {
    if (!isBoardEditor) return;
    if (spaceHeldRef.current) return;
    if (!linkFrom) {
      setLinkFrom(targetId);
      return;
    }
    if (linkFrom === targetId) {
      setLinkFrom(null);
      return;
    }
    const exists = items.some(
      (i) =>
        i.kind === "connector" &&
        ((i.fromId === linkFrom && i.toId === targetId) ||
          (i.fromId === targetId && i.toId === linkFrom)),
    );
    if (!exists) {
      pushHistory(items);
      const connector: BoardConnector = {
        kind: "connector",
        id: nid(),
        fromId: linkFrom,
        toId: targetId,
        color,
      };
      setItems((curr) => [...curr, connector]);
    }
    setLinkFrom(null);
    setTool("select");
  };

  const startPan = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const c = camRef.current;
    panDrag.current = {
      ox: e.clientX,
      oy: e.clientY,
      cx: c.x,
      cy: c.y,
    };
    setPanning(true);
    setSelectedConnector(null);
    drag.current = null;
    drawing.current = null;
    marquee.current = null;
    setMarqueeBox(null);
    surfaceRef.current?.setPointerCapture(e.pointerId);
  };

  const onSurfacePointerDownCapture = (e: React.PointerEvent) => {
    if (!spaceHeldRef.current) return;
    startPan(e);
  };

  const onSurfacePointerDown = (e: React.PointerEvent) => {
    if (!isBoardEditor) return;
    if (spaceHeldRef.current) return;

    const t = e.target as HTMLElement;
    if (t !== surfaceRef.current && !t.classList.contains("wb-surface") && t.tagName !== "svg" && !t.closest(".wb-camera")) {
      return;
    }
    if ((e.target as HTMLElement).closest(".wb-item")) return;

    const p = localPoint(e);
    setSelectedConnector(null);

    if (tool === "arrow") {
      setLinkFrom(null);
      return;
    }

    if (tool === "pencil") {
      pushHistory(items);
      const strokeId = nid();
      drawing.current = strokeId;
      setItems((curr) => [
        ...curr,
        { kind: "stroke", id: strokeId, points: [p], color },
      ]);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    if (tool === "sticky") {
      pushHistory(items);
      const sticky: BoardSticky = {
        kind: "sticky",
        id: nid(),
        x: p.x - 70,
        y: p.y - 40,
        text: "Note…",
        color,
      };
      setItems((curr) => [...curr, sticky]);
      setEditingId(sticky.id);
      setTool("select");
      return;
    }

    if (tool === "select") {
      marquee.current = {
        ox: p.x,
        oy: p.y,
        x0: p.x,
        y0: p.y,
        x1: p.x,
        y1: p.y,
        additive: isAdditiveClick(e),
      };
      setMarqueeBox({ x: p.x, y: p.y, w: 0, h: 0 });
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const updateStickyText = (itemId: string, text: string) => {
    if (!isBoardEditor) return;
    setItems((curr) =>
      curr.map((it) => (it.id === itemId && it.kind === "sticky" ? { ...it, text } : it)),
    );
  };

  const patchItem = (
    itemId: string,
    patch: Record<string, unknown>,
  ) => {
    if (!isBoardEditor) return;
    setItems((curr) =>
      curr.map((it) => (it.id === itemId ? ({ ...it, ...patch } as BoardItem) : it)),
    );
  };

  const canDeleteKind = (kind: BoardItem["kind"]) =>
    kind === "sticky" ||
    kind === "contentCard" ||
    kind === "text" ||
    kind === "image" ||
    kind === "sticker" ||
    kind === "stroke" ||
    kind === "connector";

  const deleteItem = (itemId: string) => {
    if (!isBoardEditor) return;
    const target = itemsRef.current.find((i) => i.id === itemId);
    if (target?.kind === "node") return;
    setItems((curr) => {
      pushHistory(curr);
      return curr.filter(
        (it) =>
          it.id !== itemId &&
          !(it.kind === "connector" && (it.fromId === itemId || it.toId === itemId)),
      );
    });
    if (
      target &&
      (target.kind === "contentCard" ||
        target.kind === "text" ||
        target.kind === "image" ||
        target.kind === "sticker")
    ) {
      setRemovedIdsForScene(
        currentSceneKey,
        removedIdsRef.current.includes(itemId)
          ? removedIdsRef.current
          : [...removedIdsRef.current, itemId],
      );
    }
    if (linkFrom === itemId) setLinkFrom(null);
    if (selectedConnector === itemId) setSelectedConnector(null);
    if (editingId === itemId) setEditingId(null);
    setSelectedIds((prev) => prev.filter((id) => id !== itemId));
  };

  const deleteSelected = () => {
    if (!isBoardEditor) return;
    const currItems = itemsRef.current;
    const ids = selectedIdsRef.current.filter((id) => {
      const it = currItems.find((x) => x.id === id);
      return it && canDeleteKind(it.kind);
    });
    if (!ids.length) return;
    setItems((curr) => {
      pushHistory(curr);
      const drop = new Set(ids);
      return curr.filter(
        (it) =>
          !drop.has(it.id) &&
          !(it.kind === "connector" && (drop.has(it.fromId) || drop.has(it.toId))),
      );
    });
    setRemovedIdsForScene(currentSceneKey, (() => {
      const next = new Set(removedIdsRef.current);
      for (const id of ids) {
        const it = currItems.find((x) => x.id === id);
        if (
          it &&
          (it.kind === "contentCard" ||
            it.kind === "text" ||
            it.kind === "image" ||
            it.kind === "sticker")
        ) {
          next.add(id);
        }
      }
      return Array.from(next);
    })());
    setEditingId(null);
    setSelectedIds([]);
    setSelectedConnector(null);
  };

  const positioned = items.filter(isPositioned);
  const byId = Object.fromEntries(positioned.map((i) => [i.id, i]));

  const sceneBounds = (() => {
    if (!positioned.length) return null;
    let maxX = 0;
    let maxY = 0;
    for (const it of positioned) {
      const s = itemSize(it);
      maxX = Math.max(maxX, it.x + s.w);
      maxY = Math.max(maxY, it.y + s.h);
    }
    const { width, height } = surfaceSize();
    return {
      width: Math.max(maxX + 48, width),
      height: Math.max(maxY + 80, height),
    };
  })();

  const stack = stackCenter(
    inDive && sceneBounds
      ? sceneBounds
      : (() => {
          const { width, height } = surfaceSize();
          return { width, height };
        })(),
  );

  const sceneKey =
    scene.type === "root"
      ? "root"
      : scene.type === "section"
        ? `section-${scene.id}`
        : scene.type === "idea"
          ? `idea-${scene.ideaId}`
          : `competitor-${scene.competitorId}`;

  // Stagger also on return to root (expansion from the stack)
  const staggerEnabled = !reduce && (inDive || navDir === "out");
  const [staggerLive, setStaggerLive] = useState(false);
  useEffect(() => {
    if (!staggerEnabled) {
      setStaggerLive(false);
      return;
    }
    setStaggerLive(true);
    const t = window.setTimeout(() => setStaggerLive(false), 1800);
    return () => window.clearTimeout(t);
  }, [sceneKey, staggerEnabled]);

  const staggerIndex = useMemo(() => {
    const map = new Map<string, number>();
    if (!staggerLive && !collapsing) return map;
    const ordered = items
      .filter(isPositioned)
      .slice()
      .sort((a, b) => a.y - b.y || a.x - b.x);
    ordered.forEach((it, i) => map.set(it.id, i));
    return map;
  }, [items, staggerLive, collapsing, sceneKey]);

  const zoom = sceneMotion(navDir, reduce);

  const backLabel =
    scene.type === "idea"
      ? "← Idea list"
      : scene.type === "competitor"
        ? "← Competitor list"
        : scene.type === "section"
          ? scene.fromSectionId
            ? (() => {
                const parent = sections.find((s) => s.id === scene.fromSectionId);
                const label =
                  parent?.eyebrow.replace(/^\d+\s*·\s*/, "").trim() ||
                  parent?.title ||
                  "Back";
                return `← ${label}`;
              })()
            : "← Board"
          : null;

  const sectionForChrome =
    scene.type === "section"
      ? sections.find((s) => s.id === scene.id)
      : scene.type === "idea" || scene.type === "competitor"
        ? sections.find((s) => s.id === scene.sectionId)
        : null;

  return (
    <div
      className={`wb wb-full ${tool === "arrow" ? "wb-linking" : ""}${inDive ? " wb-in-dive" : ""}${spaceHeld ? " wb-space-pan" : ""}${panning ? " wb-panning" : ""}${collapsing ? " wb-collapsing" : ""}`}
    >
      {inDive && backLabel && (
        <div className="wb-deep-chrome">
          <button type="button" className="wb-deep-back" onClick={goBack}>
            {backLabel}
          </button>
          {sectionForChrome && (
            <span className="wb-deep-crumb">
              {scene.type === "idea"
                ? sectionForChrome.ideas?.find((i) => i.id === scene.ideaId)?.title
                : scene.type === "competitor"
                  ? sectionForChrome.competitorNotes?.find((n) => n.id === scene.competitorId)
                      ?.title
                  : sectionForChrome.title}
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        className={`wb-zoom-badge${cam.scale !== 1 || cam.x !== 0 || cam.y !== 0 ? " is-active" : ""}`}
        onClick={resetCam}
        title="Click to reset zoom"
      >
        {Math.round(cam.scale * 100)}%
      </button>

      <div
        ref={surfaceRef}
        className={`wb-surface tool-${tool}${isBoardEditor ? " wb-editor" : ""}`}
        onPointerDownCapture={onSurfacePointerDownCapture}
        onPointerDown={onSurfacePointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="wb-camera"
          style={{
            transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.scale})`,
            transformOrigin: "0 0",
          }}
        >
        <AnimatePresence mode="wait">
          <motion.div
            key={sceneKey}
            className="wb-scene"
            initial={sceneReady ? zoom.initial : false}
            animate={zoom.animate}
            exit={zoom.exit}
            transition={zoom.transition}
            style={
              inDive && sceneBounds
                ? {
                    position: "relative",
                    width: sceneBounds.width,
                    height: sceneBounds.height,
                    minHeight: "100%",
                    transformOrigin: "50% 40%",
                  }
                : {
                    position: "absolute",
                    inset: 0,
                    transformOrigin: "50% 40%",
                  }
            }
          >
            <svg className="wb-strokes" aria-hidden>
              <defs>
                {Array.from(
                  new Set([
                    "#0d9488",
                    ...items
                      .filter((i): i is BoardConnector => i.kind === "connector")
                      .map((c) => c.color),
                  ]),
                ).map((c) => (
                  <marker
                    key={c}
                    id={`wb-arrowhead-${c.replace("#", "")}-${sceneKey}`}
                    viewBox="0 0 10 10"
                    markerWidth="5"
                    markerHeight="5"
                    refX="8"
                    refY="5"
                    orient="auto"
                    markerUnits="userSpaceOnUse"
                  >
                    <path d="M1.5,1.5 L9,5 L1.5,8.5 Z" fill={c} />
                  </marker>
                ))}
              </defs>

              {items
                .filter((i): i is Extract<BoardItem, { kind: "stroke" }> => i.kind === "stroke")
                .map((s) => (
                  <polyline
                    key={s.id}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={s.points.map((pt) => `${pt.x},${pt.y}`).join(" ")}
                  />
                ))}

              {items
                .filter((i): i is BoardConnector => i.kind === "connector")
                .map((c) => {
                  const from = byId[c.fromId];
                  const to = byId[c.toId];
                  if (!from || !to) return null;
                  // No arrows to nodes without a section (e.g. a removed card but ghost item)
                  if (
                    (from.kind === "node" &&
                      !sections.some((s) => s.id === from.sectionId)) ||
                    (to.kind === "node" && !sections.some((s) => s.id === to.sectionId))
                  ) {
                    return null;
                  }
                  const { x1, y1, x2, y2 } = connectionPoints(from, to, 16);
                  const mx = (x1 + x2) / 2;
                  const my = (y1 + y2) / 2;
                  const dx = x2 - x1;
                  const dy = y2 - y1;
                  const len = Math.hypot(dx, dy) || 1;
                  const curve = Math.min(28, len * 0.12);
                  const cx = mx - (dy / len) * curve * 0.15;
                  const cy = my + (dx / len) * curve * 0.15;
                  const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
                  const markerId = `wb-arrowhead-${c.color.replace("#", "")}-${sceneKey}`;
                  const selected = selectedConnector === c.id;
                  const fromDelay = staggerIndex.get(c.fromId) ?? 0;
                  const toDelay = staggerIndex.get(c.toId) ?? 0;
                  const connectorDelay = Math.max(fromDelay, toDelay);
                  return (
                    <AnimatedConnector
                      key={c.id}
                      d={d}
                      color={c.color}
                      strokeWidth={selected ? 3.25 : 2.25}
                      markerId={markerId}
                      delay={connectorDelay}
                      enabled={staggerEnabled}
                      sceneToken={sceneKey}
                      navDir={navDir}
                      collapsing={collapsing}
                      selected={selected}
                      midX={mx}
                      midY={my}
                      onSelect={() => {
                        if (!isBoardEditor) return;
                        if (tool !== "select") return;
                        setSelectedIds([]);
                        setSelectedConnector(c.id);
                      }}
                      onDelete={
                        isBoardEditor
                          ? () => {
                              deleteItem(c.id);
                            }
                          : undefined
                      }
                    />
                  );
                })}
            </svg>

            {tool === "arrow" && (
              <div className="wb-link-hint">
                {linkFrom
                  ? "Now click the target element"
                  : "Click the first element, then the second to link them"}
              </div>
            )}

            {selectedConnector && tool === "select" && isBoardEditor && (
              <div className="wb-connector-del-hint" aria-live="polite">
                Arrow selected — × or Backspace / Delete
              </div>
            )}

            <div className="wb-items-layer">
            {items.map((item) => {
              if (item.kind === "stroke" || item.kind === "connector") return null;
              const delay = staggerIndex.get(item.id) ?? 0;
              const size = itemSize(item);
              const collapse = collapseToward(item, size, stack);

              if (item.kind === "text") {
                return (
                  <div
                    key={item.id}
                    className={`wb-item wb-text wb-text-${item.role}${linkFrom === item.id ? " wb-link-from" : ""}${selectedIds.includes(item.id) ? " wb-selected" : ""}`}
                    style={{
                      transform: `translate(${item.x}px, ${item.y}px)`,
                      zIndex: frontId === item.id ? 40 : undefined,
                    }}
                    onPointerDown={(e) => {
                      if (tool === "arrow") {
                        e.stopPropagation();
                        tryConnect(item.id);
                        return;
                      }
                      startDrag(e, item.id);
                    }}
                    onDoubleClick={(e) => {
                      if (!isBoardEditor) return;
                      e.stopPropagation();
                      setEditingId(item.id);
                    }}
                  >
                    <EnterWrap
                      enabled={staggerLive}
                      delay={delay}
                      sceneToken={sceneKey}
                      navDir={navDir}
                      collapsing={collapsing}
                      collapse={collapse}
                    >
                      <BoardTextView
                        item={item}
                        editing={isBoardEditor && editingId === item.id}
                        onChangeHtml={(html) => patchItem(item.id, { html })}
                      />
                      {isBoardEditor && (
                        <button
                          type="button"
                          className="wb-item-del"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteItem(item.id);
                          }}
                          aria-label="Delete"
                        >
                          ×
                        </button>
                      )}
                    </EnterWrap>
                  </div>
                );
              }

              if (item.kind === "node") {
                const section = sections.find((s) => s.id === item.sectionId);
                if (!section) return null;
                const idx = nodeDefs.findIndex((n) => n.sectionId === item.sectionId);
                if (idx < 0) return null;
                const size = itemSize(item);
                return (
                  <div
                    key={item.id}
                    data-wb-node={item.sectionId}
                    className={`wb-item wb-node-wrap${linkFrom === item.id ? " wb-link-from" : ""}${selectedIds.includes(item.id) ? " wb-selected" : ""}`}
                    style={{
                      transform: `translate(${item.x}px, ${item.y}px)`,
                      zIndex: frontId === item.id ? 40 : undefined,
                    }}
                    onPointerDown={(e) => {
                      if (tool === "arrow") {
                        e.stopPropagation();
                        tryConnect(item.id);
                        return;
                      }
                      startDrag(e, item.id, { sectionId: item.sectionId });
                    }}
                  >
                    {/* Chrome card (.node) INSIDE EnterWrap → animates the whole element, not just the text */}
                    <EnterWrap
                      enabled={staggerLive}
                      delay={delay}
                      sceneToken={sceneKey}
                      navDir={navDir}
                      collapsing={collapsing}
                      collapse={collapse}
                    >
                      <div
                        className={`node ${size.w >= 220 ? "node-lg" : ""}`}
                        style={{
                          width: size.w,
                          minHeight: size.h,
                          transform: `rotate(${item.rotate}deg)`,
                        }}
                      >
                        <span className="node-num">{idx + 1}</span>
                        <div className="node-art">
                          {section.image || section.images?.[0]?.src ? (
                            <img
                              className="node-art-img"
                              src={section.image ?? section.images![0].src}
                              alt=""
                              draggable={false}
                            />
                          ) : (
                            <NodeArt id={section.id} />
                          )}
                        </div>
                        <strong className="node-title">{section.title}</strong>
                        <span className="node-blurb">{shortBlurb(section.summary)}</span>
                        <button
                          type="button"
                          className="node-cta"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (tool === "arrow") {
                              tryConnect(item.id);
                              return;
                            }
                            openSection(item.sectionId);
                          }}
                        >
                          Open
                        </button>
                      </div>
                    </EnterWrap>
                  </div>
                );
              }

              if (item.kind === "sticky") {
                return (
                  <div
                    key={item.id}
                    className={`wb-item wb-sticky-wrap${linkFrom === item.id ? " wb-link-from" : ""}${selectedIds.includes(item.id) ? " wb-selected" : ""}`}
                    style={{
                      transform: `translate(${item.x}px, ${item.y}px)`,
                      zIndex: frontId === item.id ? 40 : undefined,
                    }}
                    onPointerDown={(e) => {
                      if (tool === "arrow") {
                        e.stopPropagation();
                        tryConnect(item.id);
                        return;
                      }
                      startDrag(e, item.id);
                    }}
                    onDoubleClick={() => {
                      if (isBoardEditor) setEditingId(item.id);
                    }}
                  >
                    <EnterWrap
                      enabled={staggerLive}
                      delay={delay}
                      sceneToken={sceneKey}
                      navDir={navDir}
                      collapsing={collapsing}
                      collapse={collapse}
                    >
                      <div
                        className="wb-sticky"
                        style={{
                          background: item.color,
                          color: stickyInk(item.color),
                        }}
                      >
                        {isBoardEditor && editingId === item.id ? (
                          <textarea
                            autoFocus
                            value={item.text}
                            onChange={(e) => updateStickyText(item.id, e.target.value)}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                e.stopPropagation();
                                setEditingId(null);
                              }
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <p>{item.text}</p>
                        )}
                        {isBoardEditor && (
                          <button
                            type="button"
                            className="wb-item-del"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteItem(item.id);
                            }}
                            aria-label="Delete"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </EnterWrap>
                  </div>
                );
              }

              if (item.kind === "contentCard") {
                return (
                  <div
                    key={item.id}
                    className={`wb-item wb-content-card${linkFrom === item.id ? " wb-link-from" : ""}${selectedIds.includes(item.id) ? " wb-selected" : ""}`}
                    style={{
                      transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotate ?? 0}deg)`,
                      zIndex: frontId === item.id ? 40 : undefined,
                    }}
                    onPointerDown={(e) => {
                      if (tool === "arrow") {
                        e.stopPropagation();
                        tryConnect(item.id);
                        return;
                      }
                      startDrag(e, item.id, {
                        openIdeaId: item.openIdeaId,
                        openCompetitorId: item.openCompetitorId,
                        openSectionId: item.openSectionId,
                        zoomSrc:
                          item.zoomSrc ??
                          (item.variant === "image" || item.variant === "solution"
                            ? item.image
                            : undefined),
                        zoomCaption: item.tag,
                        zoomHref: item.href,
                      });
                    }}
                    onDoubleClick={(e) => {
                      if (!isBoardEditor) return;
                      e.stopPropagation();
                      setEditingId(item.id);
                    }}
                  >
                    <EnterWrap
                      enabled={staggerLive}
                      delay={delay}
                      sceneToken={sceneKey}
                      navDir={navDir}
                      collapsing={collapsing}
                      collapse={collapse}
                    >
                      <ContentCardView
                        item={item}
                        editing={isBoardEditor && editingId === item.id}
                        onPatch={(patch) => patchItem(item.id, patch)}
                        onOpenIdea={
                          scene.type === "section"
                            ? (ideaId) => openIdea(scene.id, ideaId)
                            : undefined
                        }
                        onOpenCompetitor={
                          scene.type === "section"
                            ? (id) => openCompetitor(scene.id, id)
                            : undefined
                        }
                        onOpenSection={
                          scene.type === "section"
                            ? (id) => openSection(id, scene.id)
                            : undefined
                        }
                        onZoom={(src, caption, href) =>
                          setLightbox({ src, caption, href })
                        }
                      />
                      {isBoardEditor && (
                        <button
                          type="button"
                          className="wb-item-del"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteItem(item.id);
                          }}
                          aria-label="Delete"
                        >
                          ×
                        </button>
                      )}
                    </EnterWrap>
                  </div>
                );
              }

              if (item.kind === "image") {
                return (
                  <div
                    key={item.id}
                    className={`wb-item wb-image-wrap${linkFrom === item.id ? " wb-link-from" : ""}${selectedIds.includes(item.id) ? " wb-selected" : ""}`}
                    style={{
                      transform: `translate(${item.x}px, ${item.y}px)`,
                      zIndex: frontId === item.id ? 40 : undefined,
                    }}
                    onPointerDown={(e) => {
                      if (tool === "arrow") {
                        e.stopPropagation();
                        tryConnect(item.id);
                        return;
                      }
                      startDrag(e, item.id, {
                        zoomSrc: item.src,
                        zoomCaption: item.caption,
                        zoomHref: item.href,
                      });
                    }}
                  >
                    <EnterWrap
                      enabled={staggerLive}
                      delay={delay}
                      sceneToken={sceneKey}
                      navDir={navDir}
                      collapsing={collapsing}
                      collapse={collapse}
                    >
                      <BoardImageView
                        item={item}
                        onZoom={(src, caption, href) =>
                          setLightbox({ src, caption, href })
                        }
                      />
                    </EnterWrap>
                  </div>
                );
              }

              if (item.kind === "sticker") {
                return (
                  <div
                    key={item.id}
                    className={`wb-item wb-sticker-wrap${linkFrom === item.id ? " wb-link-from" : ""}${selectedIds.includes(item.id) ? " wb-selected" : ""}`}
                    style={{
                      transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotate ?? 0}deg)`,
                      zIndex: frontId === item.id ? 40 : undefined,
                    }}
                    onPointerDown={(e) => {
                      if (tool === "arrow") {
                        e.stopPropagation();
                        tryConnect(item.id);
                        return;
                      }
                      startDrag(e, item.id);
                    }}
                  >
                    <EnterWrap
                      enabled={staggerLive}
                      delay={delay}
                      sceneToken={sceneKey}
                      navDir={navDir}
                      collapsing={collapsing}
                      collapse={collapse}
                    >
                      <BoardStickerView
                        item={item}
                        showControls={
                          isBoardEditor && selectedIds.includes(item.id)
                        }
                        onResizePointerDown={(e) =>
                          startStickerResize(e, item.id)
                        }
                        onDelete={
                          isBoardEditor
                            ? () => deleteItem(item.id)
                            : undefined
                        }
                      />
                    </EnterWrap>
                  </div>
                );
              }

              return null;
            })}
            </div>
          </motion.div>
        </AnimatePresence>
          {marqueeBox && (marqueeBox.w > 0 || marqueeBox.h > 0) && (
            <div
              className="wb-marquee"
              style={{
                left: marqueeBox.x,
                top: marqueeBox.y,
                width: marqueeBox.w,
                height: marqueeBox.h,
              }}
            />
          )}
        </div>
      </div>

      {isBoardEditor && (
        <FreeformToolbar
          tool={tool}
          spacePan={spaceHeld}
          panning={panning}
          onTool={(t) => {
            setTool(t);
            setLinkFrom(null);
            setSelectedConnector(null);
            setSelectedIds([]);
          }}
          color={color}
          onColor={setColor}
          onUndo={onUndo}
          canUndo={history.length > 0}
          onClearDrawings={onClearDrawings}
          onSave={onSaveLayout}
          onReset={onResetLayout}
          saveBusy={saveBusy}
          saveLabel={saveLabel}
          canReset={hasSavedItems(currentSceneKey) || history.length > 0}
        />
      )}

      <ImageLightbox
        src={lightbox?.src ?? null}
        caption={lightbox?.caption}
        href={lightbox?.href}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
