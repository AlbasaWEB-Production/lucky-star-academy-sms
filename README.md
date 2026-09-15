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
supabase/       migrations, RLS policies, verify checks, RLS test suite
web/            the Next.js application (self-contained npm project)
MIGRATION.md    full migration record: database design, security model, parity notes
```

- **To run the app:** start with **[`web/README.md`](web/README.md)**.
- **For the database schema, security model, collection-to-table mapping and
  rollback notes:** see **[`MIGRATION.md`](MIGRATION.md)**.

## Features

- **User roles:** Admin, Teacher and Student. Each role has its own portal and
  its own permissions, enforced by Row Level Security in the database.
- **Admin:** add students, teachers, classes and subjects; assign teachers;
  post notices; review complaints.
- **Attendance tracking:** teachers mark attendance per class and subject;
  re-submitting for the same day corrects rather than duplicates.
- **Performance assessment:** teachers record exam marks; students view their
  marks and attendance, both with charts.
- **Communication:** notices and a complaint flow between students and admin.

## Git branches

- `main` — the current Next.js + Supabase application.
- `community-version` — community contributions / external PRs.
- `legacy-version` — the original MERN (tutorial) implementation, kept for
  reference. The old `frontend/` and `backend/` folders were removed from
  `main`; that code lives on this branch.
