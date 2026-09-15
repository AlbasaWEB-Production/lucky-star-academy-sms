# Lucky Star Academy SMS — Analytics Dashboard Build Prompt

You are extending the **Lucky Star Academy School Management System** with role-based analytics dashboards. The SMS already exists as a Next.js (App Router, TypeScript) + Tailwind application backed by Supabase and deployed on Vercel. You are adding to it, not starting over. Before you write any code, read the existing repo end to end — routing structure, auth setup, Supabase client wrappers, the database schema (run `supabase db dump --schema-only` or read `/supabase/migrations`), and the existing design tokens — and write a short `DASHBOARD_PLAN.md` describing what you found and how the dashboards will slot in. Do not proceed past that file until it exists.

---

## THE JOB

Build a set of role-based dashboards inside the SMS that turn the data the school already captures — enrolment, attendance, assessment results, fee payments, admissions, discipline records, co-curricular participation — into visual pages that a head teacher, a class teacher, a bursar, and an admin can each open and act on within seconds.

**Context you must design for.** Lucky Star Academy is a private basic school in Yendi, Northern Ghana, with two campuses (Nayilifong and Kpattuya). It runs Nursery, KG, and Primary levels, plus enrichment programmes in ICT/Coding & Robotics, Culture, and Creative Arts. The school year has **three terms**. Currency is **Ghana cedis (GH₵)**. Assessment follows the Ghanaian basic-school pattern of continuous assessment plus end-of-term examination, with results expressed as marks out of 100 and grade bands. There is no GPA, no university acceptance rate, no bus fleet, and no LMS. Scale is hundreds of pupils, not thousands — every design decision should assume small numbers and make them legible, not hide them behind aggregation built for a 5,000-student district.

**Stack (fixed):** the existing Next.js + Supabase setup. Add **Recharts** as the single charting library (no mixing with Chart.js, D3, Nivo, or Tremor). Data access through Supabase Postgres views and RPC functions — the dashboards read from **views you create**, never from raw tables directly in page code. Server Components fetch the data; charts are the only client components. If the schema lacks a table a widget needs, you do not invent one silently — see Guardrails.

**Four dashboards, one route each, gated by role:**

**1. Head Teacher / Proprietor — `/dashboard/head`**
The whole-school view. Top row is KPI cards, each with a small trend arrow against the previous term: total enrolment (split by campus), attendance rate this term, average end-of-term mark across all classes, fee collection rate this term, and number of at-risk pupils. Below that: enrolment trend by term as a line chart (broken out by level: Nursery, KG, Primary); attendance rate by class as a horizontal bar chart sorted worst-to-best; fees collected vs expected by month as a column chart with a target line; a compact at-risk pupil table (name, class, campus, reason, assigned teacher) limited to the top 10 with a link to the full list; and the admissions funnel (Enquiries → Applications → Offers → Enrolled) for the current intake. Everything on this page must render on a phone in one scrolling column — the proprietor will check it from a phone more often than from a desk.

**2. Academic / Class Teacher — `/dashboard/teacher`**
Scoped automatically to the classes and subjects the logged-in teacher is assigned to. Widgets: daily attendance for their class this week (small bar chart) with a one-tap link to take today's register; attendance heat map for their class — pupils down the rows, school days across the columns, cells coloured by present/absent/late — for the current term; grade distribution histogram per subject (grade bands on the x-axis, pupil count on the y-axis); class average per subject across the last three terms as a line chart; a sortable table of pupils in their class with current average, attendance %, and any behaviour flags, colour-coded green/amber/red; and a list of assessments due to be entered. Head of Department or head-teacher roles see the same page with a class selector.

**3. Bursar / Accounts — `/dashboard/finance`**
Fee collection is the heart of this page. Widgets: KPI cards for fees collected this term, outstanding balance, collection rate %, and number of pupils with arrears; fees collected vs expected by month (column chart with target line); outstanding fees by class as a stacked bar (split by campus); a defaulters table (pupil, class, guardian phone with `tel:` link, amount outstanding, days overdue, last payment date) that is sortable and exportable to CSV; a fee-payment trend line for the current term versus the same term last year; and, **only if** the schema tracks expenses, a budget-vs-actual bar chart by cost centre with variance labels. Cash flow and fund-balance widgets are built only if the data exists.

**4. Admin / Operations — `/dashboard/admin`**
Admissions and welfare. Widgets: the admissions funnel with conversion percentages between stages; new enrolments by level and intake term as a grouped bar; capacity utilisation per class as progress bars (enrolled vs seat capacity); discipline incidents by type as a bar chart (donut only if there are five or fewer categories); incidents per 100 pupils by class as a normalised bar; co-curricular participation rate by club/activity as a stacked bar; and teacher workload as periods-per-teacher bar chart with an overload threshold line.

**Shared components you must build once and reuse:** `KpiCard` (value, label, delta vs previous period, direction, optional sparkline), `ChartCard` (title, subtitle, optional filter slot, loading skeleton, empty state, error state), `DataTable` (sortable, filterable, paginated, CSV export), `TermSelector` and `CampusSelector` as URL-param-driven filters that every dashboard respects, and an `EmptyState` component that explains *why* a widget is empty ("No attendance recorded for Primary 3 this term yet") rather than showing a blank chart.

**Data layer.** Every metric gets a Postgres view or function in a new migration file. Name them plainly (`v_attendance_rate_by_class`, `v_fee_collection_by_month`, `fn_at_risk_pupils(term_id)`). Every computed metric's exact formula lives in `METRICS.md` — attendance rate is (present + late) ÷ total register entries, not something the reader has to guess; "at risk" is defined as any pupil meeting at least one of: attendance below 80% this term, average mark below 40 in two or more subjects, or two or more behaviour incidents this term. Change those thresholds only via a single `dashboard_thresholds` config table so the head can adjust them later without a deploy.

**Access control.** Dashboards are behind Supabase Auth. Role is read from the existing user/profile table (inspect it — do not create a parallel roles system). RLS on every view ensures a teacher can only query their own classes, the bursar sees finance but not academic detail beyond names and classes, and the head sees everything. Verify this with actual queries as the wrong user, not by reading the policy text.

---

## THE WHY

The school is capturing this data already — registers, mark sheets, fee receipts — but it lives in tables nobody looks at until there's a problem. A pupil's attendance slides for six weeks before anyone notices. Fees go uncollected because the bursar works from memory and a notebook. The head learns a class is underperforming when the term results are already printed.

These dashboards exist to shorten the distance between "something is going wrong" and "someone saw it." That is the only measure that matters. A beautiful chart nobody acts on is decoration. So every widget must answer a question a real person at this school actually asks — *which of my pupils should I call home about this week? who owes fees and what's their guardian's number? is Kpattuya campus filling up faster than Nayilifong?* — and the fastest route from the chart to the action (the register, the pupil's profile, the guardian's phone number) must be one click.

The audience is not analysts. The head teacher is an educator; the bursar is an accounts clerk; teachers are in a classroom all day and will look at this on a phone during break. Clarity beats density every time.

---

## THE GUARDRAILS

**Build on what exists.** Read the schema first. If a widget in the JOB section needs data the SMS does not capture — expenses by cost centre, teacher training hours, evaluation scores, PE hours — do not build a table for it and do not fabricate a widget with dummy data. Leave it out, list it in `DASHBOARD_BACKLOG.md` with the table it would need, and move on. A dashboard with eight honest widgets beats one with twenty where half are hollow.

**No fabricated or hard-coded data in production code.** Every number on every dashboard comes from a query. Seed data for local development lives in `/supabase/seed.sql`, is clearly commented as synthetic, uses obviously Ghanaian names and realistic Yendi-scale numbers (a class of 25–35, fees in the hundreds to low thousands of cedis per term), and is never applied to the production project. If you need to demonstrate a chart and there is no data yet, the answer is the `EmptyState` component, not a placeholder array.

**Right-size for a basic school in Ghana.** Three terms, not semesters. Cedis with the GH₵ symbol and no decimals on large sums. Grade bands as the school actually uses them (check the existing assessment tables; if bands are undefined, ask). Ghanaian date format (day/month/year). British English throughout (enrolment, programme, colour, behaviour). Nothing that only makes sense for a US high school — no GPA, no SAT, no "graduation rate".

**Do not build dashboard soup.** Each role's page has a clear reading order: KPI cards first, then the one or two charts that matter most, then supporting charts, then tables. No more than eight widgets above the fold on desktop. No pie charts with more than five slices. No dual-axis charts. No 3D. No gauges — use a progress bar with the target marked. Every chart has a title that states what it shows and a subtitle that states the period and filter. Axis labels are real words, not column names. Colours are drawn from a fixed, small palette derived from the existing SMS design tokens (school green as the primary series, gold as the highlight, a neutral grey for context, and one clear red for "needs attention") — never Recharts defaults, never rainbow categorical scales.

**Charts must be honest and accessible.** Bar charts start at zero. Line charts label their axes with units. Every chart has a text alternative — a visually hidden summary sentence for screen readers ("Attendance rate ranged from 71% in Primary 4 to 96% in KG 2"). Every colour-encoded state also has a shape, icon, or label so it works without colour. Contrast on all chart text passes WCAG AA. Tables are keyboard-navigable and column headers are real `<th>` elements.

**Performance at small scale means instant.** Views are indexed on term and class. Dashboards render in under 1.5 seconds on a Vercel preview with the seed dataset. Use React Server Components for data, `Suspense` boundaries with skeletons per widget so one slow query never blanks the whole page, and revalidate on a sensible interval (attendance every few minutes, fees hourly, enrolment daily) — not on every request.

**Security.** RLS is on for every new view. The service role key is never used in dashboard code paths. Guardian phone numbers appear only for roles that need them (head, bursar, the pupil's own teacher). CSV exports are logged. Nothing in `/dashboard/*` is reachable without a session.

**Commit discipline.** One commit per step: plan file, migrations and views, shared components, each dashboard, RLS verification, docs. Write commit messages that say what changed and why.

**Ask when it's the school's decision, not yours.** Grade band thresholds, the at-risk criteria, fee expected-amounts per level, and which campus a class belongs to are the school's facts. If the schema doesn't already answer them, stop and ask once, with all your questions batched. Everything else — chart type, layout, naming — decide, record in `DECISIONS.md`, and keep going.

---

## DONE MEANS

The job is done when **all** of the following are true:

- [ ] `DASHBOARD_PLAN.md` exists and accurately describes the pre-existing schema, auth model, and where the dashboards were integrated.
- [ ] All four dashboards exist at their routes, are gated by role, and a user of the wrong role is redirected with a clear message rather than shown an error or an empty page.
- [ ] Every widget listed in the JOB section is either built and reading from a real view, or explicitly listed in `DASHBOARD_BACKLOG.md` with the missing table named. Nothing is half-built or stubbed with fake data.
- [ ] `METRICS.md` defines every KPI and derived metric with its exact formula, source view, and refresh interval. `dashboard_thresholds` exists and changing a value there changes the at-risk list without a deploy.
- [ ] Term and campus filters work on every dashboard and are reflected in the URL so a filtered view can be bookmarked or shared.
- [ ] Every widget has a working loading skeleton, an empty state with a specific explanation, and an error state. Verified by running each dashboard against an empty database and against the seed set.
- [ ] Every chart uses the shared palette, starts axes at zero where applicable, has a title and period subtitle, and has a screen-reader summary. Colour is never the only encoding.
- [ ] The teacher dashboard, logged in as a seeded teacher, shows only that teacher's classes. The bursar dashboard, logged in as the seeded bursar, cannot query academic mark data. Both verified with real queries, and the verification steps are in `RLS_VERIFICATION.md`.
- [ ] Each dashboard's Lighthouse mobile score is ≥ 90 for Performance and Accessibility. Report the numbers.
- [ ] The head dashboard is fully usable on a 360px screen in a single scrolling column with no horizontal overflow.
- [ ] `npm run build`, `npm run lint`, and type-checking all pass clean. Migrations apply cleanly to a fresh Supabase project.
- [ ] Deployed to a Vercel preview URL, with migrations applied to the linked Supabase project, and no seed data present in production.
- [ ] `DECISIONS.md` records every judgement call made without asking. `README.md` gains a section on how to add a new widget (view → component → page) so the next developer can extend it.

Deliver a final summary that includes: the preview URL, the four dashboard routes, Lighthouse numbers per dashboard, the contents of `DASHBOARD_BACKLOG.md`, and the list of commits.
