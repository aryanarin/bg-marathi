-- 0011_lock_schema_migrations.sql
-- Enable RLS on the migration-bookkeeping table.
--
-- schema_migrations is created by scripts/migrate.ts to record which migrations
-- have run. It holds only filenames and timestamps -- no user data -- but it
-- lives in the public schema, so Supabase's linter (correctly) flags any public
-- table without RLS as world-readable through the anon API.
--
-- We enable RLS and add NO policies: with RLS on and no policy, the anon and
-- authenticated roles are denied all access. The migration runner is unaffected
-- because it connects as the postgres superuser over the direct Postgres
-- connection, which bypasses RLS.

alter table if exists public.schema_migrations enable row level security;

-- Also revoke the default API grants, so the table is not even reachable.
revoke all on public.schema_migrations from anon, authenticated;
