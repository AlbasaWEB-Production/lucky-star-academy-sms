-- ============================================================================
-- Lucky Star Academy SMS - Row Level Security
-- ============================================================================
-- This file is the entire replacement for the legacy Express authorization
-- layer. The old backend had no server-side authorization at all: it trusted a
-- `role` field that the browser stored in localStorage and sent whatever id it
-- was given. Every access rule below is now enforced by Postgres itself.
--
-- AUTHORIZATION MODEL
--
--   * `app_metadata.role` and `app_metadata.school_id` in the caller's JWT are
--     the only authorization inputs. app_metadata is server-controlled, so a
--     user cannot promote themselves. user_metadata is deliberately unused.
--   * Every tenant-owned table carries school_id, and cross-tenant access is
--     blocked by `school_id = jwt_school_id()`.
--   * `TO authenticated` alone only proves "some user is signed in"; every
--     policy below pairs it with an ownership or role predicate.
--   * anon is granted nothing in `public`. Anonymous requests need no table
--     access: the pre-login student lookup runs server-side with the secret
--     key, and post-login requests carry the `authenticated` role.
--
-- Note: RLS is ENABLED but not FORCED. FORCE would also apply policies to the
-- table owner (the `postgres` role used by the Dashboard SQL editor), which
-- makes exploratory queries in the editor silently return zero rows. The
-- `service_role` used by server actions bypasses RLS either way via its
-- BYPASSRLS attribute.


-- ---------------------------------------------------------------------------
-- Policy helpers (SECURITY INVOKER - they read only the caller's own rows)
-- ---------------------------------------------------------------------------
-- Defined before the GRANTs below, because the grants reference them.

create or replace function public.teaches_subject(p_subject_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.subjects s
    where s.id = p_subject_id
      and s.teacher_id = (select auth.uid())
  );
$$;

create or replace function public.teaches_class(p_class_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.subjects s
    where s.class_id = p_class_id
      and s.teacher_id = (select auth.uid())
  );
$$;


-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
-- RLS decides which ROWS a role may see; GRANT decides whether it may touch
-- the table at all. Both are required, so both are explicit here.

grant usage on schema public to authenticated;

grant select, insert, update, delete
  on all tables in schema public
  to authenticated;

grant select on public.student_directory to authenticated;

-- Helper functions used inside policies must be executable by the roles that
-- policies run as.
grant execute on function public.jwt_role() to authenticated;
grant execute on function public.jwt_school_id() to authenticated;
grant execute on function public.teaches_subject(uuid) to authenticated;
grant execute on function public.teaches_class(uuid) to authenticated;

-- Nothing in the public schema is reachable without signing in.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;


-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
-- Every table in an exposed schema needs RLS: tables in `public` are reachable
-- through the Data API by whatever roles hold grants.

alter table public.schools            enable row level security;
alter table public.profiles           enable row level security;
alter table public.classes            enable row level security;
alter table public.subjects           enable row level security;
alter table public.students           enable row level security;
alter table public.exam_results       enable row level security;
alter table public.attendance         enable row level security;
alter table public.teacher_attendance enable row level security;
alter table public.notices            enable row level security;
alter table public.complaints         enable row level security;


-- ---------------------------------------------------------------------------
-- public.schools
-- ---------------------------------------------------------------------------
-- Readable by its own members so the app can display the school name. Writable
-- only by its admin. There is intentionally no INSERT policy: a school row is
-- created during registration by a server action using the secret key, so only
-- the server can originate a tenant.

create policy schools_select_own_school
  on public.schools
  for select
  to authenticated
  using (id = (select public.jwt_school_id()));

create policy schools_update_by_admin
  on public.schools
  for update
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and id = (select public.jwt_school_id())
  )
  with check (
    (select public.jwt_role()) = 'admin'
    and id = (select public.jwt_school_id())
  );


-- ---------------------------------------------------------------------------
-- public.profiles
-- ---------------------------------------------------------------------------
-- Admins and teachers can see everyone in their school (needed for rosters and
-- pickers). Students can see themselves and their school's teachers, but not
-- other students' profiles.

create policy profiles_select_self
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy profiles_select_by_school_staff
  on public.profiles
  for select
  to authenticated
  using (
    school_id = (select public.jwt_school_id())
    and (select public.jwt_role()) in ('admin', 'teacher')
  );

create policy profiles_select_teachers_in_school
  on public.profiles
  for select
  to authenticated
  using (
    school_id = (select public.jwt_school_id())
    and role = 'teacher'
  );

-- A user may edit their own profile row, but the WITH CHECK clause pins `role`
-- and `school_id` to the values in their own JWT. Without that clause a user
-- could rewrite their own row to role = 'admin' - a privilege escalation that
-- an UPDATE policy alone would happily allow.
create policy profiles_update_self
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and role::text = (select public.jwt_role())
    and school_id is not distinct from (select public.jwt_school_id())
  );

-- No INSERT/DELETE policies: profiles are created and removed together with
-- the matching auth.users row by server actions using the secret key.


-- ---------------------------------------------------------------------------
-- public.classes
-- ---------------------------------------------------------------------------

create policy classes_select_school
  on public.classes
  for select
  to authenticated
  using (school_id = (select public.jwt_school_id()));

create policy classes_insert_by_admin
  on public.classes
  for insert
  to authenticated
  with check (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy classes_update_by_admin
  on public.classes
  for update
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  )
  with check (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy classes_delete_by_admin
  on public.classes
  for delete
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );


-- ---------------------------------------------------------------------------
-- public.subjects
-- ---------------------------------------------------------------------------

create policy subjects_select_school
  on public.subjects
  for select
  to authenticated
  using (school_id = (select public.jwt_school_id()));

create policy subjects_insert_by_admin
  on public.subjects
  for insert
  to authenticated
  with check (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy subjects_update_by_admin
  on public.subjects
  for update
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  )
  with check (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy subjects_delete_by_admin
  on public.subjects
  for delete
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );


-- ---------------------------------------------------------------------------
-- public.students
-- ---------------------------------------------------------------------------

-- A student sees only their own row.
create policy students_select_self
  on public.students
  for select
  to authenticated
  using (id = (select auth.uid()));

-- Admins see every student in their school.
create policy students_select_by_admin
  on public.students
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

-- Teachers see only students in the classes they actually teach.
create policy students_select_by_teacher
  on public.students
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'teacher'
    and school_id = (select public.jwt_school_id())
    and public.teaches_class(class_id)
  );

create policy students_insert_by_admin
  on public.students
  for insert
  to authenticated
  with check (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy students_update_by_admin
  on public.students
  for update
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  )
  with check (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy students_delete_by_admin
  on public.students
  for delete
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );


-- ---------------------------------------------------------------------------
-- public.exam_results
-- ---------------------------------------------------------------------------

create policy exam_results_select_self
  on public.exam_results
  for select
  to authenticated
  using (student_id = (select auth.uid()));

create policy exam_results_select_by_admin
  on public.exam_results
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy exam_results_select_by_teacher
  on public.exam_results
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'teacher'
    and school_id = (select public.jwt_school_id())
    and public.teaches_subject(subject_id)
  );

create policy exam_results_insert_by_admin_or_teacher
  on public.exam_results
  for insert
  to authenticated
  with check (
    school_id = (select public.jwt_school_id())
    and (
      (select public.jwt_role()) = 'admin'
      or ((select public.jwt_role()) = 'teacher' and public.teaches_subject(subject_id))
    )
  );

create policy exam_results_update_by_admin_or_teacher
  on public.exam_results
  for update
  to authenticated
  using (
    school_id = (select public.jwt_school_id())
    and (
      (select public.jwt_role()) = 'admin'
      or ((select public.jwt_role()) = 'teacher' and public.teaches_subject(subject_id))
    )
  )
  with check (
    school_id = (select public.jwt_school_id())
    and (
      (select public.jwt_role()) = 'admin'
      or ((select public.jwt_role()) = 'teacher' and public.teaches_subject(subject_id))
    )
  );

create policy exam_results_delete_by_admin_or_teacher
  on public.exam_results
  for delete
  to authenticated
  using (
    school_id = (select public.jwt_school_id())
    and (
      (select public.jwt_role()) = 'admin'
      or ((select public.jwt_role()) = 'teacher' and public.teaches_subject(subject_id))
    )
  );


-- ---------------------------------------------------------------------------
-- public.attendance
-- ---------------------------------------------------------------------------

create policy attendance_select_self
  on public.attendance
  for select
  to authenticated
  using (student_id = (select auth.uid()));

create policy attendance_select_by_admin
  on public.attendance
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy attendance_select_by_teacher
  on public.attendance
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'teacher'
    and school_id = (select public.jwt_school_id())
    and public.teaches_subject(subject_id)
  );

create policy attendance_insert_by_admin_or_teacher
  on public.attendance
  for insert
  to authenticated
  with check (
    school_id = (select public.jwt_school_id())
    and (
      (select public.jwt_role()) = 'admin'
      or ((select public.jwt_role()) = 'teacher' and public.teaches_subject(subject_id))
    )
  );

create policy attendance_update_by_admin_or_teacher
  on public.attendance
  for update
  to authenticated
  using (
    school_id = (select public.jwt_school_id())
    and (
      (select public.jwt_role()) = 'admin'
      or ((select public.jwt_role()) = 'teacher' and public.teaches_subject(subject_id))
    )
  )
  with check (
    school_id = (select public.jwt_school_id())
    and (
      (select public.jwt_role()) = 'admin'
      or ((select public.jwt_role()) = 'teacher' and public.teaches_subject(subject_id))
    )
  );

create policy attendance_delete_by_admin_or_teacher
  on public.attendance
  for delete
  to authenticated
  using (
    school_id = (select public.jwt_school_id())
    and (
      (select public.jwt_role()) = 'admin'
      or ((select public.jwt_role()) = 'teacher' and public.teaches_subject(subject_id))
    )
  );


-- ---------------------------------------------------------------------------
-- public.teacher_attendance
-- ---------------------------------------------------------------------------
-- Recorded by the school admin; a teacher may read their own history.

create policy teacher_attendance_select_self
  on public.teacher_attendance
  for select
  to authenticated
  using (teacher_id = (select auth.uid()));

create policy teacher_attendance_select_by_admin
  on public.teacher_attendance
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy teacher_attendance_insert_by_admin
  on public.teacher_attendance
  for insert
  to authenticated
  with check (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy teacher_attendance_update_by_admin
  on public.teacher_attendance
  for update
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  )
  with check (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy teacher_attendance_delete_by_admin
  on public.teacher_attendance
  for delete
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );


-- ---------------------------------------------------------------------------
-- public.notices
-- ---------------------------------------------------------------------------
-- Everyone in the school reads notices; only the admin publishes them.

create policy notices_select_school
  on public.notices
  for select
  to authenticated
  using (school_id = (select public.jwt_school_id()));

create policy notices_insert_by_admin
  on public.notices
  for insert
  to authenticated
  with check (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy notices_update_by_admin
  on public.notices
  for update
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  )
  with check (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy notices_delete_by_admin
  on public.notices
  for delete
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );


-- ---------------------------------------------------------------------------
-- public.complaints
-- ---------------------------------------------------------------------------
-- Students author and can read their own complaints; the admin reviews all.

create policy complaints_select_self
  on public.complaints
  for select
  to authenticated
  using (student_id = (select auth.uid()));

create policy complaints_select_by_admin
  on public.complaints
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

-- The WITH CHECK pins student_id to the caller, so a student cannot file a
-- complaint in someone else's name.
create policy complaints_insert_self
  on public.complaints
  for insert
  to authenticated
  with check (
    student_id = (select auth.uid())
    and school_id = (select public.jwt_school_id())
  );

create policy complaints_delete_by_admin
  on public.complaints
  for delete
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );
