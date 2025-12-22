begin;

--------------------------------------------------------------------------------
-- Add separate buckets and paths for exam_papers and schemes in past_papers table
-- Add separate buckets and paths for seminar_paper and answers in seminars table
--------------------------------------------------------------------------------

-- Create new buckets for exam papers, schemes, seminar papers, and answers
insert into storage.buckets (id, name, public)
values
  ('exam-papers', 'exam-papers', true),
  ('schemes', 'schemes', true),
  ('seminar-papers', 'seminar-papers', true),
  ('answers', 'answers', true)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

-- Drop old past-papers and seminars buckets and their policies
delete from storage.buckets where id = 'past-papers';
delete from storage.buckets where id = 'seminars';

drop policy if exists past_papers_assets_read on storage.objects;
drop policy if exists past_papers_assets_insert on storage.objects;
drop policy if exists past_papers_assets_update on storage.objects;
drop policy if exists past_papers_assets_delete on storage.objects;

drop policy if exists seminars_assets_read on storage.objects;
drop policy if exists seminars_assets_insert on storage.objects;
drop policy if exists seminars_assets_update on storage.objects;
drop policy if exists seminars_assets_delete on storage.objects;

-- Add new columns to past_papers table
alter table public.past_papers
  add column if not exists exam_paper_bucket text not null default 'exam-papers',
  add column if not exists exam_paper_path text null,
  add column if not exists scheme_bucket text not null default 'schemes',
  add column if not exists scheme_path text null;

-- Drop old past paper related columns
alter table public.past_papers
  drop column if exists file_bucket,
  drop column if exists file_path;

-- Add new columns to seminars table
alter table public.seminars
  add column if not exists seminar_paper_bucket text not null default 'seminar-papers',
  add column if not exists seminar_paper_path text null,
  add column if not exists answers_bucket text not null default 'answers',
  add column if not exists answers_path text null;

-- Drop old seminar related columns
alter table public.seminars
  drop column if exists file_bucket,
  drop column if exists file_path;

-- Storage policies for exam-papers bucket
drop policy if exists exam_papers_assets_read on storage.objects;
create policy exam_papers_assets_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'exam-papers');

drop policy if exists exam_papers_assets_insert on storage.objects;
create policy exam_papers_assets_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'exam-papers'
  and (private.is_super_admin() or private.has_permission('paper_seminar'))
);

drop policy if exists exam_papers_assets_update on storage.objects;
create policy exam_papers_assets_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'exam-papers'
  and (private.is_super_admin() or private.has_permission('paper_seminar'))
)
with check (
  bucket_id = 'exam-papers'
  and (private.is_super_admin() or private.has_permission('paper_seminar'))
);

drop policy if exists exam_papers_assets_delete on storage.objects;
create policy exam_papers_assets_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'exam-papers'
  and (private.is_super_admin() or private.has_permission('paper_seminar'))
);

-- Storage policies for schemes bucket
drop policy if exists schemes_assets_read on storage.objects;
create policy schemes_assets_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'schemes');

drop policy if exists schemes_assets_insert on storage.objects;
create policy schemes_assets_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'schemes'
  and (private.is_super_admin() or private.has_permission('paper_seminar'))
);

drop policy if exists schemes_assets_update on storage.objects;
create policy schemes_assets_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'schemes'
  and (private.is_super_admin() or private.has_permission('paper_seminar'))
)
with check (
  bucket_id = 'schemes'
  and (private.is_super_admin() or private.has_permission('paper_seminar'))
);

drop policy if exists schemes_assets_delete on storage.objects;
create policy schemes_assets_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'schemes'
  and (private.is_super_admin() or private.has_permission('paper_seminar'))
);

-- Storage policies for seminar-papers bucket
drop policy if exists seminar_papers_assets_read on storage.objects;
create policy seminar_papers_assets_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'seminar-papers');

drop policy if exists seminar_papers_assets_insert on storage.objects;
create policy seminar_papers_assets_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'seminar-papers'
  and (private.is_super_admin() or private.has_permission('paper_seminar'))
);

drop policy if exists seminar_papers_assets_update on storage.objects;
create policy seminar_papers_assets_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'seminar-papers'
  and (private.is_super_admin() or private.has_permission('paper_seminar'))
)
with check (
  bucket_id = 'seminar-papers'
  and (private.is_super_admin() or private.has_permission('paper_seminar'))
);

drop policy if exists seminar_papers_assets_delete on storage.objects;
create policy seminar_papers_assets_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'seminar-papers'
  and (private.is_super_admin() or private.has_permission('paper_seminar'))
);

-- Storage policies for answers bucket
drop policy if exists answers_assets_read on storage.objects;
create policy answers_assets_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'answers');

drop policy if exists answers_assets_insert on storage.objects;
create policy answers_assets_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'answers'
  and (private.is_super_admin() or private.has_permission('paper_seminar'))
);

drop policy if exists answers_assets_update on storage.objects;
create policy answers_assets_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'answers'
  and (private.is_super_admin() or private.has_permission('paper_seminar'))
)
with check (
  bucket_id = 'answers'
  and (private.is_super_admin() or private.has_permission('paper_seminar'))
);

drop policy if exists answers_assets_delete on storage.objects;
create policy answers_assets_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'answers'
  and (private.is_super_admin() or private.has_permission('paper_seminar'))
);

commit;