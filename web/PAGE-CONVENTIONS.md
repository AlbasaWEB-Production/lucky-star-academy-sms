# Page conventions

The rules and building blocks every page in `web/` follows. Read this before
adding a route.

## Stack

| Piece | Version | Notes |
| --- | --- | --- |
| Next.js | 16.3.5 (App Router, Turbopack) | `src/` directory, `@/*` path alias |
| React | 19.3.0 | Server Actions, `useActionState` |
| MUI | 9.4.0 + Emotion | wired through `@mui/material-nextjs/v16-appRouter` |
| Supabase | `@supabase/ssr` 0.12.7, `supabase-js` 2.116.0 | |
| Charts | Recharts 3.10 | client components only |
| TypeScript | 7.x, `strict: true` | `npm run typecheck` must pass |

## The three rules that matter most

### 1. Server Components fetch, Client Components interact

A page under `src/app/**/page.tsx` is a **Server Component**. It calls the read
helpers in `src/lib/data/*` directly (no `fetch`, no API layer) and renders
markup. It must not use hooks or event handlers.

Interactivity goes in a separate `"use client"` component under
`src/components/**`. The server page passes plain, serialisable data (strings,
numbers, arrays of objects) as props.

**Never pass a function from a server component to a client component.** That
includes column `render` callbacks. If a component needs custom cell markup,
give it the data and let it build the cells itself.

MUI components are themselves client components, so a server page *may* render
`<TableCell>`, `<Button>`, etc. directly, and may pass element children. What
it may not do is attach `onClick`.

### 2. Never write to the browser's database access

All reads go through `src/lib/data/*` (server only). All writes go through a
Server Action in `src/lib/actions/*`. Nothing queries Supabase from the
browser, and the secret key never leaves the server
(`src/lib/supabase/admin.ts` imports `server-only`, which makes a mistake a
build error).

### 3. Row Level Security decides what a query returns

Read helpers deliberately contain **no `where school_id = ...` clause**. RLS
scopes every query automatically:

| Role | `listStudents()` returns | Writes allowed |
| --- | --- | --- |
| admin | every student in their school | anything in their school |
| teacher | students in the classes they teach | attendance/marks for their own subjects only |
| student | only themselves | their own complaint row |

So a new read helper usually needs no school filter either. Do not add one,
and do not add a role check to a read — if a page shows the wrong rows, the
policy is the thing to look at.

Writes created via Server Actions *do* re-check the role with
`requireRoleWithTenant(...)`, but only to produce a clear error message. RLS is
the actual enforcement.

## Available building blocks

### Reads — `@/lib/data/queries`

`getSchool`, `listClasses`, `getClassById`, `listStudents`,
`listStudentsByClass`, `getStudentById`, `listSubjects`, `listSubjectsByClass`,
`listUnassignedSubjects`, `getSubjectById`, `listTeachers`, `getTeacherById`,
`getOwnTeacherAssignments`, `listAdmins`, `listNotices`, `getNoticeById`,
`listComplaints`, `listExamResultsForStudent`, `listAttendanceForStudent`,
`summariseAttendanceForStudent`, `listTeacherAttendance`, `getDashboardStats`.

Dashboard / header helpers:

- `getDashboardStats()` now also returns `admins` (the `profiles` count where
  `role='admin'`), so the school's people are counted as one family.
- `listAttendanceCoverageForDate(date)` — `{ classId, className, recordedCount }[]`
  for the classes that have at least one attendance row on `date` (distinct
  student per class). Join against `listClasses()` to surface the classes at
  zero, which are the actionable gap.
- `listAttendanceCoverageForTeacher(teacherId, date)` — same shape, but every
  one of the teacher's classes is returned including zeros, and only rows for
  the teacher's own subjects are counted.
- `summariseClassAttendanceForTeacher(teacherId)` — `{ classId, className,
  present, absent, percentage }[]` per class across the teacher's subjects.
- `countMarksBySubjectForTeacher(teacherId)` — `{ subjectId, subjectName, count }[]`
  of `exam_results` rows per subject the teacher teaches.
- `listRecentExamResultsForStudent(studentId, since)` — `{ subjectId,
  subjectName, marksObtained, recordedAt }[]` recorded after `since`.

Also `@/lib/data/school`: `getOwnSchool`, `schoolSlugOrThrow`.

Finance reads live in `@/lib/data/finance` (not `queries`): `listTerms`,
`listFeeStructures`, `listFeeAssessments`, `listFeePayments`,
`listBudgetLines`, `listExpenses`, `listOwnFinance` (pupil),
`listFeesCollectedVsExpected`, `listOutstandingByClass`, `listCashPosition`,
`listBudgetVsActual`, `listFeeStatusByStudent`. Admin writes go through
`@/lib/actions/finance`. **Money is integer pesewas** everywhere — the exact
amount is stored and summed, and formatted for display only, through the single
formatter `formatCedis` (`@/lib/money`). Never format money inline, never store
a float, and never present it as anything but Ghana cedis.

### Header data — `@/lib/data/header` (server only)

`getHeaderData(role, userId)` returns `{ today, notifications, calendar }`:

- `today` — the local `YYYY-MM-DD` date.
- `notifications` — a role-aware feed of `{ id, label, href }` items over a
  fixed recent window (7 days), each linking to the page that deals with it.
  Empty when there is nothing new. Never a fake unread count.
- `calendar` — `{ date, kinds: string[] }[]` for the current month, where
  `kinds` are the real record types on that day (`notice`, `attendance`).

It is computed once per request on the server (RLS scopes every row) and passed
into the client `AppShell` as a plain prop. A client component must never call
it, and must never query Supabase itself.

### Footer — `@/components/ui/SiteFooter`

`{ schoolName? }` (defaults to `"Lucky Star Academy"`). Server-safe, no state.
Renders the exact credit **Designed & Developed by AlbasaWEB** (linked to
`https://albasaweb.com`, `target="_blank" rel="noopener noreferrer"`), muted and
centred, with the school name and current year. No other third-party link or
badge. Placed on the landing page, the login chooser, every AuthShell form, and
the signed-in shell.

View model types (`StudentSummary`, `SubjectSummary`, `TeacherSummary`,
`NoticeSummary`, `ComplaintSummary`, `ClassSummary`, …) are exported from
`@/lib/data/queries`.

### Writes — `@/lib/actions/*`

Signature is always
`(previous: FormActionResult, formData: FormData) => Promise<FormActionResult>`,
so the action drops straight into `useActionState` or
`<ConfirmActionButton action={...} />`.

- `roster.ts` — classes, subjects, students, teachers, subject assignment, teacher attendance
- `records.ts` — student attendance and exam marks (admin **and** teacher)
- `content.ts` — notices (admin), complaints (student files, admin deletes)
- `result.ts` — `FormActionResult`, `initialFormResult`, `fail`, `succeed`, `describeDatabaseError`, `readString`, `readInt`, `readNumber`

Some actions `redirect()` on success (create/update) and some return
`succeed` (deletes, so the user stays on the page).

### Auth — `@/lib/auth/session`

`requireSessionUser`, `requireRole`, `requireTenant`,
`requireRoleWithTenant`, `requireStaffWithTenant`, `roleHome`.

Role layouts already call `loadShellContext(role)` (`@/lib/auth/shell-context`),
so **pages do not need to re-check the role** — the `/admin`, `/teacher` and
`/student` layouts have already done it.

### UI — `@/components/ui/*`

| Component | Purpose |
| --- | --- |
| `PageHeader` | `{ title, subtitle?, action? }` — title in Fraunces, ink-green, optional action right-aligned |
| `StatCard` | `{ label, value, hint?, icon?, tone?, primary? }` — metric tile; `tone` picks a semantic accent, `primary` makes one filled-green focal tile |
| `TableShell` | `{ headers, children, isEmpty, emptyMessage?, density?, minWidth?, columnAlign? }` — `density` ("compact" \| "comfortable"), `columnAlign` per-column `"left" \| "right"`, children must be `TableRow`s |
| `NoticeCard` | `{ notice }` — date-rail reading card for notice lists (Decision 5) |
| `EmptyState` | `{ title, description?, action? }` |
| `ConfirmActionButton` | `{ action, fields: Record<string,string>, label, confirmTitle, confirmMessage, color?, variant?, size? }` — confirmation dialog + error reporting |
| `@/components/auth/PasswordField` | `TextField` with a show/hide toggle |
| `@/components/charts/AttendancePieChart` | `{ present, absent, height? }` |
| `@/components/charts/MarksBarChart` | `{ data: {name, value}[], height?, color? }` |
| `@/components/charts/QuestionBarChart` | `{ data: {name, value}[], question, unit?, color?, height?, horizontal? }` — a single-series bar chart that answers one question; `question` is the `aria-label` and tooltip title, `unit` is appended to the axis and labels, `horizontal` gives a per-category comparison |
| `@/components/charts/PeopleBreakdown` | `{ students, teachers, admins, height? }` — three-bar horizontal comparison; administrators are always the third group |
| `@/components/charts/FeesCollectedVsExpectedChart` | `{ data: { name, expected, collected }[], height? }` — collected bars against a gold target line |
| `@/components/charts/OutstandingByClassChart` | `{ data: { name, collected, outstanding }[], height? }` — stacked collected-vs-owing per class |
| `@/components/charts/CashPositionChart` | `{ data: { name, income, expenses, runningBalance }[], height? }` — income/expense bars with a running-balance line |
| `@/components/charts/BudgetVsActualChart` | `{ data: { name, budget, actual }[], height? }` — budget vs actual per cost centre |
| `@/components/dashboard/DataTable` | `{ rows, columns, csvName, initialSortKey?, initialSortDirection?, pageSize? }` — client sortable/searchable staff table with CSV export, used for defaulters; each column `{ key, label, type?, align? }` where `type` is `"money"` for right-aligned pesewas |
| `@/components/charts/tokens` | `CHART_COLORS` — the shared ordered series palette (`#147B45`, `#083E28`, `#F2B705`, `#3D9C6A`, `#6B8F7A`). Every chart imports from here; never hard-code a series colour |
| `@/components/ui/SearchBar` | `{ placeholder, initialQuery? }` — client filter box for list pages; writes `?q=` to the URL and leaves the actual filtering to the server page (see "Searching a list") |
| `@/components/NextLink` | `next/link` wrapper; required for MUI `component={Link}` |

`TableShell` takes `isEmpty` explicitly — do not rely on it inferring
emptiness from `children`, because `[].length === 0` still renders a truthy
array.

`TableShell` also takes `density` and `columnAlign`:
- **`density`** — `"compact"` for staff-facing data tables (admin/teacher),
  `"comfortable"` (the default) for pupil-facing surfaces. Compact tables use
  `size="small"` rows.
- **`columnAlign`** — an array indexed to `headers`. Numeric columns (counts,
  marks, percentages) go `"right"`; names and labels stay `"left"`. The page
  must set the matching `align` on its own body cells, and give numeric cells
  `fontVariantNumeric: "tabular-nums"` so the digits line up.
- **`minWidth`** — keep it small (≈640) for pupil-facing tables, wider for
  staff rosters.

Chart cards on dashboards and detail pages are wrapped as a "panel with a
caption": an overline category label (e.g. `Overview`, `Performance`) above an
h6 title. Follow the existing chart cards' structure rather than inventing a
new one.

## Next.js 16 gotchas

1. **`params` and `searchParams` are Promises.** Always:
   ```tsx
   export default async function Page({ params }: { params: Promise<{ id: string }> }) {
     const { id } = await params;
   }
   ```
2. **`cookies()` / `headers()` are async.**
3. **Do not pass `next/link` directly to MUI's `component` prop.** Import
   `Link` from `@/components/NextLink`.
4. **Avoid MUI's `Grid`.** Its prop API changed across majors. Use `Box` with
   `sx={{ display: 'grid', gridTemplateColumns: {...}, gap: n }}`, or `Stack`.
5. **`useSearchParams()` needs a `<Suspense>` boundary.** Prefer reading
   filters from `searchParams` in the server page instead.
6. Charts need an explicitly sized parent (`height` prop is provided) because
   Recharts measures its container.

## Layout and style

- Pages return a fragment starting with `<PageHeader />`.
- Content width is handled by the shell; wrap grids in `Box`.
- Palette is tokenised in `src/theme.ts`:
  - `primary.main` `#147B45` (crest green) — the single working colour: buttons,
    active sidebar item, selected chips, table-header tint.
  - `secondary.main` `#083E28` — deep green, used as ink for headings and for
    button text on white. It must stay dark enough to read.
  - `BRAND_GOLD` `#F2B705` — crest gold. **Never text on white** (≈1.9:1). Use
    as a fill, rule or watermark with dark text over it.
  - `PAGE_BG` `#F7F7F5`, `INK` `#1A1A1A`, `INK_MUTED` `#6B6B6B`.
  - `DISPLAY_FONT` = `var(--font-fraunces)`, `TEXT_FONT` = `var(--font-hanken)`.
    Fraunces for the hero, page titles, section headings and big numbers;
    Hanken for body, labels, table text and buttons.
- Use theme tokens (`color="text.secondary"`, `sx={{ color: 'primary.main' }}`)
  rather than hard-coded colours, except inside chart series — and chart series
  use `CHART_COLORS` from `@/components/charts/tokens`, not ad-hoc hex values.
- Typefaces come from CSS variables set on `<html>` in `layout.tsx`; reference
  them via `DISPLAY_FONT` / `TEXT_FONT`, never a font-family string.
- Radius scale is fixed by meaning: pill (buttons/chips) = 999, inputs = 12,
  metric/list tiles = 14, role/notice/photo cards = 20, auth card + dialogs = 24.
  Prefer these over arbitrary `sx` radii.
- Every table needs an `emptyMessage` that says what to do next.
- Dates come back from Postgres as `YYYY-MM-DD` strings; render them with
  `new Date(value).toLocaleDateString()`.
- Data tables for staff are `density="compact"` with right-aligned numeric
  columns; pupil-facing tables stay roomier. See the `TableShell` notes above.
- `NextLink` accepts only `style` (as an anchor attribute), not `sx` — use
  `style={{ color: BRAND_GREEN, fontWeight: 600 }}` for a styled link.
- A page must work at 360px: grids collapse to a single column (`gridTemplateColumns:
  { xs: '1fr', sm: '1fr 1fr' }`), and no element forces horizontal page scroll.

## Shell, header and dashboards

- The signed-in shell (`@/components/layout/AppShell`) takes `headerData` from
  the role layout (which calls `getHeaderData`). The top bar carries
  information, not chrome: today's date, a notification bell with a role-aware
  feed (`NotificationFeed`), a mini-month calendar (`CalendarGrid`), and the
  account menu. On `xs` the date, bell, calendar and account collapse into one
  "More" `IconButton` → `Menu` so the bar stays a single line. Nothing in the
  bar is ornamental.
- Dashboards answer one question each, so they have a hierarchy rather than a
  row of identical metric tiles. A hero chart (what needs attention today)
  sits beside an attention panel, then supporting charts, then the recent
  notices panel. Use `QuestionBarChart` / `PeopleBreakdown` for the dashboard
  charts; reserve `StatCard` for a single focal metric, not a grid of six.
- Administrators are a third group wherever people are counted or broken down
  (the `admins` stat, `PeopleBreakdown`, and the `/admin/admins` page). The
  administrators page is read-only — no add/delete controls.

## Searching a list

Every list page carries a `SearchBar`, and the **filtering itself stays on the
server**. The URL is the state:

```tsx
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const rows = await listX();                       // unchanged, still RLS-scoped
  const filtered = query ? rows.filter(/* … */) : rows;

  // PageHeader subtitle: query ? `Showing ${filtered.length} of ${rows.length} …` : original
  // then <SearchBar placeholder="…" initialQuery={q} />, then the table from `filtered`
  // emptyMessage: query && rows.length > 0 ? `Nothing matches “${q}”.` : original
}
```

Rules that follow from that:

- **The page stays a Server Component.** `SearchBar` is the only client part; it
  writes `?q=` (debounced) and the server re-renders. No `"use client"` list, no
  filter callback passed down, and no new query parameters reach Supabase —
  matching is done in memory over the rows RLS already returned.
- **Search matches the columns the table shows**, case-insensitively — usually
  names, codes and classes. Numbers (roll number, counts) are matched through
  `String(field)` so `string | number` columns typecheck.
- **Three states, three messages.** Running total in the subtitle ("Showing 2 of
  18 students."), the original empty message when the list is genuinely empty,
  and `Nothing matches “…”` when a query filtered everything out.
- On a page with more than one list (student subjects, attendance), filter every
  list and the chart that is fed from it, so the page never contradicts itself.
  Keep totals that describe the whole period — the attendance pie, for instance —
  on the unfiltered numbers.

## Form pattern

```tsx
"use client";

import { useActionState } from "react";
import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import { someAction } from "@/lib/actions/roster";
import { initialFormResult } from "@/lib/actions/result";

export default function SomeForm({ options }: { options: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState(someAction, initialFormResult);

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 560 }}>
      {state.error ? <Alert severity="error" sx={{ mb: 2 }}>{state.error}</Alert> : null}

      <Typography variant="overline" color="text.secondary">Section</Typography>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
        <TextField name="fieldA" label="Field A" required fullWidth margin="none" />
        <TextField name="fieldB" label="Field B" required fullWidth margin="none" />
      </Box>

      <Button type="submit" variant="contained" disabled={isPending} sx={{ mt: 3 }}>
        {isPending ? "Saving..." : "Save"}
      </Button>
    </Box>
  );
}
```

Conventions, applied consistently across every portal:

- **Error to the top.** The server error is the first child of the form (after
  any hidden inputs), as `<Alert severity="error" sx={{ mb: 2 }}>`. A success
  banner, when the action returns `ok`, sits just above the submit button.
- **Group labels.** Related fields are grouped under a
  `<Typography variant="overline" color="text.secondary">` label ("Student
  details", "Login", "Teacher", "Subject details"). Add `sx={{ mt: 3 }}` to a
  label that follows another group.
- **Pair fields.** Two short fields that belong together (name + email, roll
  number + class, present + absent) sit in a 2-column grid with `margin="none"`
  on the inner fields. Full-width single fields keep `margin="normal"`.
- **Widths.** Forms are capped at `maxWidth: 560`; a single short field
  (profile name) may be 480. Date fields are constrained to `sx={{ maxWidth: 240 }}`
  so the control is never wider than the date it holds.
- **Buttons.** `variant="contained"`, `disabled={isPending}`, `sx={{ mt: 3 }}`;
  show a `CircularProgress` while pending.

The `name` attribute on each field must match the key the action reads with
`readString` / `readInt`.

Forms carry a single global `error` string — there are no per-field errors, so
the surface treatment above is the whole story; do not invent inline field
validation.

## Verifying

```
cd web
npm run typecheck
```

`npm run build` is run once at the end by the integrator — do not run it
concurrently, since parallel builds contend over `.next/`.
