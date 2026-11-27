-- ─────────────────────────────────────────────────────────────────────────────
-- El Bosc · 001 · Accés, rols i llista d'alumnes
--
-- Com aplicar-ho: Supabase → SQL Editor → enganxa aquest fitxer → Run.
-- Després, fes professora la Cèlia (canvia el correu):
--
--   update public.profiles set role = 'teacher' where email = 'CORREU_DE_LA_CELIA';
--
-- Regles:
--   · El rol (alumna/professora) només el pot canviar algú amb accés SQL.
--   · Una alumna només té accés si el seu correu és a public.members
--     amb estat 'invited' o 'active'. 'revoked' = sense accés a cap dada.
--   · La professora gestiona public.members des de l'app.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Perfils (un per usuari d'Auth) ───────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  name        text not null default '',
  role        text not null default 'student' check (role in ('student', 'teacher')),
  data        jsonb not null default '{}'::jsonb,   -- respostes del qüestionari
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Llista d'alumnes que gestiona la professora ──────────────────────────────
create table if not exists public.members (
  email        text primary key check (email = lower(email)),
  name         text not null default '',
  level        text not null default 'principiant',
  status       text not null default 'invited' check (status in ('invited', 'active', 'revoked')),
  invited_at   timestamptz not null default now(),
  last_access  timestamptz
);

-- ── Funcions d'ajuda (security definer: no depenen de les RLS) ───────────────
create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'teacher');
$$;

create or replace function public.is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_teacher() or exists (
    select 1 from members
    where email = lower(auth.jwt() ->> 'email') and status in ('invited', 'active')
  );
$$;

-- L'alumna marca la seva invitació com a acceptada (invited → active).
-- No pot reactivar-se si està revocada.
create or replace function public.claim_invite()
returns text language plpgsql security definer set search_path = public as $$
declare st text;
begin
  update members
     set status = case when status = 'invited' then 'active' else status end,
         last_access = now()
   where email = lower(auth.jwt() ->> 'email')
  returning status into st;
  return coalesce(st, 'missing');
end;
$$;

-- ── Crea el perfil automàticament quan algú entra per primer cop ─────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name)
  values (
    new.id,
    lower(new.email),
    coalesce((select name from members where email = lower(new.email)), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Ningú pot canviar-se el rol ni el correu des de l'app ───────────────────
create or replace function public.protect_profile_fields()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.role  := old.role;
    new.email := old.email;
    new.id    := old.id;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.members  enable row level security;

drop policy if exists "profiles: llegir el propi o professora" on public.profiles;
create policy "profiles: llegir el propi o professora" on public.profiles
  for select using (id = auth.uid() or public.is_teacher());

drop policy if exists "profiles: editar el propi si té accés" on public.profiles;
create policy "profiles: editar el propi si té accés" on public.profiles
  for update using (id = auth.uid() and public.is_member())
  with check (id = auth.uid());

drop policy if exists "members: la professora ho gestiona tot" on public.members;
create policy "members: la professora ho gestiona tot" on public.members
  for all using (public.is_teacher()) with check (public.is_teacher());

drop policy if exists "members: l'alumna veu la seva fila" on public.members;
create policy "members: l'alumna veu la seva fila" on public.members
  for select using (email = lower(auth.jwt() ->> 'email'));

grant execute on function public.is_teacher(), public.is_member(), public.claim_invite() to authenticated;
