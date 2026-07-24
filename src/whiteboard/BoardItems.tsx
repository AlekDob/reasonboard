import { type MouseEvent } from "react";
import { RichText, TitleHtml } from "../RichText";
import { CaptionWithSource, SourceLink } from "./SourceLink";
import {
  itemSize,
  type BoardContentCard,
  type BoardImage,
  type BoardItem,
  type BoardText,
  type ContentBlock,
} from "./types";

function isVideoSrc(src?: string): boolean {
  if (!src) return false;
  return /\.(mp4|webm|mov)(\?|$)/i.test(src);
}

function Blocks({
  blocks,
  editing,
  onChangeBlock,
}: {
  blocks: ContentBlock[];
  editing?: boolean;
  onChangeBlock?: (index: number, text: string) => void;
}) {
  return (
    <div className="wb-cc-blocks">
      {blocks.map((b, i) => (
        <p
          key={b.label}
          className={`wb-cc-block${b.tone === "fit" ? " wb-cc-block-fit" : ""}`}
        >
          <span className="wb-cc-block-label">{b.label}</span>
          {editing && onChangeBlock ? (
            <textarea
              className="wb-cc-edit-field"
              value={b.text}
              rows={3}
              onChange={(e) => onChangeBlock(i, e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <RichText text={b.text} />
          )}
        </p>
      ))}
    </div>
  );
}

function CardInner({
  item,
  clickable,
  onOpenIdea,
  onOpenCompetitor,
  onOpenSection,
  onZoom,
  editing,
  onPatch,
}: {
  item: BoardContentCard;
  clickable: boolean;
  onOpenIdea?: (ideaId: string) => void;
  onOpenCompetitor?: (competitorId: string) => void;
  onOpenSection?: (sectionId: string) => void;
  onZoom?: (src: string, caption?: string, href?: string) => void;
  editing?: boolean;
  onPatch?: (patch: Partial<BoardContentCard>) => void;
}) {
  const isImage = item.variant === "image";
  const isSolution = item.variant === "solution";
  const isIdeaCard = item.variant === "idea";
  const isCompetitorCard = item.variant === "competitor";
  const zoomSrc = item.zoomSrc ?? (isImage || isSolution ? item.image : undefined);
  const canZoom = Boolean(zoomSrc && onZoom);
  const showThumb = Boolean(
    item.image && !isImage && !isSolution && (isIdeaCard || isCompetitorCard || item.variant === "persona"),
  );
  const mediaIsVideo = isVideoSrc(item.image) || isVideoSrc(zoomSrc);

  const openZoom = (e: MouseEvent) => {
    if (!zoomSrc || !onZoom) return;
    e.stopPropagation();
    onZoom(zoomSrc, item.tag, item.href);
  };

  return (
    <>
      {isSolution && item.image && (
        isVideoSrc(item.image) ? (
          <button
            type="button"
            className="wb-cc-media-btn"
            onClick={canZoom ? openZoom : undefined}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label={canZoom ? "Open animated mockup" : undefined}
          >
            <video
              className="wb-cc-media"
              src={item.image}
              muted
              playsInline
              loop
              autoPlay
            />
          </button>
        ) : (
          <button
            type="button"
            className="wb-cc-media-btn"
            onClick={canZoom ? openZoom : undefined}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label={canZoom ? "Enlarge mockup" : undefined}
            disabled={!canZoom}
          >
            <img className="wb-cc-media" src={item.image} alt="" draggable={false} />
          </button>
        )
      )}
      {showThumb && item.image && (
        isIdeaCard || isCompetitorCard ? (
          <div className="wb-cc-thumb-wrap" aria-hidden>
            <img className="wb-cc-thumb" src={item.image} alt="" draggable={false} />
          </div>
        ) : canZoom ? (
          <button
            type="button"
            className="wb-cc-photo-btn is-zoomable"
            onClick={openZoom}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label={mediaIsVideo ? "Open animated mockup" : "Enlarge illustration"}
          >
            <img className="wb-cc-photo" src={item.image} alt="" draggable={false} />
          </button>
        ) : (
          <img className="wb-cc-photo" src={item.image} alt="" draggable={false} />
        )
      )}
      {item.image && !isImage && !isSolution && !showThumb && (
        <img className="wb-cc-photo" src={item.image} alt="" draggable={false} />
      )}
      {isImage && item.image && (
        isVideoSrc(item.image) ? (
          <video
            className="wb-cc-hero"
            src={item.image}
            muted
            playsInline
            loop
            autoPlay
          />
        ) : (
          <img
            className="wb-cc-hero"
            src={item.image}
            alt={item.tag || item.title || ""}
            draggable={false}
          />
        )
      )}
      <div className={`wb-cc-body${isImage ? " wb-cc-body-image" : ""}${isSolution ? " wb-cc-body-solution" : ""}`}>
        {!isImage && (item.eyebrow || item.tag || editing) && (
          <div className="wb-cc-meta">
            {editing && onPatch ? (
              <input
                className="wb-cc-edit-field wb-cc-edit-eyebrow"
                value={item.eyebrow ?? ""}
                placeholder="Eyebrow"
                onChange={(e) => onPatch({ eyebrow: e.target.value })}
                onPointerDown={(e) => e.stopPropagation()}
              />
            ) : (
              item.eyebrow && <span className="wb-cc-eyebrow">{item.eyebrow}</span>
            )}
            {item.tag && (
              <span
                className={`wb-cc-tag wb-cc-tag-${item.tagKind ?? item.variant}${item.accent ? ` wb-cc-tag-${item.accent}` : ""}`}
              >
                {item.tag}
              </span>
            )}
          </div>
        )}
        {editing && onPatch ? (
          <input
            className="wb-cc-edit-field wb-cc-edit-title"
            value={item.title}
            placeholder="Title"
            onChange={(e) => onPatch({ title: e.target.value })}
            onPointerDown={(e) => e.stopPropagation()}
          />
        ) : (
          item.title && <strong className="wb-cc-title">{item.title}</strong>
        )}
        {item.blocks && item.blocks.length > 0 ? (
          <Blocks
            blocks={item.blocks}
            editing={editing}
            onChangeBlock={
              editing && onPatch
                ? (index, text) => {
                    const blocks = item.blocks!.map((b, i) =>
                      i === index ? { ...b, text } : b,
                    );
                    onPatch({ blocks });
                  }
                : undefined
            }
          />
        ) : editing && onPatch ? (
          <textarea
            className="wb-cc-edit-field wb-cc-edit-text"
            value={item.text}
            placeholder="Text"
            rows={4}
            onChange={(e) => onPatch({ text: e.target.value })}
            onPointerDown={(e) => e.stopPropagation()}
          />
        ) : item.text ? (
          <p className="wb-cc-text">
            <RichText text={item.text} />
          </p>
        ) : null}
        {isImage && (item.tag || item.href) && (
          <CaptionWithSource caption={item.tag} href={item.href} />
        )}
        {!isImage && item.href && (
          <div className="wb-cc-source-row">
            <SourceLink href={item.href} />
          </div>
        )}
        {clickable &&
          (item.openIdeaId || item.openCompetitorId || item.openSectionId) && (
          <button
            type="button"
            className={`wb-cc-open-btn wb-cc-open-btn-${item.tagKind === "bug" ? "bug" : "idea"}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              if (item.openCompetitorId) onOpenCompetitor?.(item.openCompetitorId);
              else if (item.openIdeaId) onOpenIdea?.(item.openIdeaId);
              else if (item.openSectionId) onOpenSection?.(item.openSectionId);
            }}
          >
            Open
          </button>
        )}
        {(isImage || isSolution) && canZoom && !clickable && (
          <span className="wb-cc-zoom-hint" aria-hidden>
            {mediaIsVideo ? "Click to open" : "Click to zoom"}
          </span>
        )}
      </div>
    </>
  );
}

export function ContentCardView({
  item,
  onOpenIdea,
  onOpenCompetitor,
  onOpenSection,
  onZoom,
  editing,
  onPatch,
}: {
  item: BoardContentCard;
  onOpenIdea?: (ideaId: string) => void;
  onOpenCompetitor?: (competitorId: string) => void;
  onOpenSection?: (sectionId: string) => void;
  onZoom?: (src: string, caption?: string, href?: string) => void;
  editing?: boolean;
  onPatch?: (patch: Partial<BoardContentCard>) => void;
}) {
  const size = itemSize(item);
  const clickable = Boolean(
    (item.openIdeaId && onOpenIdea) ||
      (item.openCompetitorId && onOpenCompetitor) ||
      (item.openSectionId && onOpenSection),
  );
  const zoomable = Boolean(
    (item.zoomSrc || ((item.variant === "image" || item.variant === "solution") && item.image)) &&
      onZoom,
  );
  const className = [
    "wb-cc",
    `wb-cc-${item.variant}`,
    item.tagKind === "bug" ? "wb-cc-kind-bug" : "",
    item.tagKind === "idea" ? "wb-cc-kind-idea" : "",
    item.paper ? `wb-cc-paper-${item.paper}` : "wb-cc-paper-cream",
    item.accent ? `wb-cc-accent-${item.accent}` : "",
    clickable ? "wb-cc-clickable" : "",
    zoomable && (item.variant === "image" || item.variant === "solution")
      ? "wb-cc-zoomable"
      : "",
    editing ? "wb-cc-editing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Div (not button): lets the board wrapper drag it; a short click opens via openIdeaId
  return (
    <div className={className} style={{ width: size.w, minHeight: size.h }}>
      <CardInner
        item={item}
        clickable={clickable && !editing}
        onOpenIdea={onOpenIdea}
        onOpenCompetitor={onOpenCompetitor}
        onOpenSection={onOpenSection}
        onZoom={onZoom}
        editing={editing}
        onPatch={onPatch}
      />
    </div>
  );
}

export function BoardImageView({
  item,
  onZoom,
}: {
  item: BoardImage;
  onZoom?: (src: string, caption?: string, href?: string) => void;
}) {
  const size = itemSize(item);
  const zoomable = Boolean(onZoom);
  return (
    <figure
      className={`wb-img wb-img-card${zoomable ? " is-zoomable" : ""}`}
      style={{ width: size.w, minHeight: size.h }}
      onClick={
        zoomable
          ? (e) => {
              e.stopPropagation();
              onZoom?.(item.src, item.caption, item.href);
            }
          : undefined
      }
    >
      <img
        src={item.src}
        alt={item.caption ?? ""}
        style={{ height: Math.max(120, size.h - (item.caption || item.href ? 40 : 16)) }}
      />
      <CaptionWithSource caption={item.caption} href={item.href} as="figcaption" />
    </figure>
  );
}

export function BoardTextView({
  item,
  editing,
  onChangeHtml,
}: {
  item: BoardText;
  editing?: boolean;
  onChangeHtml?: (html: string) => void;
}) {
  if (editing && onChangeHtml) {
    return (
      <textarea
        className={`wb-text-edit wb-text-edit-${item.role}`}
        value={item.html}
        autoFocus
        rows={item.role === "title" ? 3 : item.role === "lede" ? 4 : 1}
        onChange={(e) => onChangeHtml(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
      />
    );
  }
  if (item.role === "title") {
    return (
      <h1 className="headline board-headline">
        <TitleHtml html={item.html} />
      </h1>
    );
  }
  if (item.role === "eyebrow") {
    return <p className="eyebrow">{item.html}</p>;
  }
  return (
    <p className="lede board-lede">
      <RichText text={item.html} />
    </p>
  );
}

/** Mobile / list blocks (not freeform) */
export function MobileContentCard({
  variant,
  title,
  text,
  eyebrow,
  image,
  tag,
  tagKind,
  accent,
  blocks,
  openIdeaId,
  openCompetitorId,
  openSectionId,
  zoomSrc,
  href,
  onOpenIdea,
  onOpenCompetitor,
  onOpenSection,
  onZoom,
}: {
  variant: BoardContentCard["variant"];
  title: string;
  text: string;
  eyebrow?: string;
  image?: string;
  tag?: string;
  tagKind?: BoardContentCard["tagKind"];
  accent?: BoardContentCard["accent"];
  blocks?: ContentBlock[];
  openIdeaId?: string;
  openCompetitorId?: string;
  openSectionId?: string;
  zoomSrc?: string;
  href?: string;
  onOpenIdea?: (id: string) => void;
  onOpenCompetitor?: (id: string) => void;
  onOpenSection?: (id: string) => void;
  onZoom?: (src: string, caption?: string, href?: string) => void;
}) {
  const clickable = Boolean(
    (openIdeaId && onOpenIdea) ||
      (openCompetitorId && onOpenCompetitor) ||
      (openSectionId && onOpenSection),
  );
  const item: BoardContentCard = {
    kind: "contentCard",
    id: "mobile",
    x: 0,
    y: 0,
    variant,
    title,
    text,
    eyebrow,
    image,
    tag,
    tagKind,
    accent,
    blocks,
    openIdeaId,
    openCompetitorId,
    openSectionId,
    zoomSrc,
    href,
    paper:
      tagKind === "bug"
        ? "blush"
        : tagKind === "idea" || variant === "competitor"
          ? "sky"
          : variant === "solution"
            ? "mint"
            : variant === "semaforo" && accent === "green"
              ? "mint"
              : variant === "semaforo" && accent === "yellow"
                ? "peach"
                : variant === "semaforo" && accent === "red"
                  ? "blush"
                  : "cream",
  };
  const className = [
    "wb-cc",
    "wb-cc-mobile",
    `wb-cc-${variant}`,
    tagKind === "bug" ? "wb-cc-kind-bug" : "",
    tagKind === "idea" ? "wb-cc-kind-idea" : "",
    item.paper ? `wb-cc-paper-${item.paper}` : "",
    accent ? `wb-cc-accent-${accent}` : "",
    clickable ? "wb-cc-clickable" : "",
    zoomSrc && (variant === "image" || variant === "solution") ? "wb-cc-zoomable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <CardInner
        item={item}
        clickable={clickable}
        onOpenIdea={onOpenIdea}
        onOpenCompetitor={onOpenCompetitor}
        onOpenSection={onOpenSection}
        onZoom={onZoom}
      />
    </div>
  );
}

export function shortBlurb(text: string, max = 88) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3).trim()}…`;
}

export type RenderableBoardItem = Extract<
  BoardItem,
  { kind: "text" | "contentCard" | "image" | "sticky" | "node" }
>;
