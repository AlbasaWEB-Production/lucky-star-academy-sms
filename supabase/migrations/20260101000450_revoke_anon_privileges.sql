-- ============================================================================
-- Least privilege: `anon` holds no privileges in the public schema
-- ============================================================================
-- Supabase serves unauthenticated requests as the `anon` role. Authentication
-- and tenant scope are enforced by Row Level Security, which filters every row
-- a role with valid privileges can reach. That is only safe while `anon` holds
-- no privileges at all: one policy that forgets a role, or one table created
-- without RLS, silently becomes a public read/write hole.
--
-- The analytics objects were created granting `all` to `authenticated` and
-- `anon` in one statement. `authenticated` is the role the application queries
-- as — it needs those grants, and `security_invoker` views resolve against it.
-- `anon` does not. This migration strips every `anon` grant and locks the
-- default privileges so no future object in public inherits one.
--
-- Safe to run against a live project: it grants nothing and drops nothing but
-- `anon`'s privileges. Row Level Security remains the gate.
-- ============================================================================

-- Tables and views ("all tables" covers views and foreign tables too).
revoke all privileges on all tables in schema public from anon;

-- Sequences backing identity / serial columns.
revoke all privileges on all sequences in schema public from anon;

-- Functions and procedures. This closes the caller-side surface, e.g. an
-- unauthenticated request invoking fn_next_receipt_number().
revoke all privileges on all functions in schema public from anon;
revoke all privileges on all routines in schema public from anon;

-- Nothing created later in public should start out granted to `anon`.
alter default privileges in schema public
  revoke all privileges on tables from anon;
alter default privileges in schema public
  revoke all privileges on sequences from anon;
alter default privileges in schema public
  revoke all privileges on functions from anon;
alter default privileges in schema public
  revoke all privileges on routines from anon;
