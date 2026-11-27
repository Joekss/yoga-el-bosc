// data/backend.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Única porta d'entrada a Supabase. La resta de l'app crida window.EBBackend.
//
// Seguretat: el rol i l'estat d'accés els decideix el servidor (taules
// profiles i members, amb RLS — veure supabase/migrations). La còpia local
// (CACHE_KEY) només serveix per obrir l'app sense connexió; no dóna accés a
// cap dada del servidor.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  const CACHE_KEY = 'elbosc-account-cache';

  const sb = () => window.sb || null;
  const readCache = () => { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) { return null; } };
  const writeCache = (acc) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(acc)); } catch (e) {} };
  const clearCache = () => { try { localStorage.removeItem(CACHE_KEY); } catch (e) {} };

  // Error amb codi per distingir "sense xarxa" de "sense permís"
  const fail = (code, error) => { const e = new Error(code); e.code = code; e.cause = error; return e; };

  const isNetworkError = (err) => {
    const msg = String((err && (err.message || err)) || '');
    return !navigator.onLine || /fetch|network|Failed to fetch|Load failed/i.test(msg);
  };

  async function getSession() {
    if (!sb()) return null;
    const { data } = await sb().auth.getSession();
    return (data && data.session) || null;
  }

  // Envia el correu d'accés (enllaç + codi de 6 dígits)
  async function sendLoginEmail(email) {
    if (!sb()) throw fail('no-backend');
    const { error } = await sb().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: window.location.origin + window.location.pathname },
    });
    if (error) throw fail(isNetworkError(error) ? 'offline' : 'send-failed', error);
  }

  // Valida el codi de 6 dígits del correu (útil a l'app instal·lada a iPhone,
  // on l'enllaç s'obre a Safari i no a l'app)
  async function verifyCode(email, code) {
    if (!sb()) throw fail('no-backend');
    const { data, error } = await sb().auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
    if (error) throw fail(isNetworkError(error) ? 'offline' : 'bad-code', error);
    return data.session;
  }

  // Carrega el compte des del servidor: perfil + estat d'accés.
  // Retorna { userId, email, name, role, status, data }
  //   status: 'teacher' | 'active' | 'revoked' | 'missing'
  async function loadAccount(session) {
    const user = session.user;
    try {
      const { data: profile, error: pErr } = await sb()
        .from('profiles').select('id, email, name, role, data').eq('id', user.id).maybeSingle();
      if (pErr) throw pErr;

      let status;
      if (profile && profile.role === 'teacher') {
        status = 'teacher';
      } else {
        const { data: st, error: cErr } = await sb().rpc('claim_invite');
        if (cErr) throw cErr;
        status = st === 'invited' ? 'active' : st; // 'active' | 'revoked' | 'missing'
      }

      const acc = {
        userId: user.id,
        email: (profile && profile.email) || user.email,
        name: (profile && profile.name) || '',
        role: status === 'teacher' ? 'teacher' : 'student',
        status,
        data: (profile && profile.data) || {},
      };
      if (status === 'teacher' || status === 'active') writeCache(acc); else clearCache();
      return acc;
    } catch (err) {
      if (isNetworkError(err)) {
        const cached = readCache();
        if (cached && cached.userId === user.id) return { ...cached, offline: true };
        throw fail('offline', err);
      }
      throw fail('server', err);
    }
  }

  async function saveProfile(userId, patch) {
    const cached = readCache();
    if (cached && cached.userId === userId) writeCache({ ...cached, ...patch });
    if (!sb()) return;
    const { error } = await sb().from('profiles').update(patch).eq('id', userId);
    if (error) throw fail(isNetworkError(error) ? 'offline' : 'server', error);
  }

  async function signOut() {
    try { await personalClear(); } catch (e) {}
    clearCache();
    try { if (sb()) await sb().auth.signOut(); } catch (e) {}
  }

  function onAuthChange(cb) {
    if (!sb()) return () => {};
    const { data } = sb().auth.onAuthStateChange((event, session) => cb(event, session));
    return () => { try { data.subscription.unsubscribe(); } catch (e) {} };
  }

  // ── Llista d'alumnes (només professora; ho garanteix la RLS) ────────────
  async function listMembers() {
    const { data, error } = await sb().from('members').select('*').order('invited_at', { ascending: false });
    if (error) throw fail(isNetworkError(error) ? 'offline' : 'server', error);
    return data || [];
  }
  async function addMember({ email, name, level }) {
    const { error } = await sb().from('members').insert({ email: email.trim().toLowerCase(), name: name.trim(), level });
    if (error) throw fail(error.code === '23505' ? 'duplicate' : (isNetworkError(error) ? 'offline' : 'server'), error);
  }
  async function setMemberStatus(email, status) {
    const { error } = await sb().from('members').update({ status }).eq('email', email);
    if (error) throw fail(isNetworkError(error) ? 'offline' : 'server', error);
  }
  async function removeMember(email) {
    const { error } = await sb().from('members').delete().eq('email', email);
    if (error) throw fail(isNetworkError(error) ? 'offline' : 'server', error);
  }

  // ── Pràctiques: es desen al dispositiu a l'instant i se sincronitzen ────
  // Clau per usuari, perquè dues persones al mateix mòbil no es barregin.
  const pkey = (uid) => 'elbosc-practice-' + uid;
  const readLog = (uid) => { try { return JSON.parse(localStorage.getItem(pkey(uid)) || '[]'); } catch (e) { return []; } };
  const writeLog = (uid, log) => { try { localStorage.setItem(pkey(uid), JSON.stringify(log.slice(-1000))); } catch (e) {} };
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => (Math.random() * 16 | 0).toString(16)));

  async function pushPending(uid) {
    if (!sb()) return;
    const log = readLog(uid);
    const pending = log.filter(x => !x.synced);
    if (!pending.length) return;
    const rows = pending.map(x => ({ id: x.id, user_id: uid, completed_at: x.completed_at, duration_sec: x.duration_sec, poses: x.poses }));
    const { error } = await sb().from('practice_sessions').upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
    if (error) return;
    const ids = new Set(pending.map(x => x.id));
    writeLog(uid, readLog(uid).map(x => ids.has(x.id) ? { ...x, synced: true } : x));
  }

  async function logPractice(uid, { durationSec, poses }) {
    const entry = { id: uuid(), completed_at: new Date().toISOString(), duration_sec: Math.max(0, Math.round(durationSec || 0)), poses: poses || 0, synced: false };
    writeLog(uid, [...readLog(uid), entry]);
    try { await pushPending(uid); } catch (e) {}
    return entry;
  }

  // Porta l'historial del servidor (per si ha practicat des d'un altre mòbil)
  async function refreshPractice(uid) {
    if (!sb()) return readLog(uid);
    try { await pushPending(uid); } catch (e) {}
    const since = new Date(Date.now() - 400 * 864e5).toISOString();
    const { data, error } = await sb().from('practice_sessions')
      .select('id, completed_at, duration_sec, poses').eq('user_id', uid).gte('completed_at', since)
      .order('completed_at', { ascending: true });
    if (error || !data) return readLog(uid);
    const local = readLog(uid);
    const serverIds = new Set(data.map(x => x.id));
    const merged = [...data.map(x => ({ ...x, synced: true })), ...local.filter(x => !serverIds.has(x.id) && !x.synced)];
    merged.sort((a, b) => a.completed_at < b.completed_at ? -1 : 1);
    writeLog(uid, merged);
    return merged;
  }

  // Ratxa (dies seguits fins avui o ahir), sessions totals, minuts, aquesta setmana
  function practiceStats(log) {
    const dayKey = (d) => { const x = new Date(d); return x.getFullYear() + '-' + (x.getMonth() + 1) + '-' + x.getDate(); };
    const days = new Set(log.map(x => dayKey(x.completed_at)));
    let streak = 0;
    const cur = new Date();
    if (!days.has(dayKey(cur))) cur.setDate(cur.getDate() - 1);
    while (days.has(dayKey(cur))) { streak++; cur.setDate(cur.getDate() - 1); }
    const monday = new Date(); monday.setHours(0, 0, 0, 0); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const thisWeek = new Set(log.filter(x => new Date(x.completed_at) >= monday).map(x => dayKey(x.completed_at))).size;
    const minutes = Math.round(log.reduce((s, x) => s + (x.duration_sec || 0), 0) / 60);
    return { streak, total: log.length, minutes, thisWeek };
  }

  // ── Drets RGPD ──────────────────────────────────────────────────────────
  async function deleteAccount() {
    if (!sb()) throw fail('no-backend');
    const { error } = await sb().rpc('delete_my_account');
    if (error) throw fail(isNetworkError(error) ? 'offline' : 'server', error);
    try {
      Object.keys(localStorage).filter(k => k.indexOf('elbosc-') === 0).forEach(k => localStorage.removeItem(k));
    } catch (e) {}
    await signOut();
  }

  // Totes les dades de l'usuària en un fitxer JSON
  function exportData(account) {
    const local = {};
    try { Object.keys(localStorage).filter(k => k.indexOf('elbosc-') === 0).forEach(k => { try { local[k] = JSON.parse(localStorage.getItem(k)); } catch (e) { local[k] = localStorage.getItem(k); } }); } catch (e) {}
    const payload = { exportedAt: new Date().toISOString(), account: account ? { email: account.email, name: account.name, role: account.role, data: account.data } : null, device: local };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'el-bosc-dades-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // ── Xat ──────────────────────────────────────────────────────────────────
  // Converteix una fila de la taula messages al format de la interfície
  const toMsg = (r) => ({
    id: r.id,
    studentId: r.student_id,
    from: r.from_role,
    kind: r.kind,
    body: r.body,
    time: new Date(r.scheduled_for && new Date(r.scheduled_for) > new Date(r.created_at) ? r.scheduled_for : r.created_at).getTime(),
    status: r.scheduled_for && new Date(r.scheduled_for) > new Date() ? 'scheduled' : (r.read_at ? 'read' : 'delivered'),
    readAt: r.read_at,
    reactions: Array.isArray(r.reactions) ? r.reactions : [],
    scheduled: r.scheduled_for ? new Date(r.scheduled_for).getTime() : null,
    broadcast: r.broadcast || null,
  });

  const MEDIA = { audio: 1, image: 1, pdf: 1 };
  const urlCache = {};
  // Afegeix una URL temporal (signada) als missatges amb fitxer
  async function withUrls(msgs) {
    const need = [...new Set(msgs.filter(m => MEDIA[m.kind] && m.body && m.body.path && !urlCache[m.body.path]).map(m => m.body.path))];
    if (need.length && sb()) {
      try {
        const { data } = await sb().storage.from('chat').createSignedUrls(need, 60 * 60 * 6);
        (data || []).forEach(d => { if (d.signedUrl) urlCache[d.path] = d.signedUrl; });
      } catch (e) {}
    }
    return msgs.map(m => (MEDIA[m.kind] && m.body && m.body.path && urlCache[m.body.path]) ? { ...m, body: { ...m.body, url: urlCache[m.body.path] } } : m);
  }

  async function chatMessages(studentId) {
    let q = sb().from('messages').select('*').order('created_at', { ascending: true }).limit(2000);
    if (studentId) q = q.eq('student_id', studentId);
    const { data, error } = await q;
    if (error) throw fail(isNetworkError(error) ? 'offline' : 'server', error);
    return withUrls((data || []).map(toMsg));
  }

  // Alumnes per a la safata de la professora: llista + perfil + última pràctica
  async function chatStudents() {
    const [mem, prof, prac] = await Promise.all([
      sb().from('members').select('email, name, level, status').neq('status', 'revoked'),
      sb().from('profiles').select('id, email, name, data').eq('role', 'student'),
      sb().from('practice_sessions').select('user_id, completed_at').order('completed_at', { ascending: false }).limit(2000),
    ]);
    if (mem.error || prof.error) throw fail(isNetworkError(mem.error || prof.error) ? 'offline' : 'server', mem.error || prof.error);
    const byEmail = {}; (prof.data || []).forEach(p => { byEmail[p.email] = p; });
    const last = {}; (prac.data || []).forEach(r => { if (!last[r.user_id]) last[r.user_id] = r.completed_at; });
    return (mem.data || []).map(m => {
      const p = byEmail[m.email];
      const qp = (p && p.data && p.data.profile) || {};
      const name = (p && p.name) || m.name || m.email;
      const lp = p && last[p.id];
      return {
        id: p ? p.id : null,            // null = encara no ha entrat mai
        email: m.email,
        name,
        initials: name.charAt(0).toUpperCase(),
        level: qp.level || m.level || 'principiant',
        frequency: qp.frequency || 0,
        focus: qp.focusZones || [],
        injuries: [...(qp.currentInjuries || []), ...(qp.conditions || [])],
        goals: qp.goals || [],
        lastPracticeDays: lp ? Math.floor((Date.now() - new Date(lp).getTime()) / 864e5) : null,
        online: false,
        joined: !!p,
      };
    });
  }

  async function chatSend(studentId, role, payload) {
    const row = {
      student_id: studentId,
      from_role: role,
      kind: payload.kind,
      body: payload.body,
      broadcast: payload.broadcast || null,
      scheduled_for: payload.scheduled ? new Date(payload.scheduled).toISOString() : null,
    };
    const { data, error } = await sb().from('messages').insert(row).select('*').single();
    if (error) throw fail(isNetworkError(error) ? 'offline' : 'server', error);
    return (await withUrls([toMsg(data)]))[0];
  }

  // Marca com a llegits els missatges que ha enviat l'altra part
  async function chatMarkRead(studentId, role) {
    const other = role === 'teacher' ? 'student' : 'teacher';
    await sb().from('messages').update({ read_at: new Date().toISOString() })
      .eq('student_id', studentId).eq('from_role', other).is('read_at', null);
  }

  async function chatReact(msgId, reactions) {
    const { error } = await sb().from('messages').update({ reactions }).eq('id', msgId);
    if (error) throw fail(isNetworkError(error) ? 'offline' : 'server', error);
  }

  // Puja un fitxer (àudio, imatge, PDF) a la carpeta de l'alumna
  async function chatUpload(studentId, blob, ext) {
    const path = studentId + '/' + uuid() + '.' + ext;
    const { error } = await sb().storage.from('chat').upload(path, blob, { contentType: blob.type || undefined, upsert: false });
    if (error) throw fail(isNetworkError(error) ? 'offline' : 'upload', error);
    return path;
  }

  // Escolta missatges nous i canvis (llegit, reaccions) en temps real
  function chatSubscribe(onRow) {
    if (!sb() || !sb().channel) return () => {};
    const ch = sb().channel('messages-' + uuid())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (ev) => {
        if (ev.new && ev.new.id) withUrls([toMsg(ev.new)]).then(([m]) => onRow(ev.eventType, m)).catch(() => {});
      })
      .subscribe();
    return () => { try { sb().removeChannel(ch); } catch (e) {} };
  }

  async function notesList(studentId) {
    const { data, error } = await sb().from('student_notes').select('*').eq('student_id', studentId).order('created_at', { ascending: true });
    if (error) throw fail(isNetworkError(error) ? 'offline' : 'server', error);
    return (data || []).map(n => ({ id: n.id, body: n.body, time: new Date(n.created_at).getTime() }));
  }
  async function notesAdd(studentId, body) {
    const { error } = await sb().from('student_notes').insert({ student_id: studentId, body });
    if (error) throw fail(isNetworkError(error) ? 'offline' : 'server', error);
  }
  async function notesRemove(id) {
    const { error } = await sb().from('student_notes').delete().eq('id', id);
    if (error) throw fail(isNetworkError(error) ? 'offline' : 'server', error);
  }

  // ── Diari i calendari personals ─────────────────────────────────────────
  // Es desen al mòbil a l'instant (com sempre) i se'n guarda còpia a
  // public.personal_items, que només pot llegir la mateixa alumna.
  const PERSONAL = { journal: 'elbosc-journal', calendar: 'elbosc-calendar-notes' };
  const snapKey = (kind) => 'elbosc-sync-snap-' + kind;      // últim estat conegut (id → json)
  const queueKey = (kind) => 'elbosc-sync-queue-' + kind;    // canvis pendents d'enviar
  const rj = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const wj = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  let personalUid = null;
  let applyingRemote = false;

  // Calcula què ha canviat respecte de l'últim estat i ho posa a la cua
  function personalChanged(kind, arr) {
    if (applyingRemote || !PERSONAL[kind]) return;
    const snap = rj(snapKey(kind), {});
    const q = rj(queueKey(kind), {});
    const now = {};
    (arr || []).forEach(it => { if (it && it.id) now[it.id] = JSON.stringify(it); });
    Object.keys(now).forEach(id => { if (snap[id] !== now[id]) q[id] = { op: 'upsert', item: JSON.parse(now[id]) }; });
    Object.keys(snap).forEach(id => { if (!(id in now)) q[id] = { op: 'delete' }; });
    wj(snapKey(kind), now); wj(queueKey(kind), q);
    personalFlush(kind).catch(() => {});
  }

  async function personalFlush(kind) {
    if (!sb() || !personalUid) return;
    const q = rj(queueKey(kind), {});
    for (const id of Object.keys(q)) {
      const op = q[id];
      const res = op.op === 'delete'
        ? await sb().from('personal_items').delete().eq('kind', kind).eq('id', id)
        : await sb().from('personal_items').upsert({ user_id: personalUid, kind, id, payload: op.item, updated_at: new Date().toISOString() });
      if (res.error) return;
      const cur = rj(queueKey(kind), {}); delete cur[id]; wj(queueKey(kind), cur);
    }
  }

  // Porta el que hi ha al compte i ho combina amb el mòbil.
  // El primer cop en un dispositiu, puja el que ja hi havia.
  async function personalSync(uid) {
    personalUid = uid;
    if (!sb()) return false;
    let changed = false;
    for (const kind of Object.keys(PERSONAL)) {
      try {
        const firstTime = localStorage.getItem(snapKey(kind)) == null;
        if (firstTime) personalChanged(kind, rj(PERSONAL[kind], []));
        await personalFlush(kind);
        const { data, error } = await sb().from('personal_items').select('id, payload').eq('kind', kind);
        if (error || !data) continue;
        const q = rj(queueKey(kind), {});
        const byId = {};
        data.forEach(r => { byId[r.id] = r.payload; });
        Object.keys(q).forEach(id => { if (q[id].op === 'delete') delete byId[id]; else byId[id] = q[id].item; });
        const merged = Object.values(byId);
        const before = JSON.stringify(rj(PERSONAL[kind], []));
        const snap = {}; data.forEach(r => { snap[r.id] = JSON.stringify(r.payload); });
        applyingRemote = true;
        wj(PERSONAL[kind], merged);
        applyingRemote = false;
        wj(snapKey(kind), { ...snap, ...Object.fromEntries(Object.entries(q).filter(([, o]) => o.op === 'upsert').map(([id, o]) => [id, JSON.stringify(o.item)])) });
        if (before !== JSON.stringify(merged)) changed = true;
      } catch (e) { applyingRemote = false; }
    }
    if (changed) { try { window.dispatchEvent(new Event('elbosc-personal-sync')); } catch (e) {} }
    return changed;
  }

  // En sortir: envia el pendent i treu el diari del mòbil (ja és al compte)
  async function personalClear() {
    for (const kind of Object.keys(PERSONAL)) {
      try { await personalFlush(kind); } catch (e) {}
      const pending = Object.keys(rj(queueKey(kind), {})).length;
      if (!pending) [PERSONAL[kind], snapKey(kind), queueKey(kind)].forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
    }
    personalUid = null;
  }

  window.EBPersonal = { changed: personalChanged, sync: personalSync, flush: personalFlush, clear: personalClear };

  window.EBChat = {
    messages: chatMessages, students: chatStudents, send: chatSend, markRead: chatMarkRead,
    react: chatReact, upload: chatUpload, subscribe: chatSubscribe,
    notes: notesList, addNote: notesAdd, removeNote: notesRemove,
  };

  window.EBBackend = {
    available: () => !!sb(),
    getSession, sendLoginEmail, verifyCode, loadAccount, saveProfile, signOut, onAuthChange,
    listMembers, addMember, setMemberStatus, removeMember,
    readCache,
    logPractice, refreshPractice, readPracticeLog: readLog, practiceStats,
    deleteAccount, exportData,
  };
})();
