-- Error log: records the errors people hit in Caption Club, for the private /admin/errors page.
-- Paste this whole file into Supabase → SQL Editor → Run. Safe to re-run.

-- ---------- Who can see the log ----------
create table if not exists public.app_admins (
  email text primary key
);
insert into public.app_admins (email) values ('mj3164@columbia.edu') on conflict do nothing;
-- To give your PM access later, run:  insert into public.app_admins (email) values ('their@email.com');

alter table public.app_admins enable row level security;
drop policy if exists "app_admins_read_self" on public.app_admins;
-- You can only check whether YOUR OWN email is on the list
create policy "app_admins_read_self" on public.app_admins
  for select to authenticated using (lower(email) = lower(auth.jwt() ->> 'email'));

create or replace function public.is_app_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_admins where lower(email) = lower(auth.jwt() ->> 'email'));
$$;
revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to authenticated;

-- ---------- The log ----------
create table if not exists public.app_errors (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  user_id     uuid references auth.users(id) on delete set null,
  user_email  text,
  page        text check (char_length(page) <= 300),
  action      text not null check (char_length(action) <= 40),
  message     text not null check (char_length(message) <= 1000),
  details     jsonb,
  user_agent  text check (char_length(user_agent) <= 300),
  resolved    boolean not null default false
);
create index if not exists app_errors_created_idx on public.app_errors (created_at desc);

alter table public.app_errors enable row level security;
drop policy if exists "app_errors_insert" on public.app_errors;
drop policy if exists "app_errors_admin_read" on public.app_errors;
drop policy if exists "app_errors_admin_update" on public.app_errors;

-- Anyone can report an error (sign-in errors happen before login), but only as themselves:
-- signed-out reports carry no user, signed-in reports must be their own id and email.
create policy "app_errors_insert" on public.app_errors
  for insert to anon, authenticated
  with check (
    resolved = false
    and (user_id is null or user_id = (select auth.uid()))
    and (user_email is null or lower(user_email) = lower(auth.jwt() ->> 'email'))
  );

-- Only admins can read the log or mark errors fixed
create policy "app_errors_admin_read" on public.app_errors
  for select to authenticated using ((select public.is_app_admin()));
create policy "app_errors_admin_update" on public.app_errors
  for update to authenticated using ((select public.is_app_admin())) with check ((select public.is_app_admin()));
