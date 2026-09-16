# Dashboard plan — what exists, and how the analytics dashboards slot in

Written before any dashboard code, per the brief. It records what the repo
actually contains today, where each requested widget can and cannot be fed from
real rows, and the decisions that are the school's to make rather than mine.

**Headline finding:** the SMS captures attendance, exam marks, rosters,
notices and complaints. It captures **no** fee, admissions, discipline,
co-curricular, term, campus, capacity or guardian-contact data at all. Of the
~30 widgets in the brief, roughly a third can be built from real data today,
a handful need a school decision first, and the rest need tables that do not
exist. Per the brief's own guardrail — build what is honest, name the missing
table, never fabricate — those are section 5 and `DASHBOARD_BACKLOG.md`.

---

## 1. What the repo actually is

The brief describes "Next.js + Tailwind". The application is **Next.js 16.3.5
(App Router) + Material UI v9 + Emotion**, and has been since the MERN
migration. I have followed the repo, not the brief's assumption, because the
brief's governing instruction is to extend what exists.

| Piece | Reality | Brief assumed |
| --- | --- | --- |
| Styling | MUI v9 + Emotion, tokenised in `src/theme.ts` | Tailwind |
| Routing | `src/app/**`, role-prefixed (`/admin`, `/teacher`, `/student`) | `/dashboard/*` |
| Charts | Recharts 3.10, already installed, already the only chart lib | Recharts (add it) |
| Roles | `admin \| teacher \| student` (a DB enum) | head, teacher, bursar, admin |
| Dashboards | Three already exist and were rebuilt recently | build four |
| Lint | **No `lint` script exists** — only `dev, build, start, typecheck, db:push, db:types` | `npm run lint` |

`npm run build` and `npm run typecheck` are the gates that exist. The brief's
`npm run lint` cannot be run because it is not defined; I will note that rather
than invent one.

### Doctrine the app already enforces (and the dashboards must not break)

From `PAGE-CONVENTIONS.md`, `MIGRATION.md` and the RLS migration:

- **Server Components fetch, Client Components interact.** Charts are the only
  client components — which matches the brief exactly.
- **Never pass a function from a server component to a client component.**
- All reads go through `src/lib/data/*` (server-only). All writes go through
  Server Actions. The secret key never reaches the browser.
- **RLS decides what a query returns.** Read helpers deliberately contain no
  `where school_id = …` and must not gain a role check.
- `next/link` must go through `@/components/NextLink` (accepts `style`, not `sx`).

---

## 2. The schema, exactly

Ten tables, one view, four functions. Source of truth:
`supabase/migrations/20260101000000_initial_schema.sql`.

| Table | Columns that exist | Notable absences |
| --- | --- | --- |
| `schools` | `id, name, slug, created_by` | campus, address |
| `profiles` | `id, school_id, role, full_name, email` | phone, guardian link |
| `classes` | `id, school_id, name` | **campus, level, capacity** |
| `subjects` | `id, school_id, class_id, teacher_id, name, code, sessions` | period count (`sessions` is free text) |
| `students` | `id, school_id, class_id, roll_number` | guardian, fee band, status |
| `attendance` | `student_id, subject_id, class_id, date, status` | — |
| `exam_results` | `student_id, subject_id, marks_obtained` | term, exam type, grade |
| `teacher_attendance` | `teacher_id, date, present_count, absent_count` | — |
| `notices` | `title, details, date, created_by` | — |
| `complaints` | `student_id, date, complaint` | status, resolution |
| `student_directory` (view) | student + class + school names, `security_invoker = true` | — |

Two constraints shape every metric below, so they are worth stating plainly:

- `attendance` is keyed **student × subject × date**. A class "has attendance"
  on a day when at least one row exists; "how many were marked" is a
  **distinct-student** count.
- `exam_results` is keyed **student × subject**, unique. There is **one mark per
  pupil per subject** — not one per exam sitting. So "average end-of-term mark"
  is really "the current mark per subject"; there is no history to average over.

### Enums

- `user_role`: `admin | teacher | student`
- `attendance_status`: `Present | Absent` — **there is no `Late`**

### Deliberately absent (these are the whole problem)

No `fees` / `payments` / `fee_structure`. No `admissions` / `enquiries` /
`applications`. No `terms` / `academic_periods`. No `discipline` / `incidents`.
No `clubs` / `activities`. No `expenses` / `budgets`. No grade bands, no pass
mark, no thresholds config.

### Live data today (project `ascknorgqmecuuqnzrdr`)

Seeded by `scripts/seed.mjs`: 1 school, 18 pupils (3 per class), 6 classes
(Primary 1–6), 54 subjects, 25 profiles, 3 notices — and, critically,
**24 attendance rows spanning two days (2026-09-14/15), all `Present`**,
18 exam results, **0 complaints, 0 teacher attendance**.

That thinness matters: any widget that trends over time or compares terms will
render an empty state on today's data, which is the correct behaviour and also
means "does it look right?" must be checked against a deliberately richer
seed, not the current one.

---

## 3. Auth model, and where a wrong-role user goes

Three roles. `src/proxy.ts` guards by path prefix (`/admin`, `/teacher`,
`/student`) as a UX layer; RLS is the real enforcement. `roleHome` redirects a
signed-in user to their own dashboard, and `requireRoleWithTenant(role)` does
the same inside a page. A wrong-role user already gets a **redirect, not an
error page** — the brief's requirement is met by the existing mechanism.

There is **no bursar role and no head-teacher role**, and no way to add one
without touching the `user_role` enum, `app_metadata`, `proxy.ts`, `roleHome`
and the RLS policies — a change with real security surface. That is a decision
for the school, not for me (section 7, Q1).

---

## 4. Where the dashboards slot in

**Recommendation: extend the three existing role dashboards in place** —
`/admin/dashboard`, `/teacher/dashboard`, `/student/dashboard` — rather than
create a parallel `/dashboard/*` tree.

Reasons:

1. A `/dashboard/*` tree would sit outside every `ROLE_PREFIXES` entry in
   `src/proxy.ts`, so it would need new guard logic duplicating a boundary that
   already works — new security surface for no user benefit.
2. `roleHome` is the single place a role's landing page is defined; a second
   tree means two answers to "where does an admin land".
3. The brief's four dashboards assume four roles. With three roles, "Head
   Teacher / Proprietor" and "Admin / Operations" both land on the existing
   admin dashboard. Splitting one role's view across two routes is a
   presentation decision, not an access-control one.
4. It keeps the sidebar (`src/components/layout/nav.ts`) as the one place a
   page is discoverable — the brief's "one click from chart to action".

If the school wants `/dashboard/*` URLs instead, that is a small, mechanical
change to `roleHome` + `proxy.ts` + `nav.ts`, and I will do it — but it should
be a deliberate choice, not an accident of the brief's template.

---

## 5. Widget-by-widget disposition

Every widget in the brief's JOB section, against the real schema.
**Build** = real data today · **Decision** = needs a school fact first ·
**Backlog** = needs a table that does not exist.

### Head Teacher / Proprietor

| Widget | Verdict | Source / missing table |
| --- | --- | --- |
| KPI: total enrolment, **split by campus** | Decision | `students` ✓; **campus** needs a new column/table (Q3) |
| KPI: attendance rate this term | Decision | `attendance` ✓; **term boundaries** undefined (Q2) |
| KPI: average end-of-term mark | Build | `avg(exam_results.marks_obtained)` |
| KPI: fee collection rate | **Backlog** | needs `fee_invoices`, `fee_payments`, `fee_structure` |
| KPI: number of at-risk pupils | Decision | computable from attendance + marks; the brief's 3rd signal (behaviour) has no table (Q4) |
| Enrolment trend by term, by level | **Backlog** | needs `terms`; **level** (Nursery/KG/Primary) is not in the schema either |
| Attendance rate by class, worst→best | **Build** | `attendance` grouped by `class_id` — the highest-value widget here |
| Fees collected vs expected by month + target | **Backlog** | needs `fee_*` tables |
| At-risk pupil table (+ assigned teacher) | Decision | name/class/teacher ✓; **reason** partly; **guardian phone** absent |
| Admissions funnel | **Backlog** | needs `admissions_enquiries` / `_applications` / `_offers` |

### Academic / Class Teacher

| Widget | Verdict | Source / missing table |
| --- | --- | --- |
| Daily attendance this week, their class | **Build** | `attendance` by `date`, RLS already scopes to their subjects |
| Attendance heat map (pupils × days) | Build | `attendance` by `student_id` × `date`; **no `Late` state** — Present/Absent only (Q4) |
| Grade distribution histogram per subject | Decision | needs **grade bands** (Q4); currently marks out of 100 with no bands |
| Class average per subject across last 3 terms | **Backlog** | needs `terms`, and `exam_results` holds one mark per pupil per subject, not per sitting |
| Pupil table: average, attendance %, behaviour flags | Decision | average ✓, attendance % ✓; **behaviour flags** need a discipline table |
| Assessments due to be entered | **Backlog** | needs an assessment/assessment-schedule table |
| Class selector for HoD / head | Decision | depends on Q1 (roles) |

### Bursar / Accounts

**Entirely backlog.** There is no fee, payment, invoice, expense or budget data
in the schema. Not one widget on this page can be fed honestly. Building it
would mean inventing the finance tables *and* the school's actual fee
structure, which is precisely what the brief forbids. See
`DASHBOARD_BACKLOG.md`.

### Admin / Operations

| Widget | Verdict | Source / missing table |
| --- | --- | --- |
| Admissions funnel with conversion % | **Backlog** | needs `admissions_*` |
| New enrolments by level and intake term | Decision | `students.created_at` gives a date trend ✓; **level** and **term** absent |
| Capacity utilisation per class | **Backlog** | needs `classes.capacity` |
| Discipline incidents by type | **Backlog** | needs `discipline_incidents` |
| Incidents per 100 pupils by class | **Backlog** | needs `discipline_incidents` |
| Co-curricular participation by club | **Backlog** | needs `clubs` + `club_memberships` |
| Teacher workload (periods per teacher) | Decision | **subjects per teacher** ✓ from `subjects.teacher_id`; **periods** absent — `subjects.sessions` is free text |

**Score:** buildable now — enrolment, average marks, attendance rate by class,
this-week attendance, the heat map, the pupil table, teacher workload by
subjects, marks-entry coverage, new-enrolment trend. Everything else is a
decision or a backlog entry.

---

## 6. Data layer — how metrics will be served

The brief requires dashboards to read **views you create**, never raw tables in
page code. That is a genuine improvement on today's helpers, which are
TypeScript-side aggregations over fetched rows, and I will follow it for the
new metrics:

- A new migration adding `v_*` views and `fn_*` functions, each
  `security_invoker = true` (or `security invoker`) so **RLS is inherited** —
  a view without that flag would bypass every policy. This is the single most
  important line in the migration.
- Named plainly, as the brief specifies: `v_attendance_rate_by_class`,
  `v_marks_by_class_subject`, `v_attendance_heatmap`, `fn_at_risk_pupils(...)`,
  `v_teacher_workload`.
- `dashboard_thresholds` — a small config table holding the at-risk thresholds
  (and term boundaries, if Q2 says yes), so the head can change them without a
  deploy. Read by the `fn_*` functions.
- Indexed on `date` / `class_id` / `subject_id`, which `attendance` already
  largely covers (`attendance_date_idx`, `attendance_class_id_idx`,
  `attendance_subject_date_idx`).
- The service-role key is **not** used on any dashboard path — reads stay on
  the caller's session so RLS applies.

New shared components, built once: `KpiCard` (a `StatCard` already exists with
`tone`/`primary` — I will extend it with the delta/trend props rather than add a
near-duplicate), `ChartCard` (title, period subtitle, filter slot, skeleton,
empty state, error state), `DataTable` (sortable, filterable, paginated, CSV),
and URL-param filters (`?term=` / `?campus=`, matching the `?q=` pattern the
list pages already use). `EmptyState` already exists and is good.

---

## 7. Decisions I need from the school (batched, as the brief requires)

These are the school's facts, not mine. I have stopped here rather than guess.

1. **Roles and routes.** Keep the three existing roles and extend the three
   existing dashboards (my recommendation), or introduce a separate `bursar`
   and/or `head` role with new `/dashboard/*` routes? Note the bursar page has
   no data behind it either way.
2. **Terms.** There is no term concept anywhere in the schema. Do we add a
   `terms` table with the school's real three-term calendar (needed for every
   "this term / vs last term / last three terms" widget), or drop term
   comparisons and filter by date range instead?
3. **Campuses.** No campus data exists. Do we add `classes.campus` (Nayilifong
   / Kpatuya) so the enrolment split and `CampusSelector` work, or drop campus
   from the dashboards?
4. **Grade bands and the at-risk rule.** The brief assumes bands exist; they do
   not. What are the school's bands (and is there a pass mark)? And for "at
   risk", the brief proposes attendance < 80% **or** average < 40 in ≥ 2
   subjects **or** ≥ 2 behaviour incidents — the third is unimplementable
   without a discipline table. Confirm the first two, with those thresholds, as
   the starting config in `dashboard_thresholds`.
5. **`Late` attendance.** The heat map wants present/absent/late; the enum has
   only Present/Absent. Add `Late` (a migration, and every attendance form
   gains an option), or colour the heat map on two states?

Also worth flagging: the brief's `DONE` list requires a **Vercel preview
deployment**, Lighthouse runs, and a fresh-project migration check. I can do
the migration and typecheck/build gates locally and against the linked project;
I will confirm the deployment target with you rather than assume a Vercel
project exists.

---

## 8. What I will build once these are answered

In commit order, per the brief's commit discipline:

1. This plan file. *(done)*
2. Migration: `dashboard_thresholds`, `terms`/`campus` if approved, `v_*`
   views and `fn_*` functions, all `security_invoker`, all indexed.
3. Shared components: `ChartCard`, `DataTable`, `KpiCard` delta support,
   term/campus URL filters.
4. The honest widgets, per role — teacher first (most buildable), then the
   whole-school view, then admin/operations.
5. `DASHBOARD_BACKLOG.md` naming every missing table.
6. `METRICS.md` — every formula, e.g. attendance rate = (present) ÷ total
   register entries; "at risk" as configured.
7. `RLS_VERIFICATION.md` — run as the seeded teacher and as the seeded student,
   confirming a teacher sees only their own classes and a student only
   themselves. Verified by query, not by reading policy text.
8. `DECISIONS.md` — every judgement call made without asking.
9. README section on adding a widget (view → component → page).
10. Screenshots and the final summary.

`DASHBOARD_BACKLOG.md` will be written in step 5 rather than first, so that it
names only tables genuinely still missing after the approved decisions land.

---

## 9. Decisions resolved (school's answers, 2026-09-15)

1. **Roles and routes.** Extend the three existing dashboards. No new roles,
   no `/dashboard/*` tree. Head Teacher/Proprietor and Admin/Operations both
   land on the existing admin dashboard; teacher and student are extended in
   place. No `proxy.ts` change.
2. **Terms.** Add a `terms` table (`school_id, name, term_number 1–3, start_date,
   end_date`, unique per school). Seeded with a conventional Ghanaian academic
   year as an editable default (see `DECISIONS.md`).
3. **Campuses.** Add `classes.campus` constrained to `Nayilifong | Kpatuya`
   (nullable), backfilled for the six seeded classes.
4. **Grade bands and at-risk.** Standard Ghanaian basic-school bands
   (A:80–100, B:70–79, C:60–69, D:50–59, E:40–49, F:<40) as the histogram
   buckets. At-risk rule = attendance **< 80%** this term **OR** average mark
   **< 40** in **≥ 2** subjects, held as starting config in
   `dashboard_thresholds`. The brief's third signal (≥ 2 behaviour incidents)
   is **not** implementable — no discipline table — and is listed in the
   backlog.***

5. **`Late` attendance (decided by me, recorded in `DECISIONS.md`).** Not added.
   No enum change, no register-form change. The heat map colours on the two
   states that exist (Present/Absent); a third colour is trivial if the school
   later adds `Late`.
