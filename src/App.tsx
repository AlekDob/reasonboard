import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { deck } from "./content";
import { DeckSlideView } from "./DeckSlideView";
import { useDiveNav } from "./diveNav";
import { NUDGE_NEXT_EVENT } from "./nudge";
import { useIsMobile } from "./useIsMobile";
import "./index.css";

const slides = deck.slides;

const easeOut = [0.22, 1, 0.36, 1] as const;
const easeIn = [0.4, 0, 1, 1] as const;
const nudgeEase = [0.45, 0, 0.55, 1] as const;

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.35, ease: easeOut },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -28 : 28,
    opacity: 0,
    transition: { duration: 0.22, ease: easeIn },
  }),
};

export default function App() {
  const [[page, direction], setPage] = useState([0, 0]);
  const [nudgeNext, setNudgeNext] = useState(false);
  const mobile = useIsMobile();
  const reduce = useReducedMotion();
  const diveNav = useDiveNav();

  const paginate = useCallback((dir: number) => {
    setNudgeNext(false);
    setPage(([p]) => {
      const next = p + dir;
      if (next < 0 || next >= slides.length) return [p, 0];
      return [next, dir];
    });
  }, []);

  // Optional: a whiteboard node can dispatch NUDGE_NEXT_EVENT (e.g. on close) to
  // gently point the viewer toward the next slide. Generic — not tied to any
  // specific section id or slide index.
  useEffect(() => {
    const onNudge = () => setNudgeNext(true);
    window.addEventListener(NUDGE_NEXT_EVENT, onNudge);
    return () => window.removeEventListener(NUDGE_NEXT_EVENT, onNudge);
  }, []);

  useEffect(() => {
    if (!nudgeNext) return;
    const t = window.setTimeout(() => setNudgeNext(false), 5600);
    return () => window.clearTimeout(t);
  }, [nudgeNext]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("textarea,input")) return;

      // Inside a node: arrows / PageUp-Down = siblings (Esc stays on the whiteboard)
      if (diveNav) {
        if (e.key === "PageDown" || e.key === "ArrowRight") {
          e.preventDefault();
          diveNav.goNext();
        }
        if (e.key === "PageUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          diveNav.goPrev();
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          diveNav.goUp();
        }
        if (e.key === "f" || e.key === "F") {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.();
          } else {
            document.exitFullscreen?.();
          }
        }
        return;
      }

      if (e.key === "PageDown" || (mobile && e.key === "ArrowRight")) {
        e.preventDefault();
        paginate(1);
      }
      if (e.key === "PageUp" || (mobile && e.key === "ArrowLeft")) {
        e.preventDefault();
        paginate(-1);
      }
      if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paginate, mobile, diveNav]);

  const slide = slides[page];
  const showNudge = nudgeNext && !diveNav;

  return (
    <div className={`deck ${mobile ? "deck-mobile" : ""}`}>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={page}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          style={{ position: "absolute", inset: 0 }}
        >
          <DeckSlideView slide={slide} />
        </motion.div>
      </AnimatePresence>

      <div className="footer-bar footer-bar-fixed">
        <div className="hint">
          {diveNav
            ? "↑ level · ← → sibling nodes · Esc"
            : showNudge
              ? "next step →"
              : mobile
                ? "scroll · tap a card · arrows = slide"
                : "Space = pan · pinch zoom · Open · PageUp/Down · F"}
        </div>
        {diveNav ? (
          <div
            className="nav nav-dive"
            role="navigation"
            aria-label={`Node navigation, floor ${diveNav.floor}`}
          >
            <button
              type="button"
              className="nav-btn nav-btn-up"
              onClick={() => diveNav.goUp()}
              aria-label="Go up a level"
              title="Go up a level"
            >
              ↑
            </button>
            <button
              type="button"
              className="nav-btn"
              onClick={() => diveNav.goPrev()}
              disabled={diveNav.index <= 0}
              aria-label="Previous node"
            >
              ←
            </button>
            <span className="slide-counter dive-counter" aria-live="polite">
              <span className="dive-floor">Floor {diveNav.floor}</span>
              <span className="dive-pos">
                {diveNav.index + 1} / {diveNav.total}
              </span>
            </span>
            <button
              type="button"
              className="nav-btn"
              onClick={() => diveNav.goNext()}
              disabled={diveNav.index >= diveNav.total - 1}
              aria-label="Next node"
            >
              →
            </button>
          </div>
        ) : (
          <div className="nav">
            <button
              className="nav-btn"
              onClick={() => paginate(-1)}
              disabled={page === 0}
              aria-label="Previous slide"
            >
              ←
            </button>
            <span className="slide-counter" aria-live="polite">
              {page + 1} / {slides.length}
            </span>
            <motion.button
              type="button"
              data-nav="next-slide"
              className={`nav-btn${showNudge ? " nav-btn-nudge" : ""}`}
              onClick={() => paginate(1)}
              disabled={page === slides.length - 1}
              aria-label="Next slide"
              animate={
                showNudge && !reduce
                  ? { scale: [1, 1.1, 1, 1.1, 1], x: [0, 4, 0, 4, 0] }
                  : { scale: 1, x: 0 }
              }
              transition={
                showNudge && !reduce
                  ? { duration: 1.65, ease: nudgeEase, times: [0, 0.2, 0.4, 0.65, 1] }
                  : { duration: 0.2, ease: easeOut }
              }
            >
              →
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
