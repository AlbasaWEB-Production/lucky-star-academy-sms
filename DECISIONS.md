# Decisions

Judgement calls made while building the dashboards **without asking**, with the
reasoning and the alternative I rejected. The school's own decisions are in
`DASHBOARD_PLAN.md` § 9, not here — this file is only for the calls that were
mine to make.

Written so that a later reader can disagree with a decision on its merits rather
than guess why it was made.

---

## 1. Seeded data is deterministic, not random

**Decision.** Every seeded mark and absence is a pure function of the pupil's
roll number and the subject/day index. Re-running the seed produces byte-identical
data.

**Why.** A dashboard is reviewed by looking at it. If the numbers move between
runs, three things break at once: a screenshot stops being evidence of anything,
"did my fix change this figure?" becomes unanswerable, and a bug that only
appears for certain marks becomes unreproducible. Determinism is what makes the
verification in `RLS_VERIFICATION.md` meaningful — the at-risk list is the same
three pupils every time, so a *fourth* appearing is a real signal.

**Alternative rejected:** `Math.random()` marks. Faster to write, and it produces
a dataset that looks more natural at a glance — which is exactly the problem: a
plausible-looking random dataset is indistinguishable from a broken one when the
bug is in the aggregation.

**Cost accepted:** the data is visibly patterned (rolls 5, 11 and 14 are the
struggling pupils; absences fall on a fixed set of days). That is a deliberate
trade for reviewability. It is placeholder data and is labelled as such.

---

## 2. The school's thresholds are seeded as real rows, not left to fallbacks

**Decision.** `dashboard_thresholds` is seeded with the eight documented keys, and
`terms` with the three-term calendar.

**Why.** This was a **bug found during verification**, and the most instructive
one in the task. Both tables were empty, which meant every metric was running on
defaults compiled into the app *and* separately into the SQL. Nothing looked
broken. The at-risk list, the grade bands and the term subtitle all rendered
confidently from numbers the school had never chosen.

An empty config table is indistinguishable on screen from a decision the head
made. There is no "configuration missing" state a reader can see. So the config
is now a real, editable row set — and the defaults remain in the code as a
documented mirror for a genuinely new school, not as the operational value.

**Alternative rejected:** leave the tables empty and rely on the fallbacks. It
works, and it is what the code was written to tolerate — which is the trap. The
fallback exists so a *new* school is not broken; relying on it for a school that
has been configured is a silent failure.

---

## 3. Campus ownership lives in the seed, not a migration backfill

**Decision.** Which class sits at which campus is data the seed writes.

**Why.** The migration adds the nullable column and constrains it; assigning the
six classes is a school fact, not schema. Putting it in a backfill migration
would mean a one-off `update` that reruns on a fresh database and would fight
the seed — the seed comment records that re-running must not silently wipe which
campus a class belongs to.

**Consequence:** a fresh database has no campus until seeded, which is honest —
the school has not said yet. `v_enrolment_by_campus` groups those rows under
`null` and the UI labels that group, so an unassigned class is visible work
rather than a missing row.

---

## 4. "Marks entered per subject" was replaced by "Grade distribution"

**Decision.** The teacher dashboard shows a grade histogram, not a count of marks
entered per subject.

**Why.** "Marks entered" answers *where is data missing* — a data-entry
housekeeping question. "Grade distribution" answers *how is my class doing* —
the question a teacher opens the dashboard with. The brief asked for the
histogram; the count was the earlier design's substitute for it, and it survived
only because grade bands did not exist yet. Once the bands were configured, the
substitute had no reason to stay.

**Alternative rejected:** keep both. Two charts of the same subject marks on one
dashboard is the "dashboard soup" the brief warns against, and the count's real
value (spotting an unmarked subject) is already carried by the empty state.

---

## 5. `Late` was not added to the attendance enum

**Decision.** `attendance_status` stays `Present | Absent`. No migration, no
register-form change. The heat map colours on the states that exist.

**Why.** Adding an enum value is not a one-line change: every attendance form
gains an option, every existing row's meaning is unaffected but every *report*
must now decide whether late counts as present, and the school has not said
whether it wants to distinguish them. It is the school's rule to make, it is not
blocking anything, and inventing a third state would put a value in the database
that no one asked to record.

**Revisit:** it is a small change when the school wants it — one enum value, one
form option, one colour.

---

## 6. The heat map gained a `Partial` day state

**Decision.** A day is resolved from *every* subject marked that day into one of
Present / Partial / Absent / Unmarked.

**Why.** Found while writing `METRICS.md`, by checking the code against the claim
I was making about it. The component resolved a day by `byDate.set(date, status)`
— **last write wins**. A pupil marked present in Maths and absent in English on
the same day therefore rendered as whichever row the query happened to return
last: an arbitrary answer, and one that could differ between two runs of the same
page. The row's rate also divided present *subject-rows* by marked *subject-rows*
while sitting at the end of a row of *day* cells, so it read as a share of days
and was not one.

This is a genuine state the register produces — most often a pupil who leaves
partway through a day — so collapsing it either way fabricates certainty. The
grid now resolves the tally deterministically, the rate is day-based, and the
column is headed **"Days present"** so its unit is on screen rather than assumed.

**Alternative rejected:** keep two states and treat any present as present. That
hides a pupil who is quietly skipping one subject every day, which is the
pattern a drift chart exists to catch.

**Cost accepted:** a fourth state in the legend. It carries a glyph as well as a
colour, so it costs no accessibility.

**How it was verified.** Not by reading the component back. A row was flipped so
that one pupil was present in one subject and absent in another on a single day,
the teacher dashboard was fetched as that teacher with a real session, and the
rendered cell's accessible name was read out of the HTML —
`Kofi Mensah, Tue, Sep 8, 2026: Present in some subjects`. The row was then
restored, and the verification matrix reproduced exactly.

Worth recording: **the seeded data never produces a mixed day.** Every seeded
absence is a *whole* day, so the `Partial` state is not exercised by the seed at
all, and a reviewer looking at the dashboard as shipped will not see it. That is
precisely how the bug survived — the four-state grid looked correct because the
fifth case it had to handle never occurred in front of anyone.

---

## 7. A stale comment was corrected without a schema change

**Decision.** The `terms` table comment claimed an `is_active` column that does
not exist. The comment was rewritten; no column was added.

**Why.** `information_schema.columns` shows `terms` has `id, school_id, name,
term_number, start_date, end_date, created_at, updated_at` — no `is_active`. A
comment that describes a column which is not there is worse than no comment: the
next reader trusts it and writes code against a flag that will never be set.

**Recorded here rather than silently fixed** because it is the kind of thing that
looks like a no-op in a diff. The current design resolves "this term" from the
date window, which is deliberate — a stale flag can never point the dashboards at
the wrong term, whereas an `is_active` flag left un-updated can.

---

## 8. The role-scope migration is least privilege, not a leak fix

**Decision.** Every aggregate view and `fn_at_risk_pupils()` is scoped to the
roles whose dashboard consumes it.

**Why.** `security_invoker = true` makes a view inherit table RLS — necessary,
and not sufficient. An aggregate computed from the caller's own single row is
still an aggregate, and it was being labelled as a class or campus figure. A
pupil calling `v_attendance_rate_by_class` got one row reading *"Primary 1, 20
registers, 90%"* — their own attendance, presented as their whole class's.

Stated precisely, because overstating this would be its own kind of dishonesty:
**no row was ever another person's data.** The base policies already capped what
each role could read, and the subject list is school-visible by design. What was
wrong is that a management figure was produced for non-management roles, and that
a plausible wrong number appeared where "no data" was the honest answer. That
second part is a correctness bug, not a privacy one — and a wrong-but-plausible
number is more dangerous than a missing one, because nothing looks broken.

**Alternative rejected:** a policy on the view. PostgreSQL does not allow
`CREATE POLICY` on a view, so the scope lives in the view body as a predicate on
`jwt_role()`, layered over the inherited RLS.

Full evidence in `RLS_VERIFICATION.md`, including the before/after matrices and
the proof that the two sampled teachers receive disjoint sets of pupils by name.

---

## 9. `scripts/verify-rls.mjs` is a permanent artefact

**Decision.** The verification script is committed, not discarded as a throwaway.

**Why.** The brief asks for verification "with real queries as the wrong user".
A one-off script produces evidence for one afternoon; a committed script produces
evidence for every future change, and can gate a deploy — it exits non-zero on
failure. It is also what caught the role-scope gap, which reading `pg_policies`
would not have: a policy that exists and is *wrong for a `security_invoker` view*
looks identical in the catalogue and completely different in the result.

**Its distinguishing feature** is comparing the two teachers' pupils by **name**,
not by row count. Equal counts prove nothing — two teachers in classes of three
score `3` each whether they are correctly separated or both reading the same
class.

---

## 10. The at-risk rule implements two of the brief's three signals

**Decision.** At-risk = term attendance below the configured percentage **or**
below the configured mark in at least the configured number of subjects. The
brief's third signal (≥ 2 behaviour incidents) is not implemented.

**Why.** There is no discipline table. See `DASHBOARD_BACKLOG.md` § 3. The
alternative — approximating behaviour from something that does exist — would
produce a number with no meaning behind it and put a pupil on a list for a reason
the school never chose.

**Stated on screen and in the docs**, so no reader assumes the list is complete:
the rule is described as its two conditions wherever it appears. A pupil with
clean attendance and marks but repeated incidents is not flagged, and nothing
implies otherwise.

---

## 11. The "Attendance this term" KPI is labelled but not term-scoped

**Decision.** Left as-is for now; recorded in `DASHBOARD_BACKLOG.md` § 9 rather
than changed in this task.

**Why.** The KPI reads a view that aggregates every attendance row the caller may
read, while its label names the current term. With all sampled attendance inside
one term, the label is true today — and it stops being true the moment a second
term is marked.

**Why not fixed now:** making it genuinely term-scoped means deciding whether
`attendance` gains a `term_id` (a schema change with an index and a backfill) or
the read takes a date window derived from the term (no schema change, but the
view stops being a plain aggregate). That is a design choice worth making
deliberately rather than in passing, and it is not on the critical path.

**Why recorded rather than ignored:** it is precisely the "wrong and plausible"
failure mode that `RLS_VERIFICATION.md` § 2 was about, and the current seed would
never reveal it. A known gap that is written down is fixable; one that is not is
a future bug report.

---

## 12. No `lint` script was invented

**Decision.** The brief's `npm run lint` step was not run. `npm run typecheck`
and `npm run build` were used as the gates instead.

**Why.** No `lint` script exists — `package.json` defines `dev, build, start,
typecheck, db:push, db:types`. Adding ESLint to satisfy a checklist item would be
a real dependency and configuration change to the project, made to satisfy the
wording of a brief rather than a need. Reported instead.

---

## 13. The Vercel preview was not created

**Decision.** Not done in this task; raised for the user.

**Why.** The repository has no Vercel configuration and no linked project, and
creating a deployment target is an outward-facing, billing-bearing action on the
user's account. It is a step for the user to take or authorise. The brief's other
gates — typecheck, build, RLS verification — were all run locally.

---

## 14. The student dashboard reads base tables, not the views

**Decision.** The student dashboard keeps reading `attendance` and `exam_results`
directly through RLS; it does not use the aggregate views.

**Why.** A pupil's question is "how am I doing", not "how is the class doing".
The views are class- and school-level aggregates by construction, so there is
nothing on them a pupil should see — which is exactly what decision 8 formalised
when it scoped them to admin and teacher. The pupil still reads their own rows:
verified after scoping, 20 attendance entries and 3 marks.

**Consequence recorded for the future:** if a pupil-facing widget ever needs a
class figure — a rank, a percentile — it must be a **new** view with its own
audience in mind, not a widening of one of these.

---

## 15. Three rendering defects were fixed after re-shooting the screenshots

**Decision.** Three defects found by re-shooting the committed screenshots were
fixed, and the screenshots were replaced. The fixes are in
`QuestionBarChart.tsx` and the teacher dashboard.

**Why this is recorded:** none of the three was visible in code review, and two
of them were *not* visible in the previous screenshots either — they only
appeared once the widgets rendered with the data that exercises them. They are
worth writing down because each is a case of the chart confidently drawing
something wrong, which is the failure mode the rest of this file keeps returning
to.

1. **The value axis read `3students`.** Recharts' own `unit` prop on an axis is
   concatenated with no separator. A `tickFormatter` now appends the unit with a
   space. The tooltip and the direct label were already doing this; the axis was
   the one path where the unit was passed through as a prop rather than as text.

2. **A vertical bar's direct label read `1` above `pupils`, stacked.** Found by
   dumping the rendered `outerHTML` rather than by looking at the chart: a
   Recharts `LabelList` with `position="top"` splits its text on whitespace into
   two `<tspan>` lines, dropping the space and wrapping the unit underneath. The
   horizontal (`position="right"`) branch renders a single tspan and was never
   affected. Fixed with a non-breaking space, **scoped to the vertical branch
   only** — applying it to both would have leaked an invisible character into
   every horizontal label's copy-paste for no benefit.

   The related half: a direct label sits *outside* its bar, so the chart has to
   reserve room for it or the longest label is clipped at the edge (`3 stude`).
   The right margin is now computed from the longest label actually present
   rather than a fixed constant, so a longer unit cannot quietly reintroduce the
   clipping.

3. **The grade-distribution panel could draw an empty plot.** All six grade
   bands come back even when every one of them is zero, so the chart's own
   `data.length === 0` empty state can never fire. A subject with no marks
   therefore rendered an empty set of axes, which reads as a *broken chart*
   rather than as *a subject nobody has marked*. The card now gates on the total
   count and says which of the two situations it is.

   Paired with it: the subject selector defaulted to the alphabetically-first
   subject, which may be unmarked, so a teacher's first look at their own
   dashboard could open on the empty panel. The default is now the
   alphabetically-first subject **that has marks**, with an explicit `?subject=`
   selection still winning.

**Alternative rejected:** leave them, on the grounds that the numbers were
correct and only the presentation was off. Rejected because a stacked `1` /
`pupils` and an empty plot are not read as presentation by anyone looking at the
screen — they are read as *one pupil* and *no data*, and the second is a claim
about the school that the dashboard is not entitled to make.

**How it was verified.** Not by re-reading the components. The `LabelList`
markup was dumped from the live DOM and every `svg text.recharts-label` was
asserted to carry exactly one `tspan`; the axis ticks were asserted to match
`\b\d+ students\b` after normalising non-breaking spaces, and separately
asserted not to contain a glued unit; and the grade panel was asserted to render
bars with all six band labels present. The database was queried in the same pass
to confirm the heat map's `Partial` state genuinely does not occur in the seed
(§ 6) — the check was mine, not the data's.

---

## 16. Lighthouse mobile: accessibility passes, performance does not

**Decision.** Measured and recorded here rather than tuned. Accessibility meets
the brief's bar; performance does not, and the reason is understood well enough
to state rather than guessed at.

**Result** (Lighthouse 13.4.1, `--form-factor=mobile`, production build,
`next start` on localhost, audited as a real signed-in session per role):

| Dashboard | Performance | Accessibility |
| --- | --- | --- |
| `/admin/dashboard` | **61** | **100** |
| `/teacher/dashboard` | **70** | **100** |
| `/student/dashboard` | **73** | **100** |

Gate was ≥ 90 on both. **Accessibility passes on all three at 100. Performance
fails on all three.** Cumulative layout shift is 0 on every dashboard, so the
failure is not the charts reflowing as they mount.

**What dominates the performance score**, from the metric values rather than the
overall number: server response time is 1.6–1.8 s and total blocking time is
700–1170 ms. FCP is comparatively good (0.9–1.3 s), which isolates the cost to
*time to first byte* plus main-thread work, not to first paint. LCP is 2.7–3.9 s
and speed index 3.7–4.3 s, i.e. the page becomes usable well after it first
paints.

**Why the TTFB is high, stated as a cause and not an excuse.** Every dashboard
awaits Supabase over the network before it can render, and the teacher dashboard
awaits it in **two sequential rounds** — a `Promise.all` of eight reads, then a
second `Promise.all` of two whose inputs depend on the first. Each round pays the
full round trip. This is a real property of the page, not a measurement
artefact, and it is the honest headline finding: the gate fails because the
server blocks on remote queries in series.

**Recorded caveat, so this number is not over-read.** The audit ran against a
local `next start`, so no CDN, no edge caching and no co-located database; a
deployed environment would serve static assets from a CDN and reach Supabase over
a much shorter network path. The score is therefore pessimistic. It is reported
as measured, because the alternative — reporting a number I did not take, or
quietly omitting a gate I did not meet — is worse than a pessimistic true one.

**Why not optimised in this task.** Closing the gap means restructuring when the
page is allowed to render — consolidating or parallelising the query rounds,
streaming the slow cards behind `Suspense` so the shell flushes first, and
splitting the chart bundle. Each changes how the dashboards load and wants its
own verification pass, which is a task rather than a follow-up edit. Not begun
without asking.

**The accessibility defects this audit caught were fixed, not just reported** —
the second run's 100 is a different measurement from the first run's 95/94/98,
not a run-to-run wobble:

- `color-contrast` (admin, teacher) — the green `primary` StatCard rendered its
  overline and hint in `rgba(255,255,255,0.85)` and `0.8`, which composite over
  `#147b45` to `#dcebe3` (4.31:1) and `#d0e5da` (4.02:1), both under 4.5:1. The
  two are now opaque enough to clear AA.
- `heading-order` (all three) — `ChartCard` titles were `<h2>` while the inline
  card titles beside them were `<h6>`, so the sequence stepped 2 → 6. Fixed in
  the theme's `variantMapping` (page titles `h1`, card titles `h2`, and the
  `subtitle1`/`subtitle2` labels that MUI maps to `<h6>` by default demoted to
  `<div>`), with numeric values opting out via `component="div"` — a number is
  not a heading.
- `td-has-header` (teacher, critical) — the at-risk table's data cells carried no
  header association. `TableShell` renders an action column whose header string
  is `""`, which produced an empty `<th scope="col">`; every data cell in that
  column then had a column header with no content. An empty header now renders a
  visually-hidden "Actions" label, which satisfies both this rule and
  `empty-table-header` (which needs screen-reader-visible *text*, so an
  `aria-label` alone fixes only the first — established by running real axe-core
  against each candidate markup). The fix is in `TableShell`, so it covers all
  five tables that use an action column, not just the one Lighthouse flagged.
  (`td-has-header` is an unweighted "insight" audit in Lighthouse 13, so it never
  lowered the category score — but it is a real defect for a screen-reader user,
  which is why it is fixed at the source rather than left for the score to
  forgive.)

**Note on how this was measured, because it is not obvious and cost real time.**
Lighthouse cannot sign in, and all three dashboards are behind Supabase auth, so
it would otherwise have audited the login page and scored it as a passing
dashboard. The cookies were captured from a genuine Playwright login per role and
passed through `extraHeaders`. Two environment traps made the result hard to
obtain and are worth writing down: this shell's `PATH` omits `System32`, so
chrome-launcher's `taskkill` was "not recognised", Chrome survived teardown, and
the subsequent `rmSync` threw `EPERM` **which masked the real error**; and
Lighthouse's own Chrome launch should be bypassed entirely by pointing it at a
Chrome on a CDP port (`--port`), so it neither launches nor kills a browser.
Reading the overall score alone would have hidden all of this behind three
plausible-looking numbers.
