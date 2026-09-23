/**
 * Every word and fact the public website renders.
 *
 * Two rules govern this file, and they are the reason it exists as one module
 * rather than copy scattered through the pages:
 *
 *  1. **Nothing is invented.** Every value below is either a fact the school
 *     has already stated (its name, Yendi, Primary 1–6, the two campuses, the
 *     founding year and the motto — all of which appear on the school's own
 *     banner), or it is an explicit `pending(...)` marker naming what is still
 *     needed. There are no plausible-looking placeholder phone numbers, no
 *     invented statistics and no testimonial copy — a wrong-but-plausible
 *     number is worse than a visible gap, which is the failure mode this
 *     codebase already writes about at length in `DECISIONS.md`.
 *
 *  2. **The gap is visible.** `pending(...)` values render as a marked
 *     placeholder on the page, so a reviewer can see exactly what is
 *     outstanding, and a premature launch shows a gap rather than a falsehood.
 *     `PLACEHOLDERS.md` is the same list in handover form.
 *
 * To finish the site, replace `pending("…")` with `fact("…")`. Nothing else
 * needs to change.
 */

export type Detail = {
  /** The text rendered on the page. */
  value: string;
  /** True while the school has not supplied this value. */
  pending?: boolean;
  /** What the school needs to send. Shown in `PLACEHOLDERS.md`, never on the page. */
  note?: string;
};

/** A value the school has given us. */
export function fact(value: string): Detail {
  return { value };
}

/** A value still outstanding, rendered as a visible placeholder. */
export function pending(note: string): Detail {
  return { value: "To be confirmed", pending: true, note };
}

/* -------------------------------------------------------------------------- */
/*  The school                                                                */
/* -------------------------------------------------------------------------- */

export const school = {
  name: "Lucky Star Academy",
  /** Used where the full name would repeat too often. */
  shortName: "Lucky Star",
  town: "Yendi",
  region: "Northern Region",
  country: "Ghana",
  /** Written as the school writes it on its banner. */
  motto: "A Difference of Excellence",
  founded: "2014",
  levels: "Primary 1–6",
  /** From `classes.campus` in the school's own data. */
  campuses: ["Nayilifong", "Kpatuya"],
} as const;

/** One line the whole site agrees on, used in metadata and the footer. */
export const TAGLINE = `A ${school.levels} school in ${school.town}, ${school.region}, Ghana.`;

export const INTRO =
  "Lucky Star Academy is a Primary 1–6 school in Yendi, in the Northern Region of Ghana. Since 2014 we have taught one motto: a difference of excellence.";

/* -------------------------------------------------------------------------- */
/*  Contact                                                                   */
/* -------------------------------------------------------------------------- */

export const contact = {
  addressLine1: pending("The school's street address, or its Ghana Post GPS digital address"),
  town: school.town,
  region: school.region,
  country: school.country,
  phone: pending("The school office phone number, in the form families should dial"),
  phoneAlt: pending("A second phone number for the office, if there is one"),
  email: pending("The school's email address, once the domain is registered"),
  officeHours: pending("Office opening hours, and the days the office is closed"),
  /** Confirmed by nothing yet — kept out of the rendered page until it is. */
  postalAddress: pending("A postal address, if the school uses one for correspondence"),
} as const;

/**
 * Pre-filled WhatsApp / mail links must never point at a placeholder, so the
 * pages check these before rendering a `tel:` or `mailto:` link.
 */
export function isKnown(detail: Detail): boolean {
  return !detail.pending;
}

/* -------------------------------------------------------------------------- */
/*  Home page                                                                 */
/* -------------------------------------------------------------------------- */

/** The four things we can state as fact on the home page. */
export const highlights: readonly { title: string; body: string }[] = [
  {
    title: "Primary 1 to 6",
    body: "Six year groups under one school, from Primary 1 through to the Primary 6 leaving class.",
  },
  {
    title: "Two campuses",
    body: `Our classes sit across two campuses in ${school.town} — ${school.campuses.join(" and ")}.`,
  },
  {
    title: `Since ${school.founded}`,
    body: `The school was established in ${school.founded} and still teaches to one motto: ${school.motto.toLowerCase()}.`,
  },
  {
    title: "Records kept for every pupil",
    body: "Attendance and examination marks are recorded class by class, term by term, so a child's progress can be followed rather than guessed at.",
  },
];

/**
 * Deliberately not a "why parents choose us" list.
 *
 * We have no survey, no results table and no testimonials, so any such heading
 * would be a claim the school cannot stand behind. These describe what the
 * school is.
 */

/* -------------------------------------------------------------------------- */
/*  The bands, taken from the reference layout                                */
/* -------------------------------------------------------------------------- */
/*
 * The reference design (see SITE.md § 7) carries a strip of five short claims,
 * a strip of five numbers, three fact cards and a "legacy" card on the hero.
 * Every one of its values describes a different school — a K-12 international
 * school founded in 1998 with 1,500 pupils and 98% university acceptance. None
 * of that is true of Lucky Star, so the *slots* are kept and the *values* are
 * either the school's own facts or an explicit pending marker.
 *
 * The one deliberate departure from the reference: its numbers are illustrative,
 * and illustrative numbers on a real school's website are indistinguishable from
 * true ones. These read "To be confirmed" instead, which is also the client's
 * to-do list.
 */

/**
 * The school's values.
 *
 * Declared above the band that uses it because the band is on the home page and
 * the same words appear again in the About page's values section further down
 * this file. One copy, referenced twice — the alternative is two lists that can
 * disagree about what the school stands for, and the About page's copy would be
 * the one nobody remembered to update.
 */
const SCHOOL_VALUES = pending(
  "Three to five values the school wants to be known for, with a line on each",
);

/** The five short claims in the band that overlaps the hero. */
export const valueBand: readonly { title: string; body: Detail }[] = [
  {
    title: `Primary 1 to 6`,
    body: fact("The whole primary course, under one roof."),
  },
  {
    title: "Two campuses",
    body: fact(`${school.campuses.join(" and ")}, in ${school.town}.`),
  },
  {
    title: `Since ${school.founded}`,
    body: fact(`Teaching to one motto: ${school.motto.toLowerCase()}.`),
  },
  {
    title: "Records kept",
    body: fact("Attendance and marks recorded for every pupil, every term."),
  },
  {
    title: "Our values",
    body: SCHOOL_VALUES,
  },
];

/** Stable keys, so the component can pair a figure with its icon. */
export type StatKey = "years" | "pupils" | "teachers" | "awards" | "progress";

/**
 * The numbers strip.
 *
 * Every value is pending. The reference's fifth figure is "98% university
 * acceptance", which is not a thing a primary school has; its honest analogue
 * here is how many Primary 6 pupils go on to junior high school, and by what
 * measure.
 */
export const statsBand: readonly { key: StatKey; label: string; value: Detail }[] = [
  {
    key: "years",
    label: "Years of teaching",
    value: pending(
      "How many years the school has been running. It is derivable from the founding year (2014) if the school would rather not state a number",
    ),
  },
  {
    key: "pupils",
    label: "Pupils enrolled",
    value: pending("The number of pupils currently enrolled, across both campuses"),
  },
  {
    key: "teachers",
    label: "Teachers",
    value: pending("The number of teaching staff"),
  },
  {
    key: "awards",
    label: "Awards won",
    value: pending("Any awards, competitions or recognitions the school wants to publish"),
  },
  {
    key: "progress",
    label: "On to junior high",
    value: pending(
      "How many Primary 6 pupils progress to junior high school, and the measure the school uses",
    ),
  },
];

export type FactKey = "ratio" | "clubs" | "campuses";

/** The three cards beside the About photograph. */
export const factCards: readonly { key: FactKey; label: string; value: Detail }[] = [
  {
    key: "ratio",
    label: "Pupils per teacher",
    value: pending("The school's pupil-to-teacher ratio"),
  },
  {
    key: "clubs",
    label: "Clubs and activities",
    value: pending("The clubs, sports and activities the school actually runs"),
  },
  {
    key: "campuses",
    label: "Campuses in Yendi",
    value: fact("Two"),
  },
];

/** The three figures beside the About copy — all of them stated facts. */
export const aboutMiniStats: readonly { value: string; label: string }[] = [
  { value: school.founded, label: "Established" },
  { value: school.levels, label: "Classes taught" },
  { value: String(school.campuses.length), label: "Campuses in Yendi" },
];

/** The card that hangs off the hero's lower edge. */
export const legacyCard = {
  lead: "A legacy of",
  emphasis: "Excellence",
  since: `Since ${school.founded}`,
} as const;

/**
 * The footer's newsletter column.
 *
 * The reference ships a subscribe field that validates the address and then
 * says, in its own script, that nothing was submitted. That is an unwired
 * affordance — the same thing `DESIGN.md` removed from the signed-in shell
 * ("Unwired search. Removed, not kept") — so this column states what it is
 * waiting for instead of collecting addresses it cannot keep.
 */
export const newsletter = {
  heading: "Stay connected",
  body: "School news and announcements, sent straight to your inbox.",
  service: pending(
    "A mailing list or email service. Until one exists, this column points families at the school office rather than collecting addresses",
  ),
} as const;

export const welcome = {
  overline: "Welcome",
  heading: "A school in Yendi, built on one idea",
  /** The school's own words about itself — the paragraph the client will replace. */
  body: pending(
    "Two or three paragraphs in the school's own words: why it was founded, who it serves, and what it is trying to do for its pupils",
  ),
  /** Safe, factual fallback shown until the paragraph above arrives. */
  bodyFallback: INTRO,
} as const;

/* -------------------------------------------------------------------------- */
/*  About page                                                                */
/* -------------------------------------------------------------------------- */

export const about = {
  heading: "About our school",
  lead: `${school.name} is a private basic school in ${school.town}, in Ghana's ${school.region}. We teach ${school.levels}.`,
  story: {
    heading: "Our story",
    /** The founding year is real; everything after it is the client's to write. */
    body: pending(
      "The school's history in its own words: who founded it, why, how it has grown, and what it looks like today",
    ),
    bodyFallback: `The school was established in ${school.founded}. Classes are held across two campuses in ${school.town}: ${school.campuses.join(" and ")}.`,
  },
  mission: pending("The school's mission statement"),
  vision: pending("The school's vision statement"),
  values: {
    /** Shared with the home page's values band — see `SCHOOL_VALUES`. */
    items: SCHOOL_VALUES,
  },
  leadership: {
    heading: "Our leadership",
    headTeacher: pending("The head teacher's name, and their title as the school writes it"),
    note: pending("Whether the school wants a staff page, and which staff may be listed"),
  },
  /** Which year groups sit at which campus — `classes.campus` holds this, but a
   *  public page should state it from the school, not infer it from a fallback. */
  campusClasses: pending("Which classes are held at each campus"),
  registration: pending(
    "The school's GES registration number and any other official registration details the school is willing to publish",
  ),
} as const;

/* -------------------------------------------------------------------------- */
/*  Academics page                                                            */
/* -------------------------------------------------------------------------- */

export const academics = {
  heading: "Academics",
  lead: `We teach ${school.levels} — the full primary course, from a child's first year to the year they leave for junior high school.`,
  stages: [
    {
      /** Stable key, so the home page's cards can be derived from these. */
      key: "lower-primary",
      name: "Lower Primary",
      classes: "Primary 1 – 3",
      summary: "Where a child's first years of school are built.",
      body: pending("What the lower primary years focus on, in the school's words"),
    },
    {
      key: "upper-primary",
      name: "Upper Primary",
      classes: "Primary 4 – 6",
      summary: "The years that lead on to junior high school.",
      body: pending("What the upper primary years focus on, and how the leaving year is prepared"),
    },
  ],
  subjects: {
    heading: "Subjects taught",
    summary: "The subjects taught at each level.",
    items: pending(
      "The list of subjects taught at each level, as the school names them (the school's own subjects list is the source)",
    ),
  },
  assessment: {
    heading: "Progress and reports",
    summary: "How progress is measured, and what a report card shows.",
    body: pending(
      "How the school assesses pupils — class exercises, end-of-term examinations, what appears on a report card, and how often reports are sent home",
    ),
    bodyFallback:
      "Attendance and examination marks are recorded for every pupil, class by class and term by term.",
  },
  schoolDay: {
    heading: "The school day",
    items: pending("Opening and closing times for each level, the break, and the days the school is closed"),
  },
  calendar: {
    heading: "Term dates",
    summary: "The three terms of the school year.",
    items: pending("The three-term calendar for the coming academic year — each term's start and end dates"),
    /** The structure is correct for Ghanaian basic schools even before the dates are known. */
    structure: "The school year runs in three terms, in line with the Ghana Education Service calendar.",
  },
} as const;

/**
 * The cards in the home page's programme row.
 *
 * **Derived from `academics`, not written again.** The row and the Academics
 * page describe the same five things, so a change to a stage, a subject list or
 * the assessment wording has to appear in both — and the only way to guarantee
 * that is for there to be one copy of it. This is the same rule the repo already
 * applies to `roleHome` (DECISIONS.md § 19) and to `SITE_NAV`.
 *
 * The row is the layout's, adapted: the reference design has five cards for a
 * K-12 school's programmes. Lucky Star teaches Primary 1-6, so the five cards
 * are the two stages of primary school plus the three questions a parent
 * actually asks about the curriculum.
 */
export type ProgrammeCard = {
  key: string;
  title: string;
  /** The small label along the card's foot, e.g. `Primary 1 – 3`. */
  meta: string;
  summary: string;
  /** The dialog's body. */
  detail: Detail;
  /** Shown under a pending dialog body when there is something true to say. */
  fallback?: string;
};

export const programmeCards: readonly ProgrammeCard[] = [
  ...academics.stages.map((stage) => ({
    key: stage.key,
    title: stage.name,
    meta: stage.classes,
    summary: stage.summary,
    detail: stage.body,
  })),
  {
    key: "subjects",
    title: academics.subjects.heading,
    meta: "Curriculum",
    summary: academics.subjects.summary,
    detail: academics.subjects.items,
  },
  {
    key: "assessment",
    title: academics.assessment.heading,
    meta: "Progress",
    summary: academics.assessment.summary,
    detail: academics.assessment.body,
    fallback: academics.assessment.bodyFallback,
  },
  {
    key: "calendar",
    title: academics.calendar.heading,
    meta: "Three terms",
    summary: academics.calendar.summary,
    detail: academics.calendar.items,
    fallback: academics.calendar.structure,
  },
];

/* -------------------------------------------------------------------------- */
/*  Admissions page                                                           */
/* -------------------------------------------------------------------------- */

export const admissions = {
  heading: "Admissions",
  lead: `We admit pupils into ${school.levels}. Families are welcome to visit the school, meet the teachers and see a class before deciding.`,
  /** The steps are generic to any school; the details behind them are the client's. */
  steps: [
    {
      title: "Visit or call the school office",
      body: pending("How a family should first make contact, and who they should ask for"),
    },
    {
      title: "Collect and complete the admission form",
      body: pending("Where the form is obtained, and what it asks for"),
    },
    {
      title: "Bring the required documents",
      body: pending("The exact documents required — birth certificate, previous school records, photographs, and so on"),
    },
    {
      title: "Confirm your child's place",
      body: pending("How a place is confirmed, and by when, once the form and documents are in"),
    },
  ],
  requirements: {
    heading: "What to bring",
    items: pending("The definitive list of documents a family must bring when applying"),
  },
  fees: {
    heading: "School fees",
    body: pending(
      "How the school wants fees presented publicly: either the published termly fee per level, or a line directing families to the office",
    ),
    bodyFallback:
      "Fee information is available from the school office. Please contact us and we will explain what is payable each term.",
  },
  faqs: [
    {
      question: "Which classes can my child join?",
      answer: `We admit pupils into ${school.levels}.`,
    },
    {
      question: "Where are the classes held?",
      answer: `Classes are held at our two campuses in ${school.town}: ${school.campuses.join(" and ")}. The office will tell you which campus your child's class sits at.`,
    },
    {
      question: "When does the school year begin?",
      answer:
        "The school year follows the Ghana Education Service three-term calendar. Please contact the office for the current term's dates.",
    },
    {
      question: "Can we visit before applying?",
      answer:
        "Yes. Families are welcome to visit the school and see a class. Please call the office first so that someone is free to show you around.",
    },
  ],
  /** The admission form itself does not exist on this site yet — see PLACEHOLDERS.md. */
  onlineApplication: pending(
    "Whether the school wants an online application form on this website; it needs an email service or a server action behind it before one can be built honestly",
  ),
} as const;

/* -------------------------------------------------------------------------- */
/*  Gallery                                                                   */
/* -------------------------------------------------------------------------- */

export const gallery = {
  heading: "Gallery",
  lead: "Photographs of school life at Lucky Star Academy.",
  /**
   * The repo holds no usable photographs of the school. `classroom.png` is a
   * generic vector illustration, `img1–4.png` are 64px interface icons, and
   * `backg.jpg` is a watermarked Adobe Stock image that must not be published.
   * Publishing stock photography as though it were the school would be a lie
   * told in pictures, so the gallery ships as an honest empty state instead.
   */
  needs: pending("Photographs of the school: campus, classrooms, pupils at work, and school events"),
  consent: pending(
    "The school's position on publishing photographs in which pupils are identifiable, including written parental consent",
  ),
} as const;

/* -------------------------------------------------------------------------- */
/*  Social                                                                    */
/* -------------------------------------------------------------------------- */

export const social = {
  facebook: pending("The school's Facebook page address, if it has one"),
  whatsapp: pending("The number families should use on WhatsApp, if the school wants one published"),
  /** Linked only when known, so no link ever points at a placeholder. */
} as const;
