import { useState, type ReactNode } from "react";
import type { ModalSection } from "./contentTypes";
import { NodeArt } from "./NodeArt";
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
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [ideaId, setIdeaId] = useState<string | null>(null);
  const open = sections.find((s) => s.id === openId) ?? null;
  const ideas = open?.ideas ?? [];
  const idea = ideas.find((i) => i.id === ideaId) ?? null;
  const ideaIndex = idea ? ideas.findIndex((i) => i.id === idea.id) : -1;

  const closeDeep = () => {
    setIdeaId(null);
    setOpenId(null);
  };

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
          {sections.map((section, i) => (
            <li key={section.id}>
              <article
                className={`node node-mobile ${i === 0 ? "node-accent" : ""}`}
                onClick={() => {
                  setIdeaId(null);
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
                    setOpenId(section.id);
                  }}
                >
                  Open
                </button>
              </article>
              {i < sections.length - 1 && (
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
        onClose={closeDeep}
        onBackFromIdea={() => setIdeaId(null)}
        onOpenIdea={setIdeaId}
      />
    </div>
  );
}
