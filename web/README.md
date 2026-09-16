# Lucky Star Academy SMS — web app

The Next.js 16 + Supabase application. See [`../MIGRATION.md`](../MIGRATION.md)
for the full migration record, database design and security model, and
[`PAGE-CONVENTIONS.md`](./PAGE-CONVENTIONS.md) before adding a route.

## Quickstart

```bash
npm install
cp .env.example .env.local     # then fill in your Supabase project values
npm run dev                    # http://localhost:3000
```

The database schema must be applied first — run the four files in
`../supabase/migrations/` in filename order (see `../MIGRATION.md#2-apply-the-database-schema`).

The app starts without credentials: it renders a setup banner listing the
required steps instead of failing on the first query.

To get a school with pupils, terms and thresholds to look at:

```bash
node --env-file=.env.local scripts/seed.mjs            # idempotent; refuses if already seeded
node --env-file=.env.local scripts/seed.mjs --reset    # wipe the seeded school and reseed
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (Turbopack) |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit`, run before every commit |
| `npm run db:push` | `supabase db push` — apply migrations to the linked project |
| `npm run db:types` | Regenerate `src/lib/supabase/database.types.ts` from the live schema |

There is **no `lint` script** — `typecheck` and `build` are the gates. Two
maintenance scripts are run directly:

| Script | Purpose |
| --- | --- |
| `scripts/seed.mjs` | Deterministic placeholder data: 1 school, 6 classes, 18 pupils, terms, thresholds |
| `scripts/verify-rls.mjs` | Signs in as each role and asserts what each actually reads. **Exits non-zero on failure**, so it can gate a deploy. See [`RLS_VERIFICATION.md`](./RLS_VERIFICATION.md) |

## Layout

```
src/
  app/                     routes (App Router)
    page.tsx               public landing page
    login/{admin,teacher,student}/   role-specific sign-in
    register/school/       creates a school and its first admin
    admin/ teacher/ student/         role portals, each with its own layout
    setup-required/        shown when an account has no school/role claims
  components/
    auth/                  sign-in and registration forms
    layout/                AppShell (app bar, sidebar, account menu) + nav config
    dashboard/             ChartCard, DataTable, UrlFilterSelect, AttendanceHeatmap
    records/               shared attendance and marks entry screens
    ui/                    PageHeader, StatCard, TableShell, EmptyState, SearchBar, ConfirmActionButton
    charts/                Recharts wrappers + tokens.ts (the chart palette)
    account/               ProfileNameForm
    admin/ teacher/ student/   portal-specific components
  lib/
    supabase/              client factories (browser, server, admin) + DB types + env
    auth/                  session helpers, Server Actions for auth, user provisioning
    data/                  read layer (server only, RLS-scoped); dashboard.ts reads the metric views
    actions/               write layer (Server Actions)
  proxy.ts                 session refresh + role route guarding (Next 16 "middleware")
  theme.ts                 MUI theme
```

### Request flow

1. `src/proxy.ts` refreshes the Supabase session cookie and rejects
   cross-role navigation.
2. The role layout (`src/app/<role>/layout.tsx`) calls
   `loadShellContext(role)`, which enforces the role and loads the school name.
3. The page — a Server Component — calls the read helpers in `src/lib/data`
   and renders. Row Level Security scopes the rows to the caller.
4. Writes go through Server Actions in `src/lib/actions`, which re-check the
   role for a clear error message and then let RLS make the real decision.

## Two rules worth repeating

- **Never query Supabase from the browser.** Reads go through
  `src/lib/data`, writes through `src/lib/actions`. The secret key is guarded
  by `import "server-only"` in `src/lib/supabase/admin.ts`.
- **Do not add `school_id` filters to reads.** RLS already scopes them; adding
  a filter is redundant and risks silently hiding legitimate rows.

---

## Adding a dashboard widget

Three steps, in this order. The order matters: a number computed in the page
cannot be reused, tested, or scoped, and a second copy of the same formula will
eventually disagree with the first.

### 1. The metric — a view or function, in a migration

Never compute a dashboard figure in TypeScript over fetched rows, and never in
the page. Add it to `../supabase/migrations/` as a new file:

```sql
create or replace view public.v_my_metric
with (security_invoker = true)
as
select ...
where (select public.jwt_role()) in ('admin', 'teacher')   -- the roles whose dashboard reads it
group by ...;
```

Two things are not optional:

- **`with (security_invoker = true)`.** Without it the view runs as its owner
  (`postgres`, which is `BYPASSRLS`) and silently returns the whole school.
- **The role predicate.** `security_invoker` makes the view read only rows the
  caller may see; it does **not** stop it handing a pupil a class figure computed
  from the pupil's own row. PostgreSQL does not allow `CREATE POLICY` on a view,
  so the audience lives in the view body.

If the widget is a **rule** rather than a formula (a threshold, a band), add a
row to `dashboard_thresholds` instead: the head can then change it without a
deploy. Read it live, with the code fallback documented as mirroring the SQL
default — the app and the database must never disagree about the rule.

### 2. The read helper — `src/lib/data/dashboard.ts`

`server-only`, no `where school_id`, no role check. RLS already decides the rows,
and adding a check here would hide the real behaviour rather than enforce it.

```ts
export async function listMyMetric(): Promise<MyMetric[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("v_my_metric").select("...");
  return (data ?? []).map((row) => ({ ..., value: Number(row.value) }));
}
```

**Coerce every number with `Number()`.** PostgREST serialises Postgres `numeric`
and `bigint` as JSON *strings* (`"87.5"`, not `87.5`). Skipping this is how a KPI
tile renders `100.0` instead of `100%`.

### 3. The page — a Server Component

Use `ChartCard` for anything charted (it supplies the title, period subtitle,
filter slot, empty and error states) and `StatCard` for a single figure.
`DataTable` for tabular data, `EmptyState` for "no data yet".

- **Charts are the only client components.** `ChartCard`, `DataTable` and
  `UrlFilterSelect` are client; everything around them is server.
- **Never pass a function from a server component to a client component.**
- Filters are URL params read from `searchParams` (a Promise in Next 16) and
  passed to `UrlFilterSelect` — matching the `?q=` pattern the list pages use.
  Wrap them in `<Suspense>`, imported from `react` (not `@mui/material`).
- Colours come from `@/components/charts/tokens`. Never hard-code a series colour.
- **Colour is never the only carrier.** Pair it with a glyph, a direct label or a
  legend entry, so the chart survives greyscale and WCAG 1.4.1.
- An empty series renders a specific empty state, never an invented-looking zero.

### 4. Record and verify

- Add the formula to [`METRICS.md`](./METRICS.md) — including what it must *not*
  be read as. A metric whose limits are undocumented will be over-read.
- If it needs a table that does not exist, it does **not** get built: add it to
  [`DASHBOARD_BACKLOG.md`](./DASHBOARD_BACKLOG.md) instead of fabricating it.
- Add the object to `scripts/verify-rls.mjs` and re-run it. If you changed a
  role's reach, update [`RLS_VERIFICATION.md`](./RLS_VERIFICATION.md).

### Where the rest is written down

| Question | File |
| --- | --- |
| What does this number mean, exactly? | [`METRICS.md`](./METRICS.md) |
| What can each role actually read? | [`RLS_VERIFICATION.md`](./RLS_VERIFICATION.md) |
| Why isn't *this* widget here? | [`DASHBOARD_BACKLOG.md`](./DASHBOARD_BACKLOG.md) |
| Why was it built this way? | [`DECISIONS.md`](./DECISIONS.md) |
| What exists, and where do widgets slot in? | [`DASHBOARD_PLAN.md`](./DASHBOARD_PLAN.md) |
| Page and component conventions | [`PAGE-CONVENTIONS.md`](./PAGE-CONVENTIONS.md) |
