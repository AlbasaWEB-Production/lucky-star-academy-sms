# Placeholders — what the school still needs to send

Everything on the public website that is **not yet real**, in one list.

The site was built before the school supplied its content, so every unknown
value is held open in `src/content/site.ts` as `pending("…")` and renders on the
page as an italic, dashed **“To be confirmed”** marker. Nothing was invented —
there is no made-up phone number, no guessed fee, no fabricated statistic.

**Photographs are the one exception, and they are labelled on the page.** See
the next section.

## ⚠ The stock photographs must come out before launch

The layout was rebuilt from a reference design that is illustrated entirely with
**stock photographs of children who do not attend Lucky Star Academy** — pupils
in Western blazers in a European classroom. They are in the site as temporary
stand-ins, at the developer's explicit instruction, on the condition that they
are labelled as stock.

**Every one carries a visible "Stock photo" badge on the image itself**, plus
hidden text for screen readers, and a credit line beneath the two large ones.
That labelling is not decoration: the failure being guarded against is a viewer
mistaking a stock classroom for this school's classroom, and nothing short of a
mark on the picture prevents it.

They are served from `public/placeholders/stock-classroom.jpg` and appear in
**nine places**:

| Where | What it needs |
| --- | --- |
| Home page — About section | A photograph of a Lucky Star classroom |
| Home page — five programme cards | One photograph for each card |
| Home page — Admissions section | A photograph of pupils at the school |
| Gallery page | The gallery's own photographs |

**Before launch: replace them, or delete the frames.** A stock photograph of
somebody else's pupils on a real school's website is a consent problem as well
as a factual one, and the badge is what makes it tolerable in the meantime —
remove the badge without removing the photograph and the position is worse than
either.

The school's **own** banner photograph (`public/sms_background_image.png`) is
used for the home page hero and is not a placeholder.

## How to fill these in

Open **`src/content/site.ts`**. Each gap is one function call:

```ts
phone: pending("The school office phone number, in the form families should dial"),
```

Replace it with the value:

```ts
phone: fact("024 000 0000"),
```

Nothing else changes. The marker disappears, and anything gated behind
`isKnown()` — such as the `tel:` link on the contact page — starts working by
itself.

To check your work: `npm run dev`, then visit each page. Every remaining gap is
visible without reading any code.

## The list

### Highest priority — the site cannot go live without these

| What | Where it appears | Content key |
| --- | --- | --- |
| **The head teacher's name** — supplied blank | Staff page | `staff.members[0].name` |
| Office opening hours | Contact page | `contact.officeHours` |
| A paragraph about the school, in the school's own words | Home page, About page | `welcome.body` |
| The school's history | About page | `about.story.body` |
| **Mission and vision statements** — supplied blank | About page | `about.mission`, `about.vision` |
| Admission requirements — the actual document list | Admissions page | `admissions.requirements.items` |
| How fees should be presented | Admissions page | `admissions.fees.body` |
| Term dates for the coming year | Academics page | `academics.calendar.items` |
| Photographs of the school | Gallery page | `gallery.needs` |
| **Replacement photographs** for the nine stock stand-ins | Home, Staff and Gallery pages | see above |

### The home page's bands — the reference layout's slots

The home page was rebuilt from a reference design, and four of its blocks are
slots waiting for figures. Every value in them reads "To be confirmed" on
purpose: the reference's own numbers (25+ years, 1,500+ pupils, 98% university
acceptance) describe a different school, and a plausible figure on a real
school's website cannot be told apart from a true one. The school supplied its
programmes and its registrations but no figures.

| What | Where | Content key |
| --- | --- | --- |
| Years of teaching | Home — numbers strip | `statsBand[0]` |
| Pupils enrolled | Home — numbers strip | `statsBand[1]` |
| Teachers | Home — numbers strip | `statsBand[2]` |
| Awards won | Home — numbers strip | `statsBand[3]` |
| Pupils going on to junior high | Home — numbers strip | `statsBand[4]` |
| Pupils per teacher | Home — fact cards | `factCards[0]` |
| Clubs and activities | Home — fact cards | `factCards[1]` |

"The years of teaching" figure is derivable from the founding year (2014) if the
school would rather not state a number. "Pupils going on to junior high" is this
site's stand-in for the reference's "university acceptance", which is not
something a primary school has.

**The values band is now entirely real** — it carries no placeholder at all,
because the school supplied its programmes and its five values.

### The four programme descriptions

The programmes themselves — their names, labels and every class and subject
inside them — are all supplied. Only the paragraph describing how each is taught
is open.

| Programme | What is needed | Content key |
| --- | --- | --- |
| Preschool | What the preschool years focus on, and the age each class takes | `programmes[0].body` |
| Primary | What the primary years cover, and how Basic 6 is prepared for junior high | `programmes[1].body` |
| Islamic Studies | Whether every pupil takes it or it is an option, and at which levels | `programmes[2].body` |
| Digital Studies | How it is taught, and what equipment the school has | `programmes[3].body` |

### Important but not blocking

| What | Where it appears | Content key |
| --- | --- | --- |
| Postal address, if used | Contact page | `contact.postalAddress` |
| Whether teaching staff should also be listed | Staff page | `staff.more` |
| The four registration numbers | About page | `about.registrationNumbers` |
| Which classes and programmes are held at each campus | About page | `about.campusClasses` |
| Subjects taught in the primary classes | Academics page | `academics.subjects.items` |
| How pupils are assessed, and what a report card shows | Academics page | `academics.assessment.body` |
| The school day — opening, closing, break, closed days | Academics page | `academics.schoolDay.items` |
| How a family first makes contact | Admissions page | `admissions.steps[0].body` |
| Where the admission form is obtained | Admissions page | `admissions.steps[1].body` |
| How a place is confirmed | Admissions page | `admissions.steps[3].body` |
| Facebook page address | Contact page, footer | `social.facebook` |
| WhatsApp number | — (not yet rendered) | `social.whatsapp` |
| Position on publishing photographs of pupils | Gallery page | `gallery.consent` |

### Confirmed facts, now supplied

These came from the school and are **not** placeholders. All of them are live on
the site:

- Name, motto, founding year (2014), town and region
- **Preschool** — creche, nursery, kindergarten — and **Primary**, Basic 1–6
- **Islamic Studies** — Quran, Hadith, Fiqh, Luga, Tawheed, Seerah
- **Digital Studies** — Computing, Coding, Robotics, AI
- **Values** — Discipline, Faith, Excellence, Knowledge, Love
- **Both campus addresses**, both telephone numbers, and the email address
- **All four registrations** — GES, NaSIA, Department of Social Welfare,
  Registrar-General's Department
- **Abdulai Rahama**, Admin and Finance Officer

## Two things that need a decision, not just content

**1. The gallery has no photographs.** The repository contains no usable image
of the school:

- `public/classroom.png` — a generic flat vector illustration, not a photograph.
- `public/img1–4.png` — 64×64 interface icons.
- `public/lucky_star_background.png` — education-themed clip-art background.
- `public/backg.jpg` — **a watermarked Adobe Stock image.** It is unlicensed
  stock, the watermark is visible, and it must not be published. It is currently
  unreferenced in code, but because it sits in `public/` it is served at
  `/backg.jpg` on the deployed site and can be downloaded by anyone. Worth
  deleting.

The gallery shows the school's own banner — the one genuine asset — and a request
for the rest. The stock photographs now used elsewhere on the site are labelled
and are temporary; see the warning at the top of this file.

**2. No contact form, on purpose.** A form with nothing behind it swallows what
a parent writes while making them believe they have made contact. Building one
honestly needs an email service (or a Supabase table plus a server action)
behind it. Until then the contact page offers only routes that genuinely work.
Recorded in `admissions.onlineApplication`.

**3. No newsletter sign-up either, and for the same reason.** The reference
design ships a subscribe field that validates the address and then says, in its
own script, that nothing was submitted. The footer's "Stay connected" column
therefore states what it is waiting for — a mailing list or email service
(`newsletter.service`) — rather than collecting addresses it cannot keep.

**4. The home page's "news" strip was left out.** The reference layout's home
page has no news section and neither does this one; news has a page of its own,
linked from the navigation and the footer. If the school wants the latest
announcements on the home page, that is a small addition once the News page has
its first posts.

## Also outstanding: the domain

`luckystaracademy.edu.gh` is **not registered** — a WHOIS lookup returns
*"No Object Found"*. `.edu.gh` is restricted to Ghanaian educational
institutions, requires supporting documents, and takes roughly two weeks, so it
should be started before launch rather than during it. See the deployment
section of `README.md`.

Once it is registered, set these two environment variables in Vercel and the
host split switches on by itself:

```
NEXT_PUBLIC_SITE_HOST=luckystaracademy.edu.gh
NEXT_PUBLIC_PORTAL_HOST=portal.luckystaracademy.edu.gh
```

Leave them unset in local development and on preview deployments — the app then
behaves as a single hostname and both halves stay reachable at the root, exactly
as before.
