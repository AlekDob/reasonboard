import type { MouseEvent, PointerEvent } from "react";

function ExternalIcon() {
  return (
    <svg
      className="wb-source-icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function stopBubble(e: MouseEvent | PointerEvent) {
  e.stopPropagation();
}

/** Icon + "Source" label → opens the URL in a new tab (doesn't interfere with zoom/drag). */
export function SourceLink({ href }: { href: string }) {
  return (
    <a
      className="wb-source-link"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={stopBubble}
      onPointerDown={stopBubble}
      aria-label={`Open source: ${href}`}
      title={href}
    >
      <ExternalIcon />
      <span>Source</span>
    </a>
  );
}

export function CaptionWithSource({
  caption,
  href,
  as = "p",
}: {
  caption?: string | null;
  href?: string | null;
  as?: "p" | "figcaption";
}) {
  if (!caption && !href) return null;
  const Tag = as;
  return (
    <Tag className="wb-cc-caption">
      {caption ? <span className="wb-cc-caption-text">{caption}</span> : null}
      {href ? <SourceLink href={href} /> : null}
    </Tag>
  );
}
