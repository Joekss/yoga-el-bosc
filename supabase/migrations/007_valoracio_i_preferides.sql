-- ─────────────────────────────────────────────────────────────────────────────
-- El Bosc · 007 · "Com et trobes avui?", valoració i preferides
-- ─────────────────────────────────────────────────────────────────────────────

-- Pràctiques: com estava abans, com s'ha sentit després i quines postures ha fet
alter table public.practice_sessions
  add column if not exists checkin     jsonb,
  add column if not exists feeling     smallint check (feeling between 1 and 5),
  add column if not exists discomfort  text check (char_length(discomfort) <= 500),
  add column if not exists pose_ids    text[];

-- L'alumna pot afegir la valoració a una pràctica seva (només aquestes columnes)
drop policy if exists "practice: l'alumna valora les seves" on public.practice_sessions;
create policy "practice: l'alumna valora les seves" on public.practice_sessions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.practice_sessions from authenticated;
grant update (feeling, discomfort) on public.practice_sessions to authenticated;

-- Dades personals: també postures preferides i sessions desades
alter table public.personal_items drop constraint if exists personal_items_kind_check;
alter table public.personal_items add constraint personal_items_kind_check
  check (kind in ('journal', 'calendar', 'favorites', 'sessions'));
