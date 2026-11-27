-- ─────────────────────────────────────────────────────────────────────────────
-- El Bosc · 002 · Registre de pràctiques i drets de privacitat (RGPD)
-- Aplica-ho després de 001 (SQL Editor → Run).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Pràctiques completades (per a ratxa, total i minuts reals) ──────────────
create table if not exists public.practice_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade default auth.uid(),
  completed_at  timestamptz not null default now(),
  duration_sec  integer not null check (duration_sec between 0 and 6 * 3600),
  poses         integer not null default 0 check (poses between 0 and 500),
  completed     boolean not null default true
);
create index if not exists practice_sessions_user_idx on public.practice_sessions (user_id, completed_at desc);

alter table public.practice_sessions enable row level security;

drop policy if exists "practice: l'alumna veu les seves, la professora totes" on public.practice_sessions;
create policy "practice: l'alumna veu les seves, la professora totes" on public.practice_sessions
  for select using (user_id = auth.uid() or public.is_teacher());

drop policy if exists "practice: l'alumna afegeix les seves si té accés" on public.practice_sessions;
create policy "practice: l'alumna afegeix les seves si té accés" on public.practice_sessions
  for insert with check (user_id = auth.uid() and public.is_member());

drop policy if exists "practice: l'alumna esborra les seves" on public.practice_sessions;
create policy "practice: l'alumna esborra les seves" on public.practice_sessions
  for delete using (user_id = auth.uid());

-- ── Dret de supressió: l'usuària esborra el seu compte i totes les dades ────
-- Esborra l'usuari d'Auth; profiles i practice_sessions cauen en cascada.
-- També treu el seu correu de la llista d'alumnes.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid(); em text := lower(auth.jwt() ->> 'email');
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if exists (select 1 from public.profiles where id = uid and role = 'teacher') then
    raise exception 'teacher accounts must be removed by an administrator';
  end if;
  delete from public.members where email = em;
  delete from auth.users where id = uid;
end;
$$;

grant execute on function public.delete_my_account() to authenticated;
