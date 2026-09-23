-- ============================================================================
-- Post-install verification
-- ============================================================================
-- Read-only. Paste the whole file into the Supabase Dashboard SQL editor
-- after applying the two migrations and check each result against the
-- "EXPECT" note above it.
--
-- These queries are the checks that would otherwise need a database to run.
-- They verify the things the migrations are supposed to guarantee, and would
-- have caught the two mistakes found during review:
--   * a composite FK with ON DELETE SET NULL (query 8),
--   * a view without security_invoker (query 5).
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Every table in public must have RLS enabled.
-- EXPECT: zero rows.
-- ---------------------------------------------------------------------------
select c.relname as table_missing_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity = false
order by c.relname;


-- ---------------------------------------------------------------------------
-- 2. Policy inventory.
-- EXPECT: 20 tables and 109 policies, in this shape:
--
--   admissions 4, attendance 6, budget_lines 5, classes 4, complaints 4,
--   dashboard_thresholds 4, exam_results 6, expenses 8, fee_assessments 10,
--   fee_payments 7, fee_structures 5, incidents 6, notices 4, profiles 6,
--   schools 2, students 8, subjects 5, teacher_attendance 5, terms 4,
--   timetable_slots 6
--
-- The two office-staff roles (20260101000950_staff_portals.sql) account for the
-- difference from the original ten tables: profiles +2, students +2, subjects
-- +1, plus the five new tables and the timetable. Notices is 4, not 10: neither
-- new role may publish one, so the ceiling matches what the portals can do.
-- ---------------------------------------------------------------------------
select tablename, count(*) as policy_count
from pg_policies
where schemaname = 'public'
group by tablename
order by tablename;


-- ---------------------------------------------------------------------------
-- 3. anon must hold no privileges on any public table.
-- EXPECT: zero rows. If this returns rows, unauthenticated requests can reach
-- the Data API and RLS is the only remaining barrier.
-- ---------------------------------------------------------------------------
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'anon'
order by table_name, privilege_type;


-- ---------------------------------------------------------------------------
-- 4. authenticated must hold privileges on every table, or RLS could never be
--    reached (GRANT decides table access, RLS decides rows).
-- EXPECT: 20 tables, each with all four of DELETE, INSERT, SELECT, UPDATE -
--   including timetable_slots, granted by 20260101000950_staff_portals.sql.
--   The views also appear in this listing (they are objects in
--   role_table_grants too) and correctly show SELECT only.
-- ---------------------------------------------------------------------------
select table_name,
       string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'authenticated'
group by table_name
order by table_name;


-- ---------------------------------------------------------------------------
-- 5. Views must be security_invoker, otherwise they bypass the RLS of their
--    underlying tables.
-- EXPECT: every view with options containing security_invoker=true, and no
--   view with "(none)". student_directory and all the v_* analytics views,
--   including v_timetable_weekly added by 20260101000950_staff_portals.sql.
-- ---------------------------------------------------------------------------
select c.relname as view_name,
       coalesce(array_to_string(c.reloptions, ', '), '(none)') as options
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'v'
order by c.relname;


-- ---------------------------------------------------------------------------
-- 6. Every UPDATE policy needs both USING and WITH CHECK. A missing WITH CHECK
--    lets a user rewrite columns the policy was meant to protect - for example
--    setting their own role to 'admin' in profiles.
-- EXPECT: zero rows.
-- ---------------------------------------------------------------------------
select tablename, policyname
from pg_policies
where schemaname = 'public'
  and cmd = 'UPDATE'
  and (qual is null or with_check is null)
order by tablename, policyname;


-- ---------------------------------------------------------------------------
-- 7. No SECURITY DEFINER functions should exist.
-- EXPECT: zero rows. Every helper is SECURITY INVOKER and reads only the
-- caller's own JWT, so there is no privilege-escalation surface.
-- ---------------------------------------------------------------------------
select p.proname as definer_function
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef = true
order by p.proname;


-- ---------------------------------------------------------------------------
-- 7b. Every function must pin search_path.
-- EXPECT: zero rows. A mutable search_path means unqualified names inside the
-- function resolve against whatever the caller's path is, and it is one of the
-- first things `supabase db advisors` reports.
-- ---------------------------------------------------------------------------
select p.proname as function_missing_search_path
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prokind = 'f'
  and not exists (
    select 1
    from unnest(coalesce(p.proconfig, array[]::text[])) as cfg
    where cfg like 'search_path=%'
  )
order by p.proname;


-- ---------------------------------------------------------------------------
-- 7c. Every foreign key column should have an index.
-- EXPECT: zero rows. Postgres does not index FK columns automatically, so an
-- unindexed one turns every ON DELETE CASCADE / SET NULL into a scan of the
-- child table.
-- ---------------------------------------------------------------------------
select
  con.conrelid::regclass::text as table_name,
  a.attname                    as unindexed_fk_column,
  con.conname                  as constraint_name
from pg_constraint con
join pg_attribute a
  on a.attrelid = con.conrelid
 and a.attnum = any (con.conkey)
where con.contype = 'f'
  and con.connamespace = 'public'::regnamespace
  and not exists (
    select 1
    from pg_index i
    where i.indrelid = con.conrelid
      and a.attnum = any (i.indkey)
  )
order by table_name, unindexed_fk_column;


-- ---------------------------------------------------------------------------
-- 8. Foreign key inventory, to confirm the composite (same-school) constraints
--    were created and that none of them uses SET NULL.
-- EXPECT: among others, subjects_class_fkey, students_class_fkey,
--   attendance_*_fkey, exam_results_*_fkey, complaints_student_fkey and
--   teacher_attendance_teacher_fkey. A NULL delete_action against a table with
--   a NOT NULL school_id would break deletes.
-- ---------------------------------------------------------------------------
select con.conname as constraint_name,
       con.conrelid::regclass::text as child_table,
       pg_get_constraintdef(con.oid) as definition
from pg_constraint con
where con.contype = 'f'
  and con.connamespace = 'public'::regnamespace
order by child_table, constraint_name;


-- ---------------------------------------------------------------------------
-- 9. JWT helpers must exist and be STABLE (not VOLATILE).
-- EXPECT: jwt_role, jwt_school_id, teaches_subject, teaches_class.
-- ---------------------------------------------------------------------------
select p.proname as function_name,
       case p.provolatile when 's' then 'stable' when 'i' then 'immutable' else 'volatile' end as volatility,
       case p.prosecdef when true then 'DEFINER' else 'invoker' end as security
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('jwt_role', 'jwt_school_id', 'teaches_subject', 'teaches_class')
order by p.proname;
