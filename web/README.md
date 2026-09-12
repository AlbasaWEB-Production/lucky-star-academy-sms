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

The database schema must be applied first — run the two files in
`../supabase/migrations/` in order (see `../MIGRATION.md#2-apply-the-database-schema`).

The app starts without credentials: it renders a setup banner listing the
required steps instead of failing on the first query.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (Turbopack) |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit`, run before every commit |
| `npm run db:push` | `supabase db push` — apply migrations to the linked project |
| `npm run db:types` | Regenerate `src/lib/supabase/database.types.ts` from the live schema |

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
    records/               shared attendance and marks entry screens
    ui/                    PageHeader, StatCard, TableShell, EmptyState, ConfirmActionButton
    charts/                Recharts wrappers
    account/               ProfileNameForm
    admin/ teacher/ student/   portal-specific components
  lib/
    supabase/              client factories (browser, server, admin) + DB types + env
    auth/                  session helpers, Server Actions for auth, user provisioning
    data/                  read layer (server only, RLS-scoped)
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
