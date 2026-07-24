import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { CaptionWithSource } from "./SourceLink";

type Props = {
  src: string | null;
  caption?: string | null;
  href?: string | null;
  onClose: () => void;
};

const ease = [0.22, 1, 0.36, 1] as const;

function isVideoSrc(src: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(src);
}

/** Zoom overlay for image/video cards (Esc / click outside / ×). */
export function ImageLightbox({ src, caption, href, onClose }: Props) {
  const reduce = useReducedMotion();
  const video = Boolean(src && isVideoSrc(src));

  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [src, onClose]);

  return createPortal(
    <AnimatePresence>
      {src && (
        <motion.div
          className="wb-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={caption || (video ? "Video preview" : "Image preview")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <button type="button" className="wb-lightbox-close" onClick={onClose} aria-label="Close">
            ×
          </button>
          <motion.figure
            className="wb-lightbox-figure"
            initial={reduce ? false : { scale: 0.88, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={reduce ? undefined : { scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.32, ease }}
            onClick={(e) => e.stopPropagation()}
          >
            {video ? (
              <video src={src} controls autoPlay loop playsInline />
            ) : (
              <img src={src} alt={caption || ""} />
            )}
            <CaptionWithSource caption={caption} href={href} as="figcaption" />
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
