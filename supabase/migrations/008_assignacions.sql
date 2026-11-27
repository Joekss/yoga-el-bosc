-- ─────────────────────────────────────────────────────────────────────────────
-- El Bosc · 008 · Rutines assignades per la professora a una alumna
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.assignments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  routine_id  text not null,
  routine     jsonb not null,              -- còpia de la rutina (nom i postures) en assignar-la
  note        text check (char_length(note) <= 500),
  created_at  timestamptz not null default now(),
  done_at     timestamptz
);
create index if not exists assignments_student_idx on public.assignments (student_id, created_at desc);

alter table public.assignments enable row level security;

drop policy if exists "assignments: la professora ho gestiona" on public.assignments;
create policy "assignments: la professora ho gestiona" on public.assignments
  for all using (public.is_teacher()) with check (public.is_teacher());

drop policy if exists "assignments: l'alumna veu les seves" on public.assignments;
create policy "assignments: l'alumna veu les seves" on public.assignments
  for select using (student_id = auth.uid() and public.is_member());

drop policy if exists "assignments: l'alumna marca feta" on public.assignments;
create policy "assignments: l'alumna marca feta" on public.assignments
  for update using (student_id = auth.uid() and public.is_member()) with check (student_id = auth.uid());

revoke update on public.assignments from authenticated;
grant update (done_at) on public.assignments to authenticated;
