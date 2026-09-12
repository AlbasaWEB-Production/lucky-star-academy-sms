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
-- EXPECT: 10 tables, and roughly this shape:
--   schools 2, profiles 4, classes 4, subjects 4, students 5,
--   exam_results 5, attendance 5, teacher_attendance 5, notices 4, complaints 4
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
-- EXPECT: 10 tables listed, each with DELETE,INSERT,SELECT,UPDATE.
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
-- EXPECT: student_directory with options containing security_invoker=true.
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
