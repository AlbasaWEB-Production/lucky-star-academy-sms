# Migration: MERN → Next.js + Supabase

This document records the migration of the School Management System from the
original **MERN** stack to **Next.js 16 (App Router) + Supabase (Postgres,
Auth, Row Level Security)**.

The short version:

| Layer | Before | After |
| --- | --- | --- |
| Frontend | React 18 via Create React App, MUI v5, Redux Toolkit, react-router, axios | **Next.js 16.3 App Router**, React 19, MUI v9, Server Components + Server Actions |
| Backend | Express 4 REST API (`backend/`), 16 files | **Supabase** — Postgres + PostgREST. No server framework, no API layer to maintain |
| Database | MongoDB via Mongoose 7 (7 collections, embedded arrays) | **Postgres** with 10 normalised tables, foreign keys, indexes and constraints |
| Auth | `bcrypt` password hashes, no tokens; `role` stored in `localStorage` | **Supabase Auth** (email + password) with role and tenant in `app_metadata`, sessions in HTTP-only cookies |
| Authorization | **None server-side.** The API trusted a `role` field the browser sent | **Row Level Security** on every table, enforced by Postgres |
| State management | 12 Redux slice/handler files doing client-side fetching and caching | Deleted. Server Components read, Server Actions write |
| Deploy | Express on Render + CRA build on Netlify | One Next.js app |

## Where things live

```
supabase/
  migrations/
    20260101000000_initial_schema.sql   tables, constraints, indexes, trigger, view
    20260101000100_rls_policies.sql     RLS enablement, policies, grants
web/                                    the new Next.js application
  src/app/                              routes (App Router)
  src/components/                       UI, split server / "use client"
  src/lib/supabase/                     client factories + hand-written DB types
  src/lib/auth/                         session, server actions, user provisioning
  src/lib/data/                         read layer (server only)
  src/lib/actions/                      write layer (Server Actions)
  PAGE-CONVENTIONS.md                   the rules every page follows
frontend/                               LEGACY CRA app - retained for reference
backend/                                LEGACY Express API - retained for reference
```

`frontend/` and `backend/` are **left untouched** so the old and new systems can
be compared and rolled back. Nothing in `web/` imports from either. See
[Cutting over](#cutting-over) for how to remove them.

## Quickstart

### 1. Create the Supabase project

Create a project at <https://supabase.com/dashboard>.

### 2. Apply the database schema

**Option A — Dashboard SQL editor.** Open the SQL editor and run, in order:

1. `supabase/migrations/20260101000000_initial_schema.sql`
2. `supabase/migrations/20260101000100_rls_policies.sql`

**Option B — Supabase CLI.**

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

### 3. Configure the app

```bash
cd web
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`SUPABASE_SECRET_KEY` from your project's **Connect** panel. The secret key
must never be given a `NEXT_PUBLIC_` prefix.

### 4. Run it

```bash
npm install
npm run dev
```

Open <http://localhost:3000> and click **Register your school**. That creates
your school, the first administrator account and signs you in. Then add a
class, a subject, a teacher and some students.

Without credentials the app still starts and shows a setup banner explaining
these steps, rather than failing on the first query.

## Database design

### Mapping from the Mongo collections

| Mongo collection | Postgres |
| --- | --- |
| `admin` | `schools` (the tenant) + `profiles` with `role = 'admin'` |
| `teacher` | `profiles` with `role = 'teacher'`; class/subject via `subjects.teacher_id` |
| `student` | `profiles` with `role = 'student'` + `students` |
| `sclass` | `classes` |
| `subject` | `subjects` |
| `notice` | `notices` |
| `complain` | `complaints` |
| `student.attendance[]` | `attendance` (one row per student/subject/day) |
| `student.examResult[]` | `exam_results` (one row per student/subject) |
| `teacher.attendance[]` | `teacher_attendance` (one row per teacher/day) |

### Normalisation decisions

1. **Embedded arrays became tables.** Attendance and exam results were arrays
   inside each student document, which meant they could not be indexed,
   joined, or constrained. They are now rows with unique keys such as
   `unique (student_id, subject_id, date)`, so a duplicate entry is impossible
   instead of merely unlikely.

2. **The subject ⇄ teacher cycle was removed.** Mongo stored the link twice —
   `subject.teacher` and `teacher.teachSubject` — so the two could disagree.
   `subjects.teacher_id` is now the single source of truth, and a teacher's
   class and subject are derived by querying it. This has a visible
   consequence: **a teacher may teach several subjects across several
   classes**, which the old data model could not express. The UI renders all
   assignments.

3. **Credentials left the database.** `password` no longer appears in any
   table; it lives in `auth.users`, managed by Supabase Auth.

4. **Tenant integrity is declarative.** Every tenant-owned table carries
   `school_id` and references its parent through a **composite** foreign key,
   e.g. `subjects (class_id, school_id) → classes (id, school_id)`. A student
   therefore cannot reference a class belonging to another school — the
   database rejects it, with no trigger and no application code involved.

5. **Roll numbers are unique per school, not per class.** The student login
   form collects only a roll number and a name (no class selector), so a
   per-class scope would make login ambiguous. `unique (school_id, roll_number)`
   removes the ambiguity. This is a deliberate tightening of the original
   behaviour.

### Intentional behaviour changes

- **Deleting a class is refused while it still has students** (the FK is
  `ON DELETE RESTRICT`). The action reports how many students are in the way.
  The legacy API would have orphaned them.
- **Deleting a teacher unassigns their subjects** rather than deleting them
  (`ON DELETE SET NULL`).
- **Re-submitting attendance for the same day corrects it** instead of
  appending a duplicate, because the write is an upsert on
  `(student_id, subject_id, date)`.
- **`teacher_attendance.present_count` / `absent_count` are integers.** The
  Mongo schema declared them as strings.

## Security model

### Roles live in `app_metadata`, never `user_metadata`

RLS reads `app_metadata.role` and `app_metadata.school_id` straight from the
caller's JWT:

```sql
create or replace function public.jwt_school_id() returns uuid
language sql stable
as $$ select nullif(auth.jwt() -> 'app_metadata' ->> 'school_id', '')::uuid $$;
```

`app_metadata` is server-controlled and cannot be edited by the signed-in user.
`user_metadata` is user-writable, so putting a role there would let anyone grant
themselves admin. This is why the app's own helpers
(`src/lib/auth/manage-users.ts`) are the only writers of role data, and why they
need the secret key.

**Consequence to be aware of:** claims are baked into the JWT. Changing a user's
role or school does not affect an already-issued token until it is refreshed, so
after such a change the user must sign in again.

### What each role can reach

| Table | admin | teacher | student |
| --- | --- | --- | --- |
| `schools` | read/update own school | read own school | read own school |
| `profiles` | read all in school | read all in school | read self + teachers |
| `classes`, `subjects` | read all, write all | read all | read all |
| `students` | read/write all in school | read/write only classes they teach | self only |
| `attendance`, `exam_results` | read/write all in school | read/write their own subjects | self, read only |
| `teacher_attendance` | read/write all | self, read only | none |
| `notices` | read/write | read | read |
| `complaints` | read all, delete | none | insert/read own |

Details, including the `WITH CHECK` clauses that stop privilege escalation, are
in `20260101000100_rls_policies.sql`.

### Notable hardening, and the traps avoided

- **`anon` is granted nothing in `public`.** Authentication happens against the
  `auth` schema, and everything else requires a session. The one pre-login
  lookup (resolving a student's roll number to their login address) runs
  server-side with the secret key.
- **The `student_directory` view is `security_invoker = true`.** A view without
  it runs with the *owner's* privileges and would have silently bypassed every
  policy beneath it.
- **Every UPDATE policy has both `USING` and `WITH CHECK`.** Without the check,
  a user could rewrite their own `profiles` row's `role` to `admin`. The
  self-update policy pins `role` and `school_id` to the caller's JWT.
- **`auth.role()` was not used**; policies use the `TO authenticated` clause
  instead, which does not silently pass when anonymous sign-ins are enabled.
- **No `SECURITY DEFINER` functions.** Every helper is `SECURITY INVOKER` and
  reads only the caller's own JWT, so there is no privilege-escalation surface.
  `security invoker` is stated explicitly rather than relying on the default, so
  it cannot be flipped by accident.
- **Every function pins `set search_path = ''`.** Without it, unqualified names
  inside a function resolve against the *caller's* search path, so a caller able
  to create objects could shadow something the function depends on. Pinning it
  also clears the `function_search_path_mutable` warnings
  `supabase db advisors` raises for every function in `public`.
- **RLS predicates wrap helpers in `(select ...)`.** `(select auth.uid())` is
  evaluated once per query as an InitPlan rather than once per row, which on a
  large table is the difference between a scan and an index lookup. Every policy
  here is written that way.
- **Every foreign key column is indexed.** Postgres does not index FK columns
  automatically, and an unindexed one turns each `ON DELETE CASCADE` /
  `SET NULL` into a scan of the child table. `attendance.class_id`,
  `attendance.recorded_by`, `notices.created_by` and `schools.created_by` exist
  for that reason; `supabase/verify.sql` query 7c checks the whole schema for
  regressions.
- **RLS is enabled but not `FORCE`d.** This is a deliberate deviation from
  Supabase's own guidance, which recommends `FORCE`. `FORCE` also subjects the
  table *owner* to the policies, and the Dashboard SQL editor and the migration
  runner connect as `postgres` — the owner. With `FORCE`, `select * from
  students` in the SQL editor returns zero rows (there is no JWT, so
  `jwt_school_id()` is null), and `supabase/tests/rls_test.sql` could not seed
  its fixtures. What `FORCE` protects against is the owner role, which can drop
  the policies outright anyway, so the security benefit is negligible while the
  operational cost is real. `anon` and `authenticated` — the roles that reach
  the database through the Data API — are fully covered by `ENABLE`.
  `service_role` bypasses RLS either way via its `BYPASSRLS` attribute.

## Authentication flows

### School registration (creates the tenant)

`registerSchoolAction` in `src/lib/actions/auth.ts` runs five steps in an order
that can always be compensated for:

1. Create the auth user with `email_confirm: true`.
2. Insert the `schools` row (`created_by` the new user).
3. Write `app_metadata` `{ role: 'admin', school_id, full_name }`.
4. Insert the `profiles` row.
5. Sign in so the fresh claims are in the JWT.

If any step fails, the earlier ones are rolled back. `email_confirm: true` is
deliberate: a new Supabase project has no SMTP provider configured, so requiring
confirmation would leave every created account unable to sign in.

### Student sign-in without an email address

Students sign in with a roll number and their name, as they always have.
`signInAsStudentAction`:

1. Looks the student up by roll number, then compares the name in JavaScript —
   using an `ILIKE` pattern would let a student's input act as a wildcard.
2. Derives the synthetic address `{school-slug}+{roll-number}@{domain}`.
3. Completes a real `signInWithPassword`.

The student never sees the address, and both failure paths return the same
message so the form cannot be used to enumerate students.

### Teacher and student accounts

Created by the school admin through `createManagedUser` /
`createStudentUser`, which write the auth user, the `profiles` row and (for
students) the `students` row, deleting the auth user if a follow-up write
fails so no account can sign in without a profile.

## Feature parity notes

Every page from the legacy app is represented, with these deliberate
differences:

| Legacy | Now |
| --- | --- |
| `AdminRegisterPage` created a school | `/register/school` creates the school **and** its first admin |
| Student/teacher/class/subject delete cascaded in application code | Enforced by foreign keys; the class delete is refused while students remain |
| `attendanceCalculator.js` computed percentages in the browser from an embedded array | `summariseAttendanceForStudent()` computes them in SQL/indexed queries |
| One HTTP request per student when saving attendance or marks | One request per class roster |
| `Popup.js` for messages | MUI `Alert` inside forms, plus `ConfirmActionButton` for destructive actions |
| Charts via `CustomBarChart.js` / `CustomPieChart.js` | `MarksBarChart` / `AttendancePieChart` (Recharts) |
| Nine `styled(Button)` variants in `buttonStyles.js` | Theme palette + MUI `variant`/`color` |
| `TeacherComplain.js` | Dropped — it was an empty stub with no feature behind it |
| "Login as Guest" | Dropped — it hard-coded demo credentials. Re-add only with a real demo tenant |

## Environment constraints encountered

Worth knowing if you continue this work:

- **Docker is not installed**, so `supabase start` (the local Postgres stack)
  is unavailable. Schema changes must be applied to a hosted project.
- The **Supabase CLI crashed** under the sandboxed shell (it could not write to
  `~/.supabase/telemetry.json`). With normal permissions it should run fine.
- Because no project was linked, **`supabase gen types` could not be run**, so
  `web/src/lib/supabase/database.types.ts` is hand-written to mirror the
  migrations. Once linked, run `npm run db:types` and diff — the regenerated
  file will add `Relationships` metadata, which only enables PostgREST embedded
  selects. The data layer deliberately avoids embedding, so nothing breaks
  either way.
- **The migrations have never been executed against a real Postgres instance.**
  See "Verification performed" below for exactly what was and was not checked.
  Apply them first in a scratch project, run `supabase db advisors`, then
  exercise the flows.

## Verification performed

Because no Supabase project was available, verification stopped short of a live
database. Being explicit about the gap:

**Verified, with the commands used**

| Check | Command | Result |
| --- | --- | --- |
| SQL syntax of both migrations | `pgsql-parser` (libpg_query) on each file | 49 and 66 statements parse cleanly |
| Every table has RLS enabled | compared `create table` against `alter table ... enable row level security` | 10 tables, 1:1 match |
| `verify.sql` post-install checks | same parser | 9 statements parse cleanly |
| TypeScript | `cd web && npm run typecheck` | exit 0 |
| Production build | `cd web && npm run build` | exit 0, 47 routes compiled |
| Server boots and routes resolve | `next start -p 3100`, HTTP requests per route | see below |
| Public pages server-render | fetched `/` and `/login/student` | landing page and student form render; setup banner present; Emotion styles present in `<head>`, confirming the MUI SSR cache is wired |

Route behaviour with no Supabase credentials configured (the deliberate
"unconfigured" path):

| Request | Response |
| --- | --- |
| `/`, `/login`, `/login/*`, `/register/school`, `/setup-required` | `200` |
| `/admin/dashboard`, `/teacher/dashboard`, `/student/dashboard`, `/admin/students` | `307` → `/` |
| `/nonexistent-page` | `404` |

Two defects were found and fixed during this review, both of which would have
been caught only by a live database or a careful reading:

1. **A composite foreign key with `ON DELETE SET NULL`** on
   `subjects.teacher_id`. A composite FK nulls *every* referencing column, and
   `subjects.school_id` is `NOT NULL`, so deleting a teacher would have failed
   with a not-null violation. The FK is now single-column, with same-school
   membership asserted by a trigger.
2. **Authenticated routes prerendered as static redirects.** A build that runs
   without Supabase env vars would have baked the "not configured" redirect
   into the admin, teacher and student segments, permanently breaking them once
   deployed with credentials. The three role layouts now set
   `export const dynamic = "force-dynamic"`.

**Not verified — the remaining risk**

- The migrations have not run on Postgres. Syntax and structure were checked,
  not execution: constraint interactions, the trigger behaviour, and policy
  evaluation are all unproven until they run.
- **No RLS policy has been exercised.** Nothing has confirmed that a teacher
  sees only their own classes, or that a student cannot read another student's
  row. `supabase/verify.sql` checks that the policies *exist and are shaped
  correctly* (including that every UPDATE policy has a `WITH CHECK`), but only a
  real query proves they work.
- No sign-in, sign-up or CRUD flow has been run end to end against Supabase.
- No page has been visually reviewed in a browser.

Suggested first session against a live project: apply the migrations, run
`supabase/verify.sql`, register a school, add one class, one subject, one
teacher and two students, then sign in as each role and confirm the teacher
sees only their class and a student sees only themselves. That single pass
exercises nearly every policy in the schema.


## Cutting over

When you are satisfied with `web/`:

```bash
git rm -r backend frontend
```

Then update the root `README.md` to drop the legacy install instructions. Until
you do, both stacks coexist and neither interferes with the other — they share
no dependencies and `web/` is a self-contained npm project.

## Verifying the app

```bash
cd web
npm run typecheck     # tsc, must exit 0
npm run build         # production build
npm run dev           # http://localhost:3000
```

`web/PAGE-CONVENTIONS.md` documents the rules pages follow and is the first
thing to read before adding a route.
