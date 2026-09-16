-- ============================================================================
-- Phase 3 - people and teaching operations
-- ============================================================================
-- The roadmap (ANALYTICS-ROADMAP.md) asks how staffed each class is and how
-- reliable teaching attendance is. Both figures are computed from existing
-- tables; there is no schema change here, only two security_invoker views.
--
--   * v_pupil_teacher_ratio   - active pupils per class divided by the distinct
--     teachers assigned to that class (via subjects.teacher_id). A class with
--     no teacher yet has a null ratio, not a fabricated one.
--   * v_teacher_attendance_rate - each teacher's present/absent totals from
--     teacher_attendance, restricted to the current term window so a holiday
--     gap never drags the rate down. Every teacher in the school appears,
--     including those with no recorded days (null rate, "no records yet").
--
-- Both are school-management metrics on an admin screen, so they carry the same
-- in-view `jwt_role() = 'admin'` gate as v_teacher_subject_load and
-- v_enrolment_by_campus: an admin sees the school's rows, a teacher or pupil
-- sees none. RLS (security_invoker) scopes the underlying rows first.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- public.v_pupil_teacher_ratio
-- ---------------------------------------------------------------------------
-- Active pupils per class over the distinct teachers teaching that class.
-- `enrolment_status = 'active'` keeps withdrawn/transferred pupils out of the
-- count, and the ratio is null when a class has no teacher so the head can see
-- the gap rather than a misleading 0. One row per class; the campus column lets
-- the screen group the bars by campus.
create view public.v_pupil_teacher_ratio
with (security_invoker = true)
as
with pupils as (
  select
    s.class_id,
    count(*) as pupil_count
  from public.students s
  where s.enrolment_status = 'active'
  group by s.class_id
),
staff as (
  select
    sub.class_id,
    count(distinct sub.teacher_id) as teacher_count
  from public.subjects sub
  where sub.teacher_id is not null
  group by sub.class_id
)
select
  c.school_id,
  c.id          as class_id,
  c.name        as class_name,
  c.campus,
  coalesce(p.pupil_count, 0)    as pupil_count,
  coalesce(t.teacher_count, 0)  as teacher_count,
  round(
    coalesce(p.pupil_count, 0)::numeric
    / nullif(coalesce(t.teacher_count, 0), 0),
    2
  )                             as ratio
from public.classes c
left join pupils p on p.class_id = c.id
left join staff t  on t.class_id = c.id
where public.jwt_role() = 'admin'
order by c.campus, c.name;

comment on view public.v_pupil_teacher_ratio is
  'Active pupils per distinct teachers per class. Admin-only; null ratio means no teacher assigned.';


-- ---------------------------------------------------------------------------
-- public.v_teacher_attendance_rate
-- ---------------------------------------------------------------------------
-- Per-teacher present/absent totals from teacher_attendance, bounded by the
-- current term window (resolved exactly as fn_at_risk_pupils resolves it, so
-- the term this view means and the term the at-risk list means can never
-- disagree). A teacher with no recorded days has a null rate, shown as "no
-- records yet" rather than a fabricated 0%.
create view public.v_teacher_attendance_rate
with (security_invoker = true)
as
with trm as (
  select start_date, end_date
  from public.terms
  where school_id = public.jwt_school_id()
  order by
    (current_date between start_date and end_date) desc,
    start_date desc
  limit 1
),
agg as (
  select
    ta.teacher_id,
    sum(ta.present_count) as present_total,
    sum(ta.absent_count)  as absent_total,
    count(*)              as recorded_days
  from public.teacher_attendance ta
  where ta.date between
    coalesce((select start_date from trm), '1900-01-01')
    and coalesce((select end_date from trm), '2999-12-31')
  group by ta.teacher_id
)
select
  p.school_id,
  p.id                     as teacher_id,
  p.full_name              as teacher_name,
  coalesce(a.recorded_days, 0) as recorded_days,
  coalesce(a.present_total, 0) as present_total,
  coalesce(a.absent_total, 0)  as absent_total,
  round(
    100.0 * coalesce(a.present_total, 0)::numeric
    / nullif(coalesce(a.present_total, 0) + coalesce(a.absent_total, 0), 0),
    1
  )                        as rate_percent
from public.profiles p
left join agg a on a.teacher_id = p.id
where p.role = 'teacher'
  and p.school_id = public.jwt_school_id()
  and public.jwt_role() = 'admin'
order by p.full_name;

comment on view public.v_teacher_attendance_rate is
  'Teacher present/absent over the current term window. Admin-only; null rate means no records yet.';


-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
-- GRANT decides whether a role may touch an object at all; the in-view
-- jwt_role() gate then filters the rows. New objects need explicit grants
-- because the blanket grant from the RLS migration ran before these existed.

grant select on
  public.v_pupil_teacher_ratio,
  public.v_teacher_attendance_rate
to authenticated;
