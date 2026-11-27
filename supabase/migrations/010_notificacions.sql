-- ─────────────────────────────────────────────────────────────────────────────
-- El Bosc · 010 · Notificacions push i recordatori diari
--   · push_subscriptions: un dispositiu per fila (cada usuària veu les seves).
--   · private.push_config: claus VAPID i secret intern (fora de l'API).
--   · Missatge nou al xat → avís a l'altra persona (via pg_net → funció "push").
--   · Cada 15 minuts → recordatoris a l'hora que ha triat cada alumna (pg_cron).
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- ── Configuració privada (no és accessible des de l'app) ────────────────────
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.push_config (
  id             boolean primary key default true check (id),
  vapid_public   text,
  vapid_private  text,
  push_secret    text not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  function_url   text not null default 'https://cuigobpxeyzigialyiwc.supabase.co/functions/v1/push'
);
insert into private.push_config (id) values (true) on conflict (id) do nothing;

-- Només la funció (service_role) pot llegir i inicialitzar la configuració
create or replace function public.get_push_config()
returns json language sql stable security definer set search_path = private, public as $$
  select row_to_json(c) from private.push_config c where id;
$$;
create or replace function public.init_push_config(pub text, priv text)
returns void language sql security definer set search_path = private, public as $$
  update private.push_config set vapid_public = pub, vapid_private = priv where id and vapid_public is null;
$$;
revoke execute on function public.get_push_config(), public.init_push_config(text, text) from public, anon, authenticated;
grant execute on function public.get_push_config(), public.init_push_config(text, text) to service_role;

-- La clau pública sí que la necessita l'app per subscriure's
create or replace function public.push_public_key()
returns text language sql stable security definer set search_path = private, public as $$
  select vapid_public from private.push_config where id;
$$;
revoke execute on function public.push_public_key() from public, anon;
grant execute on function public.push_public_key() to authenticated;

-- ── Subscripcions dels dispositius ──────────────────────────────────────────
create table if not exists public.push_subscriptions (
  endpoint          text primary key,
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  p256dh            text not null,
  auth              text not null,
  notify_messages   boolean not null default true,
  reminder_time     text check (reminder_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  tz                text not null default 'Europe/Madrid',
  lang              text not null default 'ca' check (lang in ('ca', 'es', 'en')),
  last_reminded_on  date,
  created_at        timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
drop policy if exists "push: cadascú les seves" on public.push_subscriptions;
create policy "push: cadascú les seves" on public.push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Crida interna a la funció "push" ────────────────────────────────────────
create or replace function private.call_push(payload jsonb)
returns void language plpgsql security definer set search_path = private, public, extensions as $$
declare c private.push_config;
begin
  select * into c from private.push_config where id;
  if c.vapid_public is null and payload ->> 'type' <> 'init' then return; end if;
  perform net.http_post(
    url := c.function_url,
    body := payload,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', c.push_secret),
    timeout_milliseconds := 10000
  );
end;
$$;

-- Missatge nou → avís
create or replace function private.on_message_push()
returns trigger language plpgsql security definer set search_path = private, public as $$
begin
  perform private.call_push(jsonb_build_object('type', 'message', 'id', new.id));
  return new;
exception when others then
  return new;   -- mai bloquejar l'enviament d'un missatge per culpa d'un avís
end;
$$;
drop trigger if exists messages_push on public.messages;
create trigger messages_push after insert on public.messages
  for each row execute function private.on_message_push();

-- Recordatoris cada 15 minuts
do $$ begin
  perform cron.unschedule('elbosc-recordatoris');
exception when others then null; end $$;
select cron.schedule('elbosc-recordatoris', '*/15 * * * *', $$ select private.call_push('{"type":"reminders"}'::jsonb) $$);
