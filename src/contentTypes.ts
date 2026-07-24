/** Typed content model for a ReasonBoard deck */

export type Persona = {
  id: string;
  name: string;
  role: string;
  /** Who they are / company context */
  about: string;
  /** How they use the product day to day */
  dailyContext: string;
  /** Concrete problems they hit */
  problems: string;
  /** Analysis / KPIs they care about */
  kpis: string;
  /** How the proposed solution helps them */
  forSolution: string;
  image: string;
};

export type ProblemSolutionPair = {
  /** Short label (e.g. Maya · node) */
  who: string;
  problem: string;
  solution: string;
  mockup?: string;
  mockupCaption?: string;
};

/** Destination from a solution note (arrow): memory, or a card that opens a nested deep dive */
export type SolutionBranch = {
  id: string;
  title: string;
  text: string;
  /** Click / Open → nested section (Esc returns to the note) */
  openSectionId?: string;
  image?: string;
  eyebrow?: string;
};

/** Solution note (post-it) tied to a pillar / capability */
export type SolutionNote = {
  id: string;
  title: string;
  /** One line: what it solves, for whom */
  text: string;
  /** Destinations with an arrow (e.g. memory / a related deep dive) */
  branches?: SolutionBranch[];
};

export type DefineBrief = {
  problem: string;
  user: string;
  insight: string;
  metrics: string;
};

export type Criterion = {
  n: string;
  title: string;
  text: string;
};

export type Semaforo = {
  green: string;
  yellow: string;
  red: string;
};

/** Product bug / limit found during research */
export type BugItem = {
  id: string;
  title: string;
  detail: string;
  /** bug = wrong path/answer; limit = claimed capability you cannot exercise */
  kind?: "bug" | "limit";
};

export type EvidenceImage = {
  src: string;
  caption?: string;
  /** Source URL (opens in a new tab) */
  href?: string;
};

/** Side ideas that surfaced during the study (not the core thesis) */
export type IdeaItem = {
  id: string;
  title: string;
  blurb: string;
  detail: string;
  kind: "idea" | "bug";
  ref?: string;
  images?: EvidenceImage[];
};

/** Competitor card: list → Open opens detail guide */
export type CompetitorNote = {
  id: string;
  title: string;
  /** Peer · Enterprise · Measurement… */
  kind: string;
  blurb: string;
  /** What they do */
  does: string;
  /** Why this validates our ideas */
  validates: string;
  /** Where we can go further */
  goesFurther: string;
  href?: string;
  image: string;
  images?: EvidenceImage[];
};

/** One deep-diveable section on the board */
export type Section = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  /**
   * If false: not a node on the root board (nested deep dive only,
   * reached only via a solution branch or another section). Default true.
   */
  onRoot?: boolean;
  body: string[];
  takeaway?: string;
  /** Method / framing sticky (yellow paper) */
  methodNote?: string;
  /** Method note card title (default: "What I'm doing") */
  methodTitle?: string;
  /** Method note card eyebrow (default: "Method") */
  methodEyebrow?: string;
  pairs?: ProblemSolutionPair[];
  /** Solution notes (post-its) tied to the pillars found in research */
  solutionNotes?: SolutionNote[];
  image?: string;
  images?: EvidenceImage[];
  competitorNotes?: CompetitorNote[];
  bugs?: BugItem[];
  ideas?: IdeaItem[];
  personas?: Persona[];
  define?: DefineBrief;
  criteria?: Criterion[];
  semaforo?: Semaforo;
};

/** @deprecated use Section — kept as alias for gradual migration */
export type ModalSection = Section;

/** Optional PNG/SVG sticker seeded onto the root board (e.g. a partner logo) */
export type DeckMetaSticker = {
  id: string;
  src: string;
  alt?: string;
  rotate?: number;
};

/** Root board chrome + seed stickies for one slide */
export type DeckMeta = {
  eyebrow: string;
  /** HTML allowed: &lt;br /&gt; and &lt;em&gt; */
  title: string;
  lede: string;
  seedStickies?: [string, string];
  /** Accent for connectors; defaults to CSS token */
  connectorColor?: string;
  /** Frameless image stickers seeded near the top-right of the root board */
  stickers?: DeckMetaSticker[];
};

export type DeckSlide = {
  id: string;
  brandLeft: string;
  brandRight: string;
  pill: string;
  meta: DeckMeta;
  sections: Section[];
  /** Visual tone for mobile intro */
  tone?: "default" | "solution";
  /** After closing this section's deep-dive, dispatch reasonboard:nudge-next (optional) */
  nudgeNextAfterId?: string;
};

export type Deck = {
  slides: DeckSlide[];
};
