import { useEffect, useState } from "react";

type Pt = { x: number; y: number };

const GREEN = "#15803d";
/** Gap between the tip and the left edge of the → button */
const GAP_BEFORE_BTN = 10;
const STROKE = 5;
const HEAD_LEN = 20;
const HEAD_W = 14;

const DEFAULT_SOURCE_SELECTOR = '[data-wb-node]';

/**
 * Desktop arrow hint: from a board node (source) to the → button of the
 * next slide. Rendered outside the whiteboard because the footer nav
 * button isn't a board item. Optional / generic — not wired by default;
 * pass `sourceSelector` to target a specific board node if you use it.
 */
export function SlideAdvanceHint({
  active,
  sourceSelector = DEFAULT_SOURCE_SELECTOR,
}: {
  active: boolean;
  /** CSS selector for the board node the arrow should originate from */
  sourceSelector?: string;
}) {
  const [from, setFrom] = useState<Pt | null>(null);
  const [btnLeft, setBtnLeft] = useState<Pt | null>(null);

  useEffect(() => {
    if (!active) {
      setFrom(null);
      setBtnLeft(null);
      return;
    }

    let raf = 0;
    let prev = "";

    const measure = () => {
      const node = document.querySelector<HTMLElement>(sourceSelector);
      const btn = document.querySelector<HTMLElement>('[data-nav="next-slide"]');
      if (!node || !btn) {
        if (prev) {
          prev = "";
          setFrom(null);
          setBtnLeft(null);
        }
        raf = requestAnimationFrame(measure);
        return;
      }

      const nr = node.getBoundingClientRect();
      const br = btn.getBoundingClientRect();
      const nextFrom = {
        x: nr.right - 8,
        // Starts from the lower-right side of the card (not the absolute bottom)
        y: nr.bottom - 56,
      };
      const nextBtn = {
        x: br.left,
        y: br.top + br.height / 2,
      };
      const key = `${nextFrom.x.toFixed(1)},${nextFrom.y.toFixed(1)}→${nextBtn.x.toFixed(1)},${nextBtn.y.toFixed(1)}`;
      if (key !== prev) {
        prev = key;
        setFrom(nextFrom);
        setBtnLeft(nextBtn);
      }
      raf = requestAnimationFrame(measure);
    };

    raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [active, sourceSelector]);

  if (!active || !from || !btnLeft) return null;

  // Tip: a bit higher, aimed at the → button (not the counter)
  const tip: Pt = {
    x: btnLeft.x - GAP_BEFORE_BTN,
    y: btnLeft.y - 18,
  };

  // Arc above the counter, nearly horizontal arrival toward →
  const cx = tip.x - 56;
  const cy = tip.y - 44;

  // Final curve direction (control → tip) to orient the arrowhead
  let tx = tip.x - cx;
  let ty = tip.y - cy;
  const tlen = Math.hypot(tx, ty) || 1;
  tx /= tlen;
  ty /= tlen;

  const shaftEnd: Pt = {
    x: tip.x - tx * (HEAD_LEN - 3),
    y: tip.y - ty * (HEAD_LEN - 3),
  };

  const d = `M ${from.x} ${from.y} Q ${cx} ${cy} ${shaftEnd.x} ${shaftEnd.y}`;

  const nx = -ty;
  const ny = tx;
  const baseL: Pt = {
    x: tip.x - tx * HEAD_LEN + nx * HEAD_W,
    y: tip.y - ty * HEAD_LEN + ny * HEAD_W,
  };
  const baseR: Pt = {
    x: tip.x - tx * HEAD_LEN - nx * HEAD_W,
    y: tip.y - ty * HEAD_LEN - ny * HEAD_W,
  };
  const headPoints = `${tip.x},${tip.y} ${baseL.x},${baseL.y} ${baseR.x},${baseR.y}`;

  return (
    <svg className="slide-advance-hint" aria-hidden>
      <path
        d={d}
        fill="none"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth={STROKE + 4}
        strokeLinecap="round"
      />
      <path
        className="slide-advance-hint-path"
        d={d}
        fill="none"
        stroke={GREEN}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <polygon
        className="slide-advance-hint-head"
        points={headPoints}
        fill={GREEN}
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
