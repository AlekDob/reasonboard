import type { PointerEvent } from "react";
import { itemSize, type BoardSticker } from "./types";

type Props = {
  item: BoardSticker;
  /** DEV: shows resize / delete handles */
  showControls?: boolean;
  onResizePointerDown?: (e: PointerEvent) => void;
  onDelete?: () => void;
};

/** PNG/SVG sticker on the whiteboard — no card frame, just the image. */
export function BoardStickerView({
  item,
  showControls,
  onResizePointerDown,
  onDelete,
}: Props) {
  const size = itemSize(item);
  return (
    <div
      className="wb-sticker"
      style={{ width: size.w, height: size.h }}
      aria-label={item.alt ?? "Sticker"}
    >
      <img src={item.src} alt={item.alt ?? ""} draggable={false} />
      {showControls && (
        <>
          {onDelete && (
            <button
              type="button"
              className="wb-item-del wb-sticker-del"
              aria-label="Delete sticker"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              ×
            </button>
          )}
          {onResizePointerDown && (
            <button
              type="button"
              className="wb-sticker-resize"
              aria-label="Resize sticker"
              title="Resize"
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizePointerDown(e);
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                <path
                  d="M4 1H1v3M8 11h3V8M1 1l4 4M11 11L7 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </>
      )}
    </div>
  );
}
