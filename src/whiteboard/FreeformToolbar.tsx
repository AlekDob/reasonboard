import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import type { Tool } from "./types";

type Props = {
  tool: Tool;
  onTool: (t: Tool) => void;
  color: string;
  onColor: (c: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  onClearDrawings: () => void;
  /** Hold Space: pan mode */
  spacePan?: boolean;
  panning?: boolean;
};

const COLORS = ["#111111", "#2b7bb9", "#16a34a", "#eab308", "#0d9488"];
const iconEase = [0.22, 1, 0.36, 1] as const;

function IconUndo() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        d="M3 8h8a6 6 0 1 1-4.24 10.24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 8l4-4M3 8l4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSelect() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path d="M5 3l14 8.5-6.2 1.6L9.5 21 5 3z" fill="currentColor" />
    </svg>
  );
}

function IconHand() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        d="M8 11V6.5a1.5 1.5 0 0 1 3 0V11M11 10.5V5.5a1.5 1.5 0 0 1 3 0V11M14 10.5V7a1.5 1.5 0 0 1 3 0v7.5c0 2.5-1.8 4.5-4.5 4.5H12c-2.8 0-5-1.7-5.8-4.2L5 11.5a1.4 1.4 0 0 1 2.5-1.2L8 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        d="M14.5 5.5l4 4M5 19l1.2-4.4L15.7 5.1a1.4 1.4 0 0 1 2 0l1.2 1.2a1.4 1.4 0 0 1 0 2L8.4 17.8 4 19z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSticky() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        d="M7 4h8l5 5v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M15 4v5h5M9 12h6M9 16h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        d="M4 12h13M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconClear() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M8 7l1 12h6l1-12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FreeformToolbar({
  tool,
  onTool,
  color,
  onColor,
  onUndo,
  canUndo,
  onClearDrawings,
  spacePan = false,
  panning = false,
}: Props) {
  const showColors = tool === "pencil" || tool === "sticky";
  const selectActive = tool === "select" || spacePan;

  return createPortal(
    <div
      className={`ff-toolbar${spacePan ? " ff-toolbar-pan" : ""}`}
      role="toolbar"
      aria-label="Whiteboard tools"
    >
      <button
        type="button"
        className="ff-tool"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo"
        aria-label="Undo"
      >
        <IconUndo />
      </button>

      <div className="ff-sep" />

      <button
        type="button"
        className={`ff-tool ff-tool-select ${selectActive ? "active" : ""}${spacePan ? " is-pan" : ""}`}
        onClick={() => onTool("select")}
        title={spacePan ? "Pan (Space)" : "Move"}
        aria-label={spacePan ? "Pan" : "Move"}
      >
        <span className="ff-tool-icon-slot">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={spacePan ? "hand" : "select"}
              className="ff-tool-icon"
              initial={{ opacity: 0, scale: 0.6, rotate: spacePan ? -12 : 12, y: 4 }}
              animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotate: spacePan ? 12 : -12, y: -4 }}
              transition={{ duration: 0.2, ease: iconEase }}
            >
              {spacePan ? <IconHand /> : <IconSelect />}
            </motion.span>
          </AnimatePresence>
        </span>
        {panning && <span className="ff-pan-pulse" aria-hidden />}
      </button>

      <button
        type="button"
        className={`ff-tool ${tool === "pencil" ? "active" : ""}`}
        onClick={() => onTool("pencil")}
        title="Pencil"
        aria-label="Pencil"
        disabled={spacePan}
      >
        <IconPencil />
      </button>

      <button
        type="button"
        className={`ff-tool ${tool === "sticky" ? "active" : ""}`}
        onClick={() => onTool("sticky")}
        title="Post-it"
        aria-label="Post-it"
        disabled={spacePan}
      >
        <IconSticky />
      </button>

      <button
        type="button"
        className={`ff-tool ${tool === "arrow" ? "active" : ""}`}
        onClick={() => onTool("arrow")}
        title="Arrow"
        aria-label="Arrow"
        disabled={spacePan}
      >
        <IconArrow />
      </button>

      <AnimatePresence initial={false}>
        {showColors && !spacePan && (
          <motion.div
            className="ff-swatches-slot"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: iconEase }}
          >
            <div className="ff-sep" />
            <div className="ff-swatches">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`ff-swatch ${color === c ? "active" : ""}`}
                  style={{ background: c }}
                  onClick={() => onColor(c)}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="ff-sep" />

      <button
        type="button"
        className="ff-tool"
        onClick={onClearDrawings}
        title="Clear drawings"
        aria-label="Clear drawings"
        disabled={spacePan}
      >
        <IconClear />
      </button>
    </div>,
    document.body,
  );
}
