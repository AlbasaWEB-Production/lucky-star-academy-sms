# Placeholders — what the school still needs to send

Everything on the public website that is **not yet real**, in one list.

The site was built before the school supplied its content, so every unknown
value is held open in `src/content/site.ts` as `pending("…")` and renders on the
page as an italic, dashed **“To be confirmed”** marker. Nothing was invented —
there is no made-up phone number, no guessed fee, no stock photograph standing in
for the school.

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
| School office phone number | Contact page, footer | `contact.phone` |
| School email address | Contact page, footer | `contact.email` |
| Street address or Ghana Post GPS digital address | Contact page, footer | `contact.addressLine1` |
| Office opening hours | Contact page | `contact.officeHours` |
| A paragraph about the school, in the school's own words | Home page, About page | `welcome.body` |
| The school's history | About page | `about.story.body` |
| Mission and vision statements | About page | `about.mission`, `about.vision` |
| Admission requirements — the actual document list | Admissions page | `admissions.requirements.items` |
| How fees should be presented | Admissions page | `admissions.fees.body` |
| Term dates for the coming year | Academics page | `academics.calendar.items` |
| Photographs of the school | Gallery page | `gallery.needs` |

### Important but not blocking

| What | Where it appears | Content key |
| --- | --- | --- |
| Second phone number | Contact page | `contact.phoneAlt` |
| Postal address, if used | — (not yet rendered) | `contact.postalAddress` |
| Values the school wants to be known for | About page | `about.values.items` |
| Head teacher's name | About page | `about.leadership.headTeacher` |
| Whether a staff page is wanted, and who may be listed | About page | `about.leadership.note` |
| GES registration number | About page | `about.registration` |
| Which classes sit at which campus | About page | `about.campusClasses` |
| Subjects taught at each level | Academics page | `academics.subjects.items` |
| How pupils are assessed, and what a report card shows | Academics page | `academics.assessment.body` |
| The school day — opening, closing, break, closed days | Academics page | `academics.schoolDay.items` |
| What lower and upper primary each focus on | Academics page | `academics.stages[].body` |
| How a family first makes contact | Admissions page | `admissions.steps[0].body` |
| Where the admission form is obtained | Admissions page | `admissions.steps[1].body` |
| How a place is confirmed | Admissions page | `admissions.steps[3].body` |
| Facebook page address | Contact page, footer | `social.facebook` |
| WhatsApp number | — (not yet rendered) | `social.whatsapp` |
| Position on publishing photographs of pupils | Gallery page | `gallery.consent` |

### Confirmed facts already used

These came from the school itself (its banner, and its own class data) and are
not placeholders: the school name, **Yendi** and the **Northern Region**, the
**Primary 1–6** range, the **Nayilifong** and **Kpatuya** campuses, the founding
year **2014**, and the motto **“A Difference of Excellence”**.

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

The gallery therefore shows the school's own banner — the one genuine asset —
and an honest request for the rest. **Stock photography was deliberately not
used**: a parent would read a stranger's classroom as their child's.

**2. No contact form, on purpose.** A form with nothing behind it swallows what
a parent writes while making them believe they have made contact. Building one
honestly needs an email service (or a Supabase table plus a server action)
behind it. Until then the contact page offers only routes that genuinely work.
Recorded in `admissions.onlineApplication`.

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
