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
