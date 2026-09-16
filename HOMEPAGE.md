# Homepage rebuild — concept note

Status: **approved and shipped.** This is the plan as approved before building;
§12 records what actually shipped and where it differs. Per `homepage-prompt.md`
the note was written first and work stopped for a go-ahead.

> Path note: the prompt was written against the pre-flatten layout (`web/src/…`,
> `web/public/…`, `web/HOMEPAGE.md`). The app now lives at the repo root, so every
> `web/` path in the prompt maps as `web/X` → `X`. This note is the flattened
> `HOMEPAGE.md`, and the build targets `src/app/page.tsx`, `src/components/…`,
> `src/theme.ts`, `src/app/globals.css`.

---

## 1. The starting point — and where the prompt no longer matches the code

The prompt's audit describes the page as it was *before* the banner commit
(`6dfa5f0`, "Use the school banner as the homepage and sign-in hero"). Two of its
seven causes have already moved:

| # | Cause named in the prompt | Still true today? |
| --- | --- | --- |
| 1 | Every section on the same pale ground in one `maxWidth="lg"` container | **Yes** |
| 2 | Every surface the same outlined white 20px card | **Yes** |
| 3 | Hero gradient off-white → 16% green, indistinguishable from white | **No** — the hero is now the full-bleed `sms_background_image.png` banner with a deep-green scrim |
| 4 | Display headline barely outranks body copy | **Partly** — `h1` is `clamp(2.25rem, 5vw, 3.5rem)` (36→56px), below the prompt's 64–88px target |
| 5 | Nothing overlaps, bleeds, or is asymmetric | **Yes** |
| 6 | Hero's right half is four empty frames (`StudentPhotoCollage` → missing files) | **Changed** — `page.tsx` no longer renders the collage at all; `StudentPhotoCollage.tsx` is now **orphaned** (imported nowhere) |
| 7 | "Get started" is the wrong primary CTA | **Partly** — "Sign in" is already the gold contained button; "Create school" is still an outlined peer beside it |

So the job is real, but it is **less a rescue than the prompt implies** and more a
step up: give the page grounds that alternate, a true display scale, grid-breaking
photography, gold used boldly, real motion, and one clear primary action.

**Blocker A — the photographs do not exist.** `public/photos/` is absent from the
working tree and from git history; none of `pupils-ict.jpg`, `pupils-culture.jpg`,
`pupils-sports.jpg`, `pupils-garden.jpg` exist. The prompt forbids substituting
stock, illustration or generated images, and forbids empty frames. With zero real
photographs, the specified collage has nothing to hold.

---

## 2. Supplied facts — what is filled in, what is not

The prompt's "fill in before running" block is **entirely blank**. Per its own
rule, a blank line means the element is omitted, not guessed.

| Input | State | Effect on the build |
| --- | --- | --- |
| Hero photo filenames | **blank**, and the files are missing | **Blocks the collage** (see Blocker A) |
| Public school website URL | **blank** | "Visit our website" link omitted |
| School motto / tagline | **blank** | Omitted |
| Campus names | **blank** — but `Nayilifong` and `Kpatuya` are real, in `classes.campus` and `ANALYTICS-ROADMAP.md` | Could be stated as existing fact; needs confirmation |
| Founding year | **blank** | Omitted |

Facts that **are** available and true, from the codebase: the school's name, Yendi
and the Northern Region, Primary 1–6, and the existing banner photograph.

---

## 3. Section-by-section plan

Four movements, alternating grounds, no two adjacent sections sharing a background.

```
┌────────────────────────────────────────────────────────────┐
│ NAV — transparent over hero → blurred translucent on scroll │
│  [crest] Lucky Star Academy            Portals    Sign in   │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ▬ LUCKY STAR ACADEMY · YENDI, GHANA      (gold dash rule)  │
│                                                             │
│  School management,                     ┌────────────────┐  │
│  streamlined for                        │  banner        │  │
│  every classroom.                       │  photograph    │  │
│  ▔▔▔▔▔▔▔▔▔▔▔▔▔  ← hand-drawn SVG          │  (offset,      │  │
│                    gold underline        │  overlaps the  │  │
│  One honest line of body copy.           │  boundary)     │  │
│                                          └────────────────┘  │
│  [ Sign in → ]   Create a school account                    │
│                   (demoted to a quiet link)                 │
│                                                             │
│  DEEP SATURATED GREEN ground · crisp gold star motif        │
│  faint film grain overlay (aria-hidden)                     │
└────────────────────────────────────────────────────────────┘
        ▲ photograph + tilt breaks the section boundary ▼

┌────────────────────────────────────────────────────────────┐
│ PORTALS                                    LIGHT (PAGE_BG)  │
│                                                             │
│  01                    02                   03              │
│  ┌───────────┐         ┌───────────┐        ┌───────────┐   │
│  │ ▲ icon    │         │ ▲ icon    │        │ ▲ icon    │   │
│  │ Administr.│         │ Teacher   │        │ Student   │   │
│  │ descriptor│         │ descriptor│        │ descriptor│   │
│  │ Continue →│         │ Continue →│        │ Continue →│   │
│  └───────────┘         └───────────┘        └───────────┘   │
│  gold numeral   green numeral   green numeral               │
│  whole card clickable · focus ring · lifts on hover         │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ THIS SCHOOL                DEEP GREEN band · gold accents   │
│  [crest]  Lucky Star Academy, Yendi                         │
│           A Primary 1–6 school in the Northern Region…      │
│           (campus names, only if confirmed)                 │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ FOOTER                                    DEEP GREEN        │
│  © 2026 Lucky Star Academy · Designed & Developed by        │
│  AlbasaWEB      ·  Create a school account (quiet text link)│
└────────────────────────────────────────────────────────────┘
```

Ground sequence: **deep green → light → deep green → deep green (footer)**. Two
full-bleed deep-green sections plus the hero, as required.

---

## 4. The hero — and its relation to DESIGN.md §8

`DESIGN.md` §8 ("A green dawn") is the standing decision: *a soft brand gradient
(warm off-white melting into green) with subtle school motifs*.

**What I propose, and what needs your approval:** evolve that to a **deep,
saturated green ground** (a new `HERO_GREEN` constant in `theme.ts`, darker and
richer than `BRAND_GREEN`), with the **school's star motif rendered in crisp gold**
rather than as a faint watermark. This is a deliberate departure from §8's
off-white-to-green gradient. The reason: the gradient's warm end is what made the
old hero read as white-on-white, and the current banner already establishes a
deep-green hero — so a saturated ground continues what shipped rather than
reverting it. §8 would be updated to match in the same commit, per the prompt.

If you would rather I hold §8 exactly as written (gradient, faint motifs), say so
and I will build the gradient version instead.

Banner photograph stays as the hero image (`sms_background_image.png`, real, already
in `public/`), with the collage added once real `public/photos/` files exist.

---

## 5. Where deep green and gold fall

- **Deep green:** hero ground · the "this school" band · the footer.
- **Gold, as bold solids** (never as text on white):
  1. the numerals `01 · 02 · 03` on the portal cards,
  2. the thick gold rule under the hero keyword,
  3. the hand-drawn SVG underline beneath the hero keyword,
  4. a solid gold label/sticker in the hero (e.g. the eyebrow kicker chip),
  5. the crisp gold star motif on the deep-green ground,
  6. the primary "Sign in" button (**gold fill, `BRAND_GREEN_DARK` text** — the one place gold carries a control).
- Contrast: text on deep green is white or warm off-white, ≥ 4.5:1. Gold never
  carries body text.

---

## 6. Type scale

| Role | Face | Desktop | Phone (360px) |
| --- | --- | --- | --- |
| Hero display (`h1`) | Fraunces | `clamp(3.5rem, 6vw, 5.5rem)` → 56–88px | ~40px (clamp floor) |
| Section heading (`h2`) | Fraunces | 2.5–3rem | 1.75rem |
| Portal card title | Fraunces | 1.5rem | 1.35rem |
| Body | Hanken Grotesk | 1rem / 1.7 | 1rem / 1.7 |
| Overline / label | Hanken Grotesk | 0.75rem, +0.08em | same |

Implemented as a `clamp()` added to `theme.typography.h1` (the prompt permits a
"display-size clamp" in `globals.css` / `theme.ts`). The point is a visibly large
display-to-body ratio — the single biggest fix for cause #4.

---

## 7. Motion

All of it CSS transitions plus one small `"use client"` `Reveal` wrapper built on
`IntersectionObserver`. `page.tsx` stays a server component; only the scroll-aware
nav and `Reveal` are client. Everything renders its **final state immediately**
under `prefers-reduced-motion: reduce`.

| Element | Motion |
| --- | --- |
| Sections | rise ~16px + fade in on entering the viewport, once |
| Portal cards | lift (translateY −4px) + shadow on hover; arrow shifts right |
| Hero gold rule / SVG underline | draws in once (stroke-dashoffset / scaleX) |
| Nav | transparent over hero → blurred translucent bar + hairline on scroll |

No parallax against the finger, no autoplay video, no animated numbers, no marquee.

---

## 8. How each cause of flatness is answered

| Cause | Answer |
| --- | --- |
| 1. One pale ground everywhere | Alternating grounds: deep green → light → deep green → deep green footer; full-bleed breaks out of the `lg` container |
| 2. Same white card everywhere | Portal cards become three distinct doors (numerals, colour treatment, whole-card clickable); the "this school" band is a ground, not a card |
| 3. Hero indistinguishable from white | Saturated `HERO_GREEN` ground with gold motifs |
| 4. Headline barely outranks body | True display clamp, 56–88px desktop → 40px phone |
| 5. Nothing overlaps or bleeds | Photograph offsets past the hero's bottom edge into the next section, one frame tilted ~2°, full-bleed bands |
| 6. Empty collage frames | Collage built **only** from real `public/photos/` files; until they exist, the hero uses the real banner photo and no empty frame is rendered |
| 7. Wrong primary CTA | "Sign in" is the single primary button; school registration demoted to a quiet text link in the footer (`/register/school` still exists, untouched) |

---

## 9. Scope, guardrails, and what I will not do

- **In scope:** `src/app/page.tsx`, `src/components/ui/StudentPhotoCollage.tsx`,
  `src/components/ui/SiteFooter.tsx`, new components under `src/components/home/`,
  additive changes to `src/theme.ts` and `src/app/globals.css`.
- **Untouched:** auth pages, app shell, portals, anything under `src/lib/**` or
  `supabase/**`. No route added, changed or removed.
- **No new dependencies.** No framer-motion / GSAP / Lottie. No `npm run build`
  while the dev server runs. `npm run typecheck` after each commit.
- **No invented content** — no statistics, testimonials, feature grids, placeholder
  copy or dead links. Footer credit stays exactly `Designed & Developed by AlbasaWEB`
  → `https://albasaweb.com` in a new tab.
- **Commit plan:** concept note · theme additions · hero · portals · this-school +
  footer · motion + polish. `DESIGN.md` §3 and §8 updated in the same commit that
  ships them.

---

## 10. Definition of done

As the prompt lists it, plus: before/after screenshots at desktop and 360px (full
page, hero, scrolled nav, reduced-motion on) saved to `Claude outputs/homepage/`;
Lighthouse mobile Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95; LCP
< 2.5s throttled; CLS ≈ 0; one `h1`; no horizontal scroll at 360px; headline,
primary button and a photograph above the fold at 360×740.

---

## 11. Decisions — approved before building

1. **Hero imagery** — use the existing `public/sms_background_image.png` banner.
   The four `public/photos/` files do not exist, so no collage is built and no
   empty frame is shipped. `StudentPhotoCollage.tsx` stays orphaned.
2. **Public website URL** — blank, therefore **omitted**. No "Visit our website" link.
3. **School motto / tagline** — blank, therefore **omitted**.
4. **Founding year** — blank, therefore **omitted**.
5. **Campus names** — **stated**. "Nayilifong and Kpatuya" is true (present in
   `classes.campus` and `ANALYTICS-ROADMAP.md`).
6. **Hero treatment** — **approved**: evolve `DESIGN.md` §8 from the warm-to-green
   gradient to a deep, saturated green ground with the star motif in crisp gold.
   A new `HERO_GREEN` constant is added to `theme.ts`; §8 is updated to match in
   the same commit.

### Deviation from the prompt's "done means"

The DONE criteria require a photograph collage from `public/photos/` with a frame
overlapping the section boundary and one deliberately tilted. With no real
photographs, that collage is not built. **A solid gold star seal carries the
overlap instead**, hanging below the hero's lower edge onto the portals band (the
hero sits at `z-index: 2`, the portals at `1`). This is the one DONE item that is
answered differently, and it is answered this way by your instruction.

---

## 12. What shipped

**Files**
- New: `src/components/home/{HomeHero,HomePortals,ThisSchool,HomeNav,Reveal}.tsx`,
  `HOMEPAGE.md`, `Claude outputs/homepage/*.png`
- Changed: `src/app/page.tsx`, `src/components/ui/SiteFooter.tsx`,
  `src/theme.ts`, `src/app/globals.css`, `DESIGN.md`
- Untouched: everything under `src/lib/**` and `supabase/**`, the auth pages, the
  app shell, and every route. `/register/school` still exists — it is simply no
  longer the hero's call to action.

**Built**
- Hero on the saturated `#0B5130` ground, full-bleed banner photograph, gold
  motifs, grain, display headline at `clamp(2.5rem, 6vw, 4.5rem)`, hand-drawn SVG
  gold underline that draws in once, one gold "Sign in" button. Copy is anchored
  low so it clears the crest the banner already carries.
- Three portal cards, each with a solid gold numeral badge (`01 · 02 · 03`),
  whole-card clickable, visible focus ring, hover lift with the arrow shifting.
- Deep-green "this school" band with the crest, the two campus names, and the
  footer credit demoted alongside a quiet school-registration link.
- Scroll-aware nav: transparent over the hero, blurred translucent bar with a
  hairline on scroll; the lockup fades in once there is a bar to hold it.
- Reveal-on-scroll, card hover lifts, the underline draw — all off under
  `prefers-reduced-motion`.

**Verified**
- `npm run typecheck` passes.
- One `h1`; heading order is `H1 > H2 > H3 > H3 > H3 > H2`, no skips.
- No horizontal scroll at 360px or 1280px (`scrollWidth === clientWidth`).
- No console errors and no hydration warnings.
- Reduced motion proven through the CSSOM: the rule that hides
  `[data-reveal="out"]` is nested inside `@media (prefers-reduced-motion:
  no-preference)`, so under `reduce` nothing is hidden and everything renders in
  its final state. (The browser tool's CDP allowlist has no
  `Emulation.setEmulatedMedia`, so this was verified by inspecting the live
  stylesheet rather than by emulating the media feature.)

**Known deviations**
1. No photograph collage (no real `public/photos/` files) — the gold star seal
   carries the boundary overlap instead of a photo frame.
2. `StudentPhotoCollage.tsx` was already orphaned before this work (nothing
   imports it) and still points at the four missing `photos/*.jpg` files. Left in
   place rather than deleted; it is dead code referencing absent assets.
3. The motto ("A DIFFERENCE OF EXCELLENCE") and founding year ("EST. 2014") were
   left blank and are therefore not written as text anywhere — though both are
   visible as artwork inside the banner's crest, which is where the school put them.
4. Lighthouse was not run; the dev server serves unminified Turbopack output, so
   a Lighthouse score against it would not be meaningful. The performance budget
   (`preload` on the single LCP image, no animated layout properties, no CLS) is
   respected in the code, but the "Performance ≥ 90 / a11y ≥ 95 / LCP < 2.5s"
   gate has **not** been measured and needs a production build to confirm.
