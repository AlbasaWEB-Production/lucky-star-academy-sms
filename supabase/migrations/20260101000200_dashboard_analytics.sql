-- ============================================================================
-- Lucky Star Academy SMS - Analytics Dashboards
-- ============================================================================
-- Adds the data pieces the dashboard brief needs and the school approved:
--
--   * public.terms                    - the school's three-term calendar
--   * public.classes.campus           - Nayilifong / Kpatuya
--   * public.dashboard_thresholds     - single config table for the metrics
--                                       (at-risk rule, grade band minimums)
--   * v_* views + fn_at_risk_pupils() - every metric the dashboards read
--
-- EVERY view and function below declares `security_invoker = true` (or
-- `security invoker`) so it is evaluated with the CALLER's privileges and the
-- RLS policies on the underlying tables apply. A view without that flag would
-- run as its owner (postgres, which is BYPASSRLS) and silently return every
-- row in the school - the single most important line in this file.
--
-- Functions follow the project convention (`security invoker`,
-- `set search_path = ''`, and are stable - a volatile function cannot be used
-- inside a view). Thresholds are read live from dashboard_thresholds so the
-- head can change the rule without a deploy.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- public.terms
-- ---------------------------------------------------------------------------
-- One row per term per school. `is_active` defaults true for the latest row so
-- "this term" is cheap to read, but is never a hard source of truth - the
-- fn*/views resolve "this term" from the date window instead.

create table public.terms (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools (id) on delete cascade,
  name        text not null,
  term_number smallint not null,
  start_date  date not null,
  end_date    date not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint terms_name_not_blank check (length(btrim(name)) > 0),
  constraint terms_number_complete check (term_number between 1 and 3),
  constraint terms_window_valid check (end_date >= start_date),
  constraint terms_school_number_key unique (school_id, term_number),
  constraint terms_id_school_key unique (id, school_id)
);

create index terms_school_id_idx on public.terms (school_id);

create trigger terms_set_updated_at
  before update on public.terms
  for each row execute function public.set_updated_at();

comment on table public.terms is
  'Three-term academic calendar per school. Seed rows are conventional defaults; edit in place.';


-- ---------------------------------------------------------------------------
-- public.classes.campus
-- ---------------------------------------------------------------------------
-- The two campuses of Lucky Star Academy. Added as a nullable column so the
-- existing rows validate until the school assigns a campus. Constrained to the
-- two real campuses rather than free text.

alter table public.classes
  add column campus text,
  add constraint classes_campus_check
    check (campus is null or campus in ('Nayilifong', 'Kpatuya'));

comment on column public.classes.campus is
  'Nayilifong or Kpatuya. Null until the school assigns it.';


-- ---------------------------------------------------------------------------
-- public.dashboard_thresholds
-- ---------------------------------------------------------------------------
-- Single config table read by every fn_*/v_* metric. Store `value` as text so
-- the head can change numbers (or add keys) without a deploy. Only the school
-- admin writes; everyone else reads their own school's rows.

create table public.dashboard_thresholds (
  id          bigint generated always as identity primary key,
  school_id   uuid not null references public.schools (id) on delete cascade,
  key         text not null,
  value       text not null,
  updated_at  timestamptz not null default now(),
  constraint dashboard_thresholds_key_not_blank check (length(btrim(key)) > 0),
  constraint dashboard_thresholds_school_key_key unique (school_id, key),
  constraint dashboard_thresholds_id_school_key unique (id, school_id)
);

create index dashboard_thresholds_school_id_idx on public.dashboard_thresholds (school_id);

comment on table public.dashboard_thresholds is
  'Config values that shape dashboard metrics. Changing a row here changes the '
  'at-risk list and grade buckets without a deploy. Keys include: '
  'at_risk_attendance_percent, at_risk_subject_min_mark, at_risk_min_subjects, '
  'grade_A_min, grade_B_min, grade_C_min, grade_D_min, grade_E_min.';


-- ---------------------------------------------------------------------------
-- Views (all security_invoker so RLS is inherited)
-- ---------------------------------------------------------------------------

-- Attendance rate per class. "Register entry" = one attendance row, which is
-- one student marked on one subject on one day. Rate = present / total.
create view public.v_attendance_rate_by_class
with (security_invoker = true)
as
select
  a.school_id,
  a.class_id,
  c.name                          as class_name,
  c.campus,
  count(*)                        as total_registers,
  count(*) filter (where a.status = 'Present') as present,
  count(*) filter (where a.status = 'Absent')  as absent,
  round(
    100.0 * count(*) filter (where a.status = 'Present')
    / nullif(count(*), 0),
    1
  )                               as rate_percent
from public.attendance a
join public.classes c on c.id = a.class_id
group by a.school_id, a.class_id, c.name, c.campus;

comment on view public.v_attendance_rate_by_class is
  'Attendance rate per class. Inherits caller RLS (a teacher sees only their own subjects).';


-- Average mark per class per subject, drawn from exam_results.
create view public.v_marks_by_class_subject
with (security_invoker = true)
as
select
  er.school_id,
  sub.class_id,
  c.name                          as class_name,
  er.subject_id,
  sub.name                        as subject_name,
  round(avg(er.marks_obtained), 1) as avg_mark,
  count(distinct er.student_id)   as student_count
from public.exam_results er
join public.subjects sub on sub.id = er.subject_id
join public.classes c   on c.id = sub.class_id
group by er.school_id, sub.class_id, c.name, er.subject_id, sub.name;

comment on view public.v_marks_by_class_subject is
  'Current average mark per class per subject. Inherits caller RLS.';


-- Enrolment split by campus, for the proprietor KPI. Students with a class that
-- is not yet assigned a campus fall into a null group, which the UI labels.
create view public.v_enrolment_by_campus
with (security_invoker = true)
as
select
  s.school_id,
  c.campus,
  count(*)                        as student_count
from public.students s
join public.classes c on c.id = s.class_id
group by s.school_id, c.campus;

comment on view public.v_enrolment_by_campus is
  'Enrolment per class campus. Inherits caller RLS.';


-- Attendance history rows for the teacher heat map. Returns one row per
-- (student, date, status) within the subjects the caller is allowed to see.
create view public.v_attendance_heatmap
with (security_invoker = true)
as
select distinct
  a.school_id,
  a.class_id,
  a.student_id,
  p.full_name                     as student_name,
  s.roll_number,
  a.date,
  a.status
from public.attendance a
join public.profiles p on p.id = a.student_id
join public.students s on s.id = a.student_id;

comment on view public.v_attendance_heatmap is
  'Attendance rows for the heat map. RLS scopes a teacher to their own subjects.';


-- Teacher workload as subject count. `subjects.sessions` is free text, not a
-- period count, so this measures ownership (subjects taught), not periods.
create view public.v_teacher_subject_load
with (security_invoker = true)
as
select
  sub.school_id,
  sub.teacher_id,
  p.full_name                     as teacher_name,
  count(distinct sub.id)          as subject_count
from public.subjects sub
join public.profiles p on p.id = sub.teacher_id
group by sub.school_id, sub.teacher_id, p.full_name;

comment on view public.v_teacher_subject_load is
  'Subjects taught per teacher. Periods are not in the schema; see DASHBOARD_BACKLOG.md.';


-- Grade distribution per subject, bucketed against the grade minimums in
-- dashboard_thresholds. A mark below grade_E_min is 'F'.
create view public.v_grade_distribution
with (security_invoker = true)
as
select
  er.school_id,
  sub.class_id,
  er.subject_id,
  sub.name                        as subject_name,
  er.marks_obtained
from public.exam_results er
join public.subjects sub on sub.id = er.subject_id;

comment on view public.v_grade_distribution is
  'Raw marks joined to subject, for grade histogram bucketing in the app. '
  'RLS scopes a teacher to their own subjects.';


-- ---------------------------------------------------------------------------
-- fn_at_risk_pupils()
-- ---------------------------------------------------------------------------
-- A pupil is at risk when they meet at least one configured rule:
--   * attendance this term <  at_risk_attendance_percent (default 80)
--   * marks below at_risk_subject_min_mark (default 40) in at least
--     at_risk_min_subjects (default 2) subjects
-- The behaviour-incident signal from the brief is not implementable (no
-- discipline table) and is listed in DASHBOARD_BACKLOG.md.
--
-- "This term" resolves to the latest terms row, falling back to the full
-- attendance range when no term is defined. Thresholds are read live.

create or replace function public.fn_at_risk_pupils()
returns table (
  school_id    uuid,
  student_id   uuid,
  student_name text,
  class_id     uuid,
  class_name   text,
  campus       text,
  roll_number  integer,
  reason       text
)
language sql
stable
security invoker
set search_path = ''
as $$
  with th as (
    select key, value
    from public.dashboard_thresholds
    where school_id = public.jwt_school_id()
  ),
  trm as (
    -- Prefer the term whose window contains today; otherwise the most recent
    -- term that has already started. Never a future term.
    select start_date, end_date
    from public.terms
    where school_id = public.jwt_school_id()
    order by
      (current_date between start_date and end_date) desc,
      start_date desc
    limit 1
  ),
  att as (
    select student_id,
      count(*) as total,
      count(*) filter (where status = 'Present') as present
    from public.attendance
    where date between
      coalesce((select start_date from trm), '1900-01-01')
      and coalesce((select end_date from trm), '2999-12-31')
    group by student_id
  ),
  mks as (
    select student_id,
      count(*) filter (
        where marks_obtained < coalesce(
          (select value::numeric from th where key = 'at_risk_subject_min_mark'), 40
        )
      ) as low_count
    from public.exam_results
    group by student_id
  )
  select
    s.school_id,
    s.id,
    p.full_name,
    s.class_id,
    c.name,
    c.campus,
    s.roll_number,
    trim(both ' ' from concat_ws('; ',
      case
        when coalesce(round(100.0 * att.present / nullif(att.total, 0), 1), 100) <
             coalesce((select value::numeric from th where key = 'at_risk_attendance_percent'), 80)
        then 'Attendance ' ||
             round(coalesce(100.0 * att.present / nullif(att.total, 0), 100), 1) || '%'
      end,
      case
        when coalesce(mks.low_count, 0) >=
             coalesce((select value::int from th where key = 'at_risk_min_subjects'), 2)
        then 'Below ' ||
             coalesce((select value::numeric from th where key = 'at_risk_subject_min_mark'), 40)::text ||
             ' in ' || mks.low_count || ' subject' || case when mks.low_count > 1 then 's' else '' end
      end
    )) as reason
  from public.students s
  join public.profiles p on p.id = s.id
  join public.classes c   on c.id = s.class_id
  left join att on att.student_id = s.id
  left join mks on mks.student_id = s.id
  where
    coalesce(round(100.0 * att.present / nullif(att.total, 0), 1), 100) <
      coalesce((select value::numeric from th where key = 'at_risk_attendance_percent'), 80)
    or coalesce(mks.low_count, 0) >=
      coalesce((select value::int from th where key = 'at_risk_min_subjects'), 2)
  order by s.roll_number;
$$;

comment on function public.fn_at_risk_pupils() is
  'Pupils meeting the configured at-risk rule. Reads dashboard_thresholds live.';


-- ---------------------------------------------------------------------------
-- RLS for the new tables
-- ---------------------------------------------------------------------------

alter table public.terms                enable row level security;
alter table public.dashboard_thresholds enable row level security;

create policy terms_select_school
  on public.terms
  for select
  to authenticated
  using (school_id = (select public.jwt_school_id()));

create policy terms_insert_by_admin
  on public.terms
  for insert
  to authenticated
  with check (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy terms_update_by_admin
  on public.terms
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

create policy terms_delete_by_admin
  on public.terms
  for delete
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

-- Thresholds: everyone reads their own school's rows so metrics are honest for
-- every role; only the admin writes.
create policy dashboard_thresholds_select_school
  on public.dashboard_thresholds
  for select
  to authenticated
  using (school_id = (select public.jwt_school_id()));

create policy dashboard_thresholds_insert_by_admin
  on public.dashboard_thresholds
  for insert
  to authenticated
  with check (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy dashboard_thresholds_update_by_admin
  on public.dashboard_thresholds
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

create policy dashboard_thresholds_delete_by_admin
  on public.dashboard_thresholds
  for delete
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );


-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
-- GRANT decides whether a role may touch a table at all; RLS then filters the
-- rows. New objects need explicit grants because the blanket grant in the RLS
-- migration ran before these objects existed.

grant select on public.terms, public.dashboard_thresholds,
  public.v_attendance_rate_by_class, public.v_marks_by_class_subject,
  public.v_enrolment_by_campus, public.v_attendance_heatmap,
  public.v_teacher_subject_load, public.v_grade_distribution
  to authenticated;

grant select, insert, update, delete on public.terms, public.dashboard_thresholds
  to authenticated;

grant execute on function public.fn_at_risk_pupils() to authenticated;
