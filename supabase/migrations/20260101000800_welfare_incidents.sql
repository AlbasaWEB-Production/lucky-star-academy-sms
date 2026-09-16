-- ---------------------------------------------------------------------------
-- Phase 5 — Welfare (migration 20260101000800)
-- ---------------------------------------------------------------------------
-- One row per behavioural incident, never per pupil birth. `incident_type` is a
-- closed set (lateness, truancy, fighting, bullying, property_damage, other)
-- and `note` is short and factual: the form does not prompt for health, family
-- or home circumstances. `class_id` is denormalised so the by-class charts need
-- no join, and `resolved` / `resolved_on` track whether the matter is closed.
--
-- Scoping follows the house rules:
--   * every new table carries `school_id` and enables RLS
--   * every new view is `security_invoker = true`
--   * management numbers are admin-only, enforced in-view via `jwt_role()`
--   * composite FKs must be `on delete restrict` (school_id is NOT NULL)
--
-- The incident register is admin-only for record/resolve; a teacher reads
-- incidents only for the classes they teach; a pupil reads only their own. The
-- aggregate views are admin-only through their in-view `jwt_role()` gate.
--
-- This file is intentionally NOT idempotent (matching the other migrations):
-- run it exactly once.

-- ---------------------------------------------------------------------------
-- public.incidents
-- ---------------------------------------------------------------------------

create table public.incidents (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references public.schools (id) on delete cascade,
  student_id    uuid not null,
  class_id      uuid not null,
  date          date not null default current_date,
  incident_type text not null,
  note          text,
  resolved      boolean not null default false,
  resolved_on   date,
  recorded_by   uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint incidents_type_check
    check (incident_type in ('lateness', 'truancy', 'fighting', 'bullying', 'property_damage', 'other')),
  -- A resolved incident must carry the day it was resolved.
  constraint incidents_resolved_on_check
    check (resolved = false or resolved_on is not null),
  constraint incidents_student_fkey
    foreign key (student_id, school_id)
    references public.students (id, school_id) on delete cascade,
  -- `on delete restrict` (not set null) because a composite FK with ON DELETE
  -- SET NULL would also null school_id, which is NOT NULL.
  constraint incidents_class_fkey
    foreign key (class_id, school_id)
    references public.classes (id, school_id) on delete restrict
);

create index incidents_school_id_idx on public.incidents (school_id);
create index incidents_student_id_idx on public.incidents (student_id);
create index incidents_class_id_idx on public.incidents (class_id);
create index incidents_type_idx on public.incidents (school_id, incident_type);
create index incidents_resolved_idx on public.incidents (resolved);

create trigger incidents_set_updated_at
  before update on public.incidents
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- public.v_incidents_by_type
-- ---------------------------------------------------------------------------
-- Incident count per type, with the resolved/unresolved split, emitted for every
-- type even when it holds zero incidents (values-driven left join) so the chart
-- always keeps its full six-bar shape rather than skipping a silent type.
--
-- Gated to 'admin' in-view, exactly like the other management views.

create or replace view public.v_incidents_by_type
with (security_invoker = true)
as
select
  t.incident_type,
  count(i.id) as incident_count,
  count(i.id) filter (where i.resolved) as resolved_count,
  count(i.id) filter (where not i.resolved) as unresolved_count
from (values
  ('lateness'::text),
  ('truancy'::text),
  ('fighting'::text),
  ('bullying'::text),
  ('property_damage'::text),
  ('other'::text)
) as t(incident_type)
left join public.incidents i
  on i.incident_type = t.incident_type
where (select public.jwt_role()) = 'admin'
group by t.incident_type
order by array_position(
  array['lateness','truancy','fighting','bullying','property_damage','other']::text[],
  t.incident_type
);


-- ---------------------------------------------------------------------------
-- public.v_incidents_per_hundred_by_class
-- ---------------------------------------------------------------------------
-- Incidents per 100 active pupils in each class. A class with no active pupils
-- has a null `per_hundred` — "not set", never a fabricated number — while a
-- class with pupils but no incidents shows 0. Every class appears so the chart
-- keeps its full shape.

create or replace view public.v_incidents_per_hundred_by_class
with (security_invoker = true)
as
select
  c.id as class_id,
  c.name as class_name,
  c.campus,
  count(distinct i.id) as incidents,
  count(distinct s.id) filter (where s.enrolment_status = 'active') as active_pupils,
  case
    when count(distinct s.id) filter (where s.enrolment_status = 'active') > 0
    then round(
      count(distinct i.id)::numeric
        / count(distinct s.id) filter (where s.enrolment_status = 'active') * 100,
      1
    )
    else null
  end as per_hundred
from public.classes c
left join public.incidents i
  on i.class_id = c.id and i.school_id = c.school_id
left join public.students s
  on s.class_id = c.id and s.school_id = c.school_id
where (select public.jwt_role()) = 'admin'
group by c.id, c.name, c.campus
order by c.campus, c.name;


-- ---------------------------------------------------------------------------
-- RLS and grants
-- ---------------------------------------------------------------------------
-- Admin has full CRUD (record, resolve, delete). A teacher reads incidents only
-- in the classes they teach (no insert/update/delete — the register is
-- admin-only). A pupil reads only their own row, so the welfare flag on the
-- progress card never shows another child's incident. The two views are
-- admin-only via their in-view `jwt_role()` gate; they are still granted to
-- `authenticated` so the (admin) session is allowed through.

alter table public.incidents enable row level security;

create policy incidents_select_by_admin on public.incidents
  for select to authenticated
  using ((select public.jwt_role()) = 'admin' and school_id = (select public.jwt_school_id()));

create policy incidents_select_by_teacher on public.incidents
  for select to authenticated
  using (
    (select public.jwt_role()) = 'teacher'
    and school_id = (select public.jwt_school_id())
    and public.teaches_class(class_id)
  );

create policy incidents_select_by_student on public.incidents
  for select to authenticated
  using (student_id = (select auth.uid()));

create policy incidents_insert_by_admin on public.incidents
  for insert to authenticated
  with check ((select public.jwt_role()) = 'admin' and school_id = (select public.jwt_school_id()));

create policy incidents_update_by_admin on public.incidents
  for update to authenticated
  using ((select public.jwt_role()) = 'admin' and school_id = (select public.jwt_school_id()))
  with check ((select public.jwt_role()) = 'admin' and school_id = (select public.jwt_school_id()));

create policy incidents_delete_by_admin on public.incidents
  for delete to authenticated
  using ((select public.jwt_role()) = 'admin' and school_id = (select public.jwt_school_id()));

grant select, insert, update, delete on public.incidents to authenticated;
grant select on public.v_incidents_by_type, public.v_incidents_per_hundred_by_class to authenticated;
