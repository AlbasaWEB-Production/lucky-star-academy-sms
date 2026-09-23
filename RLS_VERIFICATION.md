# RLS verification — dashboard metrics

How access control on the dashboard views was verified, what the verification
found, and what was done about it.

The evidence below is **measured, not read**. Every row was produced by signing
in as that user with the anon key and reading the object through PostgREST, so
RLS genuinely applied. Reading `pg_policies` was deliberately avoided: the
question is not whether a policy exists, but what a user actually receives.

Reproduce with:

```bash
node --env-file=.env.local scripts/verify-rls.mjs
```

The script exits non-zero if any role sees rows it should not, so it can gate a
deploy. It is the source of both tables below.

---

## Why `security_invoker` is not the whole story

Every dashboard view declares `with (security_invoker = true)`, so it runs with
the **caller's** privileges and the RLS on the underlying tables applies. A view
without that flag runs as its owner (`postgres`, which is `BYPASSRLS`) and would
silently return the whole school. That flag is the single most important line in
the analytics migration.

But it is necessary and *not sufficient*. `security_invoker` guarantees a view
only reads rows the caller may read. It does **not** guarantee the aggregate it
computes is one the caller should have. An aggregate over the caller's own
single row is still an aggregate — and it is labelled as a class or school
figure. That is the gap the verification found.

---

## What the verification found

Before the role-scope migration, signing in as each role and reading every
object gave:

| role | v_attendance_rate_by_class | v_marks_by_class_subject | v_enrolment_by_campus | v_attendance_heatmap | v_teacher_subject_load | v_grade_distribution | fn_at_risk_pupils | terms | dashboard_thresholds |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| admin | 6 | 18 | 2 | 180 | 6 | 54 | 3 | **0** | **0** |
| teacher1 (Primary 1) | 1 | 3 | 1 | 30 | 6 | 9 | 0 | **0** | **0** |
| teacher2 (Primary 2) | 1 | 3 | 1 | 30 | 6 | 9 | 1 | **0** | **0** |
| student roll 1 (Primary 1) | **1** | **3** | **1** | 10 | **6** | **3** | 0 | **0** | **0** |
| student roll 5 (Primary 2) | **1** | **3** | **1** | 10 | **6** | **3** | **1** | **0** | **0** |

Two separate problems, which need separating because only one of them is a
security problem.

### 1. Management roll-ups were readable by every role

`v_teacher_subject_load` returned all 6 teachers to a pupil — the whole staff's
workload. `v_enrolment_by_campus` returned a row to every role.

Worth being precise: **no row here was ever another person's data.** The base
policies already cap what each role can read, and `subjects_select_school` makes
the subject list school-visible by design (a pupil needs to see their own
subjects). A pupil who called `v_teacher_subject_load` could have assembled the
same teacher names by reading `subjects` directly. So this is over-exposure of a
*management figure*, not a leak of protected data — and the fix is least
privilege, not damage control.

### 2. A pupil received a class figure computed from their own single row

This one is worse, and it is not a privacy issue at all — it is a correctness
issue of exactly the kind the brief warns about.

For a pupil, `v_attendance_rate_by_class` returned **1 row** reading:

> `Primary 1 · 20 registers · 90%`

That is *that pupil's own attendance for two subjects over ten days*, presented
as their entire class's attendance rate. Likewise `v_marks_by_class_subject`
returned the pupil's own three marks labelled as each subject's class average,
and `v_enrolment_by_campus` returned `campus, 1 pupil` — the pupil's own record,
labelled as the campus's enrolment.

None of this is on screen today, because the student dashboard reads base tables
and never these views. But a number that is wrong and *plausible* is more
dangerous than a number that is missing: the moment anyone wired one of these
views to a pupil-facing page, the dashboard would confidently display a
fabricated class statistic, and nothing would look broken.

### 3. `terms` and `dashboard_thresholds` returned 0 rows to everyone

Not an RLS failure — the tables were **empty**. The school had configured
nothing, so every metric was quietly running on the fallback defaults compiled
into both the app and the SQL. On screen this is indistinguishable from a rule
the head actually set. Fixed in the seed (see `DECISIONS.md`).

---

## The fix

`supabase/migrations/20260101000300_dashboard_view_role_scope.sql`.

PostgreSQL does not allow `CREATE POLICY` on a view, so the scope lives inside
the view as a predicate on `public.jwt_role()`, layered on top of the inherited
table RLS. Each view is restricted to the roles whose dashboard actually
consumes it:

| object | readable by | consumer |
| --- | --- | --- |
| `v_teacher_subject_load` | admin | admin dashboard, "Subjects per teacher" |
| `v_enrolment_by_campus` | admin | admin dashboard, "Pupils by campus" |
| `v_attendance_rate_by_class` | admin, teacher | both dashboards |
| `v_marks_by_class_subject` | admin, teacher | both dashboards |
| `v_grade_distribution` | admin, teacher | teacher dashboard, grade histogram |
| `v_attendance_heatmap` | admin, teacher | teacher dashboard, heat map |
| `fn_at_risk_pupils()` | admin, teacher | both dashboards |

A role outside the list gets **zero rows, not a smaller number**. "No data" is a
state the dashboards already render honestly; a plausible wrong number is not.

---

## After the fix — measured

```
                              v_attendance_rate_by_class    v_marks_by_class_subject       v_enrolment_by_campus        v_attendance_heatmap      v_teacher_subject_load        v_grade_distribution           fn_at_risk_pupils                       terms        dashboard_thresholds                  attendance                exam_results
admin                                                  6                          18                           2                         180                           6                          54                           3                           3                           8                         360                          54
teacher1 (Primary 1)                                   1                           3                           0                          30                           0                           9                           0                           3                           8                          60                           9
teacher2 (Primary 2)                                   1                           3                           0                          30                           0                           9                           1                           3                           8                          60                           9
student roll 1 (Primary 1)                             0                           0                           0                           0                           0                           0                           0                           3                           8                          20                           3
student roll 5 (Primary 2)                             0                           0                           0                           0                           0                           0                           0                           3                           8                          20                           3
```

### Teacher-to-teacher isolation, proven by name

Row counts alone prove nothing: two teachers with three pupils each score `3`
whether they are correctly separated or both reading the same class. The script
compares the actual names each teacher receives.

| role | pupils visible in `v_attendance_heatmap` |
| --- | --- |
| admin | Abena Sarpong, Adwoa Owusu, Akosua Bonsu, Aku Sika, Ama Serwaa, Araba Tetteh, Efua Naa, Esi Nyarko, Fiifi Andoh, Kofi Mensah, Kojo Appiah, Kwabena Osei, Kwame Asante, Kweku Ansah, Kwesi Boateng, Maame Yaa, Nana Ama, Yaw Boakye (18) |
| teacher1 (Primary 1) | Ama Serwaa, Efua Naa, Kofi Mensah (3) |
| teacher2 (Primary 2) | Akosua Bonsu, Kwame Asante, Yaw Boakye (3) |

The two teachers' sets are **disjoint**, and together they are a subset of the
admin's 18. Same query, different sessions, different rows — this is the
scoping, not a filter in the page.

### At-risk scoping

| role | at-risk pupils | expected |
| --- | --- | --- |
| admin | Akosua Bonsu, Araba Tetteh, Kwesi Boateng | all 3, across Primary 2 / 4 / 5 and both campuses |
| teacher1 (Primary 1) | *(none)* | no at-risk pupil is in Primary 1 |
| teacher2 (Primary 2) | Akosua Bonsu | roll 5, the only one of the three in Primary 2 |
| pupils | *(none)* | no management figure |

`Akosua Bonsu` arrives with reason `Attendance 60.0%; Below 40 in 2 subjects` —
the configured rule, applied.

### A pupil keeps their own data

Scoping the views must not lock a pupil out of their own record, so the script
also reads the base tables the student dashboard actually uses:

| role | `attendance` | `exam_results` |
| --- | --- | --- |
| admin | 360 | 54 |
| teacher1 | 60 | 9 |
| student roll 1 | **20** | **3** |

The pupil still reads their own 20 register entries (2 subjects × 10 days) and
their own 3 marks. The student dashboard is unaffected.

### Rendered-page confirmation

RLS returning the right rows and the *page* showing the right rows are two
different claims, so teacher1's dashboard was fetched over HTTP with a real
session cookie:

- Term name renders (`First Term 2026/2027`) — previously absent, because the
  term table was empty.
- Only Ama Serwaa, Efua Naa and Kofi Mensah appear. No Primary 2 pupil appears
  anywhere in the page.
- The at-risk panel reads "Nobody at risk" — correct for Primary 1.
- teacher2's page shows their own three pupils, with Akosua Bonsu listed at risk.

---

## Honest limits of this verification

Stated plainly, because a verification document that overstates its coverage is
worse than none.

1. **Single-tenant isolation was not tested here.** The seeded project has one
   school, so "school A cannot see school B" cannot be exercised against it. The
   per-school dimension of every policy
   (`school_id = public.jwt_school_id()`) is covered by the existing
   `supabase/tests/rls_test.sql` suite, which creates two schools and asserts
   cross-tenant reads return nothing. That suite is the authority for tenant
   isolation; this document is the authority for role isolation within a school.
2. **Two teachers and two pupils are sampled**, not all 24 users. The seeded
   classes hold three pupils each, so the sampled teachers do cover a full class
   roster — but this is a spot-check of the scoping logic, not an exhaustive
   sweep of every account.
3. **The role predicate is the outer bound, and inherited RLS is the inner
   one.** The tests confirm the two together. They do not separately prove that
   a teacher who taught a subject in *another* class would be correctly
   narrowed, because the seed gives each teacher exactly one class. That case is
   exercised by the `teaches_subject`/`teaches_class` assertions in
   `rls_test.sql`.
4. **`anon` was not tested**, because these objects are granted to
   `authenticated` only. An unauthenticated request is refused at the grant
   before any policy is consulted.
5. **The two office-staff roles are not measured by this document.**
   `accountant` and `schedule_officer` were added after it was written, and
   neither reads the dashboard views this page is about — so the table above is
   unchanged and still correct for the roles it names. Their coverage is
   section 24 of `supabase/tests/rls_test.sql`, which asserts each reaches its
   own domain and is refused everywhere else (no fees for the schedule officer,
   no register for the accountant, no `profiles` write for either, and
   `v_budget_vs_actual` still empty for the accountant). `scripts/verify-rls.mjs`
   does not yet sign in as them; doing so means extending its cast list, and the
   seed now creates one account of each role for exactly that purpose.

---

## Applied and verified against the live project

The migrations were pushed and the suites run on **2026-09-23**, against the
project this repo's `.env.local` points at.

**Applied.** `supabase db push` had refused with *"Remote migration versions not
found in local migrations directory"* — the remote history held the eleven
existing migrations under the version IDs they were first applied with
(`20260915231928`…), which no longer matched the filenames after those were
renamed to the `20260101000000` sequence. Nothing was missing from the schema:
all 19 tables and 23 views created by those eleven were present, `anon` was
denied everywhere, and the security advisors reported no `rls_disabled_in_public`
and no `security_definer_view`. The fix was bookkeeping only — the eleven orphan
version IDs were reverted and the eleven local versions marked applied, after
which `db push` applied exactly the two new migrations. **The `migration repair
--status reverted` line the CLI itself printed would have been the harmful
choice**: it marks the eleven as not-applied, and the next push would have tried
to re-create tables that already exist.

**`supabase/tests/rls_test.sql`: 231 probes, 231 passed, 0 failed.**

That run also corrected eight probes that were failing, and the breakdown is
worth recording because only some of it was this change's fault:

- **Three were already red** before the office-staff work touched the file —
  `v_pupil_teacher_ratio`, `v_capacity_utilisation` and
  `v_incidents_per_hundred_by_class` each expected 2 class rows. School A gains a
  third ("Probe class") at the cross-tenant control in section 8, and these
  per-class roll-ups correctly return a row for it. Confirmed pre-existing by
  running the file from commit `5e779d4` against the live database, where exactly
  those three failed and nothing else. Expectations corrected to 3.
- **Two were new counts of mine**: section 24 runs last, so the payment count is
  4 (a section 18 control adds one) and the class count is 3, not the section 11
  fixture numbers.
- **Three were a real bug in probes I wrote.** They asserted a denial by catching
  an exception, but an RLS refusal takes two forms and only one is loud: a
  `WITH CHECK` rejection raises, while *no `USING` policy matching at all* —
  which is the case for a role holding no write policy on the table — quietly
  matches zero rows. So the probe recorded "1, succeeded!" for a write that did
  nothing, which reads as a security hole rather than a test bug. They now assert
  `row_count = 0` via `get diagnostics`. The pre-existing escalation probes in
  section 10 do not need this, because `profiles_update_self` *does* match the
  caller's own row, so their denial comes back as an error.

**`supabase/verify.sql`:** six of the seven zero-row checks are clean — RLS
enabled on every table, `anon` holding no privileges, no `SECURITY DEFINER`
function, every function pinning `search_path`, every view `security_invoker`,
and every `UPDATE` policy carrying both `USING` and `WITH CHECK`. The policy
inventory matches the file's expectation exactly: **20 tables, 109 policies**,
including `notices` 4 and `subjects` 5, which confirms the two least-privilege
tightenings are what actually landed.

Check **7c fails with 2 rows**, both pre-existing and unrelated to this change:
`admissions.created_by` and `incidents.recorded_by` are FK columns with no index,
from migrations `20260101000700` and `20260101000800`. Both are
`ON DELETE SET NULL`, so the cost is a scan of those tables when a user is
deleted — not a correctness or security problem. Left unfixed rather than
smuggling an unrelated schema change into this work.

---

## Still not verified

**Neither portal has been signed into.** The `SUPABASE_SECRET_KEY` in
`.env.local` is rejected by the Auth admin API (401) with it sent as `apikey`,
as a Bearer token, and as both, while the publishable key works against the same
project — so it is stale or revoked. Every path that uses the admin client is
therefore untested end to end: `/admin/staff` (which mints the two new account
types), `/admin/teachers/add`, `/admin/students/add`, school registration, and
`scripts/seed.mjs`. No `accountant` or `schedule_officer` account exists yet, so
the accountant and schedule officer pages have never rendered against real data,
and `scripts/verify-rls.mjs` has not been run for this change.

The RLS work *is* verified — section 24 forges the two roles' JWT claims
directly, which is why it can prove their boundaries without a real account. What
that does not cover is the application layer above it: the server actions, the
timetable write path through the UI, and the guards in `src/lib/auth/session.ts`.

**One thing worth flagging that the suites cannot check:** `db push` connected
using CLI credentials, and the 24-hour MCP token used for the run above carries
`projects:write database:write`. Neither is the app's runtime key, so neither
proves the deployed environment is configured.

First check once a fresh secret key is in place: run `scripts/seed.mjs --reset`
(the seed now creates one account of each new role), then walk both portals at
desktop and 360px.

---

## Re-running after a change

Any change to a view, a policy, the seed, or the auth claims should be followed
by:

```bash
node --env-file=.env.local scripts/seed.mjs --reset   # only if the seed changed
node --env-file=.env.local scripts/verify-rls.mjs     # must exit 0
```

Both scripts print their evidence, so a failure is diagnosable from the output
alone rather than by re-deriving what the numbers should have been.
