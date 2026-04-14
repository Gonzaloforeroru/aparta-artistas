-- 005: Storage bucket for artist photos
insert into storage.buckets (id, name, public)
values ('artist-photos', 'artist-photos', true);

-- Anon: can read all photos (public catalog)
create policy "anon_read_photos"
  on storage.objects for select to anon
  using (bucket_id = 'artist-photos');

-- Admin: full access to photos
create policy "admin_write_photos"
  on storage.objects for all to authenticated
  using (bucket_id = 'artist-photos')
  with check (bucket_id = 'artist-photos');

-- Service role: full access (for anon token registration via admin client)
create policy "service_role_storage"
  on storage.objects for all to service_role
  using (bucket_id = 'artist-photos')
  with check (bucket_id = 'artist-photos');
