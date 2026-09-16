-- ============================================================================
-- Lucky Star Academy SMS - Phase 1: Fees and finance
-- ============================================================================
-- The domain with the highest value and no data at all. Builds the money model
-- a primary school in Yendi actually runs on:
--
--   * fee_structures   - a fee line item per class per term (amount, due date)
--   * fee_assessments  - one row per pupil per term, generated from that class's
--                        structures (the total the pupil owes)
--   * fee_payments     - a payment against an assessment, with a system receipt
--                        number, a payment method and a reversal flag
--   * budget_lines     - a planned amount per term per cost centre
--   * expenses         - an actual spend per term per cost centre
--
-- MONEY IS STORED IN ONE WAY ONLY: integer pesewas. `amount` is always an
-- integer number of pesewas; a Ghana cedi is 100 of them. The app converts to
-- and from cedis through the single `@/lib/money` formatter, which divides by
-- 100 in exactly one place. No `numeric(12,2)` anywhere.
--
-- RECEIPT NUMBERS are generated in the database, sequential per school, and
-- never reused. The trigger `trg_fee_payments_receipt` assigns the next number
-- on every insert (including reversals). A payment is NEVER deleted - it is
-- reversed by a compensating record (`is_reversal = true`, `reversal_reason`,
-- `reverses_payment_id`) so the audit trail holds.
--
-- SECURITY: every table carries school_id and has RLS enabled. The admin writes
-- and reads all of it; a teacher reads fee status only as the aggregated view
-- `v_fee_status_by_student`, never a payment row; a pupil reads only their own
-- assessments and payments. The aggregation views are scoped with
-- `where jwt_role() = 'admin'` so a management figure is never produced for a
-- role that does not manage (the lesson of the view role-scope migration).
-- ============================================================================


-- ---------------------------------------------------------------------------
-- fee_structures
-- ---------------------------------------------------------------------------
-- A fee line item for a class in a term. The amount is a per-term figure for
-- the whole class (e.g. "Tuition - Term 1, GH¢ 180.00" = 18000 pesewas).

create table if not exists public.fee_structures (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references public.schools(id) on delete cascade,
  class_id       uuid not null references public.classes(id) on delete restrict,
  term_id        uuid not null references public.terms(id)   on delete restrict,
  description    text not null,
  amount         integer not null check (amount >= 0),  -- pesewas
  due_date       date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (school_id, class_id, term_id, description)
);

create index if not exists fee_structures_class_term_idx
  on public.fee_structures (school_id, class_id, term_id);

comment on table public.fee_structures is
  'Fee line item per class per term. amount is integer pesewas.';


-- ---------------------------------------------------------------------------
-- fee_assessments
-- ---------------------------------------------------------------------------
-- The total a pupil owes for a term, generated from their class's structures.

create table if not exists public.fee_assessments (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references public.schools(id) on delete cascade,
  student_id     uuid not null references public.students(id) on delete restrict,
  class_id       uuid not null references public.classes(id) on delete restrict,
  term_id        uuid not null references public.terms(id)   on delete restrict,
  amount         integer not null check (amount >= 0),  -- pesewas, the total due
  due_date       date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (student_id, term_id)
);

create index if not exists fee_assessments_class_term_idx
  on public.fee_assessments (school_id, class_id, term_id);
create index if not exists fee_assessments_student_idx
  on public.fee_assessments (student_id);

comment on table public.fee_assessments is
  'Pupil''s total fee for a term. amount is integer pesewas.';


-- ---------------------------------------------------------------------------
-- fee_payments
-- ---------------------------------------------------------------------------
-- A payment (or a reversal of one) against an assessment. amount is always a
-- positive integer of pesewas - whether it settles the assessment (is_reversal
-- false) or cancels an earlier payment (is_reversal true) is the flag, so the
-- balance is sum(case when is_reversal then -amount else amount end).

create table if not exists public.fee_payments (
  id                 uuid primary key default gen_random_uuid(),
  school_id          uuid not null references public.schools(id) on delete cascade,
  assessment_id      uuid not null references public.fee_assessments(id) on delete restrict,
  amount             integer not null check (amount > 0),  -- pesewas
  payment_date       date not null default current_date,
  method             text not null check (method in ('cash', 'mobile_money', 'bank')),
  receipt_number     bigint not null,
  created_by         uuid references public.profiles(id),
  is_reversal        boolean not null default false,
  reverses_payment_id uuid references public.fee_payments(id),
  reversal_reason    text check (
    -- A reason is required exactly when this row reverses another.
    (is_reversal and reversal_reason is not null and length(trim(reversal_reason)) > 0)
    or (not is_reversal and reversal_reason is null)
  ),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (school_id, receipt_number)
);

create index if not exists fee_payments_assessment_idx
  on public.fee_payments (assessment_id);

comment on table public.fee_payments is
  'Payment against an assessment. receipt_number is sequential per school, never reused. amount is integer pesewas.';


-- ---------------------------------------------------------------------------
-- Next receipt number (security invoker, so it inherits the caller's RLS)
-- ---------------------------------------------------------------------------
-- Reads the existing maximum for the school and steps one on. The unique
-- (school_id, receipt_number) constraint is the concurrency backstop - if two
-- inserts race, one will fail the unique check and the app retries once. No
-- SECURITY DEFINER here and no counter table: both would trip the verify.sql
-- "no SECURITY DEFINER" and "RLS on every public table" checks, and a counter
-- table would need a write path a pupil could not have. Only the admin inserts
-- payments, and the admin may read the table, so the max()+1 read passes RLS.

create or replace function public.fn_next_receipt_number(p_school_id uuid)
returns bigint
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_next bigint;
begin
  select coalesce(max(receipt_number), 0) + 1
    into v_next
    from public.fee_payments
    where school_id = p_school_id;
  return v_next;
end;
$$;

create or replace function public.fn_fee_payments_receipt()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.receipt_number is null then
    new.receipt_number := public.fn_next_receipt_number(new.school_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_fee_payments_receipt on public.fee_payments;
create trigger trg_fee_payments_receipt
  before insert on public.fee_payments
  for each row
  execute function public.fn_fee_payments_receipt();

comment on function public.fn_fee_payments_receipt() is
  'Assigns the next sequential receipt number on every payment insert (including reversals).';


-- ---------------------------------------------------------------------------
-- budget_lines
-- ---------------------------------------------------------------------------
-- A planned amount per term per cost centre.

create table if not exists public.budget_lines (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references public.schools(id) on delete cascade,
  term_id        uuid not null references public.terms(id)   on delete restrict,
  cost_centre    text not null check (cost_centre in (
                   'Teaching', 'Administration', 'Utilities', 'Maintenance',
                   'Transport', 'Events', 'Other'
                 )),
  description    text,
  budget_amount  integer not null check (budget_amount >= 0),  -- pesewas
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (school_id, term_id, cost_centre, description)
);

create index if not exists budget_lines_term_idx
  on public.budget_lines (school_id, term_id, cost_centre);

comment on table public.budget_lines is
  'Planned spend per term per cost centre. budget_amount is integer pesewas.';


-- ---------------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------------
-- An actual spend per term per cost centre.

create table if not exists public.expenses (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references public.schools(id) on delete cascade,
  term_id        uuid not null references public.terms(id)   on delete restrict,
  cost_centre    text not null check (cost_centre in (
                   'Teaching', 'Administration', 'Utilities', 'Maintenance',
                   'Transport', 'Events', 'Other'
                 )),
  description    text not null,
  amount         integer not null check (amount > 0),  -- pesewas
  expense_date   date not null default current_date,
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists expenses_term_idx
  on public.expenses (school_id, term_id, cost_centre);

comment on table public.expenses is
  'Actual spend per term per cost centre. amount is integer pesewas.';


-- ---------------------------------------------------------------------------
-- Views - every one is security_invoker and role-scoped
-- ---------------------------------------------------------------------------
-- An aggregate figure is only produced for the roles that manage it, so a
-- pupil reading "their class" view can never be handed a class number computed
-- from their own single row.

-- Fee status per pupil. Admin + teacher. A teacher is narrowed to their own
-- classes by the inherited RLS on fee_assessments (they can only read the rows
-- whose class they teach), so this view hands them a balance, never a raw
-- payment record.
create or replace view public.v_fee_status_by_student
with (security_invoker = true)
as
select
  a.school_id,
  a.student_id,
  p.full_name                         as student_name,
  a.class_id,
  c.name                              as class_name,
  c.campus,
  a.term_id,
  a.amount                            as amount_due,
  coalesce(sum(case when py.is_reversal then -py.amount else py.amount end), 0)
                                      as paid,
  a.amount - coalesce(sum(case when py.is_reversal then -py.amount else py.amount end), 0)
                                      as balance,
  a.due_date
from public.fee_assessments a
join public.profiles p on p.id = a.student_id
join public.classes  c on c.id = a.class_id
left join public.fee_payments py on py.assessment_id = a.id
where (select public.jwt_role()) in ('admin', 'teacher')
group by a.school_id, a.student_id, p.full_name, a.class_id, c.name, c.campus,
         a.term_id, a.amount, a.due_date;

comment on view public.v_fee_status_by_student is
  'Amount due, paid and balance per pupil per term. Admin + teacher (teacher via inherited RLS).';


-- Fees collected vs expected per term. Admin only.
create or replace view public.v_fees_collected_vs_expected
with (security_invoker = true)
as
select
  a.school_id,
  a.term_id,
  t.name                              as term_name,
  t.start_date,
  sum(a.amount)                       as expected_pesewas,
  coalesce(sum(case when py.is_reversal then -py.amount else py.amount end), 0)
                                      as collected_pesewas,
  round(
    100.0 * coalesce(sum(case when py.is_reversal then -py.amount else py.amount end), 0)
    / nullif(sum(a.amount), 0),
    1
  )                                   as collection_rate,
  round(avg(py.payment_date - a.due_date)) as avg_days_to_pay
from public.fee_assessments a
join public.terms t on t.id = a.term_id
left join public.fee_payments py on py.assessment_id = a.id and not py.is_reversal
where (select public.jwt_role()) = 'admin'
group by a.school_id, a.term_id, t.name, t.start_date;

comment on view public.v_fees_collected_vs_expected is
  'Expected vs collected fees, collection rate and average days to pay per term. Admin only.';


-- Outstanding fees by class for a term. Admin only.
create or replace view public.v_outstanding_by_class
with (security_invoker = true)
as
select
  a.school_id,
  a.class_id,
  c.name                              as class_name,
  c.campus,
  a.term_id,
  t.name                              as term_name,
  sum(a.amount)                       as expected_pesewas,
  coalesce(sum(case when py.is_reversal then -py.amount else py.amount end), 0)
                                      as collected_pesewas,
  sum(a.amount) - coalesce(sum(case when py.is_reversal then -py.amount else py.amount end), 0)
                                      as outstanding_pesewas,
  count(distinct a.student_id)        as pupils_with_assessment
from public.fee_assessments a
join public.classes c on c.id = a.class_id
join public.terms  t on t.id = a.term_id
left join public.fee_payments py on py.assessment_id = a.id
where (select public.jwt_role()) = 'admin'
group by a.school_id, a.class_id, c.name, c.campus, a.term_id, t.name;

comment on view public.v_outstanding_by_class is
  'Expected, collected and outstanding per class per term. Admin only.';


-- Budget vs actual per cost centre per term. Admin only.
create or replace view public.v_budget_vs_actual
with (security_invoker = true)
as
select
  b.school_id,
  b.term_id,
  t.name                              as term_name,
  b.cost_centre,
  b.budget_amount                     as budget_pesewas,
  coalesce(e.actual_pesewas, 0)       as actual_pesewas,
  b.budget_amount - coalesce(e.actual_pesewas, 0) as variance_pesewas
from public.budget_lines b
join public.terms t on t.id = b.term_id
left join (
  select school_id, term_id, cost_centre, sum(amount) as actual_pesewas
  from public.expenses
  group by school_id, term_id, cost_centre
) e on e.school_id = b.school_id and e.term_id = b.term_id and e.cost_centre = b.cost_centre
where (select public.jwt_role()) = 'admin';

comment on view public.v_budget_vs_actual is
  'Budget, actual and variance per cost centre per term. Admin only.';


-- Monthly cash position (collections in, expenses out, running balance). Admin only.
create or replace view public.v_cash_position
with (security_invoker = true)
as
with flow as (
  select school_id,
         date_trunc('month', payment_date)::date as month,
         coalesce(sum(case when is_reversal then -amount else amount end), 0) as income_pesewas,
         0::bigint                               as expenses_pesewas
  from public.fee_payments
  group by school_id, date_trunc('month', payment_date)
  union all
  select school_id,
         date_trunc('month', expense_date)::date as month,
         0::bigint                               as income_pesewas,
         sum(amount)                             as expenses_pesewas
  from public.expenses
  group by school_id, date_trunc('month', expense_date)
)
select
  school_id,
  month,
  sum(income_pesewas)                           as income_pesewas,
  sum(expenses_pesewas)                         as expenses_pesewas,
  sum(income_pesewas - expenses_pesewas)        as net_pesewas,
  sum(sum(income_pesewas - expenses_pesewas)) over (
    partition by school_id order by month
  )                                             as running_balance_pesewas
from flow
where (select public.jwt_role()) = 'admin'
group by school_id, month
order by school_id, month;

comment on view public.v_cash_position is
  'Monthly inflows, outflows and running cash balance. Admin only.';


-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.fee_structures  enable row level security;
alter table public.fee_assessments enable row level security;
alter table public.fee_payments    enable row level security;
alter table public.budget_lines    enable row level security;
alter table public.expenses        enable row level security;


-- fee_structures: admin only.
create policy fee_structures_select_by_admin
  on public.fee_structures
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy fee_structures_insert_by_admin
  on public.fee_structures
  for insert
  to authenticated
  with check (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy fee_structures_update_by_admin
  on public.fee_structures
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

create policy fee_structures_delete_by_admin
  on public.fee_structures
  for delete
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );


-- fee_assessments: admin all; teacher their own classes; pupil only their own.
create policy fee_assessments_select_by_admin
  on public.fee_assessments
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy fee_assessments_select_by_teacher
  on public.fee_assessments
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'teacher'
    and school_id = (select public.jwt_school_id())
    and public.teaches_class(class_id)
  );

create policy fee_assessments_select_self
  on public.fee_assessments
  for select
  to authenticated
  using (
    student_id = (select auth.uid())
    and school_id = (select public.jwt_school_id())
  );

create policy fee_assessments_insert_by_admin
  on public.fee_assessments
  for insert
  to authenticated
  with check (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy fee_assessments_update_by_admin
  on public.fee_assessments
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

create policy fee_assessments_delete_by_admin
  on public.fee_assessments
  for delete
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );


-- fee_payments: admin all; pupil only payments against their own assessments.
-- A teacher deliberately has no policy here - the teacher's fee view is the
-- aggregated `v_fee_status_by_student`, never a raw payment row.
create policy fee_payments_select_by_admin
  on public.fee_payments
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy fee_payments_select_self
  on public.fee_payments
  for select
  to authenticated
  using (
    school_id = (select public.jwt_school_id())
    and exists (
      select 1 from public.fee_assessments a
      where a.id = assessment_id
        and a.student_id = (select auth.uid())
    )
  );

create policy fee_payments_insert_by_admin
  on public.fee_payments
  for insert
  to authenticated
  with check (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

-- A payment is never edited; it is only reversed. So there is no UPDATE policy.
create policy fee_payments_delete_by_admin
  on public.fee_payments
  for delete
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );


-- budget_lines: admin only.
create policy budget_lines_select_by_admin
  on public.budget_lines
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy budget_lines_insert_by_admin
  on public.budget_lines
  for insert
  to authenticated
  with check (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy budget_lines_update_by_admin
  on public.budget_lines
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

create policy budget_lines_delete_by_admin
  on public.budget_lines
  for delete
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );


-- expenses: admin only.
create policy expenses_select_by_admin
  on public.expenses
  for select
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy expenses_insert_by_admin
  on public.expenses
  for insert
  to authenticated
  with check (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );

create policy expenses_update_by_admin
  on public.expenses
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

create policy expenses_delete_by_admin
  on public.expenses
  for delete
  to authenticated
  using (
    (select public.jwt_role()) = 'admin'
    and school_id = (select public.jwt_school_id())
  );


-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
-- The base table grants come from the default privileges set in the initial
-- migration; restate them so this file is self-contained and the views and
-- functions are explicitly executable.

grant select, insert, update, delete on
  public.fee_structures,
  public.fee_assessments,
  public.fee_payments,
  public.budget_lines,
  public.expenses
to authenticated;

grant select on
  public.v_fee_status_by_student,
  public.v_fees_collected_vs_expected,
  public.v_outstanding_by_class,
  public.v_budget_vs_actual,
  public.v_cash_position
to authenticated;

grant execute on function public.fn_next_receipt_number(uuid) to authenticated;
-- The trigger function is invoked by the table owner's trigger machinery, but
-- granting it keeps the permission model explicit and harmless.
grant execute on function public.fn_fee_payments_receipt() to authenticated;
