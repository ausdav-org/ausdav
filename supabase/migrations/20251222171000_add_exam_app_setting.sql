-- Allow admins to toggle exam applications visibility
alter table public.app_settings
add column if not exists allow_exam_applications boolean not null default true;

update public.app_settings
set allow_exam_applications = true
where id = 1;