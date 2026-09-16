-- ============================================================================
-- Row Level Security test suite
-- ============================================================================
-- Proves the policies actually work, rather than merely that they exist.
--
-- HOW TO RUN
--
--   Option A - Supabase Dashboard -> SQL Editor. Paste the whole file and Run.
--   Option B - psql "$DATABASE_URL" -f supabase/tests/rls_test.sql
--
-- The whole script is one transaction that ends in ROLLBACK, so it creates
-- test data, checks it, and leaves your database exactly as it found it. It is
-- safe to run against a live project, including one with real data.
--
-- HOW IT WORKS
--
-- Supabase derives `auth.uid()` and `auth.jwt()` from the `request.jwt.claims`
-- setting, so a test can impersonate any user by setting that claim and
-- switching to the `authenticated` role:
--
--   set local role authenticated;
--   set local request.jwt.claims = '{"sub":"<user>","app_metadata":{...}}';
--
-- Every probe below records an observed count next to the expected count, and
-- the report at the end prints PASS/FAIL per probe plus a summary. A FAIL means
-- a policy is wrong, so read those first.
--
-- WHAT IT COVERS
--
--   * tenant isolation (no school can see another school's rows)
--   * teacher scoping (only the classes and subjects they actually teach)
--   * student scoping (only their own rows)
--   * privilege escalation attempts (role change, cross-tenant writes, forgery)
--   * positive controls, so a suite that fails everything is distinguishable
--     from one that is genuinely passing
--   * anonymous access
--
-- WHAT IT DOES NOT COVER
--
--   * the Next.js layer: these tests exercise the database directly.
--   * Storage, Realtime, or any other Supabase service.
--   * Concurrency or performance.
-- ============================================================================


begin;

-- ---------------------------------------------------------------------------
-- 1. Fixtures
-- ---------------------------------------------------------------------------
-- `profiles.id` references `auth.users`, and creating real auth users from SQL
-- is version-dependent and fragile. The reference only exists to guarantee that
-- a profile cannot outlive its login, which is irrelevant to testing policies,
-- so it is dropped for the duration of this transaction and restored by the
-- rollback at the end.

do $$
declare
  constraint_name text;
begin
  select con.conname
    into constraint_name
    from pg_constraint con
   where con.conrelid = 'public.profiles'::regclass
     and con.contype = 'f'
     and con.confrelid = 'auth.users'::regclass;

  if constraint_name is not null then
    execute format('alter table public.profiles drop constraint %I', constraint_name);
  end if;
end;
$$;

-- Two schools, so tenant isolation is testable.
insert into public.schools (id, name, slug) values
  ('a0000000-0000-4000-8000-000000000001', 'School A', 'school-a'),
  ('b0000000-0000-4000-8000-000000000001', 'School B', 'school-b');

-- School A: 1 admin, 2 teachers, 2 students.
-- School B: 1 admin, 1 teacher, 1 student.
-- Teacher A1 teaches only subject A1 (class A1); teacher A2 only subject A2.
insert into public.profiles (id, school_id, role, full_name, email) values
  ('a1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'admin',   'Admin A',    'admin-a@test.local'),
  ('a2000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'teacher', 'Teacher A1', 'teacher-a1@test.local'),
  ('a2000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'teacher', 'Teacher A2', 'teacher-a2@test.local'),
  ('a3000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'student', 'Student A1', 'student-a1@test.local'),
  ('a3000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'student', 'Student A2', 'student-a2@test.local'),
  ('b1000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'admin',   'Admin B',    'admin-b@test.local'),
  ('b2000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'teacher', 'Teacher B1', 'teacher-b1@test.local'),
  ('b3000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'student', 'Student B1', 'student-b1@test.local');

insert into public.classes (id, school_id, name) values
  ('a4000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Class A1'),
  ('a4000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Class A2'),
  ('b4000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Class B1');

-- Assigning teacher_id here also exercises
-- public.assert_subject_teacher_is_teacher().
insert into public.subjects (id, school_id, class_id, teacher_id, name, code, sessions) values
  ('a5000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', 'Subject A1', 'SA1', '10'),
  ('a5000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000002', 'Subject A2', 'SA2', '10'),
  ('b5000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001', 'Subject B1', 'SB1', '10');

insert into public.students (id, school_id, class_id, roll_number) values
  ('a3000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 1),
  ('a3000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000002', 2),
  ('b3000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000001', 1);

insert into public.attendance (school_id, student_id, subject_id, class_id, date, status, recorded_by) values
  ('a0000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'a5000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', current_date - 5, 'Present', 'a2000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000002', 'a5000000-0000-4000-8000-000000000002', 'a4000000-0000-4000-8000-000000000002', current_date - 5, 'Present', 'a2000000-0000-4000-8000-000000000002');

insert into public.exam_results (school_id, student_id, subject_id, marks_obtained) values
  ('a0000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'a5000000-0000-4000-8000-000000000001', 80),
  ('a0000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000002', 'a5000000-0000-4000-8000-000000000002', 70);

insert into public.teacher_attendance (school_id, teacher_id, date, present_count, absent_count) values
  ('a0000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', current_date - 5, 1, 0);

insert into public.notices (id, school_id, title, details, date) values
  ('a6000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Notice A', 'School A notice', current_date),
  ('b6000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Notice B', 'School B notice', current_date);

insert into public.complaints (school_id, student_id, complaint) values
  ('a0000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'Complaint from student A1'),
  ('b0000000-0000-4000-8000-000000000001', 'b3000000-0000-4000-8000-000000000001', 'Complaint from student B1');


-- ---------------------------------------------------------------------------
-- 2. Observation table
-- ---------------------------------------------------------------------------
-- Probes run as `authenticated`, so they need explicit write access to this
-- table. It is temporary and never leaves the transaction.

-- NOTE: this table is temporary and is referenced UNQUALIFIED. The Supabase
-- SQL editor does not resolve the `pg_temp` schema alias the way a psql
-- session does (it looks for a schema literally named "pg_temp"), so any
-- `pg_temp.`-qualified reference fails with SQLSTATE 3F000. A temporary table
-- is still required: a plain table in `public` would be counted by the
-- "every public table has RLS enabled" structural check below. An unqualified
-- name resolves to the temp schema because it is always first in search_path.
create temporary table rls_results (
  probe    text primary key,
  observed bigint not null,
  expected bigint not null
);

grant all on rls_results to authenticated;


-- ---------------------------------------------------------------------------
-- 3. Structural checks (run as the owner)
-- ---------------------------------------------------------------------------

insert into rls_results (probe, observed, expected) values
  ('every public table has RLS enabled', (
     select count(*) from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity), 0),

  ('anon holds no privileges on public tables', (
     select count(*) from information_schema.role_table_grants
     where table_schema = 'public' and grantee = 'anon'), 0),

  ('no SECURITY DEFINER function exists in public', (
     select count(*) from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prosecdef), 0),

  ('every public function pins search_path', (
     select count(*) from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prokind = 'f'
       and not exists (
         select 1 from unnest(coalesce(p.proconfig, array[]::text[])) cfg
         where cfg like 'search_path=%'
       )), 0),

  ('every public view is security_invoker', (
     select count(*) from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'v'
       and not coalesce(c.reloptions @> array['security_invoker=true'], false)), 0);


-- ---------------------------------------------------------------------------
-- 4. Admin A - full visibility inside its own school, nothing outside
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"admin","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('admin A sees exactly its own school''s students',        (select count(*) from public.students), 2),
  ('admin A does not see school B''s students',              (select count(*) from public.students where school_id = 'b0000000-0000-4000-8000-000000000001'), 0),
  ('admin A sees both classes',                             (select count(*) from public.classes), 2),
  ('admin A sees both subjects',                            (select count(*) from public.subjects), 2),
  ('admin A sees all 5 profiles in its school',             (select count(*) from public.profiles), 5),
  ('admin A sees only its own school''s notice',            (select count(*) from public.notices), 1),
  ('admin A does not see school B''s notice',               (select count(*) from public.notices where school_id = 'b0000000-0000-4000-8000-000000000001'), 0),
  ('admin A sees only its own school''s complaint',         (select count(*) from public.complaints), 1),
  ('admin A sees both attendance rows',                     (select count(*) from public.attendance), 2),
  ('admin A sees both exam results',                        (select count(*) from public.exam_results), 2),
  ('admin A sees the teacher attendance row',               (select count(*) from public.teacher_attendance), 1);

reset role;


-- ---------------------------------------------------------------------------
-- 5. Teacher A1 - confined to the class and subject it actually teaches
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"a2000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"teacher","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('teacher A1 sees only students in the class it teaches',  (select count(*) from public.students), 1),
  ('teacher A1 sees only its own subject''s attendance',     (select count(*) from public.attendance), 1),
  ('teacher A1 sees only its own subject''s exam results',   (select count(*) from public.exam_results), 1),
  ('teacher A1 sees only its own teacher attendance',        (select count(*) from public.teacher_attendance), 1),
  ('teacher A1 sees no complaints',                          (select count(*) from public.complaints), 0),
  ('teacher A1 can still read the school''s notice',         (select count(*) from public.notices), 1),
  ('teacher A1 sees the school''s staff profiles',           (select count(*) from public.profiles), 5);

reset role;


-- ---------------------------------------------------------------------------
-- 6. Teacher A2 - same role, different subject, different view
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"a2000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"teacher","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('teacher A2 sees only its own (different) class''s students', (select count(*) from public.students), 1),
  ('teacher A2 does not see subject A1''s attendance',           (select count(*) from public.attendance where subject_id = 'a5000000-0000-4000-8000-000000000001'), 0),
  ('teacher A2 sees no teacher attendance (none recorded)',      (select count(*) from public.teacher_attendance), 0);

reset role;


-- ---------------------------------------------------------------------------
-- 7. Student A1 - only its own rows
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"a3000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"student","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('student A1 sees only itself in students',                (select count(*) from public.students), 1),
  ('student A1 cannot see the other student',                (select count(*) from public.students where id = 'a3000000-0000-4000-8000-000000000002'), 0),
  ('student A1 sees only its own attendance',                (select count(*) from public.attendance), 1),
  ('student A1 sees only its own exam results',              (select count(*) from public.exam_results), 1),
  ('student A1 sees only its own complaint',                 (select count(*) from public.complaints), 1),
  ('student A1 sees the school notice',                      (select count(*) from public.notices), 1),
  ('student A1 cannot see school B''s notice',               (select count(*) from public.notices where school_id = 'b0000000-0000-4000-8000-000000000001'), 0),
  ('student A1 sees only itself plus teachers (3 profiles)', (select count(*) from public.profiles), 3),
  ('student A1 cannot see the admin profile',                (select count(*) from public.profiles where role = 'admin'), 0),
  ('student A1 sees no teacher attendance',                  (select count(*) from public.teacher_attendance), 0);

reset role;


-- ---------------------------------------------------------------------------
-- 8. Student B1 - tenant isolation from the other side
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"b3000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"student","school_id":"b0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('student B1 sees only itself',                            (select count(*) from public.students), 1),
  ('student B1 sees only school B''s notice',                (select count(*) from public.notices), 1),
  ('student B1 cannot see school A''s notice',               (select count(*) from public.notices where school_id = 'a0000000-0000-4000-8000-000000000001'), 0),
  ('student B1 sees only itself plus school B''s teachers',  (select count(*) from public.profiles), 2),
  ('student B1 sees none of school A''s classes',            (select count(*) from public.classes where school_id = 'a0000000-0000-4000-8000-000000000001'), 0);

reset role;


-- ---------------------------------------------------------------------------
-- 9. Admin B - a second admin, to prove scoping is by school and not by role
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"b1000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"admin","school_id":"b0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('admin B sees only its own school''s single student', (select count(*) from public.students), 1),
  ('admin B sees none of school A''s students',          (select count(*) from public.students where school_id = 'a0000000-0000-4000-8000-000000000001'), 0);

reset role;


-- ---------------------------------------------------------------------------
-- 10. Privilege escalation attempts
-- ---------------------------------------------------------------------------
-- These expect the write to be REJECTED. Each sets observed = 1 only if the
-- offending statement unexpectedly succeeded.

set local role authenticated;
set local request.jwt.claims = '{"sub":"a3000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"student","school_id":"a0000000-0000-4000-8000-000000000001"}}';

do $$
begin
  begin
    update public.profiles set role = 'admin'
     where id = 'a3000000-0000-4000-8000-000000000001';
    insert into rls_results values ('student CANNOT promote itself to admin', 1, 0);
  exception when others then
    insert into rls_results values ('student CANNOT promote itself to admin', 0, 0);
  end;
end;
$$;

do $$
begin
  begin
    insert into public.complaints (school_id, student_id, complaint)
    values ('a0000000-0000-4000-8000-000000000001',
            'a3000000-0000-4000-8000-000000000002',
            'filed under another students name');
    insert into rls_results values ('student CANNOT file a complaint as another student', 1, 0);
  exception when others then
    insert into rls_results values ('student CANNOT file a complaint as another student', 0, 0);
  end;
end;
$$;

-- A positive control: the same student CAN file its own complaint, proving the
-- previous failure was the policy working and not the insert being broken.
insert into public.complaints (school_id, student_id, complaint)
values ('a0000000-0000-4000-8000-000000000001',
        'a3000000-0000-4000-8000-000000000001',
        'a legitimate complaint');

insert into rls_results (probe, observed, expected) values
  ('student CAN file its own complaint (control)', (select count(*) from public.complaints), 2);

reset role;


set local role authenticated;
set local request.jwt.claims = '{"sub":"a2000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"teacher","school_id":"a0000000-0000-4000-8000-000000000001"}}';

-- Positive control for the teacher's own subject. It lives here rather than
-- alongside the teacher's read probes so that those reads still see the
-- untouched fixture counts - adding an attendance row changes what a later
-- student probe observes.
--
-- Note the insert and the count are separate statements on purpose. Wrapping
-- them in one `with ins as (insert ... returning 1) select count(*) ...` would
-- NOT work: a data-modifying CTE and the statement around it share a snapshot,
-- so the count would not see the CTE's own rows and the probe would report a
-- false failure.
insert into public.attendance (school_id, student_id, subject_id, class_id, date, status, recorded_by)
values ('a0000000-0000-4000-8000-000000000001',
        'a3000000-0000-4000-8000-000000000001',
        'a5000000-0000-4000-8000-000000000001',
        'a4000000-0000-4000-8000-000000000001',
        current_date - 1, 'Absent', 'a2000000-0000-4000-8000-000000000001');

insert into rls_results (probe, observed, expected) values
  ('teacher A1 CAN record attendance for its own subject (control)',
   (select count(*) from public.attendance where subject_id = 'a5000000-0000-4000-8000-000000000001'), 2);

do $$
begin
  begin
    insert into public.attendance (school_id, student_id, subject_id, class_id, date, status, recorded_by)
    values ('a0000000-0000-4000-8000-000000000001',
            'a3000000-0000-4000-8000-000000000002',
            'a5000000-0000-4000-8000-000000000002',
            'a4000000-0000-4000-8000-000000000002',
            current_date - 1, 'Absent', 'a2000000-0000-4000-8000-000000000001');
    insert into rls_results values ('teacher A1 CANNOT record attendance for a colleague''s subject', 1, 0);
  exception when others then
    insert into rls_results values ('teacher A1 CANNOT record attendance for a colleague''s subject', 0, 0);
  end;
end;
$$;

do $$
begin
  begin
    insert into public.notices (school_id, title, details)
    values ('a0000000-0000-4000-8000-000000000001', 'Teacher notice', 'teachers must not publish');
    insert into rls_results values ('teacher CANNOT publish a notice', 1, 0);
  exception when others then
    insert into rls_results values ('teacher CANNOT publish a notice', 0, 0);
  end;
end;
$$;

reset role;


set local role authenticated;
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"admin","school_id":"a0000000-0000-4000-8000-000000000001"}}';

do $$
begin
  begin
    insert into public.classes (school_id, name)
    values ('b0000000-0000-4000-8000-000000000001', 'Cross-tenant class');
    insert into rls_results values ('admin A CANNOT create a class in school B', 1, 0);
  exception when others then
    insert into rls_results values ('admin A CANNOT create a class in school B', 0, 0);
  end;
end;
$$;

-- Positive control: admin A can create a class in its own school.
insert into public.classes (school_id, name)
values ('a0000000-0000-4000-8000-000000000001', 'Probe class');

insert into rls_results (probe, observed, expected) values
  ('admin A CAN create a class in its own school (control)', (select count(*) from public.classes), 3);

reset role;


-- ---------------------------------------------------------------------------
-- 11. Finance fixtures (Phase 1)
-- ---------------------------------------------------------------------------
-- Terms come first: every finance table foreign-keys to them. The receipt
-- trigger reads max(receipt_number)+1, so each fee_payment is its own statement
-- (a BEFORE trigger cannot see rows the same INSERT statement is still building,
-- which would hand out duplicate receipt numbers).
insert into public.terms (id, school_id, name, term_number, start_date, end_date) values
  ('a7000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Term 1', 1, '2026-01-01', '2026-04-30'),
  ('b7000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Term 1', 1, '2026-01-01', '2026-04-30');

insert into public.fee_structures (id, school_id, class_id, term_id, description, amount, due_date) values
  ('a8000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000001', 'Tuition', 18000, '2026-01-15'),
  ('b8000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000001', 'Tuition', 20000, '2026-01-15');

insert into public.fee_assessments (id, school_id, student_id, class_id, term_id, amount, due_date) values
  ('a8000000-0000-4000-8000-000000000101', 'a0000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000001', 18000, '2026-01-15'),
  ('a8000000-0000-4000-8000-000000000102', 'a0000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000002', 'a4000000-0000-4000-8000-000000000002', 'a7000000-0000-4000-8000-000000000001', 18000, '2026-01-15'),
  ('b8000000-0000-4000-8000-000000000101', 'b0000000-0000-4000-8000-000000000001', 'b3000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000001', 20000, '2026-01-15');

-- Three payments in school A: a payment for each pupil plus a reversal. Each in
-- its own statement so the receipt trigger sees the previous receipts.
insert into public.fee_payments (id, school_id, assessment_id, amount, payment_date, method)
values ('a8000000-0000-4000-8000-000000000201', 'a0000000-0000-4000-8000-000000000001', 'a8000000-0000-4000-8000-000000000101', 10000, '2026-01-20', 'cash');
insert into public.fee_payments (id, school_id, assessment_id, amount, payment_date, method)
values ('a8000000-0000-4000-8000-000000000202', 'a0000000-0000-4000-8000-000000000001', 'a8000000-0000-4000-8000-000000000102', 5000, '2026-01-20', 'mobile_money');
insert into public.fee_payments (id, school_id, assessment_id, amount, payment_date, method, is_reversal, reverses_payment_id, reversal_reason)
values ('a8000000-0000-4000-8000-000000000203', 'a0000000-0000-4000-8000-000000000001', 'a8000000-0000-4000-8000-000000000101', 10000, '2026-01-25', 'cash', true, 'a8000000-0000-4000-8000-000000000201', 'Duplicate entry');
insert into public.fee_payments (id, school_id, assessment_id, amount, payment_date, method)
values ('b8000000-0000-4000-8000-000000000201', 'b0000000-0000-4000-8000-000000000001', 'b8000000-0000-4000-8000-000000000101', 20000, '2026-01-20', 'bank');

insert into public.budget_lines (id, school_id, term_id, cost_centre, description, budget_amount) values
  ('a8000000-0000-4000-8000-000000000301', 'a0000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000001', 'Teaching', 'Stationery', 50000),
  ('a8000000-0000-4000-8000-000000000302', 'a0000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000001', 'Utilities', 'Electricity', 30000),
  ('b8000000-0000-4000-8000-000000000301', 'b0000000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000001', 'Teaching', 'Books', 60000);

insert into public.expenses (id, school_id, term_id, cost_centre, description, amount, expense_date) values
  ('a8000000-0000-4000-8000-000000000401', 'a0000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000001', 'Teaching', 'Exercise books', 12000, '2026-02-10'),
  ('a8000000-0000-4000-8000-000000000402', 'a0000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000001', 'Utilities', 'Power bill', 28000, '2026-02-11'),
  ('b8000000-0000-4000-8000-000000000401', 'b0000000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000001', 'Teaching', 'Chalk', 8000, '2026-02-12');


-- ---------------------------------------------------------------------------
-- 12. Finance - admin A
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"admin","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('admin A sees exactly its own term',                       (select count(*) from public.terms), 1),
  ('admin A does not see school B''s term',                   (select count(*) from public.terms where school_id = 'b0000000-0000-4000-8000-000000000001'), 0),
  ('admin A sees its own fee structure',                      (select count(*) from public.fee_structures), 1),
  ('admin A does not see school B''s fee structure',          (select count(*) from public.fee_structures where school_id = 'b0000000-0000-4000-8000-000000000001'), 0),
  ('admin A sees both its fee assessments',                   (select count(*) from public.fee_assessments), 2),
  ('admin A does not see school B''s assessment',             (select count(*) from public.fee_assessments where school_id = 'b0000000-0000-4000-8000-000000000001'), 0),
  ('admin A sees all three payments (incl. reversal)',        (select count(*) from public.fee_payments), 3),
  ('admin A does not see school B''s payment',                (select count(*) from public.fee_payments where school_id = 'b0000000-0000-4000-8000-000000000001'), 0),
  ('admin A sees both its budget lines',                      (select count(*) from public.budget_lines), 2),
  ('admin A sees both its expenses',                          (select count(*) from public.expenses), 2),
  ('admin A sees fee status for both its pupils',             (select count(*) from public.v_fee_status_by_student), 2),
  ('admin A sees one collected-vs-expected row',              (select count(*) from public.v_fees_collected_vs_expected), 1),
  ('admin A sees outstanding by both its classes',            (select count(*) from public.v_outstanding_by_class), 2),
  ('admin A sees budget-vs-actual for two centres',           (select count(*) from public.v_budget_vs_actual), 2),
  ('admin A sees two cash-position months',                   (select count(*) from public.v_cash_position), 2);

reset role;


-- ---------------------------------------------------------------------------
-- 13. Finance - teacher A1 (its own class, but never a payment row)
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"a2000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"teacher","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('teacher A1 sees fees only for its own class''s pupil',    (select count(*) from public.fee_assessments), 1),
  ('teacher A1 cannot see another class''s assessment',       (select count(*) from public.fee_assessments where class_id = 'a4000000-0000-4000-8000-000000000002'), 0),
  ('teacher A1 sees no fee payment rows (none of them)',      (select count(*) from public.fee_payments), 0),
  ('teacher A1 sees no fee structures',                       (select count(*) from public.fee_structures), 0),
  ('teacher A1 sees no budget lines',                         (select count(*) from public.budget_lines), 0),
  ('teacher A1 sees no expenses',                             (select count(*) from public.expenses), 0),
  ('teacher A1 sees fee status for its class''s pupil',       (select count(*) from public.v_fee_status_by_student), 1),
  ('teacher A1 sees none of the admin cash figures',          (select count(*) from public.v_fees_collected_vs_expected), 0);

reset role;


-- ---------------------------------------------------------------------------
-- 14. Finance - student A1 (only its own assessment and payments)
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"a3000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"student","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('student A1 sees only its own assessment',                 (select count(*) from public.fee_assessments), 1),
  ('student A1 cannot see the other pupil''s fees',           (select count(*) from public.fee_assessments where student_id = 'a3000000-0000-4000-8000-000000000002'), 0),
  ('student A1 sees its own payment and reversal',            (select count(*) from public.fee_payments), 2),
  ('student A1 cannot see the other pupil''s payment',        (select count(*) from public.fee_payments where assessment_id = 'a8000000-0000-4000-8000-000000000102'), 0),
  ('student A1 sees no fee structure',                        (select count(*) from public.fee_structures), 0),
  ('student A1 sees no budget line',                          (select count(*) from public.budget_lines), 0),
  ('student A1 sees no expense',                              (select count(*) from public.expenses), 0),
  ('student A1 sees no class-wide fee status',                (select count(*) from public.v_fee_status_by_student), 0),
  ('student A1 sees no collected-vs-expected figure',         (select count(*) from public.v_fees_collected_vs_expected), 0),
  ('student A1 sees no outstanding-by-class figure',          (select count(*) from public.v_outstanding_by_class), 0),
  ('student A1 sees no cash position figure',                 (select count(*) from public.v_cash_position), 0);

reset role;


-- ---------------------------------------------------------------------------
-- 15. Finance - privilege escalation
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"a3000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"student","school_id":"a0000000-0000-4000-8000-000000000001"}}';

do $$
begin
  begin
    insert into public.fee_payments (school_id, assessment_id, amount, payment_date, method)
    values ('a0000000-0000-4000-8000-000000000001',
            'a8000000-0000-4000-8000-000000000102',
            5000, current_date, 'cash');
    insert into rls_results values ('student CANNOT record a payment', 1, 0);
  exception when others then
    insert into rls_results values ('student CANNOT record a payment', 0, 0);
  end;
end;
$$;

do $$
begin
  begin
    insert into public.fee_assessments (school_id, student_id, class_id, term_id, amount)
    values ('a0000000-0000-4000-8000-000000000001',
            'a3000000-0000-4000-8000-000000000002',
            'a4000000-0000-4000-8000-000000000002',
            'a7000000-0000-4000-8000-000000000001',
            18000);
    insert into rls_results values ('student CANNOT bill another pupil', 1, 0);
  exception when others then
    insert into rls_results values ('student CANNOT bill another pupil', 0, 0);
  end;
end;
$$;

reset role;


set local role authenticated;
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"admin","school_id":"a0000000-0000-4000-8000-000000000001"}}';

do $$
begin
  begin
    insert into public.budget_lines (school_id, term_id, cost_centre, budget_amount)
    values ('b0000000-0000-4000-8000-000000000001',
            'b7000000-0000-4000-8000-000000000001',
            'Teaching', 10000);
    insert into rls_results values ('admin A CANNOT bill school B''s budget', 1, 0);
  exception when others then
    insert into rls_results values ('admin A CANNOT bill school B''s budget', 0, 0);
  end;
end;
$$;

-- Positive control: admin A CAN record a payment in its own school. Kept as its
-- own statement so the receipt trigger's max()+1 sees the three rows above it.
insert into public.fee_payments (school_id, assessment_id, amount, payment_date, method)
values ('a0000000-0000-4000-8000-000000000001',
        'a8000000-0000-4000-8000-000000000101',
        3000, current_date, 'cash');

insert into rls_results (probe, observed, expected) values
  ('admin A CAN record a payment in its own school (control)',
   (select count(*) from public.fee_payments where school_id = 'a0000000-0000-4000-8000-000000000001'), 4);

reset role;


-- ---------------------------------------------------------------------------
-- 16. Academics (Phase 2) - term-scoped marks and enrolment facts
-- ---------------------------------------------------------------------------
-- The four trend views join through exam_results / students / terms, none of
-- which the finance fixtures above touched. To give them rows to return we have
-- to term-scope the marks and drop each pupil into a term window. Everything is
-- done AFTER the finance probes so no count they relied on moves.
--
-- It is not enough to test that the views exist. Each must inherit the caller's
-- RLS (security_invoker) and still scope rows per role, exactly like the base
-- tables - otherwise a view becomes a side door around the policies.

update public.exam_results
set term_id = 'a7000000-0000-4000-8000-000000000001'
where school_id = 'a0000000-0000-4000-8000-000000000001';

-- School B gets its own term-scoped mark so tenant isolation is testable from
-- the same probes.
insert into public.exam_results (school_id, student_id, subject_id, term_id, marks_obtained)
values ('b0000000-0000-4000-8000-000000000001',
        'b3000000-0000-4000-8000-000000000001',
        'b5000000-0000-4000-8000-000000000001',
        'b7000000-0000-4000-8000-000000000001',
        90);

-- Land every fixture pupil inside its school's Term 1 window (2026-01-01 ..
-- 2026-04-30) so the enrolment and retention views count it as an active pupil.
update public.students
set enrolled_at      = '2026-02-01',
    status_date      = '2026-02-01',
    enrolment_status = 'active'
where id in ('a3000000-0000-4000-8000-000000000001',
             'a3000000-0000-4000-8000-000000000002',
             'b3000000-0000-4000-8000-000000000001');


-- ---------------------------------------------------------------------------
-- 17. Academics - admin A (both classes, nothing from school B)
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"admin","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('admin A sees both class-average rows',                (select count(*) from public.v_class_average_trend), 2),
  ('admin A sees no class-average rows for school B',     (select count(*) from public.v_class_average_trend where school_id = 'b0000000-0000-4000-8000-000000000001'), 0),
  ('admin A sees both pass/promotion rows',               (select count(*) from public.v_pass_promotion_rates), 2),
  ('admin A sees no pass/promotion rows for school B',    (select count(*) from public.v_pass_promotion_rates where school_id = 'b0000000-0000-4000-8000-000000000001'), 0),
  ('admin A sees both enrolment rows',                    (select count(*) from public.v_enrolment_trend_by_class_campus), 2),
  ('admin A sees no enrolment rows for school B',         (select count(*) from public.v_enrolment_trend_by_class_campus where school_id = 'b0000000-0000-4000-8000-000000000001'), 0),
  ('admin A sees one retention row',                      (select count(*) from public.v_retention_dropout), 1),
  ('admin A sees no retention rows for school B',         (select count(*) from public.v_retention_dropout where school_id = 'b0000000-0000-4000-8000-000000000001'), 0);

reset role;


-- ---------------------------------------------------------------------------
-- 18. Academics - teacher A1 (confined to its own class and term)
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"a2000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"teacher","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('teacher A1 sees only its own class-average row',      (select count(*) from public.v_class_average_trend), 1),
  ('teacher A1 sees only its own pass/promotion row',     (select count(*) from public.v_pass_promotion_rates), 1),
  ('teacher A1 sees only its own enrolment row',          (select count(*) from public.v_enrolment_trend_by_class_campus), 1),
  ('teacher A1 sees only its own retention row',          (select count(*) from public.v_retention_dropout), 1);

reset role;


-- ---------------------------------------------------------------------------
-- 19. Academics - teacher A2 (same role, different class, opposite result)
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"a2000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"teacher","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('teacher A2 sees its own (different) class-average row',  (select count(*) from public.v_class_average_trend), 1),
  ('teacher A2 cannot see class A1''s class-average row',     (select count(*) from public.v_class_average_trend where class_id = 'a4000000-0000-4000-8000-000000000001'), 0),
  ('teacher A2 sees only its own pass/promotion row',         (select count(*) from public.v_pass_promotion_rates), 1),
  ('teacher A2 sees only its own enrolment row',              (select count(*) from public.v_enrolment_trend_by_class_campus), 1),
  ('teacher A2 sees only its own retention row',              (select count(*) from public.v_retention_dropout), 1);

reset role;


-- ---------------------------------------------------------------------------
-- 20. Academics - student A1 (only its own mark and its own pupil row)
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"a3000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"student","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('student A1 sees class-average only for its own mark',   (select count(*) from public.v_class_average_trend), 1),
  ('student A1 sees pass/promotion only for its own mark',  (select count(*) from public.v_pass_promotion_rates), 1),
  ('student A1 sees enrolment only for itself',             (select count(*) from public.v_enrolment_trend_by_class_campus), 1),
  ('student A1 sees retention only for itself',             (select count(*) from public.v_retention_dropout), 1);

reset role;


-- ---------------------------------------------------------------------------
-- 21. People & teaching (Phase 3) - admin-only views
-- ---------------------------------------------------------------------------
-- v_pupil_teacher_ratio and v_teacher_attendance_rate carry the same in-view
-- jwt_role() = 'admin' gate as the other school-management metrics, so a
-- teacher or pupil who can legitimately read subjects / profiles school-wide
-- must still see none of these. School A builds to: classes A1 (1 active pupil
-- / teacher A1) and A2 (1 active pupil / teacher A2), with a single attendance
-- record for teacher A1 and none for A2 - both still appear so the "no records
-- yet" state is surfaced. School B (1 class / 1 teacher / no attendance) proves
-- the per-tenant shape rather than anything hard-coded to school A.

set local role authenticated;
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"admin","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('admin A sees the ratio for both its classes',          (select count(*) from public.v_pupil_teacher_ratio), 2),
  ('admin A sees no ratio rows for school B',              (select count(*) from public.v_pupil_teacher_ratio where school_id = 'b0000000-0000-4000-8000-000000000001'), 0),
  ('admin A sees attendance for both its teachers',        (select count(*) from public.v_teacher_attendance_rate), 2),
  ('admin A sees no attendance rows for school B',         (select count(*) from public.v_teacher_attendance_rate where school_id = 'b0000000-0000-4000-8000-000000000001'), 0);

reset role;


set local role authenticated;
set local request.jwt.claims = '{"sub":"a2000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"teacher","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('teacher A1 sees none of the pupil/teacher ratio',      (select count(*) from public.v_pupil_teacher_ratio), 0),
  ('teacher A1 sees none of the teacher attendance rate',  (select count(*) from public.v_teacher_attendance_rate), 0);

reset role;


set local role authenticated;
set local request.jwt.claims = '{"sub":"a2000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"teacher","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('teacher A2 sees none of the pupil/teacher ratio',      (select count(*) from public.v_pupil_teacher_ratio), 0),
  ('teacher A2 sees none of the teacher attendance rate',  (select count(*) from public.v_teacher_attendance_rate), 0);

reset role;


set local role authenticated;
set local request.jwt.claims = '{"sub":"a3000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"student","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('student A1 sees none of the pupil/teacher ratio',      (select count(*) from public.v_pupil_teacher_ratio), 0),
  ('student A1 sees none of the teacher attendance rate',  (select count(*) from public.v_teacher_attendance_rate), 0);

reset role;


set local role authenticated;
set local request.jwt.claims = '{"sub":"b1000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"admin","school_id":"b0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('admin B sees the ratio for its own class',             (select count(*) from public.v_pupil_teacher_ratio), 1),
  ('admin B sees no ratio rows for school A',              (select count(*) from public.v_pupil_teacher_ratio where school_id = 'a0000000-0000-4000-8000-000000000001'), 0),
  ('admin B sees attendance for its own teacher',          (select count(*) from public.v_teacher_attendance_rate), 1),
  ('admin B sees no attendance rows for school A',         (select count(*) from public.v_teacher_attendance_rate where school_id = 'a0000000-0000-4000-8000-000000000001'), 0);

reset role;


-- ---------------------------------------------------------------------------
-- 22. Admissions & capacity (Phase 4) - admin-only records and views
-- ---------------------------------------------------------------------------
-- admissions is a lead database: one row per prospect whose stage advances
-- enquiry→application→offer→enrolled (or is declined). It is admin-only by
-- RLS (no teacher or student policy), and all three views are admin-only via
-- their in-view `jwt_role() = 'admin'` gate. School A builds to a full funnel:
-- 2 enquiries, 1 application, 1 offer, 1 enrolled (into Class A1, intake
-- Term 1), 1 declined — 6 leads. School B gets an enrolled lead into its own
-- class plus an enquiry, so tenant isolation is provable from both sides.
-- Class A1 has a capacity set, A2 does not (null = "not set", honest dash),
-- B1 has one. Capacity utilisation then reads: A1 = 1 active pupil of 2 → 50%,
-- A2 = 1 active pupil with no capacity → null, B1 = 1 active pupil of 2 → 50%.

-- Class capacity is set by the owner here (RLS is bypassed); the policy is what
-- the probes below actually exercise.
update public.classes set capacity = 2 where id = 'a4000000-0000-4000-8000-000000000001';
update public.classes set capacity = 2 where id = 'b4000000-0000-4000-8000-000000000001';
-- Class A2 keeps capacity null.

-- Admissions leads, inserted by the owner. Each references a term and (for the
-- enrolled ones) a class of its own school, satisfying the composite FKs.
insert into public.admissions (id, school_id, pupil_name, intake_term_id, class_id, stage, stage_date) values
  ('a9000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Alice', 'a7000000-0000-4000-8000-000000000001', null, 'enquiry',     current_date),
  ('a9000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Bob',   'a7000000-0000-4000-8000-000000000001', null, 'enquiry',     current_date),
  ('a9000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Carol', 'a7000000-0000-4000-8000-000000000001', null, 'application', current_date),
  ('a9000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Dave',  'a7000000-0000-4000-8000-000000000001', null, 'offer',       current_date),
  ('a9000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'Eve',   'a7000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'enrolled', current_date),
  ('a9000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'Frank', 'a7000000-0000-4000-8000-000000000001', null, 'declined',    current_date),
  ('b9000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Grace', 'b7000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000001', 'enrolled', current_date),
  ('b9000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Henry', 'b7000000-0000-4000-8000-000000000001', null, 'enquiry',     current_date);


set local role authenticated;
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"admin","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('admin A sees its own admissions leads',             (select count(*) from public.admissions where school_id = 'a0000000-0000-4000-8000-000000000001'), 6),
  ('admin A sees no admissions leads for school B',     (select count(*) from public.admissions where school_id = 'b0000000-0000-4000-8000-000000000001'), 0),
  ('admin A sees all five funnel stages',               (select count(*) from public.v_admissions_funnel), 5),
  ('admin A funnel counts only its own enrolled',       (select leads from public.v_admissions_funnel where stage = 'enrolled'), 1),
  ('admin A sees its own enrolments by class & term',   (select count(*) from public.v_new_enrolments_by_class_intake where school_id = 'a0000000-0000-4000-8000-000000000001'), 1),
  ('admin A sees no school B enrolments',               (select count(*) from public.v_new_enrolments_by_class_intake where school_id = 'b0000000-0000-4000-8000-000000000001'), 0),
  ('admin A sees both classes in capacity',             (select count(*) from public.v_capacity_utilisation), 2),
  ('admin A capacity A1 is 50%',                        (select utilisation_percent::bigint from public.v_capacity_utilisation where class_id = 'a4000000-0000-4000-8000-000000000001'), 50),
  ('admin A capacity A2 is honest (no capacity set)',   (case when (select utilisation_percent from public.v_capacity_utilisation where class_id = 'a4000000-0000-4000-8000-000000000002') is null then 1 else 0 end), 1);

-- Positive control: admin A CAN record a lead, proving the teacher denial below
-- was the policy working and not the insert being broken.
insert into public.admissions (id, school_id, pupil_name)
values ('a9000000-0000-4000-8000-000000000099', 'a0000000-0000-4000-8000-000000000001', 'Ivy');

insert into rls_results (probe, observed, expected) values
  ('admin A CAN record an admissions lead (control)', (select count(*) from public.admissions where school_id = 'a0000000-0000-4000-8000-000000000001'), 7);

reset role;


set local role authenticated;
set local request.jwt.claims = '{"sub":"a2000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"teacher","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('teacher A1 sees no admissions leads',        (select count(*) from public.admissions), 0),
  ('teacher A1 sees no admissions funnel',       (select count(*) from public.v_admissions_funnel), 0),
  ('teacher A1 sees no enrolments by class',     (select count(*) from public.v_new_enrolments_by_class_intake), 0),
  ('teacher A1 sees no capacity utilisation',    (select count(*) from public.v_capacity_utilisation), 0);

do $$
begin
  begin
    insert into public.admissions (school_id, pupil_name)
    values ('a0000000-0000-4000-8000-000000000001', 'Rogue lead');
    insert into rls_results values ('teacher A1 CANNOT record an admissions lead', 1, 0);
  exception when others then
    insert into rls_results values ('teacher A1 CANNOT record an admissions lead', 0, 0);
  end;
end;
$$;

reset role;


set local role authenticated;
set local request.jwt.claims = '{"sub":"a3000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"student","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('student A1 sees no admissions leads',        (select count(*) from public.admissions), 0),
  ('student A1 sees no admissions funnel',       (select count(*) from public.v_admissions_funnel), 0),
  ('student A1 sees no capacity utilisation',    (select count(*) from public.v_capacity_utilisation), 0);

reset role;


set local role authenticated;
set local request.jwt.claims = '{"sub":"b1000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"admin","school_id":"b0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('admin B sees its own admissions leads',         (select count(*) from public.admissions where school_id = 'b0000000-0000-4000-8000-000000000001'), 2),
  ('admin B sees no admissions leads for school A', (select count(*) from public.admissions where school_id = 'a0000000-0000-4000-8000-000000000001'), 0),
  ('admin B funnel counts only its own enrolled',   (select leads from public.v_admissions_funnel where stage = 'enrolled'), 1),
  ('admin B sees its own enrolments by class & term', (select count(*) from public.v_new_enrolments_by_class_intake where school_id = 'b0000000-0000-4000-8000-000000000001'), 1),
  ('admin B sees no school A enrolments',           (select count(*) from public.v_new_enrolments_by_class_intake where school_id = 'a0000000-0000-4000-8000-000000000001'), 0),
  ('admin B sees its own class capacity',           (select count(*) from public.v_capacity_utilisation), 1),
  ('admin B capacity B1 is 50%',                    (select utilisation_percent::bigint from public.v_capacity_utilisation where class_id = 'b4000000-0000-4000-8000-000000000001'), 50);

reset role;


-- ---------------------------------------------------------------------------
-- 23. Welfare (Phase 5) - the incident register and its admin-only views
-- ---------------------------------------------------------------------------
-- incidents is a behavioural register: one row per incident against a pupil,
-- admin-only for record/resolve/delete (there is no teacher or student write
-- policy). Reads scope per role: admin full, teacher classes they teach, pupil
-- own only. Both views are admin-only via their in-view `jwt_role() = 'admin'`
-- gate, so a teacher or pupil who can legitimately read their own rows must
-- still see none of the aggregated numbers. School A builds to 3 incidents
-- (A1: 2, A2: 1), School B to 1 in its single class, so tenant isolation and
-- per-class rates are both provable: A1 = 2 incidents / 1 active pupil → 200
-- per hundred, A2 = 1/1 → 100, B1 = 1/1 → 100.

-- Incidents, inserted by the owner (RLS is bypassed); the policies are what the
-- probes below exercise. The resolved row carries its resolved_on (the check
-- constraint requires it), and every row satisfies the composite FKs to
-- students and classes.
insert into public.incidents
  (id, school_id, student_id, class_id, date, incident_type, note, resolved, resolved_on) values
  ('aa000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', '2026-02-01', 'lateness',          'Arrived after the bell', true,  '2026-02-03'),
  ('aa000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', '2026-02-10', 'fighting',           'Pushed a classmate',    false, null),
  ('aa000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000002', 'a4000000-0000-4000-8000-000000000002', '2026-02-12', 'truancy',            'Missed morning lessons', false, null),
  ('bb000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'b3000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000001', '2026-02-14', 'bullying',           'Taunted a classmate',   false, null);


set local role authenticated;
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"admin","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('admin A sees its own incidents',                (select count(*) from public.incidents where school_id = 'a0000000-0000-4000-8000-000000000001'), 3),
  ('admin A sees no incidents for school B',        (select count(*) from public.incidents where school_id = 'b0000000-0000-4000-8000-000000000001'), 0),
  ('admin A sees all six incident types',           (select count(*) from public.v_incidents_by_type), 6),
  ('admin A by-type counts its own lateness',       (select incident_count from public.v_incidents_by_type where incident_type = 'lateness'), 1),
  ('admin A by-type resolved/unresolved split',     (select unresolved_count from public.v_incidents_by_type where incident_type = 'fighting'), 1),
  ('admin A sees both classes by rate',             (select count(*) from public.v_incidents_per_hundred_by_class), 2),
  ('admin A rate for class A1',                     (select per_hundred::bigint from public.v_incidents_per_hundred_by_class where class_id = 'a4000000-0000-4000-8000-000000000001'), 200),
  ('admin A rate for class A2',                     (select per_hundred::bigint from public.v_incidents_per_hundred_by_class where class_id = 'a4000000-0000-4000-8000-000000000002'), 100);

reset role;


set local role authenticated;
set local request.jwt.claims = '{"sub":"a2000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"teacher","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('teacher A1 sees incidents only in its class',    (select count(*) from public.incidents where class_id = 'a4000000-0000-4000-8000-000000000001'), 2),
  ('teacher A1 sees no class A2 incidents',          (select count(*) from public.incidents where class_id = 'a4000000-0000-4000-8000-000000000002'), 0),
  ('teacher A1 sees no school B incidents',          (select count(*) from public.incidents where school_id = 'b0000000-0000-4000-8000-000000000001'), 0),
  ('teacher A1 sees no incidents by type view',      (select count(*) from public.v_incidents_by_type), 0);

do $$
begin
  begin
    insert into public.incidents (school_id, student_id, class_id, incident_type)
    values ('a0000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'lateness');
    insert into rls_results values ('teacher A1 CANNOT record an incident', 1, 0);
  exception when others then
    insert into rls_results values ('teacher A1 CANNOT record an incident', 0, 0);
  end;
end;
$$;

reset role;


set local role authenticated;
set local request.jwt.claims = '{"sub":"a2000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"teacher","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('teacher A2 sees incidents only in its class',    (select count(*) from public.incidents where class_id = 'a4000000-0000-4000-8000-000000000002'), 1),
  ('teacher A2 sees no class A1 incidents',          (select count(*) from public.incidents where class_id = 'a4000000-0000-4000-8000-000000000001'), 0);

reset role;


set local role authenticated;
set local request.jwt.claims = '{"sub":"a3000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"student","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('student A1 sees only its own incidents',         (select count(*) from public.incidents where student_id = 'a3000000-0000-4000-8000-000000000001'), 2),
  ('student A1 sees no classmate''s incidents',      (select count(*) from public.incidents where student_id = 'a3000000-0000-4000-8000-000000000002'), 0),
  ('student A1 sees no school B incidents',          (select count(*) from public.incidents where school_id = 'b0000000-0000-4000-8000-000000000001'), 0),
  ('student A1 sees no incidents by type view',      (select count(*) from public.v_incidents_by_type), 0),
  ('student A1 sees no incidents per hundred view',  (select count(*) from public.v_incidents_per_hundred_by_class), 0);

reset role;


set local role authenticated;
set local request.jwt.claims = '{"sub":"b1000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"admin","school_id":"b0000000-0000-4000-8000-000000000001"}}';

insert into rls_results (probe, observed, expected) values
  ('admin B sees its own incidents',                 (select count(*) from public.incidents where school_id = 'b0000000-0000-4000-8000-000000000001'), 1),
  ('admin B sees no incidents for school A',         (select count(*) from public.incidents where school_id = 'a0000000-0000-4000-8000-000000000001'), 0),
  ('admin B sees its own class rate',                (select per_hundred::bigint from public.v_incidents_per_hundred_by_class where class_id = 'b4000000-0000-4000-8000-000000000001'), 100);

-- Positive control: admin A CAN record an incident, proving the teacher denial
-- above was the policy working and not the insert being broken. It must run as
-- admin A — the insert policy's `with check` ties the row's school_id to
-- jwt_school_id(), so recording under admin B (or any other role) would be
-- rejected and the probe would fail. Done after the role probes so it cannot
-- shift the counts a teacher or student relied on.
set local role authenticated;
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"admin","school_id":"a0000000-0000-4000-8000-000000000001"}}';

insert into public.incidents (id, school_id, student_id, class_id, incident_type)
values ('aa000000-0000-4000-8000-000000000099', 'a0000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'lateness');

insert into rls_results (probe, observed, expected) values
  ('admin A CAN record an incident (control)', (select count(*) from public.incidents where school_id = 'a0000000-0000-4000-8000-000000000001'), 4);

reset role;


-- ---------------------------------------------------------------------------
-- 24. Report
-- ---------------------------------------------------------------------------

select
  case when observed = expected then 'PASS' else 'FAIL' end as result,
  probe,
  observed,
  expected
from rls_results
order by (observed = expected), probe;

select
  count(*)                                    as total_probes,
  count(*) filter (where observed = expected) as passed,
  count(*) filter (where observed <> expected) as failed
from rls_results;

-- Nothing the suite created is kept.
rollback;
