-- Delete orphaned auth users
-- Removes rows from auth.users that are not referenced by public.members.auth_user_id
-- Run with a DB user that has permission to modify the auth schema (service role).

begin;

-- Safety: do not delete users that are referenced in members
delete from auth.users u
where not exists (
  select 1 from public.members m where m.auth_user_id = u.id
);

commit;

-- Note: this will cascade or set null according to existing foreign key rules.
-- Review other schemas that reference auth.users before running in production.
