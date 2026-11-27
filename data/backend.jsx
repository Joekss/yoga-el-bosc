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

  window.EBBackend = {
    available: () => !!sb(),
    getSession, sendLoginEmail, verifyCode, loadAccount, saveProfile, signOut, onAuthChange,
    listMembers, addMember, setMemberStatus, removeMember,
    readCache,
    logPractice, refreshPractice, readPracticeLog: readLog, practiceStats,
    deleteAccount, exportData,
  };
})();
