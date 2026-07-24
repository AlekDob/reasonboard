import { MobileSlide } from "./MobileSlide";
import type { DeckSlide as DeckSlideType } from "./contentTypes";
import { useIsMobile } from "./useIsMobile";
import { Whiteboard } from "./whiteboard/Whiteboard";
import { TitleHtml } from "./RichText";

type Props = { slide: DeckSlideType };

/** One slide of a ReasonBoard deck — freeform whiteboard on desktop, stack on mobile. */
export function DeckSlideView({ slide }: Props) {
  const mobile = useIsMobile();
  const { id, brandLeft, brandRight, pill, meta, sections, tone, nudgeNextAfterId } = slide;

  if (mobile) {
    return (
      <MobileSlide
        brandLeft={brandLeft}
        brandRight={brandRight}
        pill={pill}
        eyebrow={meta.eyebrow}
        title={<TitleHtml html={meta.title} />}
        lede={meta.lede}
        sections={sections}
        tone={tone}
        nudgeNextAfterId={nudgeNextAfterId}
      />
    );
  }

  return (
    <div className={`slide slide-wb${tone === "solution" ? " slide-solution" : ""}`}>
      <div className="topbar topbar-wb">
        <div className="brand">
          {brandLeft} <span>×</span> {brandRight}
        </div>
        <div className="pill">
          <span className="pill-dot" />
          {pill}
        </div>
      </div>
      <Whiteboard
        slideId={id}
        sections={sections}
        meta={meta}
        nudgeNextAfterId={nudgeNextAfterId}
      />
    </div>
  );
}
