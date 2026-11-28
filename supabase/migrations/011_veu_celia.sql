-- ─────────────────────────────────────────────────────────────────────────────
-- El Bosc · 011 · La veu de la Cèlia
--   · El catàleg guarda quines frases ha gravat la professora (kind = 'voice').
--   · Els àudios van al bucket privat "poses" (carpeta voice/), que ara accepta àudio.
--   Les regles d'accés ja hi són (009): llegeix qui té accés, només puja/esborra la professora.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.catalog drop constraint if exists catalog_kind_check;
alter table public.catalog add constraint catalog_kind_check
  check (kind in ('pose', 'removed_pose', 'routine', 'pose_media', 'voice'));

update storage.buckets
   set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic',
                                  'video/mp4', 'video/quicktime', 'video/webm',
                                  'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/aac']
 where id = 'poses';
