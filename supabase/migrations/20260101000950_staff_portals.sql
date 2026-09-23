-- ============================================================================
-- Lucky Star Academy SMS - Staff portals: accountant and schedule_officer
-- ============================================================================
-- The two roles 20260101000900_staff_role_enum.sql added to public.user_role,
-- and everything they may do:
--
--   accountant        - fees in, expenses out. An officer who records money,
--                       never one who sets policy.
--   schedule_officer  - the timetable, in a real table at last. `subjects`
--                       holds free text `sessions` ("Mon, Wed"), so no column
--                       could say which *period* a lesson occupies or notice a
--                       double-booked room (DASHBOARD_BACKLOG.md item 10;
--                       ANALYTICS-ROADMAP.md records the same gap).
--
-- Read the policy half of this file as two blocks: the rules that name
-- 'accountant', then the rules that name 'schedule_officer'. The new table and
-- its view are shared, and the finance views at the end are widened for the
-- accountant only.
--
-- THE NEW ROLES ARE COMPARED AS TEXT, NEVER AS ENUM LITERALS
--
-- `public.jwt_role()` returns text, so every rule below is written
-- `(select public.jwt_role()) = 'accountant'` or `in ('admin', 'accountant')`.
-- That is not a style preference, it is the only form available: both values
-- were added by the PREVIOUS migration's transaction, and Postgres refuses to
-- use an enum value in the transaction that added it -
--
--   ERROR:  unsafe use of new value "accountant" of enum type public.user_role
--
-- so a literal cast to public.user_role anywhere in this file would fail. No
-- statement here casts to, or compares against, that type at all: the only enum
-- column in play is `profiles.role`, and none of these policies filters on it.
-- Where that comparison is needed the house form keeps it in text -
-- `role::text = (select public.jwt_role())`, as in profiles_update_self in
-- 20260101000100_rls_policies.sql, which still pins a profile's own role and
-- school to the caller's JWT on every write.
--
-- NOTHING HERE NARROWS AN EXISTING ROLE. Every policy added to an existing
-- table is PERMISSIVE, and permissive policies are OR-ed, so the admin,
-- teachers and pupils keep exactly the access they had and the two new roles
-- gain their block on top of it.
--
-- Scoping follows the house rules:
--   * every new table carries `school_id` and enables RLS
--   * every new view is `security_invoker = true`
--   * roles are gated in-view via `jwt_role()`, and RLS does the real narrowing
--   * composite FKs prove same-school membership
--
-- This file assumes 20260101000900 has been committed, and is intentionally NOT
-- idempotent (matching the other migrations): run it exactly once.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- public.timetable_slots
-- ---------------------------------------------------------------------------
-- One row per lesson in the week. A slot points at a *subject* and nothing
-- else: `subjects` already carries `class_id` and `teacher_id`, so the class
-- and the teacher of a lesson are derived by joining it and can never disagree
-- with it. Copying either onto this table would recreate exactly the
-- subject<->teacher disagreement the initial schema removed (its normalisation
-- note 4).
--
-- `day_of_week` is ISO-ish: 1 = Monday ... 5 = Friday, matching
-- `extract(isodow from ...)`, so no translation is needed in the app and a
-- weekend slot cannot be recorded. `period` is the period number within the
-- day, 1..12 - the school runs fewer, and the ceiling is a sanity bound, not a
-- claim about the bell.

create table public.timetable_slots (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools (id) on delete cascade,
  subject_id  uuid not null,
  day_of_week smallint not null,
  period      smallint not null,
  -- Free text and nullable: rooms are named by the school ("Room 3", "Hall"),
  -- not modelled as rows, and a slot with no room arranged yet is a real state
  -- rather than a missing one.
  room        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint timetable_slots_day_of_week_range check (day_of_week between 1 and 5),
  constraint timetable_slots_period_range check (period between 1 and 12),
  -- Blank is not a room name; NULL still means "not arranged yet".
  constraint timetable_slots_room_not_blank check (room is null or length(btrim(room)) > 0),
  -- Composite FK target, mirroring subjects_id_school_key.
  constraint timetable_slots_id_school_key unique (id, school_id),
  -- A subject cannot be in two places at once.
  constraint timetable_slots_subject_day_period_key unique (subject_id, day_of_week, period),
  -- The subject must belong to the slot's own school. `on delete cascade` (not
  -- restrict): a timetable slot has no meaning once its subject is gone, and
  -- unlike a composite FK with SET NULL, cascade deletes the child row instead of
  -- trying to null the NOT NULL school_id.
  constraint timetable_slots_subject_fkey foreign key (subject_id, school_id)
    references public.subjects (id, school_id) on delete cascade
);

-- FK columns: deleting a school cascades here, and deleting a subject cascades
-- through the composite FK, so both need an index or each delete scans the
-- table (verify.sql check 7c).
create index timetable_slots_school_id_idx on public.timetable_slots (school_id);
create index timetable_slots_subject_id_idx on public.timetable_slots (subject_id);
-- The read the weekly grid and the clash checks make.
create index timetable_slots_school_day_period_idx
  on public.timetable_slots (school_id, day_of_week, period);

-- A room cannot host two lessons at once. Partial, so that a slot with no room
-- yet is exempt by construction rather than by the "nulls are distinct"
-- default of a unique index, and so the index only carries slots that name a
-- room. The key is exact text: "Room 3" and "room 3" are two different rooms
-- to Postgres. Rooms are the school's own names, so normalising the text is
-- left to the app rather than guessed at here.
create unique index timetable_slots_school_day_period_room_key
  on public.timetable_slots (school_id, day_of_week, period, room)
  where room is not null;

create trigger timetable_slots_set_updated_at
  before update on public.timetable_slots
  for each row execute function public.set_updated_at();

comment on table public.timetable_slots is
  'One scheduled lesson per subject per day and period. The class and the '
  'teacher are derived from subjects; room is free text and nullable.';


-- ---------------------------------------------------------------------------
-- public.v_timetable_weekly
-- ---------------------------------------------------------------------------
-- One row per scheduled slot with everything a timetable screen prints: the
-- subject, its class, its teacher and where it sits in the week.
--
-- WHO IS ANSWERED, AND WHY EXACTLY THESE FOUR ROLES
--
--   admin, schedule_officer - they build and maintain the timetable
--   teacher                 - "what am I teaching, and where"
--   student                 - "what is next, and in which room"
--
-- Those are the only roles with a reason to read a timetable at all, so they
-- are the only ones the view answers. The accountant is deliberately absent:
-- fees have no timetable dimension, and a role outside the list gets zero rows
-- rather than a smaller answer - "no data" is a state the screens render
-- honestly, a plausible wrong number is not (the lesson of
-- 20260101000300_dashboard_view_role_scope.sql).
--
-- The gate is a role whitelist, NOT the access rule. `security_invoker = true`
-- means the caller's RLS runs first: a teacher sees only the slots of subjects
-- they actually teach and a pupil only their own class's week (see the policies
-- below), so the same view is four different, correctly-scoped answers.
--
-- `left join` on the teacher: `subjects.teacher_id` is nullable, and a slot
-- whose subject has no teacher yet must still appear - that gap is precisely
-- what the schedule officer is looking at - rather than vanish from the week.

create or replace view public.v_timetable_weekly
with (security_invoker = true)
as
select
  ts.school_id,
  ts.subject_id,
  sub.name        as subject_name,
  sub.code        as subject_code,
  sub.class_id,
  c.name          as class_name,
  sub.teacher_id,
  p.full_name     as teacher_name,
  ts.day_of_week,
  ts.period,
  ts.room
from public.timetable_slots ts
join public.subjects sub on sub.id = ts.subject_id
join public.classes  c   on c.id = sub.class_id
left join public.profiles p on p.id = sub.teacher_id
where (select public.jwt_role()) in ('admin', 'schedule_officer', 'teacher', 'student')
order by ts.day_of_week, ts.period;

comment on view public.v_timetable_weekly is
  'One row per scheduled lesson: subject, class, teacher, day, period and room. '
  'Answered for the admin, schedule officer, teacher and pupil; RLS narrows a '
  'teacher to their own subjects and a pupil to their own class.';


-- ---------------------------------------------------------------------------
-- RLS on public.timetable_slots
-- ---------------------------------------------------------------------------
-- The timetable is readable by the people who work from it, and writable only
-- by the two roles that own it. A pupil is narrowed to their own class: a whole
-- school's week is not a secret, but it is not their timetable either, and the
-- narrower rule is the honest one.

alter table public.timetable_slots enable row level security;

create policy timetable_slots_select_by_admin_or_schedule_officer
  on public.timetable_slots
  for select
  to authenticated
  using (
    (select public.jwt_role()) in ('admin', 'schedule_officer')
    and school_id = (select public.jwt_school_id())
  );

-- A teacher reads the slots of the subjects they teach.
-- `public.teaches_subject()` is the same helper the
-- subjects/attendance/incidents policies use, and `subjects.teacher_id` is the
-- single source of truth for who teaches what, so it fits a read-only
-- timetable exactly - no new helper was needed.
create policy timetable_slots_select_by_teacher
  on public.timetable_slots
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'teacher'
    and school_id = (select public.jwt_school_id())
    and public.teaches_subject(subject_id)
  );

-- A pupil reads their own class's week. `public.teaches_class()` cannot
-- express this - it asks whether the *caller* teaches the class, which is
-- false for every pupil - so the class is resolved from the caller's own
-- `students` row instead. That row is visible to them through
-- students_select_self, so the lookup needs no new helper and no privilege of
-- its own; a pupil with no students row gets no timetable, which is honest
-- rather than wrong.
create policy timetable_slots_select_by_student
  on public.timetable_slots
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'student'
    and school_id = (select public.jwt_school_id())
    and exists (
      select 1
      from public.subjects sub
      join public.students st
        on st.class_id = sub.class_id
       and st.school_id = sub.school_id
      where sub.id = timetable_slots.subject_id
        and st.id = (select auth.uid())
    )
  );

create policy timetable_slots_insert_by_admin_or_schedule_officer
  on public.timetable_slots
  for insert
  to authenticated
  with check (
    (select public.jwt_role()) in ('admin', 'schedule_officer')
    and school_id = (select public.jwt_school_id())
  );

create policy timetable_slots_update_by_admin_or_schedule_officer
  on public.timetable_slots
  for update
  to authenticated
  using (
    (select public.jwt_role()) in ('admin', 'schedule_officer')
    and school_id = (select public.jwt_school_id())
  )
  with check (
    (select public.jwt_role()) in ('admin', 'schedule_officer')
    and school_id = (select public.jwt_school_id())
  );

create policy timetable_slots_delete_by_admin_or_schedule_officer
  on public.timetable_slots
  for delete
  to authenticated
  using (
    (select public.jwt_role()) in ('admin', 'schedule_officer')
    and school_id = (select public.jwt_school_id())
  );


-- ---------------------------------------------------------------------------
-- The accountant's policies on existing tables
-- ---------------------------------------------------------------------------
-- A finance officer, not a manager: the accountant records what the school
-- charged (assessments), what it received (payments) and what it spent
-- (expenses), and reads the names, classes and terms those figures hang off.
--
-- Several of the reads this role needs are already open to every signed-in
-- member of the school, because those SELECT policies name no role:
--
--   schools -> schools_select_own_school (id = (select public.jwt_school_id()))
--   classes -> classes_select_school      (school_id = ...)
--   terms   -> terms_select_school        (school_id = ...)
--   notices -> notices_select_school      (school_id = ...)
--
-- so no accountant policy is written for those four reads: a second permissive
-- policy that the role already passes would only add a predicate for every
-- query to evaluate. What the accountant does not have on notices is a write,
-- and that is added below. Everything else in this block is a genuinely new
-- grant of access.

-- Student and staff names, for receipts, debtor lists, rosters and pickers.
-- Read-only: `profiles_update_self` is the only way anyone edits a profile, and
-- its WITH CHECK still pins `role::text = (select public.jwt_role())` and
-- `school_id`, so a wider read here cannot become a write or a promotion.
create policy profiles_select_by_accountant
  on public.profiles
  for select
  to authenticated
  using (
    school_id = (select public.jwt_school_id())
    and (select public.jwt_role()) = 'accountant'
  );

-- The roster an assessment is raised against, with the class and roll number a
-- bill is addressed by. School-wide, like students_select_by_admin: fees are
-- per pupil, so a class-scoped rule would hide the pupils the accountant is
-- responsible for.
create policy students_select_by_accountant
  on public.students
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'accountant'
    and school_id = (select public.jwt_school_id())
  );

-- Read the fee structure (what a class owes per term); never write it. The
-- structure is the school's fee policy and belongs to the admin - see the
-- omissions note at the end of this block.
create policy fee_structures_select_by_accountant
  on public.fee_structures
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'accountant'
    and school_id = (select public.jwt_school_id())
  );

create policy fee_assessments_select_by_accountant
  on public.fee_assessments
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'accountant'
    and school_id = (select public.jwt_school_id())
  );

create policy fee_assessments_insert_by_accountant
  on public.fee_assessments
  for insert
  to authenticated
  with check (
    (select public.jwt_role()) = 'accountant'
    and school_id = (select public.jwt_school_id())
  );

create policy fee_assessments_update_by_accountant
  on public.fee_assessments
  for update
  to authenticated
  using (
    (select public.jwt_role()) = 'accountant'
    and school_id = (select public.jwt_school_id())
  )
  with check (
    (select public.jwt_role()) = 'accountant'
    and school_id = (select public.jwt_school_id())
  );

create policy fee_assessments_delete_by_accountant
  on public.fee_assessments
  for delete
  to authenticated
  using (
    (select public.jwt_role()) = 'accountant'
    and school_id = (select public.jwt_school_id())
  );

-- A payment is recorded by the accountant and read back as the audit trail.
-- NOTE: the SELECT policy is load-bearing, not a convenience. The receipt
-- trigger calls public.fn_next_receipt_number(), which is SECURITY INVOKER and
-- therefore reads fee_payments under the *caller's* RLS; an accountant who
-- could insert a payment but not read the table would compute
-- max(receipt_number) = 1 on every insert and hit the unique (school_id,
-- receipt_number) constraint on the second one.
create policy fee_payments_select_by_accountant
  on public.fee_payments
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'accountant'
    and school_id = (select public.jwt_school_id())
  );

create policy fee_payments_insert_by_accountant
  on public.fee_payments
  for insert
  to authenticated
  with check (
    (select public.jwt_role()) = 'accountant'
    and school_id = (select public.jwt_school_id())
  );

create policy fee_payments_delete_by_accountant
  on public.fee_payments
  for delete
  to authenticated
  using (
    (select public.jwt_role()) = 'accountant'
    and school_id = (select public.jwt_school_id())
  );

-- There is deliberately NO fee_payments_update policy for the accountant, and
-- none is missing: 20260101000400 states the rule ("A payment is never edited;
-- it is only reversed. So there is no UPDATE policy") and gives the admin no
-- UPDATE either. Writing one for the accountant would hand the finance officer
-- a privilege the head does not have and break the audit trail the reversal
-- design exists to keep. Correcting a payment is an INSERT of a compensating
-- row, which the policies above allow.

create policy expenses_select_by_accountant
  on public.expenses
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'accountant'
    and school_id = (select public.jwt_school_id())
  );

create policy expenses_insert_by_accountant
  on public.expenses
  for insert
  to authenticated
  with check (
    (select public.jwt_role()) = 'accountant'
    and school_id = (select public.jwt_school_id())
  );

create policy expenses_update_by_accountant
  on public.expenses
  for update
  to authenticated
  using (
    (select public.jwt_role()) = 'accountant'
    and school_id = (select public.jwt_school_id())
  )
  with check (
    (select public.jwt_role()) = 'accountant'
    and school_id = (select public.jwt_school_id())
  );

create policy expenses_delete_by_accountant
  on public.expenses
  for delete
  to authenticated
  using (
    (select public.jwt_role()) = 'accountant'
    and school_id = (select public.jwt_school_id())
  );

-- Read the budget; never write it. Comparing spend against the plan is the
-- accountant's job, setting the plan is not - see the omissions note below.
create policy budget_lines_select_by_accountant
  on public.budget_lines
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'accountant'
    and school_id = (select public.jwt_school_id())
  );

-- NO NOTICES WRITE FOR THE ACCOUNTANT, AND NONE FOR THE SCHEDULE OFFICER.
--
-- An earlier draft of this migration gave both roles INSERT/UPDATE/DELETE on
-- `notices` - a fee reminder for one, a timetable-change announcement for the
-- other. It was removed, for two reasons that apply to both:
--
--   1. `notices` has no per-role visibility. Every notice is school-wide, so
--      "fee reminders only" cannot be expressed as a policy: the grant would be
--      authority to publish, edit and DELETE any announcement the school has
--      made, which is far wider than the stated intent.
--   2. No screen can reach it. The only notice action is `createNoticeAction`
--      in src/lib/actions/content.ts; it opens with
--      `requireRoleWithTenant("admin")` and hard-codes `/admin/notices` for both
--      its revalidate and its redirect, so a form on either portal would look
--      like it saved and then silently bounce the user to their dashboard. Both
--      portals therefore ship a read-only notices page.
--
-- So the policy ceiling is kept level with what the UI can actually do. If the
-- school later wants the accountant to chase fees by notice, the change is the
-- action in content.ts (a role-keyed destination validated against an allowlist,
-- never a hidden form field) TOGETHER WITH these policies - not the policies
-- alone. Reading notices needs nothing here: `notices_select_school` in
-- 20260101000100 already grants school-scoped read to any signed-in user.

-- DELIBERATELY NOT GRANTED TO THE ACCOUNTANT:
--   * fee_structures writes - the amounts a class is charged are the school's
--     fee policy, set by the admin. An officer who could edit the structure
--     could change what a pupil owes.
--   * budget_lines writes - setting a budget is a management decision; the
--     accountant measures against it.
--   * fee_payments UPDATE - see the note above; nobody has it.
--   * profiles writes - there are none for anyone: a profile is created and
--     removed with its auth.users row by server actions using the secret key,
--     and role/school_id are only ever written there.
--   * anything academic - exam_results, attendance, timetable_slots, incidents,
--     admissions, students writes. None of it is a finance concern, and the
--     accountant is not a substitute teacher or a registrar.


-- ---------------------------------------------------------------------------
-- The schedule officer's policies on existing tables
-- ---------------------------------------------------------------------------
-- Owns the timetable, so the reads it needs are the ones a timetable is built
-- from: the classes, the subjects, the pupils who sit in them and the teachers
-- who teach them.
--
-- As with the accountant, the school's classes, subjects, terms and school row
-- are already readable through role-free school-scoped SELECT policies
-- (classes_select_school, subjects_select_school, terms_select_school,
-- schools_select_own_school), so no read policy is duplicated here. What this
-- block adds is the staff-facing read that is genuinely missing - `profiles`
-- and `students` are role-gated today - and the writes on subjects and
-- notices.

-- Teacher names, for the timetable and for assigning a subject to a teacher.
-- This read is not a convenience: `public.assert_subject_teacher_is_teacher()`
-- is SECURITY INVOKER and looks the teacher up in public.profiles, so an
-- INSERT/UPDATE of subjects.teacher_id by a schedule officer only succeeds
-- because this policy makes that profile row visible. Without it the trigger
-- raises "Profile % is not a visible profile in this school".
create policy profiles_select_by_schedule_officer
  on public.profiles
  for select
  to authenticated
  using (
    school_id = (select public.jwt_school_id())
    and (select public.jwt_role()) = 'schedule_officer'
  );

-- Class lists, so a slot can be arranged around the pupils who are actually in
-- the class. Read-only: the roster is the admin's.
create policy students_select_by_schedule_officer
  on public.students
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'schedule_officer'
    and school_id = (select public.jwt_school_id())
  );

-- `subjects` is where the timetable actually lives between slots: `sessions`
-- is free text the officer keeps in step with the periods, and `teacher_id`
-- changes as staffing changes. Both are columns of `subjects`, so the officer
-- needs UPDATE on the row - but nothing wider, and not authority over the
-- academic record (see the omissions note below).
--
-- UPDATE only, deliberately. The first draft also granted INSERT and DELETE,
-- which was wrong twice over:
--
--   * Creating and removing a subject is the registrar's act, not a scheduling
--     one. A class's subject list is the school's academic structure.
--   * DELETE on `subjects` is destructive well beyond this role's domain:
--     `exam_results_subject_fkey` and `attendance_subject_fkey` are both
--     `on delete cascade`, so one statement would take a subject's entire mark
--     sheet and attendance register with it. A schedule officer must never be
--     able to erase a term's marks while rearranging a timetable.
--
-- Note for whoever wires this up: no shipped screen currently updates
-- `subjects`. The officer's `/schedule/subjects` page is read-only and every
-- timetable edit goes through `timetable_slots`. This grant is kept because the
-- role owns the timetable domain and `sessions`/`teacher_id` are timetable
-- facts, not because a form exists - so do not read it as proof of a UI.
create policy subjects_update_by_schedule_officer
  on public.subjects
  for update
  to authenticated
  using (
    (select public.jwt_role()) = 'schedule_officer'
    and school_id = (select public.jwt_school_id())
  )
  with check (
    (select public.jwt_role()) = 'schedule_officer'
    and school_id = (select public.jwt_school_id())
  );

-- NO NOTICES WRITE FOR THE SCHEDULE OFFICER. See the long note above the
-- accountant's block: notices are school-wide, and the only notice action is
-- admin-guarded and redirects to `/admin/notices`, so both portals ship a
-- read-only notices page and neither role gets a write policy. Announcements
-- remain the school office's.

-- DELIBERATELY NOT GRANTED TO THE SCHEDULE OFFICER:
--   * every finance table - fee_structures, fee_assessments, fee_payments,
--     budget_lines and expenses. A timetable has no money in it, and the
--     finance views stay admin + accountant.
--   * exam_results and attendance - the officer arranges *when* a subject
--     meets, never what is recorded in the register or the mark sheet.
--   * profiles and students writes - the roster and the roles are the admin's.
--   * classes writes - a class is created and named by the admin; the officer
--     schedules into the classes that exist.
--   * subjects INSERT and DELETE - creating a subject is the registrar's act,
--     and DELETE cascades into exam_results and attendance. Only UPDATE is
--     granted, for `sessions` and `teacher_id`; see the note above it.
--   * notices writes - school-wide announcements are the office's, and no
--     screen on this portal can post one.


-- ---------------------------------------------------------------------------
-- Finance views widened for the accountant
-- ---------------------------------------------------------------------------
-- 20260101000400 gates each finance view with `jwt_role() = 'admin'`, which is
-- correct for the roles that existed then and returns zero rows for the
-- accountant - a finance officer who cannot see a finance view. The four views
-- an accountant legitimately needs are redeclared here with the gate widened
-- and the body otherwise untouched.
--
-- Redeclaring is `create or replace view`, so only the WHERE clause and the
-- options are rewritten; every column, every alias and the column ORDER are
-- byte-for-byte the 20260101000400 definitions, which is what Postgres requires
-- anyway - `create or replace view` refuses to change a column name, type or
-- position.
--
-- No re-grant is needed: `create or replace view` keeps the view's OID, so the
-- SELECT grants made to `authenticated` in 20260101000400 (its Grants section
-- names all five views) survive the replacement. The `comment on view` lines
-- are restated because they name the old role list and would otherwise be
-- stale.
--
-- `public.v_budget_vs_actual` is deliberately NOT redeclared: setting a budget
-- is a management function, so budget-vs-actual stays admin-only, exactly as
-- 20260101000400 wrote it. The accountant can read budget_lines and expenses
-- individually without being handed the management comparison.

-- Fee status per pupil. The gate grows by one role; the teacher clause and the
-- inherited RLS that narrows a teacher to their own classes are unchanged.
create or replace view public.v_fee_status_by_student
with (security_invoker = true)
as
select
  a.school_id,
  a.student_id,
  p.full_name                         as student_name,
  a.class_id,
  c.name                              as class_name,
  c.campus,
  a.term_id,
  a.amount                            as amount_due,
  coalesce(sum(case when py.is_reversal then -py.amount else py.amount end), 0)
                                      as paid,
  a.amount - coalesce(sum(case when py.is_reversal then -py.amount else py.amount end), 0)
                                      as balance,
  a.due_date
from public.fee_assessments a
join public.profiles p on p.id = a.student_id
join public.classes  c on c.id = a.class_id
left join public.fee_payments py on py.assessment_id = a.id
where (select public.jwt_role()) in ('admin', 'teacher', 'accountant')
group by a.school_id, a.student_id, p.full_name, a.class_id, c.name, c.campus,
         a.term_id, a.amount, a.due_date;

comment on view public.v_fee_status_by_student is
  'Amount due, paid and balance per pupil per term. Admin + teacher (teacher via inherited RLS) + accountant.';


-- Fees collected vs expected per term. Admin + accountant.
create or replace view public.v_fees_collected_vs_expected
with (security_invoker = true)
as
select
  a.school_id,
  a.term_id,
  t.name                              as term_name,
  t.start_date,
  sum(a.amount)                       as expected_pesewas,
  coalesce(sum(case when py.is_reversal then -py.amount else py.amount end), 0)
                                      as collected_pesewas,
  round(
    100.0 * coalesce(sum(case when py.is_reversal then -py.amount else py.amount end), 0)
    / nullif(sum(a.amount), 0),
    1
  )                                   as collection_rate,
  round(avg(py.payment_date - a.due_date)) as avg_days_to_pay
from public.fee_assessments a
join public.terms t on t.id = a.term_id
left join public.fee_payments py on py.assessment_id = a.id and not py.is_reversal
where (select public.jwt_role()) in ('admin', 'accountant')
group by a.school_id, a.term_id, t.name, t.start_date;

comment on view public.v_fees_collected_vs_expected is
  'Expected vs collected fees, collection rate and average days to pay per term. Admin + accountant.';


-- Outstanding fees by class for a term. Admin + accountant.
create or replace view public.v_outstanding_by_class
with (security_invoker = true)
as
select
  a.school_id,
  a.class_id,
  c.name                              as class_name,
  c.campus,
  a.term_id,
  t.name                              as term_name,
  sum(a.amount)                       as expected_pesewas,
  coalesce(sum(case when py.is_reversal then -py.amount else py.amount end), 0)
                                      as collected_pesewas,
  sum(a.amount) - coalesce(sum(case when py.is_reversal then -py.amount else py.amount end), 0)
                                      as outstanding_pesewas,
  count(distinct a.student_id)        as pupils_with_assessment
from public.fee_assessments a
join public.classes c on c.id = a.class_id
join public.terms  t on t.id = a.term_id
left join public.fee_payments py on py.assessment_id = a.id
where (select public.jwt_role()) in ('admin', 'accountant')
group by a.school_id, a.class_id, c.name, c.campus, a.term_id, t.name;

comment on view public.v_outstanding_by_class is
  'Expected, collected and outstanding per class per term. Admin + accountant.';


-- Monthly cash position (collections in, expenses out, running balance).
-- Admin + accountant.
create or replace view public.v_cash_position
with (security_invoker = true)
as
with flow as (
  select school_id,
         date_trunc('month', payment_date)::date as month,
         coalesce(sum(case when is_reversal then -amount else amount end), 0) as income_pesewas,
         0::bigint                               as expenses_pesewas
  from public.fee_payments
  group by school_id, date_trunc('month', payment_date)
  union all
  select school_id,
         date_trunc('month', expense_date)::date as month,
         0::bigint                               as income_pesewas,
         sum(amount)                             as expenses_pesewas
  from public.expenses
  group by school_id, date_trunc('month', expense_date)
)
select
  school_id,
  month,
  sum(income_pesewas)                           as income_pesewas,
  sum(expenses_pesewas)                         as expenses_pesewas,
  sum(income_pesewas - expenses_pesewas)        as net_pesewas,
  sum(sum(income_pesewas - expenses_pesewas)) over (
    partition by school_id order by month
  )                                             as running_balance_pesewas
from flow
where (select public.jwt_role()) in ('admin', 'accountant')
group by school_id, month
order by school_id, month;

comment on view public.v_cash_position is
  'Monthly inflows, outflows and running cash balance. Admin + accountant.';


-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
-- GRANT decides whether a role may touch an object at all; RLS then filters the
-- rows. New objects need explicit grants because the blanket grant in
-- 20260101000100_rls_policies.sql ran long before these two existed.
--
-- The two new roles need no grant of their own, anywhere. An accountant or a
-- schedule officer signs in as the Postgres `authenticated` role - the role
-- only exists in `app_metadata.role` in their JWT, not as a database role - so
-- every grant already made to `authenticated`, here and in the earlier
-- migrations, covers them. What makes them differ from a teacher is the
-- policies above, not the grants: the same tables are reachable, and RLS
-- decides the rows.
--
-- The four redeclared finance views are not re-granted either: `create or
-- replace view` preserves the grants made in 20260101000400.

grant select, insert, update, delete on public.timetable_slots to authenticated;

grant select on public.v_timetable_weekly to authenticated;

-- `anon` is granted nothing here, and 20260101000450_revoke_anon_privileges.sql
-- revoked `all` on every public table from `anon` and locked the schema default
-- privileges, so the two objects above do not start out reachable without a
-- session.
