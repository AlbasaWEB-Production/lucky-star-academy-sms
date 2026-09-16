-- ---------------------------------------------------------------------------
-- Phase 4 — Admissions and capacity (migration 20260101000700)
-- ---------------------------------------------------------------------------
-- Admissions is a lead database, not a per-birth table: one row per prospect
-- whose `stage` advances from enquiry → application → offer → enrolled (or is
-- declined), each advance stamping a date. This is the source for the funnel,
-- the new-enrolments-by-class chart, and — combined with a new nullable
-- `classes.capacity` — the capacity utilisation chart.
--
-- Scoping follows the house rules:
--   * every new table carries `school_id` and enables RLS
--   * every new view is `security_invoker = true`
--   * management numbers are admin-only, enforced in-view via `jwt_role()`
--   * composite FKs must be `on delete restrict` (school_id is NOT NULL)
--
-- This file is intentionally NOT idempotent (matching the other migrations):
-- run it exactly once.

-- ---------------------------------------------------------------------------
-- classes.capacity
-- ---------------------------------------------------------------------------
-- Nullable. `null` is a real state — "not set" — shown honestly as a dash in
-- the chart rather than coerced into a fabricated number. Positive check so a
-- class can never be recorded as having room for zero or negative pupils.

alter table public.classes
  add column capacity integer,
  add constraint classes_capacity_check
    check (capacity is null or capacity > 0);


-- ---------------------------------------------------------------------------
-- public.admissions
-- ---------------------------------------------------------------------------
-- The `class_id` column is NOT in the original roadmap sketch (which listed
-- only intake_term_id) but is required so `v_new_enrolments_by_class_intake`
-- can say which class an enrolled lead joined. It stays null until a lead
-- advances to 'enrolled' — an enquiry is not yet in any class.

create table public.admissions (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references public.schools (id) on delete cascade,
  pupil_name     text not null,
  guardian_name  text,
  guardian_phone text,
  source         text,
  intake_term_id uuid,
  class_id       uuid,
  stage          text not null default 'enquiry',
  stage_date     date not null default current_date,
  received_on    date,
  submitted_on   date,
  offered_on     date,
  enrolled_on    date,
  declined_on    date,
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint admissions_pupil_name_not_blank check (length(btrim(pupil_name)) > 0),
  constraint admissions_stage_check check (stage in ('enquiry', 'application', 'offer', 'enrolled', 'declined')),
  constraint admissions_id_school_key unique (id, school_id),
  -- Intake term and class must belong to the same school. `on delete restrict`
  -- (not set null) because a composite FK with ON DELETE SET NULL would also
  -- null school_id, which is NOT NULL.
  constraint admissions_intake_term_fkey
    foreign key (intake_term_id, school_id)
    references public.terms (id, school_id) on delete restrict,
  constraint admissions_class_fkey
    foreign key (class_id, school_id)
    references public.classes (id, school_id) on delete restrict
);

create index admissions_school_id_idx on public.admissions (school_id);
create index admissions_stage_idx on public.admissions (school_id, stage);
create index admissions_class_id_idx on public.admissions (class_id);
create index admissions_intake_term_idx on public.admissions (intake_term_id);

create trigger admissions_set_updated_at
  before update on public.admissions
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- public.v_admissions_funnel
-- ---------------------------------------------------------------------------
-- Count per current stage, with the percentage of ALL leads sitting in that
-- stage written beside the bar. Every stage row is emitted (values-driven has a
-- stage even when it holds zero leads), so the funnel always draws the full
-- five-bar shape rather than skipping an empty stage. `conversion_percent` is 0
-- until there is at least one lead — no invented numbers.
--
-- Gated to 'admin' in-view, exactly like the other management views.

create or replace view public.v_admissions_funnel
with (security_invoker = true)
as
select
  st.stage,
  count(a.id) as leads,
  coalesce(
    round(count(a.id)::numeric / nullif((select count(*) from public.admissions a2), 0) * 100, 1),
    0
  ) as conversion_percent
from (values
  ('enquiry'::text),
  ('application'::text),
  ('offer'::text),
  ('enrolled'::text),
  ('declined'::text)
) as st(stage)
left join public.admissions a
  on a.stage = st.stage
where (select public.jwt_role()) = 'admin'
group by st.stage
order by array_position(array['enquiry','application','offer','enrolled','declined']::text[], st.stage);


-- ---------------------------------------------------------------------------
-- public.v_new_enrolments_by_class_intake
-- ---------------------------------------------------------------------------
-- Enrolled leads per class and the intake term they targeted. A lead that was
-- enrolled but has no intake term yet still surfaces (term columns null), so a
-- data-entry gap is visible rather than silently dropped.

create or replace view public.v_new_enrolments_by_class_intake
with (security_invoker = true)
as
select
  a.school_id,
  c.id as class_id,
  c.name as class_name,
  c.campus,
  t.id as term_id,
  t.name as term_name,
  t.term_number,
  count(*) as enrolled
from public.admissions a
join public.classes c
  on c.id = a.class_id and c.school_id = a.school_id
left join public.terms t
  on t.id = a.intake_term_id and t.school_id = a.school_id
where (select public.jwt_role()) = 'admin'
  and a.stage = 'enrolled'
  and a.class_id is not null
group by a.school_id, c.id, c.name, c.campus, t.id, t.name, t.term_number
order by t.term_number nulls last, class_name;


-- ---------------------------------------------------------------------------
-- public.v_capacity_utilisation
-- ---------------------------------------------------------------------------
-- Active pupils (enrolment_status = 'active') per class over the class's
-- set capacity. A class with no capacity set has `capacity` null and
-- `utilisation_percent` null — "not set", not a derived number. Classes with
-- no active pupils still appear at 0%.

create or replace view public.v_capacity_utilisation
with (security_invoker = true)
as
select
  c.id as class_id,
  c.name as class_name,
  c.campus,
  c.capacity,
  count(s.id) as pupil_count,
  case
    when c.capacity > 0 then round(count(s.id)::numeric / c.capacity * 100, 1)
    else null
  end as utilisation_percent
from public.classes c
left join public.students s
  on s.class_id = c.id and s.school_id = c.school_id
  and s.enrolment_status = 'active'
where (select public.jwt_role()) = 'admin'
group by c.id, c.name, c.campus, c.capacity
order by c.campus, c.name;


-- ---------------------------------------------------------------------------
-- RLS and grants
-- ---------------------------------------------------------------------------
-- admissions is admin-only (full CRUD). No teacher or student policy: an
-- admissions lead is a school-records concern, never a class the pupils see.
-- The three views are admin-only via their in-view `jwt_role()` gate; they are
-- still granted to `authenticated` so the (admin) session is allowed through,
-- and the in-view gate does the real denial.

alter table public.admissions enable row level security;

create policy admissions_select_by_admin on public.admissions
  for select to authenticated
  using ((select public.jwt_role()) = 'admin' and school_id = (select public.jwt_school_id()));

create policy admissions_insert_by_admin on public.admissions
  for insert to authenticated
  with check ((select public.jwt_role()) = 'admin' and school_id = (select public.jwt_school_id()));

create policy admissions_update_by_admin on public.admissions
  for update to authenticated
  using ((select public.jwt_role()) = 'admin' and school_id = (select public.jwt_school_id()))
  with check ((select public.jwt_role()) = 'admin' and school_id = (select public.jwt_school_id()));

create policy admissions_delete_by_admin on public.admissions
  for delete to authenticated
  using ((select public.jwt_role()) = 'admin' and school_id = (select public.jwt_school_id()));

grant select, insert, update, delete on public.admissions to authenticated;
grant select on public.v_admissions_funnel, public.v_new_enrolments_by_class_intake, public.v_capacity_utilisation to authenticated;
