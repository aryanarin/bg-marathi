-- 0002_profiles.sql
-- User profiles, mirroring auth.users with application fields, plus the trigger
-- that auto-creates a profile on signup.

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Application profile per auth user. role is never set from client input; see prevent_role_change() and column grants in 0007.';

-- ---------------------------------------------------------------------------
-- is_admin(): true when the current user has role 'admin'. Defined here rather
-- than in 0001 because its body references public.profiles, and a SQL function
-- is validated against existing objects at creation time.
--
-- security definer is required to avoid infinite recursion: a policy on
-- profiles that tested admin-ness by selecting from profiles would re-trigger
-- that same policy. Running as the owner bypasses RLS and breaks the cycle.
--
-- search_path is pinned so a caller cannot shadow `profiles` with a table in an
-- earlier schema -- the classic privilege-escalation route for security definer
-- functions.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS on from the start. Policies are added in 0007; until then the table is
-- closed to the anon and authenticated roles, which is the safe default.
alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------------
-- Auto-create a profile when a user signs up.
--
-- role is hard-coded to 'user'. There is no code path, here or in the app, that
-- creates an account as an administrator. The first admin is promoted by hand
-- (see docs/setup.md).
--
-- full_name is taken from signup metadata when the client provided it.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Guard: only an existing admin may change a role. Defence in depth alongside
-- the column-level grants in 0007, in case a future migration re-grants update
-- on the role column too broadly.
-- ---------------------------------------------------------------------------
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'role cannot be changed by a non-admin';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();
