import { motion, useReducedMotion } from "framer-motion";
import { useRef, type ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;
const easeCollapse = [0.4, 0, 0.2, 1] as const;

export type NavDir = "in" | "out";

export type CollapseOffset = { dx: number; dy: number };

/**
 * Staggered entrance, played once per scene.
 * - navDir=out on entry: expands from the central stack
 * - collapsing=true: collapses toward the center (before going up a level)
 * - exit with navDir=out: safety collapse in case unmount happens anyway
 */
export function EnterWrap({
  delay = 0,
  enabled,
  sceneToken,
  navDir = "in",
  collapsing = false,
  collapse,
  children,
}: {
  delay?: number;
  enabled: boolean;
  sceneToken?: string;
  navDir?: NavDir;
  /** Active collapse on the current level (before the scene changes) */
  collapsing?: boolean;
  collapse?: CollapseOffset | null;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const played = useRef(false);
  const prevToken = useRef(sceneToken);

  if (prevToken.current !== sceneToken) {
    prevToken.current = sceneToken;
    played.current = false;
  }

  if (reduce) return <>{children}</>;

  const shouldEnter = enabled && !played.current && !collapsing;
  const dx = collapse?.dx ?? 0;
  const dy = collapse?.dy ?? 0;
  const fromStack = navDir === "out";
  const tilt = delay % 2 === 0 ? -7 : 7;

  const stacked = {
    opacity: 0,
    scale: 0.14,
    x: dx,
    y: dy,
    rotate: tilt,
  };

  const settled = { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 };

  return (
    <motion.div
      className="wb-enter"
      initial={
        shouldEnter
          ? fromStack
            ? stacked
            : { opacity: 0, scale: 0.88, y: 26, x: 0, rotate: 0 }
          : false
      }
      animate={collapsing ? stacked : settled}
      exit={
        fromStack || collapsing
          ? {
              ...stacked,
              transition: {
                duration: 0.32,
                ease: easeCollapse,
                delay: Math.min(delay, 14) * 0.02,
              },
            }
          : {
              opacity: 0,
              scale: 1.06,
              transition: { duration: 0.22, ease },
            }
      }
      transition={
        collapsing
          ? {
              duration: 0.36,
              ease: easeCollapse,
              delay: Math.min(delay, 14) * 0.022,
            }
          : shouldEnter
            ? fromStack
              ? { delay: 0.05 + delay * 0.042, duration: 0.5, ease }
              : { delay: 0.14 + delay * 0.058, duration: 0.44, ease }
            : { duration: 0 }
      }
      onAnimationComplete={() => {
        if (!collapsing) played.current = true;
      }}
    >
      {children}
    </motion.div>
  );
}

/** Scene zoom variants: in = zoom into node, out = after stack collapse → level above */
export function sceneMotion(dir: NavDir, reduce: boolean | null) {
  if (reduce) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 },
    };
  }
  if (dir === "in") {
    return {
      initial: { opacity: 0, scale: 0.72 },
      animate: { opacity: 1, scale: 1 },
      exit: {
        opacity: 0,
        scale: 1.1,
        transition: { duration: 0.28, ease },
      },
      transition: { duration: 0.48, ease },
    };
  }
  return {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
    exit: {
      opacity: 0,
      scale: 0.94,
      transition: { duration: 0.22, ease: easeCollapse },
    },
    transition: { duration: 0.4, ease },
  };
}

export function stackCenter(bounds: { width: number; height: number } | null): {
  x: number;
  y: number;
} {
  if (!bounds) return { x: 480, y: 280 };
  return { x: bounds.width * 0.5, y: bounds.height * 0.42 };
}

export function collapseToward(
  item: { x: number; y: number },
  size: { w: number; h: number },
  center: { x: number; y: number },
): CollapseOffset {
  return {
    dx: center.x - (item.x + size.w / 2),
    dy: center.y - (item.y + size.h / 2),
  };
}

/** Collapse duration (stagger max ~14 * 22ms + 360ms) */
export const COLLAPSE_MS = 520;

/**
 * SVG arrow with draw-in / fade-out aligned to the node stagger.
 * pathLength: the line "draws itself"; on collapse it retracts.
 * Wide hit area + × at the center when selected (DEV delete).
 */
export function AnimatedConnector({
  d,
  color,
  strokeWidth,
  markerId,
  delay = 0,
  enabled,
  sceneToken,
  navDir = "in",
  collapsing = false,
  selected = false,
  midX,
  midY,
  onSelect,
  onDelete,
}: {
  d: string;
  color: string;
  strokeWidth: number;
  markerId: string;
  delay?: number;
  enabled: boolean;
  sceneToken?: string;
  navDir?: NavDir;
  collapsing?: boolean;
  selected?: boolean;
  midX?: number;
  midY?: number;
  onSelect?: () => void;
  onDelete?: () => void;
}) {
  const reduce = useReducedMotion();
  const played = useRef(false);
  const prevToken = useRef(sceneToken);

  if (prevToken.current !== sceneToken) {
    prevToken.current = sceneToken;
    played.current = false;
  }

  const hit = (
    <path
      d={d}
      fill="none"
      stroke="transparent"
      strokeWidth="28"
      style={{ cursor: "pointer", pointerEvents: "stroke" }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDelete?.();
      }}
    />
  );

  const delBtn =
    selected && onDelete && midX != null && midY != null ? (
      <g
        className="wb-connector-x"
        transform={`translate(${midX}, ${midY})`}
        style={{ pointerEvents: "auto", cursor: "pointer" }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <circle r="14" fill="#111" stroke="#fff" strokeWidth="2" />
        <path
          d="M-5-5l10 10M5-5l-10 10"
          fill="none"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>
    ) : null;

  if (reduce) {
    return (
      <g className={`wb-connector ${selected ? "selected" : ""}`}>
        {hit}
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          markerEnd={`url(#${markerId})`}
          style={{ pointerEvents: "none" }}
          opacity={0.92}
        />
        {delBtn}
      </g>
    );
  }

  const shouldEnter = enabled && !played.current && !collapsing;
  const fromStack = navDir === "out";
  const capped = Math.min(delay, 14);

  const enterDelay = fromStack
    ? 0.12 + capped * 0.042
    : 0.28 + capped * 0.058;
  const enterDuration = fromStack ? 0.42 : 0.38;

  return (
    <motion.g
      className={`wb-connector ${selected ? "selected" : ""}`}
      initial={shouldEnter ? { opacity: 0 } : false}
      animate={collapsing ? { opacity: 0 } : { opacity: 1 }}
      transition={
        collapsing
          ? {
              duration: 0.2,
              ease: easeCollapse,
              delay: capped * 0.012,
            }
          : shouldEnter
            ? { delay: enterDelay, duration: 0.2, ease }
            : { duration: 0 }
      }
      onAnimationComplete={() => {
        if (!collapsing) played.current = true;
      }}
    >
      {hit}
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={`url(#${markerId})`}
        style={{ pointerEvents: "none" }}
        initial={shouldEnter ? { pathLength: 0, opacity: 0 } : false}
        animate={
          collapsing
            ? { pathLength: 0, opacity: 0 }
            : { pathLength: 1, opacity: 0.92 }
        }
        transition={
          collapsing
            ? {
                duration: 0.22,
                ease: easeCollapse,
                delay: capped * 0.012,
              }
            : shouldEnter
              ? {
                  pathLength: {
                    delay: enterDelay,
                    duration: enterDuration,
                    ease,
                  },
                  opacity: {
                    delay: enterDelay,
                    duration: 0.18,
                    ease,
                  },
                }
              : { duration: 0 }
        }
      />
      {delBtn}
    </motion.g>
  );
}
