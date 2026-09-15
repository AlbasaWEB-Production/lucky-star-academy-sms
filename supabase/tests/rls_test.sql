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
       )), 0);


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
-- 11. Report
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
