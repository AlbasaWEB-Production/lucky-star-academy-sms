# Dashboards, header and footer — proposal

A short plan, per the brief. Every number and every chart below comes from real
rows through Row Level Security — no sample series, no placeholder counts, no
fabricated calendar. Where a series is empty we render a specific empty state,
never an invented-looking zero.

**Scope guard:** we may add read helpers to `src/lib/data/*` and extend
`DashboardStats`. We will **not** touch `src/lib/actions/**`, `src/lib/auth/**`,
`src/proxy.ts`, or `supabase/**`. No new tables, no policy changes, no
migrations.

---

## 0. What the data actually holds

| Table | Columns we use | Recency available |
| --- | --- | --- |
| `profiles` | `id, full_name, email, role` | `created_at` |
| `students` | `id, class_id, roll_number` | — |
| `classes` | `id, name` | — |
| `subjects` | `id, name, code, class_id, teacher_id` | — |
| `attendance` | `id, class_id, date, student_id, subject_id, status` | `created_at`, `date` |
| `exam_results` | `id, student_id, subject_id, marks_obtained` | `created_at`, `updated_at` |
| `notices` | `id, title, details, date` | `date`, `created_at` |
| `complaints` | `id, complaint, date, student_id` | `date`, `created_at` |
| `teacher_attendance` | `id, teacher_id, date, present_count, absent_count` | `date` |
| `student_directory` (view) | `student_id, full_name, email, roll_number, class_id, class_name` | — |

Attendance is keyed **per student × subject × date** (a teacher marks a whole
class for one subject on one day). So "a class has attendance on a day" means
*at least one attendance row for that class on that date*, and "how many were
marked" is a distinct-student count.

`exam_results.created_at` exists, so "newly recorded marks" *can* be time-windowed.
No pass mark exists in the database, so we will not draw a pass/fail line.

---

## 1. Read helpers to add (`src/lib/data/queries.ts`)

All follow the existing pattern: `server-only`, no `where school_id`, no role
check — RLS scopes the result. Names and return shapes mirror what is already
there.

| Helper | Returns | Feeds |
| --- | --- | --- |
| `listAdmins()` | `{ id, fullName, email }[]` — `profiles` where `role='admin'`, ordered by `full_name` | Administrators page, admin people-breakdown |
| `listAttendanceCoverageForDate(date)` | `{ classId, className, recordedCount }[]` — `attendance` where `date = date`, distinct `student_id` per `class_id`, class names joined | admin "attendance today" hero |
| `listAttendanceCoverageForTeacher(teacherId, date)` | same shape, but only `subject_id` in the teacher's subjects (RLS gives exactly their rows) | teacher "attendance today" hero |
| `summariseClassAttendanceForTeacher(teacherId)` | `{ classId, className, present, absent, percentage }[]` — attendance for the teacher's subjects grouped by class | teacher "attendance rate by class" |
| `countMarksBySubjectForTeacher(teacherId)` | `{ subjectId, subjectName, count }[]` — `exam_results` for the teacher's subjects grouped by subject | teacher "marks entered per subject" |
| `listRecentExamResultsForStudent(studentId, since)` | `{ subjectId, subjectName, marksObtained, recordedAt }[]` — `exam_results` where `created_at >= since` | student bell "newly recorded marks" |

`DashboardStats` gains an `admins` field; `getDashboardStats()` adds one
`countOf("profiles", { column: "role", value: "admin" })`.

Notices and complaints windows are computed in the page from the existing
`listNotices()` / `listComplaints()` by filtering on `date`. Unassigned subjects
come from the existing `listSubjects()` filtered to `teacherId === null` — no
new helper needed.

---

## 2. Shared chart tokens (`src/components/charts/tokens.ts`)

One module, defined once, imported by every chart:

```ts
// A small ordered palette derived from the green + gold system.
export const CHART_COLORS = [
  "#147B45", // BRAND_GREEN — first series
  "#083E28", // BRAND_GREEN_DARK
  "#F2B705", // BRAND_GOLD
  "#3D9C6A", // mid green
  "#6B8F7A", // sage
];
```

Existing `MarksBarChart` and `AttendancePieChart` are used by detail pages
(student/teacher/subject pages, student attendance, student subjects), so they
**stay**. We only route their hard-coded colors through `CHART_COLORS` so the
series read as one family. The dashboard charts are new components.

### New chart components (`src/components/charts/`)

| Component | Props | Replaces |
| --- | --- | --- |
| `QuestionBarChart` | `{ data: {name,value}[], question, unit?, color?, height, horizontal? }` — axis label with unit, `aria-label` = question, direct labels, specific empty state | the three dashboards' ad-hoc `MarksBarChart` calls |
| `PeopleBreakdown` | `{ students, teachers, admins }` — 3-bar horizontal comparison | nothing (new) |

Both are `"use client"`, take an explicit `height`, stay Recharts, use
`CHART_COLORS`, and never animate on load. Colour is never the only carrier —
bars carry direct value labels; the pie already has a legend.

---

## 3. Admin dashboard

The question an admin opens the app with: **"What needs my attention today, and
how is my school put together?"**

### Visualisations

| Question it answers | Chart form | Exact query / aggregation | Why this form |
| --- | --- | --- | --- |
| Which classes still need attendance taken today? | Horizontal bar — one bar per class, value = distinct students marked today (a class with 0 is the actionable gap) | `listAttendanceCoverageForDate(today)` joined against `listClasses()`; `recordedCount` = distinct `student_id` in `attendance` where `date = today`, per `class_id` | The answer is a per-class comparison — the classes at zero *are* the to-do list. Bars make the gap read at a glance; a table would bury it. |
| How is the school composed? | Horizontal bar, 3 bars: Students / Teachers / Administrators | `students` count; `profiles` `role='teacher'` count; `profiles` `role='admin'` count (via `getDashboardStats`) | A comparison of three magnitudes. Bars are the plainest comparison form; a 3-slice pie is allowed but bars keep the magnitude difference readable. |
| How big are my classes? (kept) | Vertical bar — students per class | `listClasses()` `studentCount` per class | Already the right form for comparing class sizes; keep it. |
| Which subjects still need a teacher? | Compact list card (count + names), not a chart | `listSubjects()` filtered to `teacherId === null` | A short, actionable list is clearer than a chart of mostly-zeros. "Small table when clearer" per the brief. |
| What's new? (kept) | Recent notices panel | `listNotices()` first 5 | Unchanged. |

### Hierarchy (no six-identical-tiles grid)

1. **Hero — "Attendance today by class"** (large, spans ~3fr) beside a
   **"Needs attention"** panel (~2fr) listing open complaints (count + link),
   unassigned subjects (count + link), and classes without attendance today
   (count + link). The thing that most needs attention today is first and
   largest.
2. **People breakdown** + **Students per class**, two charts side by side.
3. **Recent notices** panel.

The three role counts live inside the people-breakdown chart, so there is no
separate Students/Teachers/Admins tile row.

---

## 4. Teacher dashboard

The question: **"Which of my classes still need me today, and is anything
drifting?"**

| Question it answers | Chart form | Exact query / aggregation | Why this form |
| --- | --- | --- | --- |
| Which of my classes still need attendance today? (hero) | Horizontal bar per class, value = distinct students marked today for the teacher's subjects | `listAttendanceCoverageForTeacher(teacherId, today)` against the teacher's classes from `getOwnTeacherAssignments` | Same reason as admin: the zero classes are the to-do list, and RLS already limits this to the teacher's own subjects. |
| Which of my classes attend least? | Horizontal bar — % present per class across the teacher's subjects | `summariseClassAttendanceForTeacher(teacherId)` — present/total per `class_id` | Percentages across classes; bars show the low ones as the risk. |
| Have I finished entering marks? | Vertical bar — count of `exam_results` rows per subject the teacher teaches | `countMarksBySubjectForTeacher(teacherId)` | Empty (0) subjects are the ones still to do; a count bar surfaces the gap directly. |
| What's new? (kept) | Recent notices panel | `listNotices()` first 5 | Unchanged. |

### Hierarchy

1. **Hero — "Attendance today for my classes"** with a **"Today"** attention
   strip (which classes still need marking, link to `/teacher/attendance`).
2. **Attendance rate by class** + **Marks entered per subject**, side by side.
3. **Teaching assignments** table (kept) + **recent notices**.

**Removed with reason:** the old "Students per class" bar on this dashboard. It
is not what a teacher needs first on a Tuesday morning (the brief's own example
of an irrelevant chart); it is replaced by the attendance-today hero. Class
sizes still appear in the assignments table.

---

## 5. Student dashboard

The question: **"How am I doing — attendance and marks — and what's new?"**

| Question it answers | Chart form | Exact query / aggregation | Why this form |
| --- | --- | --- | --- |
| What's my overall attendance? (hero) | Donut, 2 slices: present / absent | `summariseAttendanceForStudent(userId)` totals | Two-slice donut is allowed (≤3). It answers "overall" in one glance; the per-subject bar below answers "where". |
| In which subjects am I missing class? | Horizontal bar — % present per subject | `summariseAttendanceForStudent(userId)` per subject | Percentages across subjects; the low bars are the ones to improve. |
| How did I do in each subject? (kept) | Vertical bar — marks per subject | `listExamResultsForStudent(userId)` | Already the right form. No pass line — no pass mark exists in the database. |
| What's new? (kept) | Recent notices panel | `listNotices()` first 5 | Unchanged. |

### Hierarchy

1. **Hero — attendance donut** with the overall % figure beside it, plus two
   supporting figures (Average marks, Subjects).
2. **Attendance by subject** + **Marks by subject**, side by side.
3. **Recent notices** panel.

---

## 6. Header (top bar)

The bar carries **information, not chrome**. It keeps the logo, the school name
(Fraunces) + role caption, and the account menu. The decorative search box is
already gone (removed in a prior commit) — nothing to strip.

| Element | What it does | Notes |
| --- | --- | --- |
| Today's date in full | e.g. "Monday, 15 September 2026" as a caption | Hidden on `xs` (collapses with the overflow below) so the bar stays one line. |
| Notification bell | IconButton + `Badge`. Click opens a **Popover** (not a page) with a role-aware feed. Badge count = number of feed items; **hidden when 0**. | Each item is a link to where it is dealt with. |
| Calendar | IconButton. Click opens a **Popover** mini month grid. | Only days carrying real records are marked; no fabricated events. |
| Account | Existing avatar + menu | Unchanged. |
| Overflow (`xs`) | At 360px the bell, calendar and account collapse into one "More" `IconButton` → `Menu` | Keeps the bar to a single line; icons never wrap. |

### Bell feed — role-aware, real rows only

"New" is defined by a **fixed recent window** and stated in the popover — no
per-user read state, no fake unread counts.

| Role | Feed items | Window | Links to |
| --- | --- | --- | --- |
| Admin | New complaints; subjects without a teacher; classes without attendance today; notices published this week | complaints `date` last 7 days; unassigned = `teacher_id` null; attendance = no row for today; notices `date` last 7 days | `/admin/complaints`, `/admin/subjects`, `/admin/attendance`, `/admin/notices` |
| Teacher | Own classes without attendance today; new notices | own subjects, no attendance row today; notices `date` last 7 days | `/teacher/attendance`, `/teacher/notices` |
| Student | New notices; newly recorded marks | notices `date` last 7 days; `exam_results.created_at` last 7 days | `/student/notices`, `/student/dashboard` (marks section) |

The popover footer states the window, e.g. "New means the last 7 days."

### Calendar popover

- Shows the current month; **today** highlighted.
- Days with real records are marked:
  - Notices → by their `date`.
  - Attendance days → admin: any day with attendance rows in school; teacher:
    days with rows for their subjects; student: days with their own rows.
- Picking a day links to the page that handles that kind of record (notices
  list, or the attendance page for that date).
- **No events table exists**, so no term/event calendar. A proper events/term
  calendar is proposed as a follow-up below, not built now.

---

## 7. Footer

New `src/components/ui/SiteFooter.tsx` (server-safe, no state):

- Text **exactly** `Designed & Developed by AlbasaWEB`, where `AlbasaWEB` links
  to `https://albasaweb.com` with `target="_blank" rel="noopener noreferrer"`.
- Styled small and muted in `text.secondary`, centered, with the school name and
  current year alongside (e.g. `© 2026 Lucky Star Academy · Designed & Developed
  by AlbasaWEB`).
- Optional `schoolName` prop (defaults to "Lucky Star Academy") so the shell can
  pass its own school name.
- No other third-party link or badge.

### Placement

| Surface | How |
| --- | --- |
| Landing (`/`) | Below the "this school" section, at the bottom of the root `minHeight:100vh` Box. Sits below content. |
| Login chooser (`/login`) | Below the `Container` content. |
| Auth forms (login/admin, login/teacher, login/student, register/school) | `AuthShell` becomes a column flex (`minHeight:100vh`, grid `flex:1`) with `SiteFooter` after the grid — the card stays centred and the footer sits below it, so it never pushes the sign-in card off a phone screen. |
| Signed-in shell | Wrap `main` + `SiteFooter` in a column Box (`flex:1`); `main` gets `flex:1`, footer sits at the bottom of the content area (right of the drawer on `md`). |

---

## 8. Removals (with reason)

| Removed | Where | Why |
| --- | --- | --- |
| "Students per class" bar | Teacher dashboard | Not what a teacher needs first (the brief's example of an irrelevant chart). Replaced by the attendance-today hero; class sizes remain in the assignments table. |
| Six-identical-tiles StatCard grid | All three dashboards | Replaced by a real hierarchy: one hero + supporting charts. Counts fold into charts and the attention panel. |

Kept because they still earn their place: the admin and student "students per
class" / "marks by subject" charts, the teacher assignments table, and the
recent-notices panel on all three.

---

## 9. Follow-ups (proposed, **not** built in this task)

1. **Events / term calendar** — a real `school_events` table (term dates,
   holidays, events) so the calendar can show the term at a glance. Needs a
   migration + RLS policy, so it is out of scope here.
2. **Pass mark / grade scale** — a configured pass threshold (per school, or
   per subject) so marks charts can draw a pass line and colour pass/fail. No
   such setting exists in the database today.

---

## Deliverables after go-ahead (implementation order)

1. Read helpers + `DashboardStats.admins` + `tokens.ts`.
2. `QuestionBarChart` + `PeopleBreakdown`; route existing charts through tokens.
3. Header: bell + calendar popovers, date, overflow; role-aware feed.
4. Admin dashboard → Administrators page + sidebar entry → teacher dashboard →
   student dashboard.
5. `SiteFooter` + placements.
6. Update `PAGE-CONVENTIONS.md` (new helpers, new chart components, header,
   footer). `npm run typecheck` after each commit. Screenshots of each dashboard,
   both popovers, and the footer, at desktop and 360px.
