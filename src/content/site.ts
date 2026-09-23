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
    /** Individual values are the school's to name. */
    items: pending("Three to five values the school wants to be known for, with a line on each"),
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
      name: "Lower Primary",
      classes: "Primary 1 – 3",
      body: pending("What the lower primary years focus on, in the school's words"),
    },
    {
      name: "Upper Primary",
      classes: "Primary 4 – 6",
      body: pending("What the upper primary years focus on, and how the leaving year is prepared"),
    },
  ],
  subjects: {
    heading: "Subjects taught",
    items: pending(
      "The list of subjects taught at each level, as the school names them (the school's own subjects list is the source)",
    ),
  },
  assessment: {
    heading: "How progress is measured",
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
    items: pending("The three-term calendar for the coming academic year — each term's start and end dates"),
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
