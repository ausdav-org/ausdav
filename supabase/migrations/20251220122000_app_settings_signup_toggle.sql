-- Application-wide signup toggle and enforcement

-- Create singleton settings table
create table if not exists public.app_settings (
  id integer primary key check (id = 1),
  allow_signup boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid null
);

insert into public.app_settings (id, allow_signup)
values (1, false)
on conflict (id) do nothing;

-- Keep timestamps fresh
drop trigger if exists set_updated_at_app_settings on public.app_settings;
create trigger set_updated_at_app_settings
before update on public.app_settings
for each row execute function private.tg_set_updated_at();

alter table public.app_settings enable row level security;

drop policy if exists "read signup flag" on public.app_settings;
create policy "read signup flag"
  on public.app_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "super admin can update signup flag" on public.app_settings;
create policy "super admin can update signup flag"
  on public.app_settings
  for update
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists "super admin can insert signup flag" on public.app_settings;
create policy "super admin can insert signup flag"
  on public.app_settings
  for insert
  to authenticated
  with check (private.is_super_admin());
