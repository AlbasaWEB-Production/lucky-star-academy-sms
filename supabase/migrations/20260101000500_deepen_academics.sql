-- ============================================================================
-- Phase 2 - deepen academics
-- ============================================================================
-- Marks, enrolment and progress were modelled for a single snapshot. The
-- roadmap (ANALYTICS-ROADMAP.md) asks for history: a mark per subject *per
-- term*, an enrolment date and a current enrolment status per pupil, a
-- configured pass mark, and four trend/rate views that read them.
--
-- Everything here is additive or a constraint change:
--   * exam_results gains term_id, the one-mark-per-subject uniqueness becomes
--     one-mark-per-subject-per-term, and existing rows are backfilled by
--     matching their created_at to a term window.
--   * students gains enrolled_at / enrolment_status / status_date.
--   * dashboard_thresholds gains the documented pass_mark key (a key/value
--     table, so this is a comment + a reader function, not a column).
--   * All new views are security_invoker so RLS keeps scoping every row.
-- No column is dropped or renamed.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- public.exam_results.term_id
-- ---------------------------------------------------------------------------
-- One mark per pupil, per subject, per term. `term_id` is nullable so a mark
-- recorded before any term exists (or outside every term window) is honest:
-- it has no term rather than a fabricated one.

alter table public.exam_results
  add column term_id uuid;

-- Backfill: a legacy mark belongs to the term whose window contains the moment
-- it was recorded (created_at). Rows that fall outside every window stay null
-- and read as "no term". Deterministic: if windows ever overlap, the latest
-- term to start wins.
update public.exam_results er
set term_id = (
  select t.id
  from public.terms t
  where t.school_id = er.school_id
    and er.created_at >= t.start_date::timestamptz
    and er.created_at <  (t.end_date + 1)::timestamptz
  order by t.start_date desc
  limit 1
)
where er.term_id is null;

-- The term must belong to the mark's own school (the composite FK proven by
-- the rest of the schema). If a term is ever removed, its marks are not
-- silently re-homed: restrict beats a wrong school_id.
alter table public.exam_results
  add constraint exam_results_term_fkey
  foreign key (term_id, school_id)
  references public.terms (id, school_id)
  on delete restrict;

-- Replace the one-mark-per-subject lock. NULLS NOT DISTINCT is the trick that
-- keeps the legacy guarantee (one mark per pupil per subject when no term is
-- known, because null term_ids compare equal) while opening up a real history
-- (one mark per pupil per subject *per* term). The whole constraint is one
-- index, so ON CONFLICT (student_id, subject_id, term_id) resolves cleanly.
alter table public.exam_results
  drop constraint exam_results_student_subject_key;

alter table public.exam_results
  add constraint exam_results_student_subject_term_key
  unique nulls not distinct (student_id, subject_id, term_id);

-- Trend joins walk exam_results->terms on term_id; index the new column.
create index exam_results_term_id_idx on public.exam_results (term_id);


-- ---------------------------------------------------------------------------
-- public.students  (enrolment)
-- ---------------------------------------------------------------------------
-- `enrolled_at` is the day the pupil joined a class - a real school fact we
-- must not invent, so it starts null until the school records it. `status`
-- captures the current state, and `status_date` the day that state began.

alter table public.students
  add column enrolled_at date,
  add column enrolment_status text not null default 'active',
  add constraint students_enrolment_status_check
    check (enrolment_status in ('active', 'withdrawn', 'completed', 'transferred')),
  add column status_date date;

-- Existing pupils are by definition still enrolled; created_at is only a
-- fallback for *when* that state began, never a claim about the enrolment date
-- (account creation is not enrolment - enrolled_at stays null).
update public.students
set status_date = created_at::date
where status_date is null;

create index students_enrolment_status_idx on public.students (enrolment_status);
create index students_enrolled_at_idx on public.students (enrolled_at);


-- ---------------------------------------------------------------------------
-- public.dashboard_thresholds  (pass_mark)
-- ---------------------------------------------------------------------------
-- A school's pass mark does not exist as a key yet; grade bands do. The table
-- is key/value, so "adding the key" is a reader function plus a comment. No
-- row is invented here - like the other thresholds (at_risk_*, grade_*), the
-- function falls back to a conventional default until the school sets one.

comment on table public.dashboard_thresholds is
  'Config values that shape dashboard metrics. Changing a row here changes the '
  'at-risk list, grade buckets and pass mark without a deploy. Keys include: '
  'at_risk_attendance_percent, at_risk_subject_min_mark, at_risk_min_subjects, '
  'grade_A_min, grade_B_min, grade_C_min, grade_D_min, grade_E_min, pass_mark.';

create or replace function public.fn_pass_mark()
returns numeric
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (select value::numeric
     from public.dashboard_thresholds
     where school_id = public.jwt_school_id() and key = 'pass_mark'),
    50
  );
$$;

comment on function public.fn_pass_mark() is
  'The school''s configured pass mark (dashboard_thresholds `pass_mark`), '
  'falling back to 50. Security invoker: reads the caller''s own school.';


-- ---------------------------------------------------------------------------
-- Views (all security_invoker so RLS is inherited by every caller)
-- ---------------------------------------------------------------------------

-- Note: `v_marks_by_class_subject` is deliberately left as the *snapshot*
-- rollup. The roadmap floated extending it with term_id, but a per-term group
-- would let a subject appear once per term and silently double-count in the
-- existing `overallAverageMark` + per-subject charts. The term-aware slice a
-- performance screen needs lives in v_class_average_trend /
-- v_pass_promotion_rates below, so the snapshot view keeps its contract.


-- How many pupils joined each class on each campus during each term.
-- Only pupils with a real enrolled_at that lands in a term window are counted;
-- pupils whose enrolment date is unknown are not guessed into a term.
create view public.v_enrolment_trend_by_class_campus
with (security_invoker = true)
as
select
  s.school_id,
  s.class_id,
  c.name                          as class_name,
  c.campus,
  t.id                            as term_id,
  t.name                          as term_name,
  t.term_number,
  count(*)                        as enrolled
from public.students s
join public.classes c on c.id = s.class_id
join public.terms t   on t.school_id = s.school_id
  and s.enrolled_at >= t.start_date
  and s.enrolled_at <= t.end_date
where s.enrolled_at is not null
group by s.school_id, s.class_id, c.name, c.campus, t.id, t.name, t.term_number;

comment on view public.v_enrolment_trend_by_class_campus is
  'Pupils enrolled into each class and campus per term, from students.enrolled_at. ';


-- Retention vs dropout per term, counted in the term where a pupil''s status
-- last changed (status_date). A pupil currently 'active' or 'completed' counts
-- as retained; 'withdrawn' or 'transferred' as left. Pupils with no status_date
-- are omitted rather than guessed into a term.
create view public.v_retention_dropout
with (security_invoker = true)
as
select
  s.school_id,
  t.id                            as term_id,
  t.name                          as term_name,
  t.term_number,
  count(*) filter (where s.enrolment_status in ('active', 'completed')) as retained,
  count(*) filter (where s.enrolment_status in ('withdrawn', 'transferred')) as left_school,
  count(*)                        as changes_total
from public.students s
join public.terms t on t.school_id = s.school_id
  and s.status_date >= t.start_date
  and s.status_date <= t.end_date
where s.status_date is not null
group by s.school_id, t.id, t.name, t.term_number;

comment on view public.v_retention_dropout is
  'Retained vs pupils who left, per term, from students.status_date. Inherits RLS.';


-- Pass rate and promotion rate against the configured pass mark, per class and
-- term. A mark passes when it is >= pass_mark; a pupil is promoted when the
-- average of their assessed marks in that term meets the pass mark. Only pupils
-- with at least one mark in the term are assessed - nobody is assumed to have
-- failed from silence.
create view public.v_pass_promotion_rates
with (security_invoker = true)
as
with term_marks as (
  select
    er.school_id,
    sub.class_id,
    c.name                          as class_name,
    er.term_id,
    t.name                          as term_name,
    er.student_id,
    er.marks_obtained
  from public.exam_results er
  join public.subjects sub on sub.id = er.subject_id
  join public.classes c   on c.id = sub.class_id
  left join public.terms t on t.id = er.term_id and t.school_id = er.school_id
  where er.term_id is not null
),
pupil as (
  select
    school_id,
    class_id,
    class_name,
    term_id,
    term_name,
    student_id,
    avg(marks_obtained) as avg_mark
  from term_marks
  group by school_id, class_id, class_name, term_id, term_name, student_id
)
select
  m.school_id,
  m.class_id,
  m.class_name,
  m.term_id,
  m.term_name,
  count(*) filter (where m.marks_obtained >= public.fn_pass_mark()) as passed_marks,
  count(*)                                                          as total_marks,
  round(
    100.0 * count(*) filter (where m.marks_obtained >= public.fn_pass_mark())
    / nullif(count(*), 0),
    1
  )                                                                 as pass_rate_percent,
  count(*) filter (where p.avg_mark >= public.fn_pass_mark())       as promoted_pupils,
  count(distinct m.student_id)                                      as assessed_pupils,
  round(
    100.0 * count(*) filter (where p.avg_mark >= public.fn_pass_mark())
    / nullif(count(distinct m.student_id), 0),
    1
  )                                                                 as promotion_rate_percent
from term_marks m
join pupil p
  on p.school_id  = m.school_id
 and p.class_id   = m.class_id
 and p.term_id    = m.term_id
 and p.student_id = m.student_id
group by m.school_id, m.class_id, m.class_name, m.term_id, m.term_name;

comment on view public.v_pass_promotion_rates is
  'Pass rate (marks >= pass_mark) and promotion rate (pupil average >= pass_mark) per class and term. Inherits caller RLS.';


-- Average mark per class per term, the line the class-average trend chart
-- draws. One row per class per term; just a mark with no term is excluded.
create view public.v_class_average_trend
with (security_invoker = true)
as
select
  er.school_id,
  sub.class_id,
  c.name                          as class_name,
  er.term_id,
  t.name                          as term_name,
  t.term_number,
  round(avg(er.marks_obtained), 1) as avg_mark,
  count(*)                        as marks_count,
  count(distinct er.student_id)   as pupils_assessed
from public.exam_results er
join public.subjects sub on sub.id = er.subject_id
join public.classes c   on c.id = sub.class_id
left join public.terms t on t.id = er.term_id and t.school_id = er.school_id
where er.term_id is not null
group by er.school_id, sub.class_id, c.name, er.term_id, t.name, t.term_number;

comment on view public.v_class_average_trend is
  'Average mark per class per term. Inherits caller RLS; term-less marks excluded.';


-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
-- GRANT decides whether a role may touch an object at all; RLS then filters
-- the rows. New objects need explicit grants because the blanket grant from the
-- RLS migration ran before these existed.

grant select on
  public.v_enrolment_trend_by_class_campus,
  public.v_retention_dropout,
  public.v_pass_promotion_rates,
  public.v_class_average_trend
to authenticated;

grant execute on function public.fn_pass_mark() to authenticated;
