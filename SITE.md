# The public website

The school's informational website, and how it shares a codebase with the school
management system.

Read this before adding a page, changing `src/proxy.ts`, or deploying.

---

## 1. The shape: one codebase, two hostnames

```
luckystaracademy.edu.gh         the public website   ─┐
www.luckystaracademy.edu.gh     the public website   ─┤ one Next.js app
portal.luckystaracademy.edu.gh  the school system    ─┘ one Supabase project
```

The website is on the **main domain** and the management system on a
**subdomain**, not the other way round. That was the first decision and
everything else follows from it:

- The bare domain is the school's front door. A parent, a PTA member, a donor or
  a GES officer who has heard the school's name types it. They should see the
  school, not a sign-in form they cannot pass.
- Search engines treat the main domain as the real site. The school's visibility
  for "school in Yendi" is built there; putting the brochure on `info.` and a
  login wall at the apex throws that away.
- `portal.` explains itself. Staff and pupils learn one extra word; nobody else
  ever needs it. It also isolates the portal's session cookies from the public
  site.
- One address for everything printed — signboard, letterhead, report cards,
  Facebook page — with a "Portal login" button on the website.

**The alternative rejected:** website on a subdomain, management system at the
apex. It costs one DNS record to do it the right way now, and broken links,
reprints and lost ranking to fix it later.

**The other alternative rejected:** two separate projects (a marketing site on
its own platform plus the app). That is the right answer when non-technical
staff must redesign pages freely and often. It was not chosen because it means
two things to maintain, two designs that drift, and two bills — and because the
website can then no longer read the school's own data (see § 5).

---

## 2. Routing rules

`src/proxy.ts` (Next 16's replacement for `middleware.ts`) classifies each
request with `hostZone()` from `src/lib/site/host.ts`:

| Zone | Meaning | Behaviour |
| --- | --- | --- |
| `portal` | host is the configured portal hostname | `/` redirects to `/login`; website paths redirect to the main domain |
| `public` | host is the main domain or `www` | portal paths (`/login`, `/register`, `/setup-required`, `/admin`, `/teacher`, …) redirect to the portal host |
| `single` | anything else | **no host redirects at all** |

`single` is what makes this safe. It is the zone for `localhost`, for every
`*.vercel.app` preview, and for any hostname nobody configured. Because the two
environment variables are unset outside production, a preview deployment keeps
working as a single-hostname app — website at `/`, portal at `/admin` — so the
change cannot strand anyone mid-review.

A request is only ever treated as portal traffic when it arrives on the
configured portal host **by name**, so a typo in the environment cannot redirect
the school's public website into the app.

### Why the route table lives in one module

`src/lib/site/routes.ts` holds `SITE_NAV`, and the nav, the sitemap, `robots.txt`
and the proxy all read from it. Portal paths come from `@/lib/auth/roles`, the
same `rolePrefix` the layouts and sign-in action use.

This is the rule already written down in `DECISIONS.md` § 19 for `roleHome`, and
it applies here for the same reason: a sixth role added to the app but forgotten
in the proxy would serve an admin dashboard on the school's public domain, and
that failure is silent.

---

## 3. Content: nothing invented

Every word and fact on the website is in **`src/content/site.ts`**, and every
value is either something the school has stated or an explicit `pending("…")`
marker naming what is missing.

```ts
phone: pending("The school office phone number, in the form families should dial"),
```

A pending value renders as an italic, dashed **"To be confirmed"**; a real one
using `fact("…")` renders as ordinary text. To finish the site, replace one with
the other — nothing else changes, and anything gated behind `isKnown()` (such as
the `tel:` link on the contact page) starts working by itself.

`PLACEHOLDERS.md` is the same list in handover form.

### Decisions worth keeping

**No stock photography.** The repository holds no usable photograph of the
school: `classroom.png` is a generic vector illustration, `img1–4.png` are 64px
interface icons, `lucky_star_background.png` is clip-art, and `backg.jpg` is a
**watermarked Adobe Stock image** that must not be published. The gallery
therefore shows the school's own banner — which is a genuine photograph of
pupils — and an honest request for the rest. Filling it with stock images would
tell a lie in pictures: a parent would read a stranger's classroom as their
child's.

**No invented news.** `src/content/news.ts` ships empty and the news page shows
an empty state. Seeding it with plausible-looking announcements would be the
failure `DECISIONS.md` § 2 describes — a placeholder indistinguishable from real
data, and a parent who plans around an invented date has been misled by us.

**No contact form.** A form with nothing behind it swallows what a parent writes
while making them believe they made contact. Building one honestly needs an
email service or a Supabase table plus a server action, so it is recorded as
outstanding rather than faked.

**No unwired affordances, no invented statistics, no testimonials.** The facts
the site leads with — Primary 1–6, two campuses, established 2014, the motto —
are all the school's own, taken from its banner and its class data.

---

## 4. The footer, the credit and the brand

The public footer keeps the convention in `PAGE-CONVENTIONS.md`: **exactly one
third-party reference, the AlbasaWEB credit, word for word**, with the school
name and the current year. The site's own footer adds the school's identity,
navigation and contact details around it; it does not add a second badge.

Identity comes from the school's real assets only — the crest
(`lucky_star_logo.png`, genuinely transparent) and the banner
(`sms_background_image.png`) — set in the existing type pairing and palette from
`src/theme.ts`. No new fonts, no new colours, no second design system.

---

## 5. Not done yet, on purpose

**News is not editable by the office.** Notices already live in Supabase for the
signed-in portal, so the obvious next step is for the office to publish to the
website from the admin portal they already use. That needs an anon-readable
policy or view **and** a deliberate decision about which notices are public —
office notices are not all meant for parents. It is a change of its own, not a
side effect of building the site.

**Pupil photographs need a consent decision.** `gallery.consent` is `pending`
rather than assumed.

**`public/backg.jpg` should be deleted.** It is unlicensed watermarked stock. It
is unreferenced in code, but because it sits in `public/` it is served at
`/backg.jpg` on the deployed site.

---

## 6. Verifying

```
npm run typecheck
npm run build
```

Both must pass. The public pages are all prerendered as static content, which is
the point — a school website on mobile data should not wait on a server.

Two layout facts are checked against a real browser rather than by reading code:

```
npx next start -p 3100
chrome --headless=new --remote-debugging-port=9222 --user-data-dir=<temp> about:blank
node scripts/check-layout.mjs      # no page may scroll horizontally, 360px and up
```

```
chrome --headless=new --remote-debugging-port=9223 --user-data-dir=<temp> about:blank
node scripts/shoot.mjs             # writes full-page screenshots to Claude outputs/site
```

`src/proxy.ts` is auth-critical, so the public website work is also checked
against the thing it could most easily have broken — the school management
system's sign-in:

```
chrome --headless=new --remote-debugging-port=9224 --user-data-dir=<temp> about:blank
node scripts/check-portal-signin.mjs
```

That drives a real browser through the real sign-in form against the real
Supabase project using the seeded development accounts, and asserts that an
admin lands on the admin dashboard, that the dashboard renders as that user,
that a signed-in user can still read the public website without being redirected
off it, and that the sign-in screen still bounces a signed-in user to their
portal home. All four pass.

`check-layout.mjs` exists because horizontal overflow fails **silently**: the
page still loads, still passes accessibility, and simply cuts the right-hand side
off every section. That is exactly what happened during this build — the header
reserved space for a hidden lockup *and* kept a second button in the bar, which
pushed the menu control past the edge of a 390px phone and made the whole
document wider than the viewport, clipping every page. Nothing in the markup
looked wrong.

Both scripts encode traps that cost real time:

- Chrome's `--screenshot` flag silently ignores `--window-size` when another
  Chrome instance is running, emitting a 762×484 image for every requested size.
  Driving the DevTools Protocol gives exact control, which is why `shoot.mjs`
  exists.
- A full-page capture never scrolls, so blocks wrapped in `Reveal` (which start
  at `opacity: 0` until scrolled into view) photograph as blank gaps, and images
  marked `loading="lazy"` never load. Both look exactly like broken pages, and
  both are the screenshot's fault, not the page's. `shoot.mjs` emulates
  `prefers-reduced-motion: reduce` and grows the viewport to the full page height
  before capturing.

---

## 7. Deploying

1. Register the domain. `.edu.gh` is restricted to Ghanaian educational
   institutions, needs supporting documents, and takes about two weeks —
   `PLACEHOLDERS.md` has the checklist. Start it before launch, not during.
2. Add both hostnames to the existing Vercel project (the current project serves
   the portal; the website is the same deployment).
3. Set `NEXT_PUBLIC_SITE_HOST` and `NEXT_PUBLIC_PORTAL_HOST` in Vercel's
   production environment **only**, then redeploy. The split switches on.
4. Leave them unset in Preview, so preview deployments stay single-hostname.
5. Check afterwards: the apex shows the website, `/login` on the apex redirects
   to the portal, `portal.` opens on the sign-in chooser, and `/robots.txt` on
   each host returns text rather than a login page.
