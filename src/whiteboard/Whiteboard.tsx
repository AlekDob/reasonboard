import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DeckMeta, ModalSection } from "../contentTypes";
import { NodeArt } from "../NodeArt";
import {
  BoardImageView,
  BoardTextView,
  ContentCardView,
  shortBlurb,
} from "./BoardItems";
import { fitCameraToItems } from "./cameraFit";
import { layoutCompetitorDetail, layoutDeepDive, layoutIdeaDetail } from "./deepDiveLayout";
import { FreeformToolbar } from "./FreeformToolbar";
import { ImageLightbox } from "./ImageLightbox";
import { layoutSlideBoard } from "./layout";
import { EnterWrap, COLLAPSE_MS, collapseToward, sceneMotion, stackCenter, type NavDir } from "./sceneMotion";
import {
  STICKY_COLORS,
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
};

type Scene =
  | { type: "root" }
  | { type: "section"; id: string }
  | { type: "idea"; sectionId: string; ideaId: string }
  | { type: "competitor"; sectionId: string; competitorId: string };

let uid = 0;
const nid = () => `b-${Date.now()}-${uid++}`;

export function Whiteboard({ sections, meta }: Props) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const laidOut = useRef(false);
  const reduce = useReducedMotion();
  const nodeDefs = sections.map((s) => ({ id: `node-${s.id}`, sectionId: s.id }));

  const [rootItems, setRootItems] = useState<BoardItem[]>(() =>
    layoutSlideBoard(
      meta,
      nodeDefs,
      typeof window !== "undefined" ? window.innerWidth : 1440,
      typeof window !== "undefined" ? window.innerHeight : 900,
    ),
  );
  const [diveItems, setDiveItems] = useState<BoardItem[]>([]);
  const [scene, setScene] = useState<Scene>({ type: "root" });
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
  const [editingSticky, setEditingSticky] = useState<string | null>(null);
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);
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

  const drag = useRef<{
    id: string;
    sectionId?: string;
    openIdeaId?: string;
    openCompetitorId?: string;
    zoomSrc?: string;
    zoomCaption?: string;
    zoomHref?: string;
    ox: number;
    oy: number;
    sx: number;
    sy: number;
    dragging: boolean;
  } | null>(null);
  const drawing = useRef<string | null>(null);
  const moved = useRef(false);
  const DRAG_THRESHOLD = 6;

  const inDive = scene.type !== "root";
  const items = inDive ? diveItems : rootItems;
  const setItems = inDive ? setDiveItems : setRootItems;
  const history = inDive ? diveHistory : rootHistory;
  const setHistory = inDive ? setDiveHistory : setRootHistory;

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

  const openSection = useCallback(
    (sectionId: string) => {
      if (collapsing) return;
      const section = sections.find((s) => s.id === sectionId);
      if (!section) return;
      const { width, height } = surfaceSize();
      setDiveItems(layoutDeepDive(section, width, height));
      setDiveHistory([]);
      setEditingSticky(null);
      setLinkFrom(null);
      setSelectedConnector(null);
      setTool("select");
      setNavDir("in");
      setSceneReady(true);
      setScene({ type: "section", id: sectionId });
    },
    [sections, collapsing],
  );

  const openIdea = useCallback(
    (sectionId: string, ideaId: string) => {
      if (collapsing) return;
      const section = sections.find((s) => s.id === sectionId);
      const idea = section?.ideas?.find((i) => i.id === ideaId);
      if (!section || !idea) return;
      const index = section.ideas?.findIndex((i) => i.id === ideaId) ?? 0;
      const { width, height } = surfaceSize();
      setDiveItems(layoutIdeaDetail(idea, index, width, height));
      setDiveHistory([]);
      setEditingSticky(null);
      setLinkFrom(null);
      setSelectedConnector(null);
      setTool("select");
      setNavDir("in");
      setSceneReady(true);
      setScene({ type: "idea", sectionId, ideaId });
    },
    [sections, collapsing],
  );

  const openCompetitor = useCallback(
    (sectionId: string, competitorId: string) => {
      if (collapsing) return;
      const section = sections.find((s) => s.id === sectionId);
      const note = section?.competitorNotes?.find((n) => n.id === competitorId);
      if (!section || !note) return;
      const index = section.competitorNotes?.findIndex((n) => n.id === competitorId) ?? 0;
      const { width, height } = surfaceSize();
      setDiveItems(layoutCompetitorDetail(note, index, width, height));
      setDiveHistory([]);
      setEditingSticky(null);
      setLinkFrom(null);
      setSelectedConnector(null);
      setTool("select");
      setNavDir("in");
      setSceneReady(true);
      setScene({ type: "competitor", sectionId, competitorId });
    },
    [sections, collapsing],
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
      const { width, height } = surfaceSize();
      setDiveItems(layoutDeepDive(section, width, height));
      setDiveHistory([]);
      setNavDir("out");
      setSceneReady(true);
      setScene({ type: "section", id: scene.sectionId });
      return;
    }
    if (scene.type === "section") {
      setNavDir("out");
      setSceneReady(true);
      setScene({ type: "root" });
      setDiveItems([]);
      setDiveHistory([]);
    }
  }, [scene, sections, meta]);

  const goBack = useCallback(() => {
    if (scene.type === "root" || collapsing) return;
    // Prima collassa gli elementi al centro, poi sali di livello
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
    if (!el || laidOut.current) return;

    const apply = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width < 40 || height < 40) return;
      laidOut.current = true;
      setRootItems(layoutSlideBoard(meta, nodeDefs, width, height));
    };

    apply();
    const ro = new ResizeObserver(() => {
      if (!laidOut.current) apply();
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta]);

  useEffect(() => {
    document.body.classList.toggle("wb-deep-open", inDive);
    return () => document.body.classList.remove("wb-deep-open");
  }, [inDive]);

  useEffect(() => {
    if (!inDive && !lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if ((e.target as HTMLElement)?.closest?.("textarea,input")) return;
      e.preventDefault();
      e.stopPropagation();
      if (lightbox) {
        setLightbox(null);
        return;
      }
      if (inDive) goBack();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [inDive, goBack, lightbox]);

  // Fit camera a ogni cambio scena (deep-dive: tutto in vista, spesso <100%)
  useEffect(() => {
    setFrontId(null);
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
    scene.type === "root"
      ? "root"
      : scene.type === "section"
        ? `section-${scene.id}`
        : scene.type === "idea"
          ? `idea-${scene.ideaId}`
          : `competitor-${scene.competitorId}`,
  ]);

  // Trackpad: pinch (ctrl+wheel) = zoom; due dita = pan
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

  // Hold Spazio = modalità pan (come Figma)
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
    setItems((curr) => {
      pushHistory(curr);
      return curr.filter((i) => i.kind !== "stroke");
    });
  };

  const bringFront = (itemId: string) => {
    // Solo z-index: non riordinare l’array (rompe EnterWrap / opacity)
    setFrontId(itemId);
  };

  const startDrag = (
    e: React.PointerEvent,
    itemId: string,
    opts?: {
      sectionId?: string;
      openIdeaId?: string;
      openCompetitorId?: string;
      zoomSrc?: string;
      zoomCaption?: string;
      zoomHref?: string;
    },
  ) => {
    if (spaceHeldRef.current) return;
    if (tool !== "select") return;
    if (
      (e.target as HTMLElement).closest(
        "textarea,input,button.wb-item-del,button.node-cta,button.wb-cc-open-btn,button.wb-cc-photo-btn,a.wb-source-link",
      )
    ) {
      return;
    }
    e.stopPropagation();
    const item = items.find((x) => x.id === itemId);
    if (!item || !isPositioned(item)) return;
    moved.current = false;
    setSelectedConnector(null);
    drag.current = {
      id: itemId,
      sectionId: opts?.sectionId,
      openIdeaId: opts?.openIdeaId,
      openCompetitorId: opts?.openCompetitorId,
      zoomSrc: opts?.zoomSrc,
      zoomCaption: opts?.zoomCaption,
      zoomHref: opts?.zoomHref,
      ox: e.clientX,
      oy: e.clientY,
      sx: item.x,
      sy: item.y,
      dragging: false,
    };
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
      d.dragging = true;
      moved.current = true;
      pushHistory(items);
      bringFront(d.id);
    }

    setItems((curr) =>
      curr.map((it) => {
        if (it.id !== d.id || !isPositioned(it)) return it;
        const s = camRef.current.scale;
        return { ...it, x: d.sx + dx / s, y: d.sy + dy / s };
      }),
    );
  };

  const onPointerUp = () => {
    if (panDrag.current) {
      panDrag.current = null;
      setPanning(false);
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
      if (d.openIdeaId && scene.type === "section") {
        openIdea(scene.id, d.openIdeaId);
        return;
      }
      if (d.openCompetitorId && scene.type === "section") {
        openCompetitor(scene.id, d.openCompetitorId);
        return;
      }
      if (d.zoomSrc) {
        setLightbox({ src: d.zoomSrc, caption: d.zoomCaption, href: d.zoomHref });
        return;
      }
      if (d.sectionId && scene.type === "root") {
        openSection(d.sectionId);
      }
    }
  };

  const tryConnect = (targetId: string) => {
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
    surfaceRef.current?.setPointerCapture(e.pointerId);
  };

  const onSurfacePointerDownCapture = (e: React.PointerEvent) => {
    if (!spaceHeldRef.current) return;
    startPan(e);
  };

  const onSurfacePointerDown = (e: React.PointerEvent) => {
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
        text: "Nota…",
        color: STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
      };
      setItems((curr) => [...curr, sticky]);
      setEditingSticky(sticky.id);
      setTool("select");
    }
  };

  const updateStickyText = (itemId: string, text: string) => {
    setItems((curr) =>
      curr.map((it) => (it.id === itemId && it.kind === "sticky" ? { ...it, text } : it)),
    );
  };

  const deleteItem = (itemId: string) => {
    setItems((curr) => {
      pushHistory(curr);
      return curr.filter(
        (it) =>
          it.id !== itemId &&
          !(it.kind === "connector" && (it.fromId === itemId || it.toId === itemId)),
      );
    });
    if (linkFrom === itemId) setLinkFrom(null);
    if (selectedConnector === itemId) setSelectedConnector(null);
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

  // Stagger anche al ritorno su root (espansione dallo stack)
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
          ? "← Board"
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
        className={`wb-surface tool-${tool}`}
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
                  return (
                    <g key={c.id} className={`wb-connector ${selected ? "selected" : ""}`}>
                      <path
                        d={d}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="16"
                        style={{ cursor: "pointer", pointerEvents: "stroke" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (tool === "select") setSelectedConnector(c.id);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          deleteItem(c.id);
                        }}
                      />
                      <path
                        d={d}
                        fill="none"
                        stroke={c.color}
                        strokeWidth={selected ? 2.75 : 2.25}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        markerEnd={`url(#${markerId})`}
                        style={{ pointerEvents: "none" }}
                        opacity={0.92}
                      />
                    </g>
                  );
                })}
            </svg>

            {tool === "arrow" && (
              <div className="wb-link-hint">
                {linkFrom
                  ? "Ora clicca l’elemento di destinazione"
                  : "Click the first element, then the second to link them"}
              </div>
            )}

            {selectedConnector && tool === "select" && (
              <button
                type="button"
                className="wb-connector-del"
                onClick={() => deleteItem(selectedConnector)}
              >
                Elimina freccia
              </button>
            )}

            {items.map((item) => {
              if (item.kind === "stroke" || item.kind === "connector") return null;
              const delay = staggerIndex.get(item.id) ?? 0;
              const size = itemSize(item);
              const collapse = collapseToward(item, size, stack);

              if (item.kind === "text") {
                return (
                  <div
                    key={item.id}
                    className={`wb-item wb-text wb-text-${item.role} ${linkFrom === item.id ? "wb-link-from" : ""}`}
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
                  >
                    <EnterWrap
                      enabled={staggerLive}
                      delay={delay}
                      sceneToken={sceneKey}
                      navDir={navDir}
                      collapsing={collapsing}
                      collapse={collapse}
                    >
                      <BoardTextView item={item} />
                    </EnterWrap>
                  </div>
                );
              }

              if (item.kind === "node") {
                const section = sections.find((s) => s.id === item.sectionId);
                if (!section) return null;
                const idx = sections.findIndex((s) => s.id === item.sectionId);
                const size = itemSize(item);
                return (
                  <div
                    key={item.id}
                    className={`wb-item wb-node-wrap ${linkFrom === item.id ? "wb-link-from" : ""}`}
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
                    {/* Chrome card (.node) DENTRO EnterWrap → anima l’elemento intero, non solo i testi */}
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
                    className={`wb-item wb-sticky-wrap ${linkFrom === item.id ? "wb-link-from" : ""}`}
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
                    onDoubleClick={() => setEditingSticky(item.id)}
                  >
                    <EnterWrap
                      enabled={staggerLive}
                      delay={delay}
                      sceneToken={sceneKey}
                      navDir={navDir}
                      collapsing={collapsing}
                      collapse={collapse}
                    >
                      <div className="wb-sticky" style={{ background: item.color }}>
                        {editingSticky === item.id ? (
                          <textarea
                            autoFocus
                            value={item.text}
                            onChange={(e) => updateStickyText(item.id, e.target.value)}
                            onBlur={() => setEditingSticky(null)}
                            onPointerDown={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <p>{item.text}</p>
                        )}
                        <button
                          type="button"
                          className="wb-item-del"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteItem(item.id);
                          }}
                          aria-label="Elimina"
                        >
                          ×
                        </button>
                      </div>
                    </EnterWrap>
                  </div>
                );
              }

              if (item.kind === "contentCard") {
                return (
                  <div
                    key={item.id}
                    className={`wb-item wb-content-card ${linkFrom === item.id ? "wb-link-from" : ""}`}
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
                        zoomSrc:
                          item.variant === "image"
                            ? item.zoomSrc ?? item.image
                            : undefined,
                        zoomCaption: item.tag,
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
                      <ContentCardView
                        item={item}
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
                        onZoom={(src, caption, href) =>
                          setLightbox({ src, caption, href })
                        }
                      />
                    </EnterWrap>
                  </div>
                );
              }

              if (item.kind === "image") {
                return (
                  <div
                    key={item.id}
                    className={`wb-item wb-image-wrap ${linkFrom === item.id ? "wb-link-from" : ""}`}
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

              return null;
            })}
          </motion.div>
        </AnimatePresence>
        </div>
      </div>

      <FreeformToolbar
        tool={tool}
        spacePan={spaceHeld}
        panning={panning}
        onTool={(t) => {
          setTool(t);
          setLinkFrom(null);
          setSelectedConnector(null);
        }}
        color={color}
        onColor={setColor}
        onUndo={onUndo}
        canUndo={history.length > 0}
        onClearDrawings={onClearDrawings}
      />

      <ImageLightbox
        src={lightbox?.src ?? null}
        caption={lightbox?.caption}
        href={lightbox?.href}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
