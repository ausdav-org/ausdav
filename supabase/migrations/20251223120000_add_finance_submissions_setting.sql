-- Allow admins to toggle finance submissions for all members
alter table public.app_settings
add column if not exists allow_finance_submissions boolean not null default false;

update public.app_settings
set allow_finance_submissions = false
where id = 1;

--------------------------------------------------------------------------------
-- CLEANUP: Remove legacy finance_submissions / finance_transactions tables
--------------------------------------------------------------------------------

drop table if exists public.finance_transactions cascade;
drop table if exists public.finance_submissions cascade;

--------------------------------------------------------------------------------
-- EXTEND FINANCE TABLE for member submissions workflow
--------------------------------------------------------------------------------

-- Add columns for member submission tracking
alter table public.finance
add column if not exists submitted_by uuid null references auth.users(id) on delete set null,
add column if not exists verified_by uuid null references auth.users(id) on delete set null,
add column if not exists verified_at timestamptz null,
add column if not exists rejection_reason text null,
add column if not exists txn_date date null;

-- Update existing records to have a txn_date based on created_at
update public.finance
set txn_date = created_at::date
where txn_date is null;

-- Make txn_date not null after backfilling
alter table public.finance
alter column txn_date set default current_date;

-- Indexes for finance table queries
create index if not exists idx_finance_approved 
  on public.finance(approved);
create index if not exists idx_finance_submitted_by 
  on public.finance(submitted_by);
create index if not exists idx_finance_txn_date 
  on public.finance(txn_date);

--------------------------------------------------------------------------------
-- RLS POLICIES for finance table
--------------------------------------------------------------------------------

alter table public.finance enable row level security;

-- Members can view their own submissions
drop policy if exists "Users can view own finance records" on public.finance;
create policy "Users can view own finance records"
  on public.finance
  for select
  to authenticated
  using (submitted_by = auth.uid());

-- Members can insert their own submissions (unapproved)
drop policy if exists "Users can insert own finance records" on public.finance;
create policy "Users can insert own finance records"
  on public.finance
  for insert
  to authenticated
  with check (submitted_by = auth.uid() and approved = false);

-- Members can update their own unapproved submissions
drop policy if exists "Users can update own unapproved records" on public.finance;
create policy "Users can update own unapproved records"
  on public.finance
  for update
  to authenticated
  using (submitted_by = auth.uid() and approved = false)
  with check (submitted_by = auth.uid() and approved = false);

-- Members can delete their own unapproved submissions
drop policy if exists "Users can delete own unapproved records" on public.finance;
create policy "Users can delete own unapproved records"
  on public.finance
  for delete
  to authenticated
  using (submitted_by = auth.uid() and approved = false);

-- Admins/Finance permission holders can view all records
drop policy if exists "Finance admins can view all records" on public.finance;
create policy "Finance admins can view all records"
  on public.finance
  for select
  to authenticated
  using (
    exists (
      select 1 from public.members m
      left join public.permissions p on p.id = m.mem_id
      where m.auth_user_id = auth.uid()
        and (p.finance = true or m.role in ('admin', 'super_admin'))
    )
  );

-- Admins can insert any records (direct ledger entry)
drop policy if exists "Admins can insert finance records" on public.finance;
create policy "Admins can insert finance records"
  on public.finance
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.members m
      where m.auth_user_id = auth.uid()
        and m.role in ('admin', 'super_admin')
    )
  );

-- Admins can update any records (approve/reject/edit)
drop policy if exists "Admins can update finance records" on public.finance;
create policy "Admins can update finance records"
  on public.finance
  for update
  to authenticated
  using (
    exists (
      select 1 from public.members m
      where m.auth_user_id = auth.uid()
        and m.role in ('admin', 'super_admin')
    )
  );

-- Admins can delete any records
drop policy if exists "Admins can delete finance records" on public.finance;
create policy "Admins can delete finance records"
  on public.finance
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.members m
      where m.auth_user_id = auth.uid()
        and m.role in ('admin', 'super_admin')
    )
  );

--------------------------------------------------------------------------------
-- FINANCE-PHOTOS STORAGE BUCKET POLICIES
--------------------------------------------------------------------------------

-- RLS policies for finance-photos bucket
-- Allow authenticated users to upload their own photos
drop policy if exists "Users can upload own finance photos" on storage.objects;
create policy "Users can upload own finance photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'finance-photos' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to read their own photos
drop policy if exists "Users can read own finance photos" on storage.objects;
create policy "Users can read own finance photos"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'finance-photos' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow admins to read all finance photos (for verification)
drop policy if exists "Admins can read all finance photos" on storage.objects;
create policy "Admins can read all finance photos"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'finance-photos'
    and exists (
      select 1 from public.members m
      where m.auth_user_id = auth.uid()
        and m.role in ('admin', 'super_admin')
    )
  );

-- Allow users to delete their own photos
drop policy if exists "Users can delete own finance photos" on storage.objects;
create policy "Users can delete own finance photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'finance-photos' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );
