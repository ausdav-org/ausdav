-- Migration: Create patrons storage bucket

insert into storage.buckets (id, name, public)
values ('patrons', 'patrons', true)
on conflict (id) do update
set name   = excluded.name,
    public = excluded.public;
