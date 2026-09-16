-- ============================================================================
-- Lucky Star Academy SMS - Role scope for the dashboard views
-- ============================================================================
-- `security_invoker = true` makes a view inherit the RLS of the tables it
-- reads. That is necessary but NOT sufficient for a metric: an aggregate view
-- reading only rows the caller may see still hands a pupil a class-level figure
-- computed from the pupil's own single row.
--
-- Measured, before this migration (see RLS_VERIFICATION.md for the full table):
--
--   v_attendance_rate_by_class -> a pupil got 1 row reading
--      "Primary 1, 20 registers, 90%" - i.e. that pupil's own attendance,
--      labelled as their whole class's. Wrong, not merely over-shared.
--   v_marks_by_class_subject   -> a pupil got their own 3 marks labelled as
--      each subject's class average.
--   v_teacher_subject_load     -> every role in the school got all 6 teachers.
--   v_enrolment_by_campus      -> a pupil got 1 row ("campus, 1 pupil"): their
--      own record, labelled as the campus's enrolment.
--
-- PostgreSQL does not allow CREATE POLICY on a view, so the scope has to live
-- inside the view. Each view below is therefore restricted to the roles whose
-- dashboard actually consumes it, on top of the inherited table RLS:
--
--   admin only          v_teacher_subject_load, v_enrolment_by_campus
--   admin + teacher     v_attendance_rate_by_class, v_marks_by_class_subject,
--                       v_grade_distribution, v_attendance_heatmap,
--                       fn_at_risk_pupils()
--
-- A role outside the list gets zero rows, not a smaller number. "No data" is a
-- state the dashboards already render honestly; a plausible wrong number is not.
--
-- This is least privilege and correctness, not a closed data leak. The base
-- policies already cap what each role can read (a pupil can read their own
-- `attendance`/`exam_results` rows, and `subjects_select_school` makes the
-- subject list school-visible by design), so no row here was ever another
-- person's. The point is that a management figure is only produced for the
-- roles that manage.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- admin only
-- ---------------------------------------------------------------------------

create or replace view public.v_teacher_subject_load
with (security_invoker = true)
as
select
  sub.school_id,
  sub.teacher_id,
  p.full_name                     as teacher_name,
  count(distinct sub.id)          as subject_count
from public.subjects sub
join public.profiles p on p.id = sub.teacher_id
where (select public.jwt_role()) = 'admin'
group by sub.school_id, sub.teacher_id, p.full_name;

comment on view public.v_teacher_subject_load is
  'Subjects taught per teacher. Admin only. Periods are not in the schema; see DASHBOARD_BACKLOG.md.';


create or replace view public.v_enrolment_by_campus
with (security_invoker = true)
as
select
  s.school_id,
  c.campus,
  count(*)                        as student_count
from public.students s
join public.classes c on c.id = s.class_id
where (select public.jwt_role()) = 'admin'
group by s.school_id, c.campus;

comment on view public.v_enrolment_by_campus is
  'Enrolment per class campus, for the proprietor view. Admin only.';


-- ---------------------------------------------------------------------------
-- admin + teacher
-- ---------------------------------------------------------------------------

create or replace view public.v_attendance_rate_by_class
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
where (select public.jwt_role()) in ('admin', 'teacher')
group by a.school_id, a.class_id, c.name, c.campus;

comment on view public.v_attendance_rate_by_class is
  'Attendance rate per class. Admin + teacher; inherited RLS narrows a teacher to their own subjects.';


create or replace view public.v_marks_by_class_subject
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
where (select public.jwt_role()) in ('admin', 'teacher')
group by er.school_id, sub.class_id, c.name, er.subject_id, sub.name;

comment on view public.v_marks_by_class_subject is
  'Current average mark per class per subject. Admin + teacher.';


create or replace view public.v_attendance_heatmap
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
join public.students s on s.id = a.student_id
where (select public.jwt_role()) in ('admin', 'teacher');

comment on view public.v_attendance_heatmap is
  'Attendance rows for the heat map. Admin + teacher; RLS narrows a teacher to their own subjects.';


create or replace view public.v_grade_distribution
with (security_invoker = true)
as
select
  er.school_id,
  sub.class_id,
  er.subject_id,
  sub.name                        as subject_name,
  er.marks_obtained
from public.exam_results er
join public.subjects sub on sub.id = er.subject_id
where (select public.jwt_role()) in ('admin', 'teacher');

comment on view public.v_grade_distribution is
  'Raw marks joined to subject, for grade histogram bucketing in the app. Admin + teacher.';


-- ---------------------------------------------------------------------------
-- fn_at_risk_pupils() - admin + teacher
-- ---------------------------------------------------------------------------
-- The role condition is ANDed against the whole existing rule, so the `or`
-- between the two at-risk signals cannot leak past it. The threshold and term
-- CTEs are unchanged.

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
    (select public.jwt_role()) in ('admin', 'teacher')
    and (
      coalesce(round(100.0 * att.present / nullif(att.total, 0), 1), 100) <
        coalesce((select value::numeric from th where key = 'at_risk_attendance_percent'), 80)
      or coalesce(mks.low_count, 0) >=
        coalesce((select value::int from th where key = 'at_risk_min_subjects'), 2)
    )
  order by s.roll_number;
$$;

comment on function public.fn_at_risk_pupils() is
  'Pupils meeting the configured at-risk rule, for admin and teacher. Reads dashboard_thresholds live.';


-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
-- Unchanged in substance, restated here so this file is self-contained: the
-- role scoping above is what narrows the rows, not the grant. `anon` never
-- receives these - every dashboard is behind a session.

grant select on
  public.v_attendance_rate_by_class,
  public.v_marks_by_class_subject,
  public.v_enrolment_by_campus,
  public.v_attendance_heatmap,
  public.v_teacher_subject_load,
  public.v_grade_distribution
to authenticated;

grant execute on function public.fn_at_risk_pupils() to authenticated;
