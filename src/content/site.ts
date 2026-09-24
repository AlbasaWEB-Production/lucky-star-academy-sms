/**
 * Every word and fact the public website renders.
 *
 * Two rules govern this file, and they are the reason it exists as one module
 * rather than copy scattered through the pages:
 *
 *  1. **Nothing is invented.** Every value below is either a fact the school
 *     has stated, or it is an explicit `pending(...)` marker naming what is
 *     still needed. There are no plausible-looking placeholder phone numbers,
 *     no invented statistics and no testimonial copy — a wrong-but-plausible
 *     value is worse than a visible gap, which is the failure mode this
 *     codebase already writes about at length in `DECISIONS.md`.
 *
 *  2. **The gap is visible.** `pending(...)` values render as a marked
 *     placeholder on the page, so a reviewer can see exactly what is
 *     outstanding. `PLACEHOLDERS.md` is the same list in handover form.
 *
 * To finish the site, replace `pending("…")` with `fact("…")`. Nothing else
 * needs to change.
 *
 * ## Where the confirmed facts came from
 *
 * Everything not marked `pending` was supplied by the school: the name, motto,
 * founding year, town and region, the five values, the two campuses and their
 * addresses, the telephone numbers and email address, the four programmes with
 * the classes and subjects inside each, the four registrations, and the Admin
 * and Finance Officer's name. The school's own banner supplied the motto and
 * the founding year before that.
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
  /**
   * The school teaches preschool and primary. See `programmes` for the four
   * programmes and the classes inside each.
   */
  levels: "Preschool to Basic 6",
  /** From `classes.campus` in the school's own data. */
  campuses: ["Nayilifong", "Kpatuya"],
} as const;

/** The two campuses, with the addresses the school gave. */
export const campuses: readonly { name: string; address: string }[] = [
  {
    name: school.campuses[0],
    address: "Adjacent Gukpegu Junction, along the Yendi–Tatale Road",
  },
  {
    name: school.campuses[1],
    address: "Behind Dagbon State SHS, Yendi",
  },
];

/**
 * The school's registrations, as supplied.
 *
 * Worth stating on the website and worth stating **accurately**: a parent
 * checking whether a school is registered will compare these names against the
 * bodies' own, so the acronyms are written as the bodies write them — `NaSIA`,
 * not `NASIA`, and the `Registrar-General's Department`.
 */
export const registrations: readonly string[] = [
  "Ghana Education Service (GES)",
  "National Schools Inspectorate Authority (NaSIA)",
  "Department of Social Welfare",
  "Registrar-General's Department",
];

/** One line the whole site agrees on, used in metadata and the footer. */
export const TAGLINE = `A preschool and primary school in ${school.town}, ${school.region}, Ghana.`;

export const INTRO =
  "Lucky Star Academy is a preschool and primary school in Yendi, in the Northern Region of Ghana. " +
  "Since 2014 we have taught one motto: a difference of excellence.";

/**
 * The one-line description used in page metadata and link previews.
 *
 * Held here rather than composed at each call site because `${school.levels}`
 * reads awkwardly inside a sentence — "a Preschool to Basic 6 school" — and a
 * search result is the last place to sound like a database.
 */
export const META_DESCRIPTION =
  `${school.name} is a preschool and primary school in ${school.town}, ${school.region}, Ghana ` +
  `— creche to Basic 6, with Islamic Studies and Digital Studies alongside the school curriculum. ` +
  `Established ${school.founded}.`;

/* -------------------------------------------------------------------------- */
/*  Contact                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Pre-filled WhatsApp / mail links must never point at a placeholder, so every
 * `tel:` and `mailto:` on the site is gated on `isKnown()`. That is what makes
 * the utility bar and the footer grow working links by themselves.
 */
export function isKnown(detail: Detail): boolean {
  return !detail.pending;
}

export const contact = {
  phone: fact("024 042 3100"),
  phoneAlt: fact("054 764 6286"),
  email: fact("school.luckystar@gmail.com"),
  town: school.town,
  region: school.region,
  country: school.country,
  officeHours: pending("Office opening hours, and the days the office is closed"),
  postalAddress: pending("A postal address, if the school uses one for correspondence"),
} as const;

/* -------------------------------------------------------------------------- */
/*  What the school stands for                                                */
/* -------------------------------------------------------------------------- */

/** The five values, as the school names them. */
export const values: readonly string[] = [
  "Discipline",
  "Faith",
  "Excellence",
  "Knowledge",
  "Love",
];

/** The paragraph the school will write about itself. */
export const welcome = {
  overline: "Welcome",
  heading: "A school in Yendi, built on one idea",
  body: pending(
    "Two or three paragraphs in the school's own words: why it was founded, who it serves, and what it is trying to do for its pupils",
  ),
  /** Safe, factual fallback shown until the paragraph above arrives. */
  bodyFallback: INTRO,
} as const;

/* -------------------------------------------------------------------------- */
/*  The bands, taken from the reference layout                                */
/* -------------------------------------------------------------------------- */
/*
 * The reference design (see SITE.md § 7) carries a strip of five short claims,
 * a strip of five numbers, three fact cards and a "legacy" card on the hero.
 * Every one of its values describes a different school — a K-12 international
 * school founded in 1998 with 1,500 pupils and 98% university acceptance.
 *
 * The slots are kept and the values are Lucky Star's own. Now that the school
 * has supplied its programmes, the values band is **entirely fact** — it no
 * longer carries a placeholder at all.
 */

/** The five short claims in the band that overlaps the hero. */
export const valueBand: readonly { title: string; body: Detail }[] = [
  {
    title: "Preschool to Basic 6",
    body: fact("Creche, nursery and kindergarten, then Basic 1 through to Basic 6."),
  },
  {
    title: "Islamic studies",
    body: fact("Quran, Hadith, Fiqh, Luga, Tawheed and Seerah."),
  },
  {
    title: "Digital studies",
    body: fact("Computing, coding, robotics and AI."),
  },
  {
    title: "Two campuses in Yendi",
    body: fact(`${school.campuses.join(" and ")}, on either side of town.`),
  },
  {
    title: "Our values",
    body: fact(values.join(" · ")),
  },
];

/** Stable keys, so the component can pair a figure with its icon. */
export type StatKey = "years" | "pupils" | "teachers" | "awards" | "progress";

/**
 * The numbers strip.
 *
 * Every value is still pending. The reference's fifth figure is "98%
 * university acceptance", which is not a thing a primary school has; its honest
 * analogue here is how many Basic 6 pupils go on to junior high school, and by
 * what measure.
 *
 * The school supplied its programmes and its registrations but no figures, so
 * these read "To be confirmed" rather than being guessed. The years figure is
 * derivable from the founding year (2014) if the school would rather not state
 * a number.
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
      "How many Basic 6 pupils progress to junior high school, and the measure the school uses",
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
  { value: "Basic 1–6", label: "Primary classes" },
  { value: "4", label: "Programmes taught" },
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

/* -------------------------------------------------------------------------- */
/*  Programmes — the four things the school teaches                           */
/* -------------------------------------------------------------------------- */

/**
 * The programmes, and the classes and subjects inside each.
 *
 * **All four are supplied.** The names, the labels and every entry in `courses`
 * came from the school; only the descriptive paragraph (`body`) is still open.
 * So the cards and their detail panels render real content rather than
 * placeholders, which is what the programme row was built to show.
 *
 * This one array feeds the home page's card row **and** the Academics page, so
 * the two cannot disagree — the rule the repo already applies to `SITE_NAV` and
 * `roleHome`.
 */
export type Programme = {
  key: string;
  name: string;
  /** The small label along the card's foot. */
  meta: string;
  summary: string;
  /** The classes or subjects inside the programme. All supplied. */
  courses: readonly string[];
  /** The description, which the school has not written yet. */
  body: Detail;
  fallback?: string;
};

export const programmes: readonly Programme[] = [
  {
    key: "preschool",
    name: "Preschool",
    meta: "Creche · Nursery · Kindergarten",
    summary: "Where a child's first years of school begin.",
    courses: ["Creche", "Nursery", "Kindergarten"],
    body: pending(
      "What the preschool years focus on, and the age each class takes (creche, nursery and kindergarten)",
    ),
  },
  {
    key: "primary",
    name: "Primary",
    meta: "Basic 1 – 6",
    summary: "Six years of basic education, from Basic 1 to the leaving class.",
    courses: ["Basic 1", "Basic 2", "Basic 3", "Basic 4", "Basic 5", "Basic 6"],
    body: pending(
      "What the primary years cover, and how the Basic 6 year is prepared for junior high school",
    ),
  },
  {
    key: "islamic-studies",
    name: "Islamic Studies",
    meta: "Six subjects",
    summary: "Quran and the Islamic sciences, taught alongside the school curriculum.",
    courses: ["Quran", "Hadith", "Fiqh", "Luga", "Tawheed", "Seerah"],
    body: pending(
      "How Islamic Studies is taught — whether it is taken by every pupil or offered as an option, and at which levels",
    ),
  },
  {
    key: "digital-studies",
    name: "Digital Studies",
    meta: "Computing · Coding · Robotics · AI",
    summary: "Computing and technology, from first steps through to robotics.",
    courses: ["Computing", "Coding", "Robotics", "AI"],
    body: pending("How Digital Studies is taught, and what equipment the school has for it"),
  },
];

/* -------------------------------------------------------------------------- */
/*  About page                                                                */
/* -------------------------------------------------------------------------- */

export const about = {
  heading: "About our school",
  lead: `${school.name} is a preschool and primary school in ${school.town}, in Ghana's ${school.region}. We teach ${school.levels}.`,
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
  campusClasses: pending("Which classes and programmes are held at each campus"),
  /** The registrations themselves are confirmed; only the numbers are open. */
  registrationNumbers: pending(
    "The registration or certificate numbers for the four bodies, if the school wants them published",
  ),
} as const;

/* -------------------------------------------------------------------------- */
/*  Staff                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The staff page.
 *
 * Two entries today. The head teacher's name has not been supplied — the school
 * marked it with an ❌ — so that card renders as a visible placeholder rather
 * than being quietly omitted, which is what makes the page a to-do list as well
 * as a staff list.
 *
 * `more` records the open question about how far the list should go: a page
 * that names only two people invites the question of where the teachers are,
 * and the answer may simply be that the school would rather not publish them.
 * That is the school's call to make.
 */
export type StaffMember = {
  key: string;
  name: Detail;
  role: string;
};

export const staff = {
  heading: "Our staff",
  lead: "The people who lead the school and run its office.",
  members: [
    {
      key: "head-teacher",
      name: pending("The head teacher's name, and their title as the school writes it"),
      role: "Head Teacher",
    },
    {
      key: "admin-finance",
      name: fact("Abdulai Rahama"),
      role: "Admin and Finance Officer",
    },
  ] as readonly StaffMember[],
  more: pending(
    "Whether teaching staff should be listed on this page too, and which of them may be named",
  ),
} as const;

/* -------------------------------------------------------------------------- */
/*  Academics page                                                            */
/* -------------------------------------------------------------------------- */

export const academics = {
  heading: "Academics",
  lead: `We teach ${school.levels} — preschool and primary, with two programmes running alongside them: Islamic Studies and Digital Studies.`,
  subjects: {
    heading: "Subjects taught",
    summary: "The subjects taught in the primary classes.",
    items: pending(
      "The list of subjects taught in the primary classes, as the school names them. The Islamic Studies and Digital Studies subjects are already published on this page",
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
    summary: "Opening and closing times.",
    items: pending(
      "Opening and closing times for each level, the break, and the days the school is closed",
    ),
  },
  calendar: {
    heading: "Term dates",
    summary: "The three terms of the school year.",
    items: pending(
      "The three-term calendar for the coming academic year — each term's start and end dates",
    ),
    /** The structure is correct for Ghanaian basic schools even before the dates are known. */
    structure: "The school year runs in three terms, in line with the Ghana Education Service calendar.",
  },
} as const;

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
      body: pending(
        "The exact documents required — birth certificate, previous school records, photographs, and so on",
      ),
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
      answer: `We admit pupils into ${school.levels} — creche, nursery and kindergarten, then Basic 1 through to Basic 6.`,
    },
    {
      question: "Where are the classes held?",
      answer: `Classes are held at our two campuses in ${school.town}: ${school.campuses.join(" and ")}. The office will tell you which campus your child's class sits at.`,
    },
    {
      question: "Does the school teach Islamic Studies?",
      answer:
        "Yes. Islamic Studies is one of our four programmes, covering Quran, Hadith, Fiqh, Luga, Tawheed and Seerah. Please contact the office to ask how it is arranged for your child's class.",
    },
    {
      question: "Is the school registered?",
      answer:
        "Yes. Lucky Star Academy is registered with the Ghana Education Service, the National Schools Inspectorate Authority, the Department of Social Welfare and the Registrar-General's Department.",
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
   * The repo holds no photographs of the school beyond its own banner.
   * `classroom.png` is a generic vector illustration, `img1–4.png` are 64px
   * interface icons, and `backg.jpg` is a watermarked Adobe Stock image that
   * must not be published. The image slots use labelled stock stand-ins —
   * see `PLACEHOLDERS.md`.
   */
  needs: pending(
    "Photographs of the school: both campuses, classrooms, pupils at work, and school events",
  ),
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
