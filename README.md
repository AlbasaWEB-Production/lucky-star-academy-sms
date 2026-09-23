# Lucky Star Academy — School Management System & Website

Two things live in this repository:

1. **The school management system** — a system for **Lucky Star Academy**
   (Yendi, Northern Region, Ghana; Primary 1–6). It streamlines class
   organization, attendance tracking, exam marks and communication between
   students, teachers and administrators.
2. **The school's public website** — the informational site for parents and
   prospective families: about the school, admissions, academics, news, gallery
   and contact.

They share one Next.js application, one Supabase project and one deployment, and
are separated by hostname:

| Address | What it serves |
| --- | --- |
| `luckystaracademy.edu.gh`, `www.luckystaracademy.edu.gh` | the public website |
| `portal.luckystaracademy.edu.gh` | the management system and sign-in |

> **Note — this repo has been migrated.** The original implementation (Create
> React App + Express + MongoDB, the "MERN" stack) has been replaced by a
> Next.js 16 application backed by Supabase. The old code is preserved on the
> `legacy-version` branch for reference; it is no longer maintained.

## Stack

- **Frontend:** Next.js 16 (App Router, Server Components + Server Actions), React 19, Material UI v9
- **Backend / Database:** Supabase — Postgres with Row Level Security, PostgREST, Auth
- **Auth:** Supabase Auth (email + password), sessions in HTTP-only cookies

## Repo layout

```
src/app/(site)/         the public website's pages (Home, About, Academics, Admissions, News, Gallery, Contact)
src/app/                the management system's pages (auth screens + one subtree per role)
src/components/site/    components used only by the public website
src/content/            every word and fact on the public website, with gaps marked
src/lib/site/           public website routing, host split, metadata and structured data
src/                  the Next.js application (App Router, Server Components + Server Actions)
public/                 static assets (crest, banner, icons)
scripts/                database seed and probe scripts, plus layout and screenshot checks
supabase/               migrations, RLS policies, verify checks, RLS test suite
MIGRATION.md            full migration record: database design, security model, parity notes
SITE.md                 the public website: architecture, routing rules and decisions
PLACEHOLDERS.md         the school content the website is still waiting for
```

- **To run the app:** from the repo root, run `npm install` then `npm run dev`
  (serves on http://localhost:3000). Both the website and the portal are
  reachable there — `/` is the website, `/login` and `/admin` are the portal.
- **For the database schema, security model, collection-to-table mapping and
  rollback notes:** see **[`MIGRATION.md`](MIGRATION.md)**.
- **For the public website — the host split, content model and decisions:**
  see **[`SITE.md`](SITE.md)**.
- **For the school content still outstanding:** see
  **[`PLACEHOLDERS.md`](PLACEHOLDERS.md)**.

## The public website

Seven pages, all prerendered as static content: Home, About, Academics,
Admissions, News, Gallery and Contact, plus a not-found page.

- **Content is in one place.** `src/content/site.ts` holds every fact the site
  states. Nothing is invented: anything the school has not supplied is a
  `pending("…")` marker that renders as a visible "To be confirmed", and
  `PLACEHOLDERS.md` lists them all as a handover checklist.
- **The design reuses the existing system** — the same type pairing, palette,
  radius scale and crest as the management system, per `DESIGN.md` and
  `PAGE-CONVENTIONS.md`.
- **The portal is excluded from search engines** by both `robots.txt` and
  `noindex` metadata, so a parent searching the school's name never lands on a
  staff sign-in page.

The host split is driven by two environment variables that are deliberately
unset outside production, so local development and every preview deployment
behave as a single hostname. See `SITE.md` § 7 for the deployment steps.

## Features

- **User roles:** Administrator, Teacher, Student, Accountant and Schedule
  Officer. Each role has its own portal, its own sign-in card, and its own
  permissions, enforced by Row Level Security in the database.
- **Admin:** add students, teachers, classes, subjects and the two office staff
  accounts; assign teachers; post notices; review complaints.
- **Attendance tracking:** teachers mark attendance per class and subject;
  re-submitting for the same day corrects rather than duplicates.
- **Performance assessment:** teachers record exam marks; students view their
  marks and attendance, both with charts.
- **Finance:** the administrator sets the fee policy and the budget; the
  accountant issues the term's assessments, banks payments and records
  expenses. Amounts are held as integer pesewas throughout.
- **Timetable:** the schedule officer places each subject into the weekly grid
  by day, period and room; a subject cannot be double-booked and a room cannot
  host two lessons at once.
- **Communication:** notices and a complaint flow between students and admin.

## Git branches

- `main` — the current Next.js + Supabase application.
- `community-version` — community contributions / external PRs.
- `legacy-version` — the original MERN (tutorial) implementation, kept for
  reference. The old `frontend/` and `backend/` folders were removed from
  `main`; that code lives on this branch.
