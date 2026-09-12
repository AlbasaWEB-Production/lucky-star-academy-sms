-- ============================================================================
-- Lucky Star Academy SMS - Initial Schema
-- ============================================================================
-- Replaces the Mongoose models found in the legacy `backend/models/` folder:
--
--   adminSchema    -> public.schools        + public.profiles (role = 'admin')
--   teacherSchema  -> public.profiles       + public.subjects.teacher_id
--   studentSchema  -> public.profiles       + public.students
--   sclassSchema   -> public.classes
--   subjectSchema  -> public.subjects
--   noticeSchema   -> public.notices
--   complainSchema -> public.complaints
--
-- Deliberate normalisation decisions vs the MongoDB original:
--
--  1. Embedded arrays became real tables. `student.attendance[]`,
--     `student.examResult[]` and `teacher.attendance[]` are now
--     public.attendance, public.exam_results and public.teacher_attendance.
--     This makes them indexable, joinable, and enforceable at the DB level.
--  2. Credentials moved to Supabase Auth (auth.users). No password column
--     exists anywhere in this schema - passwords are never stored by us.
--  3. `school` (an admin ObjectId) is now a first-class public.schools row.
--     Every tenant-owned table carries school_id so RLS can isolate tenants.
--  4. The original circular subject<->teacher reference is now a single
--     source of truth: public.subjects.teacher_id. A teacher's class and
--     subject are derived by querying subjects, instead of being duplicated
--     onto the teacher document.
--  5. Tenant integrity is enforced declaratively with composite foreign keys
--     rather than triggers. A student cannot reference a class in another
--     school because the FK targets (id, school_id), not just (id).
-- ============================================================================


-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('admin', 'teacher', 'student');

-- Values deliberately kept identical to the MongoDB enum so that any data
-- migration or CSV import does not need to translate them.
create type public.attendance_status as enum ('Present', 'Absent');


-- ---------------------------------------------------------------------------
-- Shared trigger: maintain updated_at
-- ---------------------------------------------------------------------------
-- Every function in this project declares `security invoker` explicitly and
-- pins `set search_path = ''`.
--
-- Why: a function with a mutable search_path resolves unqualified names
-- against the *caller's* search_path. A caller who can create objects could
-- therefore shadow something the function relies on. Pinning the path to empty
-- forces every reference in the body to be schema-qualified, which also clears
-- the `function_search_path_mutable` warning that `supabase db advisors`
-- raises for every function in the public schema.
--
-- `security invoker` is the default, but stating it makes the intent explicit:
-- nothing here should ever be switched to SECURITY DEFINER, because that would
-- bypass Row Level Security.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------------
-- JWT claim helpers (used by RLS policies)
-- ---------------------------------------------------------------------------
-- Authorization data lives in app_metadata, never user_metadata:
-- app_metadata is server-controlled and cannot be edited by the signed-in
-- user, whereas user_metadata is user-writable and therefore unsafe for
-- authorization decisions.
--
-- These functions are SECURITY INVOKER and read only the caller's own signed
-- JWT, so they can never be used to escalate privileges.

create or replace function public.jwt_role()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$;

create or replace function public.jwt_school_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'school_id', '')::uuid;
$$;

comment on function public.jwt_role() is
  'Role from app_metadata of the caller''s JWT. Authoritative for RLS.';
comment on function public.jwt_school_id() is
  'Tenant (school) id from app_metadata of the caller''s JWT. Authoritative for RLS.';


-- ---------------------------------------------------------------------------
-- public.schools
-- ---------------------------------------------------------------------------
-- Replaces the tenant aspect of the MongoDB `admin` collection.

create table public.schools (
  id          uuid primary key default gen_random_uuid(),
  -- Human readable name, e.g. "Lucky Star Academy". Was admin.schoolName.
  name        text not null,
  -- URL/email safe identifier, e.g. "lucky-star-academy". Used to build the
  -- synthetic login emails for students.
  slug        text not null unique,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint schools_name_not_blank check (length(btrim(name)) > 0),
  constraint schools_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create trigger schools_set_updated_at
  before update on public.schools
  for each row execute function public.set_updated_at();

-- FK column (auth.users.created_by): indexed so deleting a user does not scan
-- every school row.
create index schools_created_by_idx on public.schools (created_by);


-- ---------------------------------------------------------------------------
-- public.profiles
-- ---------------------------------------------------------------------------
-- One row per authenticated user, 1:1 with auth.users.
--
-- INVARIANT: `role` and `school_id` here mirror the values in the user's
-- app_metadata, which is the authoritative source for RLS. Both are written
-- together by the server-side admin helper in
-- `src/lib/supabase/admin.ts`; they are never written from the browser.

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  -- Nullable only during admin bootstrap: the school row is created first on
  -- sign-up, then this is set. Every non-admin role has it from creation.
  school_id   uuid references public.schools (id) on delete cascade,
  role        public.user_role not null,
  full_name   text not null,
  email       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint profiles_full_name_not_blank check (length(btrim(full_name)) > 0),
  -- Needed as a composite FK target so child rows can prove same-school
  -- membership (see the composite FKs below).
  constraint profiles_id_school_key unique (id, school_id)
);

create index profiles_school_id_idx on public.profiles (school_id);
create index profiles_school_role_idx on public.profiles (school_id, role);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- public.classes  (was `sclass`)
-- ---------------------------------------------------------------------------

create table public.classes (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools (id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint classes_name_not_blank check (length(btrim(name)) > 0),
  constraint classes_school_name_key unique (school_id, name),
  constraint classes_id_school_key unique (id, school_id)
);

create index classes_school_id_idx on public.classes (school_id);

create trigger classes_set_updated_at
  before update on public.classes
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- public.subjects
-- ---------------------------------------------------------------------------
-- `teacher_id` is the single source of truth for "who teaches this subject".
-- The legacy model stored the link on both subject.teacher and
-- teacher.teachSubject, which allowed the two to disagree.

create table public.subjects (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools (id) on delete cascade,
  class_id    uuid not null,
  teacher_id  uuid,
  name        text not null,
  code        text not null,
  sessions    text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint subjects_name_not_blank check (length(btrim(name)) > 0),
  constraint subjects_code_not_blank check (length(btrim(code)) > 0),
  constraint subjects_school_class_code_key unique (school_id, class_id, code),
  constraint subjects_id_school_key unique (id, school_id),
  -- Class must belong to the same school.
  constraint subjects_class_fkey foreign key (class_id, school_id)
    references public.classes (id, school_id) on delete cascade,
  -- NOTE: this FK is deliberately single-column rather than the composite
  -- (teacher_id, school_id) used elsewhere. A composite FK with ON DELETE SET
  -- NULL sets *every* referencing column to null, and school_id is NOT NULL,
  -- so deleting a teacher would fail with a not-null violation. Same-school
  -- membership for the teacher is therefore asserted by the trigger below,
  -- which can also check the role - something no foreign key can express.
  constraint subjects_teacher_fkey foreign key (teacher_id)
    references public.profiles (id) on delete set null
);

create index subjects_school_id_idx on public.subjects (school_id);
create index subjects_class_id_idx on public.subjects (class_id);
create index subjects_teacher_id_idx on public.subjects (teacher_id);

create trigger subjects_set_updated_at
  before update on public.subjects
  for each row execute function public.set_updated_at();

-- A foreign key can prove a profile exists, but not that it is a teacher, nor
-- that it belongs to the same school (see the note on subjects_teacher_fkey).
-- Both need a lookup, so both are checked here.
create or replace function public.assert_subject_teacher_is_teacher()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_role   public.user_role;
  v_school uuid;
begin
  if new.teacher_id is null then
    return new;
  end if;

  select role, school_id
    into v_role, v_school
    from public.profiles
   where id = new.teacher_id;

  -- Invisible under RLS, which for a school admin means "not in my school".
  if v_role is null then
    raise exception 'Profile % is not a visible profile in this school', new.teacher_id
      using errcode = 'foreign_key_violation';
  end if;

  if v_role <> 'teacher' then
    raise exception 'Profile % has role %, but subjects.teacher_id requires role teacher',
      new.teacher_id, v_role
      using errcode = 'check_violation';
  end if;

  if v_school is distinct from new.school_id then
    raise exception 'Teacher % belongs to a different school', new.teacher_id
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger subjects_assert_teacher_role
  before insert or update of teacher_id on public.subjects
  for each row execute function public.assert_subject_teacher_is_teacher();


-- ---------------------------------------------------------------------------
-- public.students
-- ---------------------------------------------------------------------------
-- Student-specific attributes only. Name and email live on public.profiles,
-- credentials live in auth.users.

create table public.students (
  id           uuid primary key references public.profiles (id) on delete cascade,
  school_id    uuid not null references public.schools (id) on delete cascade,
  class_id     uuid not null,
  roll_number  integer not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint students_roll_number_positive check (roll_number > 0),
  -- Roll numbers are unique per school, not per class. Student login takes
  -- only a roll number and a name (there is no class selector on the form),
  -- so a per-class scope would make the login ambiguous.
  constraint students_school_roll_key unique (school_id, roll_number),
  constraint students_id_school_key unique (id, school_id),
  constraint students_class_fkey foreign key (class_id, school_id)
    references public.classes (id, school_id) on delete restrict
);

create index students_school_id_idx on public.students (school_id);
create index students_class_id_idx on public.students (class_id);

create trigger students_set_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- public.exam_results   (was student.examResult[])
-- ---------------------------------------------------------------------------

create table public.exam_results (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references public.schools (id) on delete cascade,
  student_id       uuid not null,
  subject_id       uuid not null,
  marks_obtained   numeric(6, 2) not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint exam_results_marks_non_negative check (marks_obtained >= 0),
  constraint exam_results_student_subject_key unique (student_id, subject_id),
  constraint exam_results_student_fkey foreign key (student_id, school_id)
    references public.students (id, school_id) on delete cascade,
  constraint exam_results_subject_fkey foreign key (subject_id, school_id)
    references public.subjects (id, school_id) on delete cascade
);

create index exam_results_school_id_idx on public.exam_results (school_id);
create index exam_results_student_id_idx on public.exam_results (student_id);
create index exam_results_subject_id_idx on public.exam_results (subject_id);

create trigger exam_results_set_updated_at
  before update on public.exam_results
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- public.attendance   (was student.attendance[])
-- ---------------------------------------------------------------------------

create table public.attendance (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references public.schools (id) on delete cascade,
  student_id   uuid not null,
  subject_id   uuid not null,
  class_id     uuid not null,
  date         date not null,
  status       public.attendance_status not null,
  recorded_by  uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  -- One record per student, per subject, per day. The MongoDB version used a
  -- push-only array, which allowed duplicate entries for the same day.
  constraint attendance_student_subject_date_key unique (student_id, subject_id, date),
  constraint attendance_student_fkey foreign key (student_id, school_id)
    references public.students (id, school_id) on delete cascade,
  constraint attendance_subject_fkey foreign key (subject_id, school_id)
    references public.subjects (id, school_id) on delete cascade,
  constraint attendance_class_fkey foreign key (class_id, school_id)
    references public.classes (id, school_id) on delete cascade
);

create index attendance_school_id_idx on public.attendance (school_id);
create index attendance_student_id_idx on public.attendance (student_id);
create index attendance_subject_date_idx on public.attendance (subject_id, date);
create index attendance_date_idx on public.attendance (date);
-- Postgres does not index foreign key columns automatically, and an unindexed
-- FK column turns every ON DELETE CASCADE / SET NULL into a full scan of the
-- child table. class_id and recorded_by are both FK columns here.
create index attendance_class_id_idx on public.attendance (class_id);
create index attendance_recorded_by_idx on public.attendance (recorded_by);


-- ---------------------------------------------------------------------------
-- public.teacher_attendance   (was teacher.attendance[])
-- ---------------------------------------------------------------------------
-- The legacy schema stored presentCount/absentCount as strings; they are
-- integers here.
-- Note: teacher shift attendance was recorded by an admin, hence the
-- admin-only write policy in the RLS migration.

create table public.teacher_attendance (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references public.schools (id) on delete cascade,
  teacher_id     uuid not null,
  date           date not null,
  present_count  integer not null default 0,
  absent_count   integer not null default 0,
  created_at     timestamptz not null default now(),
  constraint teacher_attendance_counts_non_negative
    check (present_count >= 0 and absent_count >= 0),
  constraint teacher_attendance_teacher_date_key unique (teacher_id, date),
  constraint teacher_attendance_teacher_fkey foreign key (teacher_id, school_id)
    references public.profiles (id, school_id) on delete cascade
);

create index teacher_attendance_school_id_idx on public.teacher_attendance (school_id);
create index teacher_attendance_teacher_id_idx on public.teacher_attendance (teacher_id);


-- ---------------------------------------------------------------------------
-- public.notices
-- ---------------------------------------------------------------------------

create table public.notices (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools (id) on delete cascade,
  title       text not null,
  details     text not null,
  date        date not null default current_date,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint notices_title_not_blank check (length(btrim(title)) > 0),
  constraint notices_details_not_blank check (length(btrim(details)) > 0)
);

create index notices_school_id_idx on public.notices (school_id);
create index notices_date_idx on public.notices (date desc);
-- FK column: keeps ON DELETE SET NULL on profiles.created_by cheap.
create index notices_created_by_idx on public.notices (created_by);

create trigger notices_set_updated_at
  before update on public.notices
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- public.complaints
-- ---------------------------------------------------------------------------
-- Complaints are authored by students and reviewed by the school admin,
-- matching the legacy behaviour (complain.user -> student, required).

create table public.complaints (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools (id) on delete cascade,
  student_id  uuid not null,
  date        date not null default current_date,
  complaint   text not null,
  created_at  timestamptz not null default now(),
  constraint complaints_text_not_blank check (length(btrim(complaint)) > 0),
  constraint complaints_student_fkey foreign key (student_id, school_id)
    references public.students (id, school_id) on delete cascade
);

create index complaints_school_id_idx on public.complaints (school_id);
create index complaints_student_id_idx on public.complaints (student_id);


-- ---------------------------------------------------------------------------
-- Convenience view: student rosters with class and school names
-- ---------------------------------------------------------------------------
-- security_invoker = true is required: without it the view would be evaluated
-- with the view owner's privileges and would silently bypass the RLS policies
-- on the underlying tables.

create view public.student_directory
with (security_invoker = true)
as
select
  s.id            as student_id,
  s.school_id,
  s.class_id,
  s.roll_number,
  p.full_name,
  p.email,
  c.name          as class_name,
  sc.name         as school_name,
  sc.slug         as school_slug
from public.students s
join public.profiles p on p.id = s.id
join public.classes c on c.id = s.class_id
join public.schools sc on sc.id = s.school_id;

comment on view public.student_directory is
  'Student roster joined with class and school names. Inherits caller RLS.';
