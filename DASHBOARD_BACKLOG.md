# Dashboard backlog — what cannot be built, and what it would need

Every widget from the brief that is **not** on a dashboard, with the reason and
the table that would unblock it.

This is written *after* the approved decisions landed (`DASHBOARD_PLAN.md` §9),
so it names only what is genuinely still missing. The `terms` table, the campus
column and `dashboard_thresholds` were on the earlier list and have been built —
they are not repeated here.

**Two rules governed every entry below:**

1. **No fabricated data.** A widget that needs a table gets a backlog entry, not
   a plausible-looking chart. A dashboard that lies is worse than a dashboard
   with a gap, because the gap is visible and the lie is not.
2. **No invented school facts.** Where a widget needs the school's own numbers
   (a fee, a capacity, a pass mark), that is the school's to supply. I have not
   guessed one.

---

## A. Missing tables

### 1. Fees — the whole Bursar dashboard

| Would need | Columns |
| --- | --- |
| `fee_structure` | `school_id, class_id, term_id, amount, currency` |
| `fee_invoices` | `student_id, term_id, amount_due, due_date, status` |
| `fee_payments` | `invoice_id, amount_paid, paid_on, method, received_by` |

**Blocks:** fee collection rate; fees collected vs expected by month; arrears
list; the entire Bursar/Accounts page from the brief.

**Why it matters most:** this is the largest single gap. Of the brief's ~30
widgets, roughly a third were the finance page, and **not one of them can be fed
honestly.** The brief itself frames fee collection as the proprietor's headline
number, so this is the highest-value table to add.

**Why it was not invented:** a fee structure is a school fact — amounts, per
class, per term, in Ghanaian cedis, plus what counts as paid (part payment? in
kind?). Generating that would be fabricating the school's finances.

### 2. Admissions — the funnel

| Would need | Columns |
| --- | --- |
| `admissions_enquiries` | `school_id, pupil_name, guardian_name, guardian_phone, source, received_on, intake_term_id` |
| `admissions_applications` | `enquiry_id, submitted_on, documents_received` |
| `admissions_offers` | `application_id, offered_on, accepted_on, declined_reason` |

**Blocks:** admissions funnel; conversion % between stages; new enrolments by
intake term *as a funnel*.

**Partially substituted, and named honestly:** `listNewEnrolmentsByTerm()` counts
`students.created_at` per term. That is an **enrolment-date trend**, not a funnel
— it records when a pupil row was created, not when an enquiry became an
application became an offer. The chart is labelled "New pupils by term", never
"admissions", and the three conversion rates the brief asked for are absent
rather than estimated.

### 3. Discipline — the at-risk rule's third signal

| Would need | Columns |
| --- | --- |
| `discipline_incidents` | `school_id, student_id, occurred_on, category, description, recorded_by, resolved_on` |

**Blocks:** the at-risk rule's third condition (≥ 2 behaviour incidents); pupil
tables' behaviour flags; discipline incidents by type per class; incidents per
100 pupils.

**This is the one gap that affects a widget that *is* built.** The at-risk rule
on both dashboards implements two of the brief's three signals (attendance and
marks). A pupil with a clean attendance and mark record but repeated behaviour
incidents is **not flagged**, and no on-screen wording implies otherwise — the
rule is stated as two conditions. See `METRICS.md` § 5.

Adding the table alone is not sufficient: "incident" needs the school's
categories (the brief assumes a taxonomy that does not exist), and two incidents
in a term is a different rule from two in a week. Both are the school's calls.

### 4. Capacity — utilisation

| Would need | Columns |
| --- | --- |
| `classes.capacity` | `integer`, the planned roll for the class |

**Blocks:** capacity utilisation per class; over/under-capacity flags.

A single column on an existing table, not a new table — noted separately because
it is the cheapest item here. The school must supply the numbers: capacity is
per class, per campus, and depends on classrooms and teachers, none of which is
in the schema.

### 5. Co-curricular — clubs

| Would need | Columns |
| --- | --- |
| `clubs` | `school_id, name, category, patron_teacher_id, capacity` |
| `club_memberships` | `club_id, student_id, joined_on, left_on` |

**Blocks:** co-curricular participation by club; participation rate.

### 6. Assessment schedule — "assessments due to be entered"

| Would need | Columns |
| --- | --- |
| `assessments` | `school_id, subject_id, term_id, name, max_mark, due_on, weight` |

**Blocks:** assessments due to be entered; the "have I finished entering marks?"
question as a *deadline* rather than a count.

Today's substitute is "marks recorded per subject" (a count out of what exists),
which answers "where is data missing" but cannot say what is *due*, because the
schema does not record what was supposed to be marked. Named accordingly on
screen.

### 7. Academic levels — Nursery / KG / Primary

| Would need | Columns |
| --- | --- |
| `classes.level` | `text`, or an enum: `Nursery | KG | Primary` |

**Blocks:** "enrolment by level"; "new enrolments by level and intake term".

Note this is genuinely a gap for the brief as written, but it is **not** a gap
for Lucky Star Academy as it actually operates: the school teaches **Primary 1–6
only** — there is no Nursery, KG, JHS or SHS. The brief's level breakdowns
assume a school structure this school does not have. Recorded for completeness
rather than as work to do.

### 8. Guardian contact — the at-risk follow-up

| Would need | Columns |
| --- | --- |
| `guardians` | `school_id, full_name, phone, relationship, address` |
| `student_guardians` | `student_id, guardian_id, is_primary` |

**Blocks:** the brief's at-risk table with the guardian's phone number beside each
pupil.

This matters more than it looks. An at-risk list is only actionable if someone
can be contacted, and the brief pairs every at-risk pupil with a guardian phone.
Today the list names the pupil, class and reason — and stops there. The follow-up
step the widget exists to prompt requires a phone number that is not in the
database.

---

## B. Metrics blocked on a missing column, not a missing table

### 9. Term-scoped attendance roll-up

**The gap:** the "Attendance this term" KPI reads a view that aggregates **every**
attendance row the caller may read, and is labelled with the current term.

**Why it is currently harmless:** all sampled attendance falls inside the
configured term, so the label is true today. It stops being true the moment a
second term is marked — the KPI would then report a rate spanning both terms
while the subtitle names one of them.

**What it needs:** a `term_id` on `attendance`, or a date-bounded read. Today the
term is resolved inside `fn_at_risk_pupils()` by date window, so the *at-risk*
figure is correctly scoped; only this KPI is not.

Recorded rather than left silent because it is a "wrong and plausible" number of
exactly the kind `RLS_VERIFICATION.md` § 2 was about — and the current seed would
never reveal it.

### 10. Teacher workload as periods

**The gap:** the brief asks for **periods per teacher**. The schema has no period
count — `subjects.sessions` is free text such as `"Mon, Wed"`.

**What is shown:** subjects owned per teacher (`v_teacher_subject_load`). A
teacher with three subjects meeting four times a week scores 3, the same as one
whose three subjects meet once.

**What it needs:** either a structured timetable (`subject_sessions` with a day
and a period number), or `subjects.periods_per_week integer`. A timetable is the
real answer and would also unblock "which classes still need marking today"
becoming "which *periods*", which is closer to what a teacher actually needs.

### 11. Marks over time

**The gap:** the brief asks for "class average per subject across the last 3
terms" and marks trend lines.

**Why it cannot be built:** `exam_results` holds **one mark per pupil per
subject**, unique. There is no term, no exam type and no sitting — so there is
no history to average over, only a current standing. "Average mark" on every
dashboard means "the current mark", and no chart trends a mark over time.

**What it needs:** `exam_results` keyed by `(student_id, subject_id, term_id,
assessment_id)` and made non-unique on the first three. This is the single change
that would unlock the most widgets — trend lines, term comparisons, progress
against a pass mark — and it is a **breaking change to an existing table**, so
it needs its own migration and a decision about backfilling the existing 54 rows.

### 12. `Late` attendance

**The gap:** the heat map and the brief want present / absent / **late**. The
enum has two values.

**Decided by me, not deferred:** not added. No enum change, no register-form
change. See `DECISIONS.md` § 5. The heat map uses the two states that exist plus
a derived `Partial`, and adding `Late` later is a small change: one enum value,
one form option, one colour.

---

## C. Deliberately not built, even though a table could exist

### 13. Attendance trend lines over time

Buildable from `attendance.date` — the rows are there. **Not built** because with
ten sampled days across two weeks the line would be honest and useless, and a
line chart implies a trend where the school has none yet. The heat map answers
the drift question better on this data. Revisit once a term of real registers
exists.

### 14. Login/usage analytics

No such table, and none proposed: it is not a school-facing metric, and adding
tracking to a children's school system should be a deliberate decision with a
reason, not a dashboard convenience.

---

## Priority

Ordered by value per unit of work, for whoever picks this up next.

| # | Item | Why first |
| --- | --- | --- |
| 1 | `discipline_incidents` | Completes a rule that is **already half-built and on screen**. Cheapest way to make an existing widget fully honest. |
| 2 | `classes.capacity` | One column, unblocks a whole widget. |
| 3 | Marks history (`term_id` on `exam_results`) | Unlocks the most widgets, but is a breaking migration — needs care, not speed. |
| 4 | `fee_*` | Largest gap by far. Needs the school's real numbers before any code. |
| 5 | Guardian contacts | Turns the at-risk list into something a teacher can act on. |
| 6 | Timetable / `periods_per_week` | Fixes the workload metric and two attendance widgets. |
| 7 | `admissions_*`, `clubs`, `assessments`, `guardians` | Each unblocks one page; none is urgent at this school's size. |

Items 1, 2 and 3 are the ones I would do next: together they would let every
widget the brief asked for that this schema can *nearly* support become fully
honest, without inventing a single number.
