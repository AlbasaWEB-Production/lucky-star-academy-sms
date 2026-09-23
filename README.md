# Lucky Star Academy — School Management System

A school management system for **Lucky Star Academy** (Yendi, Northern Region,
Ghana; Primary 1–6). It streamlines class organization, attendance tracking,
exam marks and communication between students, teachers and administrators.

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
src/            the Next.js application (App Router, Server Components + Server Actions)
public/         static assets (crest, banner, icons)
scripts/        database seed and probe scripts
supabase/       migrations, RLS policies, verify checks, RLS test suite
MIGRATION.md    full migration record: database design, security model, parity notes
```

- **To run the app:** from the repo root, run `npm install` then `npm run dev`
  (serves on http://localhost:3000).
- **For the database schema, security model, collection-to-table mapping and
  rollback notes:** see **[`MIGRATION.md`](MIGRATION.md)**.

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
