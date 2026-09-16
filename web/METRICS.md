# Metrics — every formula on the dashboards

One section per figure that appears on a dashboard: what it means, exactly how
it is computed, and what it deliberately does **not** claim. The SQL lives in
`supabase/migrations/20260101000200_dashboard_analytics.sql` (and
`…00300_dashboard_view_role_scope.sql` for the role scoping); the TypeScript
that reads it lives in `web/src/lib/data/dashboard.ts`.

Two schema facts explain most of the caveats below, so they are worth holding in
mind throughout:

1. **`attendance` is keyed `student × subject × date`.** A register entry is one
   pupil, marked in one subject, on one day. So a class marked in six subjects
   carries six times the weight of a class marked in one.
2. **`exam_results` holds one mark per pupil per subject**, unique. There is no
   history — not one row per exam sitting, not one row per term. "Average mark"
   therefore means "the current mark per subject", and no metric on any
   dashboard trends a mark over time.

---

## 1. Attendance rate by class

**Widget:** admin "Attendance rate by class, weakest first"; teacher class list.
**Source:** `v_attendance_rate_by_class`.

```sql
rate_percent = round(
  100.0 * count(*) filter (where a.status = 'Present')
  / nullif(count(*), 0),
  1
)
```

| Term | Meaning |
| --- | --- |
| numerator | register entries marked `Present` |
| denominator | **all** register entries — `Present` + `Absent` |
| unit | one row of `attendance` = one pupil × one subject × one day |

`nullif(count(*), 0)` guards the division; a class with no attendance at all
yields `null` rather than a division error, and the page renders its empty
state.

**Read it as:** how consistently a class is *marked present*, weighted by how
much it is marked. **Do not read it as:** the share of pupils in the class who
were in school. A class marked in one subject and a class marked in six are not
comparable on this figure; the counts (`total_registers`, `present`, `absent`)
are returned alongside so the reader can see the basis.

`absent` is `count(*) filter (where a.status = 'Absent')`. Because
`attendance_status` has exactly two values, `present + absent = total_registers`
— there is no third state to lose rows to.

**Ordering** is done in the data layer, not SQL:
`sort((a, b) => a.ratePercent - b.ratePercent)` — weakest first, so the class
that needs attention is the first bar, not a bar the reader has to find.

---

## 2. Attendance rate, whole school ("Attendance this term")

**Widget:** the "Attendance this term" KPI on the admin and teacher dashboards.
**Source:** `overallAttendanceRate()` over the per-class rows.

```ts
present / totalRegisters, then × 1000, rounded, ÷ 10   // 1 decimal place
```

This rolls the raw counts up and divides once — it is **not** the mean of the
per-class percentages. A straight mean would let a class with three register
entries count as heavily as a class with three hundred. Returns `null` when no
attendance exists at all, so the tile renders "—" rather than a confident `0%`.

**The "this term" label.** The KPI is labelled "this term", but the view it
reads is not term-scoped — it aggregates every attendance row the caller may
read. The label is honest for the seeded school (all sampled attendance falls in
the configured term) and becomes wrong if a second term is ever marked. This is
recorded as a known gap rather than silently left; see `DASHBOARD_BACKLOG.md`
§ "Term-scoped attendance roll-up".

---

## 3. Average mark

**Widget:** the "Average mark" KPI.
**Source:** `overallAverageMark()` over `v_marks_by_class_subject` rows.

Each row of that view is one subject's average for one class:

```sql
avg_mark = round(avg(er.marks_obtained), 1),
student_count = count(distinct er.student_id)
```

The school-wide figure then weights each subject average by how many pupils it
was taken over:

```ts
total  = Σ (averageMark × studentCount)
pupils = Σ studentCount
result = round(total / pupils, 10) / 10
```

Weighting by pupil count stops a subject with one mark from pulling the school
average as hard as a subject with thirty. Returns `null` when no marks exist.

**Do not read it as:** a term result. `exam_results` has one row per pupil per
subject with no term attached, so this is the current standing, not a report
card.

---

## 4. Grade distribution

**Widget:** teacher "Grade distribution" histogram.
**Source:** `v_grade_distribution` → `getGradeDistribution()` → `gradeForMark()`.

The view returns raw marks joined to their subject; the **bucketing happens in
the app**, against bands read live from `dashboard_thresholds`:

| Band | Minimum | Default |
| --- | --- | --- |
| A | `grade_A_min` | 80 |
| B | `grade_B_min` | 70 |
| C | `grade_C_min` | 60 |
| D | `grade_D_min` | 50 |
| E | `grade_E_min` | 40 |
| F | *(below E)* | < 40 |

```ts
if (mark >= bands.aMin) return "A";   // …through E
return "F";
```

Bands are inclusive lower bounds, evaluated highest-first, so a mark of exactly
70 is a `B` and not a `C`. Every bucket is initialised to `0` and all six are
returned, so the histogram keeps its shape instead of collapsing to the grades
that happen to be present.

**The counts sum to the number of pupils holding a mark, not to a number of
exam sittings** — because there is one mark per pupil per subject. A histogram
whose six bars total 3 for a class of 3 means "all three pupils", not "three
exams".

The chart is **not** distribution-normalised and draws **no pass line**: no pass
mark exists in the schema. `F` is the bottom band, not a fail.

---

## 5. Pupils at risk

**Widget:** the "Pupils at risk" KPI and the at-risk list, on both admin and
teacher dashboards.
**Source:** `fn_at_risk_pupils()`.

A pupil is at risk when **either** rule fires:

| Rule | Condition | Threshold key | Default |
| --- | --- | --- | --- |
| Attendance | term attendance rate **<** threshold | `at_risk_attendance_percent` | 80 |
| Marks | marks below threshold in **≥** N subjects | `at_risk_subject_min_mark`, `at_risk_min_subjects` | 40, 2 |

The logic lives in SQL only, so one definition serves every surface. The
thresholds are read **live** from `dashboard_thresholds` on every call — change
the row, and the next render uses it, with no deploy.

Three details that decide the answer:

- **A pupil with no attendance at all is not at risk on that rule.**
  `coalesce(…, 100)` treats "never marked" as 100%, so absence of data is never
  reported as a problem. The same rule appears three times (the `att` CTE, the
  `reason` text, and the `where`) and they must be changed together.
- **`<` not `<=` on attendance, `>=` on subjects.** A pupil on exactly 80% is
  not at risk; a pupil with exactly 2 low subjects is.
- **"This term" is resolved inside the function:** the term whose window contains
  today, else the most recent term that has already started, never a future one.
  `getCurrentTerm()` in the data layer resolves identically, so the page's
  subtitle and the list can never disagree about which term they mean.

`reason` is assembled in SQL so the same words appear wherever the pupil is
shown — e.g. `Attendance 60.0%; Below 40 in 2 subjects` — and the parts are
joined with a semicolon, so a pupil meeting one rule gets one clause, not a
dangling separator.

**Not implementable:** the brief's third signal (≥ 2 behaviour incidents). There
is no discipline table. See `DASHBOARD_BACKLOG.md`.

---

## 6. Pupils by campus

**Widget:** admin "Pupils by campus".
**Source:** `v_enrolment_by_campus`. **Admin only** (role-scoped).

```sql
count(*) group by s.school_id, c.campus
```

One row per campus, counting pupils through their class's `campus`. A class with
no campus assigned groups under `null`, which the UI labels rather than hiding —
so an unassigned class shows up as work to do instead of vanishing from the
total.

---

## 7. New pupils by term

**Widget:** admin "New pupils by term".
**Source:** `listNewEnrolmentsByTerm()`.

For each configured term, count pupils whose `students.created_at` falls inside
that term's window (inclusive both ends, compared as `YYYY-MM-DD`).

**Read it as:** an enrolment-date trend. **Do not read it as:** an admissions
funnel. It says when a pupil *row was created*, not when an enquiry became an
application became an offer — none of those tables exist. It is named and
labelled "new", never "total", precisely because a pupil created before the
first configured term belongs to no bucket, so the buckets can sum to less than
the roll. The term containing today is flagged `isCurrent` so the bar can be
marked.

---

## 8. Subjects per teacher

**Widget:** admin teacher-workload figure, backing the unassigned-subjects panel.
**Source:** `v_teacher_subject_load`. **Admin only** (role-scoped).

```sql
count(distinct sub.id) group by sub.teacher_id
```

**The brief asked for periods per week. This is not that.** The schema has no
period count — `subjects.sessions` is free text such as `"Mon, Wed"` — so this
counts **subjects owned**. Every surface that shows it says "subjects" and never
"periods". A teacher with three subjects that each meet four times a week scores
3, the same as a teacher with three subjects meeting once. See
`DASHBOARD_BACKLOG.md` for what a real workload figure would need.

A subject with no teacher (`teacher_id is null`) has no row here at all, which
is why the dashboard's "subjects still without a teacher" panel is a separate
read.

---

## 9. Pupil-by-day attendance heat map

**Widget:** teacher "Pupil-by-day attendance".
**Source:** `v_attendance_heatmap` → `listClassAttendanceHeatmap(classId, {since, until})`.

The view is `select distinct` over pupil × date × status, so a pupil marked in
three subjects on one day contributes one row per *distinct status*, not three.
A day is then resolved from **every** row that day — never from whichever row
arrived last:

| Rows that day | Cell state |
| --- | --- |
| all `Present` | **Present** |
| all `Absent` | **Absent** |
| both present and absent | **Partial** — present in some subjects |
| no rows | **Unmarked** (dashed outline) |

`Partial` is not decoration: the register genuinely produces it (marked present
in one subject, absent in another, most often a pupil who left partway through
a day), and a two-state grid cannot express it without picking one of the two
and being wrong half the time. Resolving the day from the tally rather than by
overwriting also makes the cell **deterministic** — the same rows always give
the same grid.

All four states carry a **glyph as well as a colour** (a tilde for partial, a
cross for absent), so the grid survives greyscale printing and WCAG 1.4.1. The
per-state text colour matters too: white on the gold partial fill does not meet
contrast.

**The row's rate** is `days with at least one present mark ÷ days marked` — a
**day-based** figure, matching the day-cells in the row it sits under. The
column is headed **"Days present"** so the unit is on screen. Note this differs
in unit from §1's class rate, which is weighted by register entries; the two are
not comparable figures, which is why neither is labelled just "attendance rate".

**No `Late` state.** `attendance_status` is `Present | Absent`. The heat map is
coloured on the states that exist; there is no third attendance state to invent.
See `DECISIONS.md` § 5.

---

## 10. Classes to mark today

**Widget:** teacher "Classes to mark today" KPI, and the per-class rows beneath
it.

Counts the teacher's own classes with **no attendance row dated today**. The
zero-coverage classes *are* the to-do list. RLS narrows `attendance` to the
teacher's own subjects, so this needs no explicit filter — the policy is the
filter.

**Caveat:** it asks whether *any* row exists for today, not whether the register
is complete. A class marked in one of its six subjects reads as done. The
underlying data does not record what was *supposed* to be marked, so
completeness is not knowable; the widget is named for what it measures.

---

## Units and coercion

PostgREST serialises Postgres `numeric` and `bigint` as **JSON strings**, not
numbers — `"87.5"`, not `87.5`. Every rate, average and count crosses the wire
inside `Number()` in `dashboard.ts`. Skipping that is how a KPI tile renders
`100.0` where it means `100%`. This is the single most common way a metric here
would go quietly wrong, so the coercion is applied at the boundary and the view
models are all typed `number`.

---

## Changing a metric

1. Change the **view or function**, in a new migration — never the page. A
   number computed twice from two places will eventually disagree with itself.
2. If it is a rule rather than a formula, change the **row** in
   `dashboard_thresholds`; no migration, no deploy.
3. Update the formula here, and the matching entry in `RLS_VERIFICATION.md` if
   the object's role scope changed.
4. Re-run the verification: `node --env-file=.env.local scripts/verify-rls.mjs`.
