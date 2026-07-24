import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { ModalSection } from "./contentTypes";
import { clearDiveNav, setDiveNav } from "./diveNav";
import { NodeArt } from "./NodeArt";
import { nudgeNextSlide } from "./nudge";
import { shortBlurb } from "./whiteboard/BoardItems";
import { MobileDeepBoard } from "./whiteboard/MobileDeepBoard";

type Props = {
  brandLeft: string;
  brandRight: string;
  pill: string;
  eyebrow: string;
  title: ReactNode;
  lede: string;
  sections: ModalSection[];
  /** Slide with solution tone: title + numbers emphasized */
  tone?: "default" | "solution";
  /** After closing this section's deep-dive, nudge toward the next slide */
  nudgeNextAfterId?: string;
};

export function MobileSlide({
  brandLeft,
  brandRight,
  pill,
  eyebrow,
  title,
  lede,
  sections,
  tone = "default",
  nudgeNextAfterId,
}: Props) {
  const rootSections = useMemo(
    () => sections.filter((s) => s.onRoot !== false),
    [sections],
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const [parentOpenId, setParentOpenId] = useState<string | null>(null);
  const [ideaId, setIdeaId] = useState<string | null>(null);
  const [competitorId, setCompetitorId] = useState<string | null>(null);
  const open = sections.find((s) => s.id === openId) ?? null;
  const ideas = open?.ideas ?? [];
  const idea = ideas.find((i) => i.id === ideaId) ?? null;
  const ideaIndex = idea ? ideas.findIndex((i) => i.id === idea.id) : -1;
  const competitors = open?.competitorNotes ?? [];
  const competitor = competitors.find((c) => c.id === competitorId) ?? null;
  const competitorIndex = competitor
    ? competitors.findIndex((c) => c.id === competitor.id)
    : -1;

  const closeDeep = () => {
    if (parentOpenId) {
      setIdeaId(null);
      setCompetitorId(null);
      setOpenId(parentOpenId);
      setParentOpenId(null);
      return;
    }
    const closed = openId;
    setIdeaId(null);
    setCompetitorId(null);
    setOpenId(null);
    if (nudgeNextAfterId && closed === nudgeNextAfterId) {
      nudgeNextSlide();
    }
  };

  // Footer pager: siblings at the current level + go up
  useEffect(() => {
    if (!openId) {
      clearDiveNav();
      return;
    }

    const section = sections.find((s) => s.id === openId) ?? null;
    const ideaList = section?.ideas ?? [];
    const competitorList = section?.competitorNotes ?? [];

    let ids: string[] = [];
    let index = 0;
    let floor: 1 | 2 = 1;
    let goTo = (_id: string) => {};
    let goUp = () => {};

    if (ideaId) {
      floor = 2;
      ids = ideaList.map((i) => i.id);
      index = ids.indexOf(ideaId);
      goTo = (id) => {
        setCompetitorId(null);
        setIdeaId(id);
      };
      goUp = () => {
        setIdeaId(null);
        setCompetitorId(null);
      };
    } else if (competitorId) {
      floor = 2;
      ids = competitorList.map((c) => c.id);
      index = ids.indexOf(competitorId);
      goTo = (id) => {
        setIdeaId(null);
        setCompetitorId(id);
      };
      goUp = () => {
        setIdeaId(null);
        setCompetitorId(null);
      };
    } else if (parentOpenId) {
      floor = 2;
      ids = [openId];
      index = 0;
      goTo = () => {};
      goUp = () => {
        setIdeaId(null);
        setCompetitorId(null);
        setOpenId(parentOpenId);
        setParentOpenId(null);
      };
    } else {
      floor = 1;
      ids = rootSections.map((s) => s.id);
      index = ids.indexOf(openId);
      goTo = (id) => {
        setIdeaId(null);
        setCompetitorId(null);
        setParentOpenId(null);
        setOpenId(id);
      };
      goUp = () => {
        const closed = openId;
        setIdeaId(null);
        setCompetitorId(null);
        setParentOpenId(null);
        setOpenId(null);
        if (nudgeNextAfterId && closed === nudgeNextAfterId) {
          nudgeNextSlide();
        }
      };
    }

    const safeIndex = Math.max(0, index);
    setDiveNav({
      floor,
      index: safeIndex,
      total: Math.max(ids.length, 1),
      goPrev: () => {
        if (safeIndex <= 0) return;
        goTo(ids[safeIndex - 1]!);
      },
      goNext: () => {
        if (safeIndex >= ids.length - 1) return;
        goTo(ids[safeIndex + 1]!);
      },
      goUp,
    });

    return () => clearDiveNav();
  }, [
    openId,
    parentOpenId,
    ideaId,
    competitorId,
    sections,
    rootSections,
    nudgeNextAfterId,
  ]);

  return (
    <div
      className={`slide slide-mobile${tone === "solution" ? " slide-solution" : ""}`}
    >
      <div className="topbar">
        <div className="brand">
          {brandLeft} <span>×</span> {brandRight}
        </div>
        <div className="pill">
          <span className="pill-dot" />
          {pill}
        </div>
      </div>

      <div className="mobile-scroll">
        <header className="mobile-intro">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="headline">{title}</h1>
          <p className="lede">{lede}</p>
        </header>

        <ol className="mobile-stack">
          {rootSections.map((section, i) => (
            <li key={section.id}>
              <article
                className={`node node-mobile ${i === 0 ? "node-accent" : ""}`}
                onClick={() => {
                  setIdeaId(null);
                  setCompetitorId(null);
                  setParentOpenId(null);
                  setOpenId(section.id);
                }}
              >
                <span className="node-num" aria-hidden>
                  {i + 1}
                </span>
                <div className="node-art">
                  {section.image || section.images?.[0]?.src ? (
                    <img
                      className="node-art-img"
                      src={section.image ?? section.images![0].src}
                      alt=""
                      draggable={false}
                    />
                  ) : (
                    <NodeArt id={section.id} />
                  )}
                </div>
                <strong className="node-title">{section.title}</strong>
                <span className="node-blurb">{shortBlurb(section.summary, 110)}</span>
                <button
                  type="button"
                  className="node-cta"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIdeaId(null);
                    setCompetitorId(null);
                    setParentOpenId(null);
                    setOpenId(section.id);
                  }}
                >
                  Open
                </button>
              </article>
              {i < rootSections.length - 1 && (
                <div className="mobile-connector" aria-hidden>
                  <span />
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>

      <MobileDeepBoard
        section={open}
        idea={idea}
        ideaIndex={ideaIndex}
        competitor={competitor}
        competitorIndex={competitorIndex}
        parentSection={
          parentOpenId
            ? (sections.find((s) => s.id === parentOpenId) ?? null)
            : null
        }
        onClose={closeDeep}
        onBackFromChild={() => {
          setIdeaId(null);
          setCompetitorId(null);
        }}
        onOpenIdea={(id) => {
          setCompetitorId(null);
          setIdeaId(id);
        }}
        onOpenCompetitor={(id) => {
          setIdeaId(null);
          setCompetitorId(id);
        }}
        onOpenSection={(id) => {
          if (!openId) return;
          setIdeaId(null);
          setCompetitorId(null);
          setParentOpenId(openId);
          setOpenId(id);
        }}
      />
    </div>
  );
}
