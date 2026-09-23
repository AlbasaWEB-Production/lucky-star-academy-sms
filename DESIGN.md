# Lucky Star Academy — UI redesign decisions

Scope: every surface a user sees — landing, auth, shell, every portal, list
pages, detail pages, forms and empty states. Presentation only: no data layer,
server actions, auth, RLS, routing or `src/lib/**` / `supabase/**` changes.
Spelling of routes, every feature and every piece of information stays as it is.

(Originally written when the system had three portals. The accountant and
schedule officer portals added later reuse the same shell, cards and form
patterns rather than introducing new ones, so every decision below still holds
for them — the five role cards on the landing page are the same card component
at the same radius and the same gold-badge numeral treatment.)

This note records the decisions. Nothing has been edited yet — a go-ahead is
required before touching components.

---

## What the audit found

Confirmed in the current code (these are the tells):

- **No chosen typeface.** `theme.ts` uses the OS stack
  (`-apple-system, System-ui, Segoe UI, Inter, …`). Headings, labels, table text
  and numbers are all the same face at different sizes — no display/heading/body/
  caption separation.
- **One icon-in-a-circle.** `StatCard` puts every icon in an identical 48px circle
  (`borderRadius "50%"` on a tinted green box); the landing role cards and the
  auth panel copy the same motif.
- **Stray hex colours.** `StatCard` accepts a raw-hex `accent`; the dashboards pass
  `#080a43`, `#270843`, `#266810`, `#b26a00`, `#c62828` — leftovers from the
  purple theme that belong to no palette. `MarksBarChart` defaults its bars to
  `#7f56da` (the purple). `register/school/page.tsx` hard-codes `#7f56da`.
- **Six identical tiles.** The admin dashboard is six stat tiles in a uniform
  grid; teacher and student dashboards are similarly flat. No hierarchy.
- **Unwired search.** `AppShell` renders a decorative "Search" field that posts
  nowhere (removed, not kept).
- **Dead nav links.** Landing nav links to `#features` and `#about`; only `#roles`
  exists. Removed instead of inventing sections.
- **Borrowed motifs.** The segmented "Lucky Star for…" chips and the blurred
  `Orb` (with its dashed halo) are lifted from the SchoolAI reference. Both gone.
- **Hero ignores the standing decision.** The landing hero is a plain light
  section; the earlier agreed full-screen 16:9 gradient-with-motifs hero is not
  implemented. This note restores it.
- **`MarksBarChart` default `#7f56da`**, `AttendancePieChart` uses `#266810` /
  `#c62828` inside charts (allowed, but aligned to tokens). Chart cards are the
  same `p:3` outlined `Paper` as everything else.
- **Density is uniform.** `TableShell` is one medium table for both the admin
  roster and a pupil's marks; no difference between "data the staff scan" and
  "the few rows a child reads". Options row has no affordance.
- **Forms are flat stacks.** Full-width fields, `margin="normal"`, one error `Alert`
  at the bottom; fields are not grouped and there is no inline field error.
- **`PAGE-CONVENTIONS.md`** still documents the abandoned purple palette
  (`primary #7f56da`, `secondary #270843`). Updated last.
- **Radius drift.** Cards use `sx borderRadius: 4` (= the 8px multiplier → 32px)
  while the theme `Paper` override is 20px and inputs 12px; cards land on
  different radii by accident, not by intent.

---

## The decisions

### 1. Typeface pairing — **Fraunces** (display) + **Hanken Grotesk** (text)

Two variable Google fonts loaded once through `next/font/google` (self-hosted at
build; no browser requests to Google) and exposed as CSS variables, then mapped
into the theme.

- **Fraunces** — a warm, soft-optical serif with real character. Used for the
  school's identity voice: the hero headline, page titles, section headings, and
  the big numeric values on stat cards. (SOFT axis on, WONK off.)
- **Hanken Grotesk** — a clean, friendly grotesque that carries the *work*:
  body copy, labels, table text, form fields, buttons, captions.

Why Fraunces not Inter/Poppins: Inter and Poppins are the default "template" 
faces. A soft serif headline over a grotesque body reads as a deliberate brand
system — and it immediately separates us from the Notion/Linear/SchoolAI
grotesque look without resorting to decoration.

"One new dependency class" = webfonts (`next/font`), exactly as permitted.

### 2. Type scale — display / heading / body / label

An intentional scale assigned to MUI variants, so each job looks different:

| Job | Face | Sizes |
| --- | --- | --- |
| Display (hero) | Fraunces | `clamp(2.25rem, 5vw, 3.5rem)`, tight line-height |
| Heading (page title) | Fraunces | h4/h5/h6, `1.15` line-height, slight negative tracking |
| Body | Hanken Grotesk | body1/body2, comfortable line-height |
| Label / overline | Hanken Grotesk | uppercase, `+0.08em` tracking, small — used for card labels, nav sections, table captions |
| Numeric value | Fraunces | stat values set large and tabular-ish, so figures read as data, not prose |

`theme.typography` gets a `fontFamily: Hanken` base plus per-variant overrides for
`h1–h6`, `overline`, `button`, `caption`.

### 3. Colour story — green works, gold is a ruling, warm neutrals in between

Keep the school green and gold identity, expressed through tokens only (the only
raw hexes anywhere stay inside chart series).

- `primary.main` `#147B45` (crest green) — the single working colour: primary
  buttons, active nav, selected chips, table header tint, focus rings.
- `secondary.main` `#083E28` (deep green) — **kept as ink**, because it carries
  headings and button text on white. Gold is never swapped in here (contrast).
- `HERO_GREEN` `#0B5130` (saturated deep green) — the landing hero and its
  full-bleed bands. Deeper and richer than the crest green, and about 9:1 with
  white. `ON_GREEN` `#F4F1E8` (warm off-white) is the text colour on those
  grounds.
- Gold `#F2B705` is **not** a text colour on a light ground. It appears in
  exactly these places:
  1. the hand-drawn gold rule under the hero headline keyword — an SVG path that
     draws itself in once,
  2. a small gold dash before the overline kicker labels,
  3. the solid gold star seal that overlaps the hero's lower edge onto the
     portals band,
  4. the gold fill of the one primary button ("Sign in"), with
     `BRAND_GREEN_DARK` text on it,
  5. the gold numeral badges (01 · 02 · 03) on the portal cards, with
     `BRAND_GREEN_DARK` numerals sitting on the gold,
  6. the gold star of the crest standing alone beside the school name.
- Warm neutrals: off-white page `#F7F7F5`, white cards, warm gray `#F0F0EE`
  fills, near-black ink `#1A1A1A`, muted `#6B6B6B`. These become named tokens and
  every hard-coded hex outside a chart is replaced.

### 4. Corner radius system — a small, intentional set

`shape.borderRadius` stays 8 (so numeric `sx` radii stay predictable), but the
*meanings* are fixed and used consistently:

- `pill` (999) — buttons, chips, active nav item, avatar.
- `12px` — inputs, menus, small selections.
- `14px` — metric/summary tiles and list cards.
- `20px` — role/portal cards, notice cards, photo tiles (the "framed" surfaces).
- `24px` — the big surfaces: auth card, dialogs.

Cards no longer drift to 32px via `sx`. A metric tile and a role card share a
scale but differ in structure and content, not in an accidental radius.

### 5. Components differ by purpose — the icon-circle motif is gone

Four distinct card treatments, each with its own skeleton:

- **Metric tile** (dashboard stats) — a quiet card: small uppercase label,
  large serif number, a small **rounded-square** icon chip (not a circle), and a
  fine hairline bottom rule. No `accent` raw-hex prop; colour comes from a small
  set of semantic tokens.
- **Role / portal card** — icon in a tinted rounded square, title, short
  description, and an explicit "Continue →" affordance. A door, not a metric.
- **Notice card** — a date rail on the left, title and excerpt to the right; a
  reading card, not a stat. Used on the landing and on the notice portals.
- **Empty state** — keeps a specific "what's missing" line and always one clear
  next step (already mostly good; tidied into the system).

### 6. Dashboard hierarchy — one primary, the rest secondary

Each dashboard gets a single **primary** metric tile: the number the person first
cares about. On admin that is *Students*; on teacher, *My classes*; on student,
*Overall attendance*. The primary tile is a filled green card with white text;
the remaining tiles are quiet, outlined/neutral. This replaces the uniform grid
and gives every dashboard a focal point. The chart card ("Students per class" /
"Marks by subject") is the second surface and is styled as a proper panel with a
clear caption, not another blank rectangle.

### 7. Density — staff tables dense, pupil surfaces light

`TableShell` gains an intentional density switch rather than one size for all.

- **Admin / teacher data** — compact rows, `size="small"`-style padding, smaller
  cells, tabular numerals, right-aligned numeric columns (marks, counts,
  percentages) and left-aligned names, striped-ish but calm, row hover tint, and
  the whole row is a link where a detail page exists.
- **Student/teacher portal reading** — roomier. Where there is a real table
  (my marks, attendance by subject) it is comfortaable with generous padding and
  the value as the focus; notices and subjects read as cards, not as a table.

### 8. Landing concept — "Saturated green ground" (superseding "A green dawn")

The earlier decision here was a soft off-white-to-green gradient hero with faint
motifs. That gradient's warm end read as white on most screens, which is most of
what made the page feel flat, so it was **replaced** with a full-bleed deep,
saturated green ground (`HERO_GREEN`) and the school's motifs in crisp gold. The
banner's own dark top band is no longer the only thing carrying the contrast.

- **Background:** full-bleed `public/sms_background_image.png` — the school's own
  banner, which already carries the crest, the school name and the "EST. 2014 ·
  A DIFFERENCE OF EXCELLENCE" motto as artwork — under a deep-green scrim that is
  strongest on the left, plus a dark top band so the nav's white links stay
  legible over the bright school building.
- **Hero copy** low in the left band, clearing the banner's baked-in crest:
  overline kicker with the gold dash, Fraunces display headline (`clamp(2.5rem,
  6vw, 4.5rem)` — ~40px on a phone) with the hand-drawn gold rule under the
  keyword, one honest line ("Lucky Star Academy, Yendi · Primary 1–6…"), and a
  **single** action: the gold "Sign in".
- **A gold star seal** hangs below the hero onto the portals band, so the hero and
  the band below it are not two sealed boxes.
- **Below:** the three role-portal cards, each numbered `01 · 02 · 03` on a solid
  gold badge (gold as a fill, never gold text on white) with the whole card
  clickable; then a deep-green "this school" band with the crest, the two campus
  names, and the year — no invented statistics, no testimonials, no placeholder
  copy. School registration is demoted to a quiet text link in the footer.
- **Grounds alternate:** hero (deep green) → portals (light) → this school (deep
  green) → footer (deeper green). No two adjacent sections share a background.
- **Nav:** no lockup over the hero — the banner's crest is the lockup there — with
  honest links that exist and Sign in on the right. The lockup fades in when the
  nav becomes a blurred translucent bar on scroll.

### 9. Auth + shell read as one product

- **AuthShell:** the `Orb` is gone. The split screen keeps form-left; the right
  panel becomes a deep-green brand rail with the crest, the school name in
  Fraunces, and one tagline in the school's own words — a real brand moment, not
  empty space with a borrowed orb. Hidden on mobile as today.
- **AppShell:** remove the unwired search. Top bar = logo + school name/portal
  label (Fraunces, small) on the left, avatar menu on the right. Sidebar keeps
  the green active pill but with the shared radius scale; the section labels use
  the overline treatment. Account menu wears theme tokens.

---

## Left deliberately alone

- **The data model, RLS, server actions and routing** — out of scope, untouched.
- **Content** — no new copy, statistics, testimonials or imagery invented. Only
  removals (dead links, decorative search) and honest wording.
- **Charts** — same libraries and data; re-aligned to tokens and to a single
  panel treatment.
- The functional behaviour of every form, confirm dialog and server page stays
  identical; this is surface only.

## Still needs the owner's judgement

- The **Fraunces + Hanken Grotesk pairing** (the most visible choice). If you'd
  rather keep an all-grotesque look, I'll swap Fraunces for a warm sans display.
- ~~The **gradient hero**~~ — **decided**: the off-white-to-green gradient was
  replaced by the saturated green ground in §8. This is what shipped.
- **Gold placement** (the six spots above). Fine to adjust the list.