begin;

-- Allow gallery creators to delete their own galleries
-- This policy allows authenticated users to delete galleries they created

drop policy if exists galleries_delete_creator on public.galleries;
create policy galleries_delete_creator
on public.galleries
for delete
to authenticated
using ( created_by = auth.uid() );

-- Allow gallery image creators to delete their own images
-- This policy allows authenticated users to delete images they uploaded

drop policy if exists gallery_images_delete_creator on public.gallery_images;
create policy gallery_images_delete_creator
on public.gallery_images
for delete
to authenticated
using ( created_by = auth.uid() );

-- Allow gallery image creators to delete their own files from storage
-- This policy allows authenticated users to delete files they uploaded

drop policy if exists event_gallery_assets_delete_creator on storage.objects;
create policy event_gallery_assets_delete_creator
on storage.objects
for delete
to authenticated
using (bucket_id = 'event-gallery');

-- Update existing gallery_images that don't have created_by set
-- This ensures existing images can be managed by their creators
update public.gallery_images
set created_by = (
  select g.created_by
  from public.galleries g
  where g.id = gallery_images.gallery_id
)
where created_by is null;

commit;