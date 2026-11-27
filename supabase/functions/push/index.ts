// supabase/functions/push — Envia les notificacions push d'El Bosc.
//
// La criden només la base de dades (pg_net) amb la capçalera x-push-secret:
//   { type: 'init' }                 genera les claus VAPID (un sol cop)
//   { type: 'message', id }          avís de missatge nou (sense contingut)
//   { type: 'reminders' }            recordatoris diaris (cada 15 minuts)
import { createClient } from "jsr:@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

const T = {
  ca: { msgTeacher: "Tens un missatge nou de la Cèlia", msgStudent: "Tens un missatge nou d'una alumna", remTitle: "Hora de practicar", remBody: "Uns minuts per a tu. La teva pràctica t'espera." },
  es: { msgTeacher: "Tienes un mensaje nuevo de Cèlia", msgStudent: "Tienes un mensaje nuevo de una alumna", remTitle: "Hora de practicar", remBody: "Unos minutos para ti. Tu práctica te espera." },
  en: { msgTeacher: "You have a new message from Cèlia", msgStudent: "You have a new message from a student", remTitle: "Time to practise", remBody: "A few minutes for you. Your practice is waiting." },
} as const;
type Lang = keyof typeof T;

type Sub = { endpoint: string; user_id: string; p256dh: string; auth: string; lang: Lang; tz: string; reminder_time: string | null; last_reminded_on: string | null; notify_messages: boolean };

async function send(sub: Sub, payload: Record<string, unknown>) {
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload), { TTL: 3600 });
    return true;
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode;
    if (code === 404 || code === 410) await sb.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    return false;
  }
}

// Hora i data locals d'una zona horària
function localNow(tz: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
    .formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const hh = g("hour") === "24" ? "00" : g("hour");
  return { date: `${g("year")}-${g("month")}-${g("day")}`, minutes: Number(hh) * 60 + Number(g("minute")) };
}

Deno.serve(async (req) => {
  const { data: cfg } = await sb.rpc("get_push_config");
  if (!cfg || req.headers.get("x-push-secret") !== cfg.push_secret) return new Response("forbidden", { status: 403 });
  const body = await req.json().catch(() => ({}));

  if (body.type === "init") {
    if (!cfg.vapid_public) {
      const k = webpush.generateVAPIDKeys();
      await sb.rpc("init_push_config", { pub: k.publicKey, priv: k.privateKey });
    }
    return Response.json({ ok: true });
  }

  if (!cfg.vapid_public || !cfg.vapid_private) return Response.json({ ok: false, reason: "no-keys" });
  webpush.setVapidDetails("https://joekss.github.io/yoga-el-bosc/", cfg.vapid_public, cfg.vapid_private);

  if (body.type === "message" && body.id) {
    const { data: m } = await sb.from("messages").select("id, student_id, from_role, scheduled_for").eq("id", body.id).maybeSingle();
    if (!m) return Response.json({ ok: false });
    if (m.scheduled_for && new Date(m.scheduled_for) > new Date()) return Response.json({ ok: true, scheduled: true });
    let recipients: string[] = [];
    if (m.from_role === "teacher") recipients = [m.student_id];
    else {
      const { data: teachers } = await sb.from("profiles").select("id").eq("role", "teacher");
      recipients = (teachers ?? []).map((t) => t.id);
    }
    if (!recipients.length) return Response.json({ ok: true, sent: 0 });
    const { data: subs } = await sb.from("push_subscriptions").select("*").in("user_id", recipients).eq("notify_messages", true);
    let sent = 0;
    for (const s of (subs ?? []) as Sub[]) {
      const t = T[s.lang] ?? T.ca;
      if (await send(s, { title: "El Bosc", body: m.from_role === "teacher" ? t.msgTeacher : t.msgStudent, url: "./?tab=messages", tag: "elbosc-msg" })) sent++;
    }
    return Response.json({ ok: true, sent });
  }

  if (body.type === "reminders") {
    const { data: subs } = await sb.from("push_subscriptions").select("*").not("reminder_time", "is", null);
    let sent = 0;
    for (const s of (subs ?? []) as Sub[]) {
      const now = localNow(s.tz || "Europe/Madrid");
      const [h, mi] = (s.reminder_time as string).split(":").map(Number);
      const target = h * 60 + mi;
      const due = now.minutes >= target && now.minutes < target + 15;
      if (!due || s.last_reminded_on === now.date) continue;
      // Si avui ja ha practicat, no cal recordar-ho
      const since = new Date(Date.now() - 20 * 3600e3).toISOString();
      const { data: done } = await sb.from("practice_sessions").select("id, completed_at").eq("user_id", s.user_id).gte("completed_at", since);
      const practisedToday = (done ?? []).some((p) => localNowFor(p.completed_at, s.tz) === now.date);
      await sb.from("push_subscriptions").update({ last_reminded_on: now.date }).eq("endpoint", s.endpoint);
      if (practisedToday) continue;
      const t = T[s.lang] ?? T.ca;
      if (await send(s, { title: t.remTitle, body: t.remBody, url: "./", tag: "elbosc-reminder" })) sent++;
    }
    return Response.json({ ok: true, sent });
  }

  return Response.json({ ok: false, reason: "unknown-type" }, { status: 400 });
});

function localNowFor(iso: string, tz: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz || "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(iso));
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${g("year")}-${g("month")}-${g("day")}`;
}
