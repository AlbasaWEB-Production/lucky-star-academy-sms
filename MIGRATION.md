# Migration: MERN → Next.js + Supabase

This document records the migration of the School Management System from the
original **MERN** stack to **Next.js 16 (App Router) + Supabase (Postgres,
Auth, Row Level Security)**.

The short version:

| Layer | Before | After |
| --- | --- | --- |
| Frontend | React 18 via Create React App, MUI v5, Redux Toolkit, react-router, axios | **Next.js 16.3 App Router**, React 19, MUI v9, Server Components + Server Actions |
| Backend | Express 4 REST API (`backend/`), 16 files | **Supabase** — Postgres + PostgREST. No server framework, no API layer to maintain |
| Database | MongoDB via Mongoose 7 (7 collections, embedded arrays) | **Postgres** with 17 normalised tables, foreign keys, indexes and constraints |
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
    20260101000200_dashboard_analytics.sql   dashboard aggregate views + thresholds
    20260101000300_dashboard_view_role_scope.sql  role-scoped security_invoker views
    20260101000400_analytics_fees.sql    Phase 1: fees, budget, expenses, finance views
    20260101000450_revoke_anon_privileges.sql  least privilege: `anon` holds nothing in public
  tests/
    rls_test.sql                        row level security test suite - run this
  verify.sql                            post-install structural checks (read-only)
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

**Then confirm it worked.** Both files are safe to run against a live project:

- `supabase/verify.sql` — read-only. Checks the install is structurally correct:
  RLS on every table, grants, no `SECURITY DEFINER`, every function pinning
  `search_path`, every foreign key indexed.
- `supabase/tests/rls_test.sql` — one transaction ending in `ROLLBACK`. Seeds two
  schools and impersonates an admin, a teacher and a student in each to prove the
  policies actually restrict access, then reports PASS/FAIL per probe.

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

The system is built for a single school — **Lucky Star Academy** (Yendi,
Northern Region, Ghana, Primary 1–6). Instead of registering the school by
hand, seed the tenant, its classes, subjects, admin, teachers and students:

```bash
cd web
node --env-file=.env.local scripts/seed.mjs
```

The seed data is generic / placeholder (per the school owner). It prints the
sign-in credentials on completion, e.g. admin
`admin@luckystaracademy.edu.gh` / `Admin@2026`. See `web/scripts/seed.mjs`.

Open <http://localhost:3000>. The landing page is branded for the school and
the "Register your school" flow is no longer surfaced, since the school is
already provisioned.

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
| `terms`, `fee_structures`, `budget_lines`, `expenses` | read/write all | none | none |
| `fee_assessments` | read/write all | read only classes they teach | own only |
| `fee_payments` | read/write, delete; "reverse" via compensating row | none | own payments, read only |

The finance tables and views are delegated to RLS exactly like the others; the
role-scoped `security_invoker` views appends finance aggregates and are
admin-only (see "Analytics expansion" below). Details, including the `WITH
CHECK` clauses that stop privilege escalation, are in
`20260101000100_rls_policies.sql`.

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

## Analytics expansion

After the MERN→Next migration, the whole-school analytics brief
(`web/ANALYTICS-ROADMAP.md`) extends the product across five phases and then
reorganises the dashboards. Phase 1 (fees & finance) is live:

- **Data model** — `terms`, `fee_structures` (per class/term), `fee_assessments`
  (per pupil), `fee_payments` (with database-issued receipt numbers, sequential
  per school, never reused; a payment is never deleted, only *reversed* by a
  compensating row bearing a `reversal_reason`), `budget_lines` and `expenses`.
  Money is integer **pesewas**, formatted as Ghana cedis through a single
  formatter.
- **Views** — `v_fee_status_by_student`, `v_fees_collected_vs_expected`,
  `v_outstanding_by_class`, `v_budget_vs_actual`, `v_cash_position`, all
  `security_invoker = true`; the admin aggregates are admin-only.
- **Screens** — admin `/admin/fees` overview (collected-vs-expected with a
  target line, outstanding by class, collection-rate and days-to-pay KPIs with
  previous-term comparison, sortable defaulters, monthly cash position,
  budget-vs-actual by cost centre), structures, assessments, payments,
  budget and expenses pages; a pupil-owned `/student/finance` balance and
  receipts view.
- **Hardening** — see `20260101000450_revoke_anon_privileges.sql`.

The later phases (academics, people/teaching operations, admissions & capacity,
welfare) and the final dashboard reorganisation are tracked in
`web/ANALYTICS-ROADMAP.md`.

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
| SQL syntax of all four SQL files | `pgsql-parser` (libpg_query) | schema 53 statements, RLS 66, `tests/rls_test.sql` 62, `verify.sql` 9 — all parse cleanly |
| Every table has RLS enabled | compared `create table` against `alter table ... enable row level security` | 10 tables, 1:1 match |
| Every foreign key column is indexed | reviewed `create index` output against the constraint list | full coverage, no gaps |
| Every function pins `search_path` | reviewed `create or replace function` output | all 6 pinned |
| TypeScript | `cd web && npm run typecheck` | exit 0 |
| Production build | `cd web && npm run build` | exit 0, 46 routes compiled (45 page files plus the generated not-found route) |
| Server boots and routes resolve | `next start -p 3100`, HTTP requests per route | see below |
| Public pages server-render | fetched `/` and `/login/student` | landing page and student form render; setup banner present; Emotion styles present in `<head>`, confirming the MUI SSR cache is wired |

Route behaviour with no Supabase credentials configured (the deliberate
"unconfigured" path):

| Request | Response |
| --- | --- |
| `/`, `/login`, `/login/*`, `/register/school`, `/setup-required` | `200` |
| `/admin/dashboard`, `/teacher/dashboard`, `/student/dashboard`, `/admin/students` | `307` → `/` |
| `/nonexistent-page` | `404` |

**Defects found and fixed during review.** None of these were caught by the
build or the typechecker; each needed a careful reading of the schema, the build
output, or the code.

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
3. **The subject roster page issued two queries per student** — 80 concurrent
   requests to PostgREST for a 40-student class. `getSubjectRoster()` now does
   it in three queries regardless of class size.
4. **Four foreign key columns had no index**, including
   `attendance.class_id`, so every class deletion scanned the attendance table.
   All four are now indexed.
5. **All six functions had a mutable `search_path`**, which
   `supabase db advisors` would have reported on the first live run.

**About the test suite.** `supabase/tests/rls_test.sql` was written during this
review and, once a live project was available, extended into the suite that
runs today. It threads one transaction ending in `ROLLBACK`: seeds two schools,
impersonates an admin, two teachers and two students, and asserts the number of
rows each role can actually reach — including the Phase 1 finance tables and
role-scoped views and the receipt/reversal model. Two bugs were found in it
before delivery: a data-modifying CTE whose count could not see its own insert
(a data-modifying CTE shares the surrounding statement's snapshot, so the probe
would have reported a false failure), and a teacher write probe placed ahead of
the student read probes, which changed the counts those probes assert. Both are
noted in the file.

### Live verification — done

All applied against the live project (MCP, `ascknorgqmecuuqnzrdr`):

| Check | Result |
| --- | --- |
| `supabase/tests/rls_test.sql` | **88 probes, 88 pass** (was 50 before Phase 1). Backed by `ROLLBACK`, so nothing was left behind. |
| `supabase/verify.sql` | read-only; no orphan/regression rows |
| `npm run typecheck` | exit 0 |
| `supabase db advisors` | clean |

Running the suite surfaced one real hardening gap, fixed in
`20260101000450_revoke_anon_privileges.sql`: the analytics tables, views and
functions had been `grant all`ed to `authenticated` **and** `anon`. `anon` is
the unauthenticated role — RLS happened to still block it, but a single missing
policy would have handed the whole fee ledger to anyone. The migration revokes
everything from `anon` and locks default privileges so it cannot recur.

**Remaining risk**

- Migrations and policies are proven; **no page has been visually reviewed in a
  browser**, and no sign-in/CRUD flow has been exercised end to end against the
  live project outside the suite.
- `npm run db:types` still cannot be used here (it silently empties the types
  file in this environment), so `web/src/lib/supabase/database.types.ts`
  continues to be hand-maintained to mirror the migrations.


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
