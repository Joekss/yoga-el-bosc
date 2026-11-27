-- ─────────────────────────────────────────────────────────────────────────────
-- El Bosc · 005 · Enduriment (avisos de l'assessor de seguretat de Supabase)
--   · Cap funció interna es pot cridar sense sessió.
--   · handle_new_user només la fa servir el trigger: ningú la pot cridar.
--   · protect_profile_fields amb search_path fix.
-- ─────────────────────────────────────────────────────────────────────────────

revoke execute on function public.is_teacher(), public.is_member(), public.claim_invite(),
  public.delete_my_account(), public.handle_new_user() from public, anon;
revoke execute on function public.handle_new_user() from authenticated;
grant execute on function public.is_teacher(), public.is_member(), public.claim_invite(),
  public.delete_my_account() to authenticated;

alter function public.protect_profile_fields() set search_path = public;
