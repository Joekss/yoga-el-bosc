-- ─────────────────────────────────────────────────────────────────────────────
-- El Bosc · 003 · Catàleg compartit: postures i rutines de la professora
-- La professora les crea; totes les alumnes amb accés les veuen.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.catalog (
  kind        text not null check (kind in ('pose', 'removed_pose', 'routine')),
  id          text not null check (char_length(id) between 1 and 80),
  payload     jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (kind, id)
);

alter table public.catalog enable row level security;

drop policy if exists "catalog: el veu qui té accés" on public.catalog;
create policy "catalog: el veu qui té accés" on public.catalog
  for select using (public.is_member());

drop policy if exists "catalog: només la professora el modifica" on public.catalog;
create policy "catalog: només la professora el modifica" on public.catalog
  for all using (public.is_teacher()) with check (public.is_teacher());
