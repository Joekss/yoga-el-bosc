-- ─────────────────────────────────────────────────────────────────────────────
-- El Bosc · 004 · Xat professora ↔ alumna
--   · messages: una conversa per alumna (student_id). Temps real activat.
--   · student_notes: notes privades de la professora sobre cada alumna.
--   · Storage "chat": àudios, imatges i PDF (privat, per carpeta d'alumna).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.messages (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references public.profiles(id) on delete cascade,
  sender_id      uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  from_role      text not null check (from_role in ('teacher', 'student')),
  kind           text not null check (kind in ('text', 'audio', 'image', 'pdf', 'pose', 'session', 'quote')),
  body           jsonb not null,
  broadcast      text,
  scheduled_for  timestamptz,
  read_at        timestamptz,
  reactions      jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists messages_student_idx on public.messages (student_id, created_at);

alter table public.messages enable row level security;

-- Llegir: la professora tot; l'alumna la seva conversa (sense programats futurs)
drop policy if exists "messages: llegir" on public.messages;
create policy "messages: llegir" on public.messages
  for select using (
    public.is_teacher()
    or (student_id = auth.uid() and public.is_member()
        and (scheduled_for is null or scheduled_for <= now()))
  );

-- Escriure: la professora a qualsevol alumna; l'alumna només respon a la seva
-- conversa i només si la professora ja li ha escrit.
drop policy if exists "messages: escriure" on public.messages;
create policy "messages: escriure" on public.messages
  for insert with check (
    sender_id = auth.uid() and (
      (public.is_teacher() and from_role = 'teacher')
      or (student_id = auth.uid() and from_role = 'student' and scheduled_for is null and public.is_member()
          and exists (select 1 from public.messages m where m.student_id = auth.uid() and m.from_role = 'teacher'))
    )
  );

-- Actualitzar: només lectura i reaccions (permís per columna, a sota)
drop policy if exists "messages: llegit i reaccions" on public.messages;
create policy "messages: llegit i reaccions" on public.messages
  for update using (public.is_teacher() or (student_id = auth.uid() and public.is_member()));

drop policy if exists "messages: la professora esborra" on public.messages;
create policy "messages: la professora esborra" on public.messages
  for delete using (public.is_teacher());

revoke update on public.messages from authenticated;
grant update (read_at, reactions) on public.messages to authenticated;

-- Temps real
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;

-- ── Notes privades de la professora ──────────────────────────────────────────
create table if not exists public.student_notes (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz not null default now()
);
alter table public.student_notes enable row level security;
drop policy if exists "notes: només la professora" on public.student_notes;
create policy "notes: només la professora" on public.student_notes
  for all using (public.is_teacher()) with check (public.is_teacher());

-- ── Fitxers del xat (Storage) ────────────────────────────────────────────────
-- Ruta: <student_id>/<fitxer>. Màxim 15 MB per fitxer.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat', 'chat', false, 15728640,
        array['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/aac',
              'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif',
              'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "chat files: llegir" on storage.objects;
create policy "chat files: llegir" on storage.objects
  for select using (
    bucket_id = 'chat' and (public.is_teacher()
      or ((storage.foldername(name))[1] = auth.uid()::text and public.is_member()))
  );

drop policy if exists "chat files: pujar" on storage.objects;
create policy "chat files: pujar" on storage.objects
  for insert with check (
    bucket_id = 'chat' and (public.is_teacher()
      or ((storage.foldername(name))[1] = auth.uid()::text and public.is_member()))
  );

drop policy if exists "chat files: la professora esborra" on storage.objects;
create policy "chat files: la professora esborra" on storage.objects
  for delete using (bucket_id = 'chat' and public.is_teacher());
