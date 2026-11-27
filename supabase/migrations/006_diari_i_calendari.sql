-- ─────────────────────────────────────────────────────────────────────────────
-- El Bosc · 006 · Diari i calendari personals al compte
-- Només els veu i els modifica la mateixa alumna (ni tan sols la professora).
-- S'esborren amb el compte (on delete cascade).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.personal_items (
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('journal', 'calendar')),
  id          text not null check (char_length(id) between 1 and 80),
  payload     jsonb not null,
  updated_at  timestamptz not null default now(),
  primary key (user_id, kind, id)
);

alter table public.personal_items enable row level security;

drop policy if exists "personal: només la propietària" on public.personal_items;
create policy "personal: només la propietària" on public.personal_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
