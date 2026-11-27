-- ─────────────────────────────────────────────────────────────────────────────
-- El Bosc · 009 · Fotos i vídeos de la professora a cada postura
--   · Storage "poses" (privat): només el veuen les alumnes amb accés.
--   · El catàleg guarda quin fitxer té cada postura (kind = 'pose_media').
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.catalog drop constraint if exists catalog_kind_check;
alter table public.catalog add constraint catalog_kind_check
  check (kind in ('pose', 'removed_pose', 'routine', 'pose_media'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('poses', 'poses', false, 52428800,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic',
              'video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "poses files: llegir qui té accés" on storage.objects;
create policy "poses files: llegir qui té accés" on storage.objects
  for select using (bucket_id = 'poses' and public.is_member());

drop policy if exists "poses files: la professora puja" on storage.objects;
create policy "poses files: la professora puja" on storage.objects
  for insert with check (bucket_id = 'poses' and public.is_teacher());

drop policy if exists "poses files: la professora esborra" on storage.objects;
create policy "poses files: la professora esborra" on storage.objects
  for delete using (bucket_id = 'poses' and public.is_teacher());
