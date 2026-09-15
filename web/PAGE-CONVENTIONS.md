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
`getOwnTeacherAssignments`, `listNotices`, `getNoticeById`, `listComplaints`,
`listExamResultsForStudent`, `listAttendanceForStudent`,
`summariseAttendanceForStudent`, `listTeacherAttendance`, `getDashboardStats`.

Also `@/lib/data/school`: `getOwnSchool`, `schoolSlugOrThrow`.

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
  rather than hard-coded colours, except inside chart series.
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
