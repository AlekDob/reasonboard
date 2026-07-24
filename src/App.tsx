import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { deck } from "./content";
import { DeckSlideView } from "./DeckSlideView";
import { useIsMobile } from "./useIsMobile";
import "./index.css";

const slides = deck.slides;

const easeOut = [0.22, 1, 0.36, 1] as const;
const easeIn = [0.4, 0, 1, 1] as const;

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
  const mobile = useIsMobile();

  const paginate = useCallback((dir: number) => {
    setPage(([p]) => {
      const next = p + dir;
      if (next < 0 || next >= slides.length) return [p, 0];
      return [next, dir];
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.body.classList.contains("wb-deep-open")) return;
      if ((e.target as HTMLElement)?.closest?.("textarea,input")) return;

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
  }, [paginate, mobile]);

  const slide = slides[page];

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
          {mobile
            ? "scroll · tap a card · arrows = slide"
            : "Space = pan · pinch zoom · Open · PageUp/Down · F"}
        </div>
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
          <button
            type="button"
            className="nav-btn"
            onClick={() => paginate(1)}
            disabled={page === slides.length - 1}
            aria-label="Next slide"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
