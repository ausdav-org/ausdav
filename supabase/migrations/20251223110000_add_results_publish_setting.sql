-- Allow admins to toggle results visibility
alter table public.app_settings
add column if not exists allow_results_view boolean not null default false;

update public.app_settings
set allow_results_view = false
where id = 1;
