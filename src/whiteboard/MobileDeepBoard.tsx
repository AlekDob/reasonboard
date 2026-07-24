import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { CompetitorNote, IdeaItem, ModalSection } from "../contentTypes";
import { RichText } from "../RichText";
import { MobileContentCard } from "./BoardItems";
import {
  mobileCompetitorBlocks,
  mobileDeepBlocks,
  mobileIdeaBlocks,
  type MobileDeepBlock,
} from "./deepDiveLayout";
import { ImageLightbox } from "./ImageLightbox";
import { CaptionWithSource } from "./SourceLink";
import {
  COLLAPSE_MS,
  EnterWrap,
  sceneMotion,
  type NavDir,
} from "./sceneMotion";

const ease = [0.22, 1, 0.36, 1] as const;

type Props = {
  section: ModalSection | null;
  idea: IdeaItem | null;
  ideaIndex: number;
  competitor: CompetitorNote | null;
  competitorIndex: number;
  /** Parent section when nested inside another section's deep dive (e.g. a solution branch) */
  parentSection?: ModalSection | null;
  onClose: () => void;
  onBackFromChild: () => void;
  onOpenIdea: (id: string) => void;
  onOpenCompetitor: (id: string) => void;
  onOpenSection?: (id: string) => void;
};

function Blocks({
  blocks,
  onOpenIdea,
  onOpenCompetitor,
  onOpenSection,
  onZoom,
  stagger,
  sceneToken,
  navDir,
  collapsing,
}: {
  blocks: MobileDeepBlock[];
  onOpenIdea?: (id: string) => void;
  onOpenCompetitor?: (id: string) => void;
  onOpenSection?: (id: string) => void;
  onZoom?: (src: string, caption?: string, href?: string) => void;
  stagger: boolean;
  sceneToken: string;
  navDir: NavDir;
  collapsing: boolean;
}) {
  const mid = (blocks.length - 1) / 2;
  return (
    <div className={`mobile-deep-blocks${collapsing ? " is-collapsing" : ""}`}>
      {blocks.map((b, i) => {
        let inner: ReactNode;
        if (b.type === "header") {
          inner = (
            <header className="mobile-deep-header">
              <p className="eyebrow">{b.eyebrow}</p>
              <h2 className="mobile-deep-title">{b.title}</h2>
              <p className="lede">
                <RichText text={b.summary} />
              </p>
            </header>
          );
        } else if (b.type === "sticky") {
          inner = (
            <div className="wb-sticky mobile-deep-sticky" style={{ background: b.color }}>
              <p>{b.text}</p>
            </div>
          );
        } else if (b.type === "image") {
          inner = (
            <button
              type="button"
              className="wb-img mobile-deep-img is-zoomable"
              onClick={() => onZoom?.(b.src, b.caption, b.href)}
            >
              <img src={b.src} alt={b.caption ?? ""} />
              <CaptionWithSource caption={b.caption} href={b.href} as="figcaption" />
            </button>
          );
        } else {
          inner = (
            <MobileContentCard
              variant={b.variant}
              title={b.title}
              text={b.text}
              eyebrow={b.eyebrow}
              image={b.image}
              tag={b.tag}
              tagKind={b.tagKind}
              accent={b.accent}
              blocks={b.blocks}
              openIdeaId={b.openIdeaId}
              openCompetitorId={b.openCompetitorId}
              openSectionId={b.openSectionId}
              zoomSrc={b.zoomSrc}
              href={b.href}
              onOpenIdea={onOpenIdea}
              onOpenCompetitor={onOpenCompetitor}
              onOpenSection={onOpenSection}
              onZoom={onZoom}
            />
          );
        }

        // Stack at the center of the list (overlap)
        const collapse = { dx: 0, dy: (mid - i) * 56 };

        return (
          <EnterWrap
            key={`b-${i}-${b.type}`}
            enabled={stagger}
            delay={i}
            sceneToken={sceneToken}
            navDir={navDir}
            collapsing={collapsing}
            collapse={collapse}
          >
            {inner}
          </EnterWrap>
        );
      })}
    </div>
  );
}

export function MobileDeepBoard({
  section,
  idea,
  ideaIndex,
  competitor,
  competitorIndex,
  parentSection = null,
  onClose,
  onBackFromChild,
  onOpenIdea,
  onOpenCompetitor,
  onOpenSection,
}: Props) {
  const reduce = useReducedMotion();
  const [navDir, setNavDir] = useState<NavDir>("in");
  const [collapsing, setCollapsing] = useState(false);
  const pendingNav = useRef<null | (() => void)>(null);
  const zoom = sceneMotion(navDir, reduce);
  const [lightbox, setLightbox] = useState<{
    src: string;
    caption?: string;
    href?: string;
  } | null>(null);

  const child = idea ?? competitor;

  useEffect(() => {
    if (!section) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("wb-deep-open");
    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove("wb-deep-open");
    };
  }, [section]);

  useEffect(() => {
    if (section && !child) setNavDir("in");
  }, [section?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!collapsing) return;
    const t = window.setTimeout(() => {
      const fn = pendingNav.current;
      pendingNav.current = null;
      setCollapsing(false);
      fn?.();
    }, reduce ? 80 : COLLAPSE_MS);
    return () => window.clearTimeout(t);
  }, [collapsing, reduce]);

  const requestBack = (fn: () => void) => {
    if (collapsing) return;
    pendingNav.current = fn;
    setNavDir("out");
    setCollapsing(true);
  };

  useEffect(() => {
    if (!section) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      if (lightbox) {
        setLightbox(null);
        return;
      }
      if (collapsing) return;
      pendingNav.current = child ? onBackFromChild : onClose;
      setNavDir("out");
      setCollapsing(true);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [section, child, onClose, onBackFromChild, lightbox, collapsing]);

  const sectionBlocks = section ? mobileDeepBlocks(section) : [];
  const ideaBlocks = idea ? mobileIdeaBlocks(idea, ideaIndex) : [];
  const competitorBlocks = competitor
    ? mobileCompetitorBlocks(competitor, competitorIndex)
    : [];
  const activeBlocks = idea
    ? ideaBlocks
    : competitor
      ? competitorBlocks
      : sectionBlocks;

  const backLabel = idea
    ? "← Idea list"
    : competitor
      ? "← Competitor list"
      : parentSection
        ? `← ${parentSection.eyebrow.replace(/^\d+\s*·\s*/, "").trim() || parentSection.title}`
        : "← Board";

  const crumbTitle = idea?.title ?? competitor?.title ?? section?.title ?? "";

  return createPortal(
    <>
      <AnimatePresence>
        {section && (
          <motion.div
            className={`mobile-deep-board${collapsing ? " is-collapsing" : ""}`}
            key={`deep-${section.id}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`mobile-deep-${section.id}`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.42, ease }}
          >
            <div className="mobile-deep-chrome">
              <button
                type="button"
                className="wb-deep-back"
                disabled={collapsing}
                onClick={() => {
                  if (child) requestBack(onBackFromChild);
                  else requestBack(onClose);
                }}
              >
                {backLabel}
              </button>
              <span className="wb-deep-crumb" id={`mobile-deep-${section.id}`}>
                {crumbTitle}
              </span>
            </div>

            <div className="mobile-deep-scroll">
              <AnimatePresence mode="wait">
                <motion.div
                  key={
                    idea
                      ? `idea-${idea.id}`
                      : competitor
                        ? `comp-${competitor.id}`
                        : `sec-${section.id}`
                  }
                  initial={zoom.initial}
                  animate={zoom.animate}
                  exit={zoom.exit}
                  transition={zoom.transition}
                >
                  <Blocks
                    blocks={activeBlocks}
                    onOpenIdea={onOpenIdea}
                    onOpenCompetitor={onOpenCompetitor}
                    onOpenSection={onOpenSection}
                    onZoom={(src, caption, href) => setLightbox({ src, caption, href })}
                    stagger={!reduce}
                    sceneToken={
                      idea
                        ? `idea-${idea.id}`
                        : competitor
                          ? `comp-${competitor.id}`
                          : `sec-${section.id}`
                    }
                    navDir={navDir}
                    collapsing={collapsing}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ImageLightbox
        src={lightbox?.src ?? null}
        caption={lightbox?.caption}
        href={lightbox?.href}
        onClose={() => setLightbox(null)}
      />
    </>,
    document.body,
  );
}
