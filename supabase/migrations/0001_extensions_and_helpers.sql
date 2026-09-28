-- 0001_extensions_and_helpers.sql
-- Extensions and the table-independent trigger helper. Applied first.
--
-- is_admin() is intentionally NOT here: it references public.profiles, and a SQL
-- function's body is validated at creation time, so it must be defined after
-- that table exists. It lives in 0002, immediately after profiles is created.

-- gen_random_uuid() lives in pgcrypto. Usually present on Supabase, but declare
-- it so the migration set is self-contained and reproducible from scratch.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- set_updated_at(): stamps updated_at on every write, server-side, so a client
-- cannot back-date a row. References no table, so it is safe to define here.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
