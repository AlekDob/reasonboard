import { motion, useReducedMotion } from "framer-motion";
import { useRef, type ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;
const easeCollapse = [0.4, 0, 0.2, 1] as const;

export type NavDir = "in" | "out";

export type CollapseOffset = { dx: number; dy: number };

/**
 * Ingresso staggered una sola volta per scena.
 * - navDir=out in ingresso: espande dallo stack centrale
 * - collapsing=true: collassa verso il centro (prima di salire di livello)
 * - exit con navDir=out: collasso di sicurezza se lo smontaggio arriva comunque
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
  /** Collasso attivo sul livello corrente (prima del cambio scena) */
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

/** Varianti zoom scena: in = zoom into nodo, out = dopo collasso stack → livello sopra */
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

/** Durata collasso (stagger max ~14 * 22ms + 360ms) */
export const COLLAPSE_MS = 520;
