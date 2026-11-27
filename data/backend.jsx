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

  window.EBBackend = {
    available: () => !!sb(),
    getSession, sendLoginEmail, verifyCode, loadAccount, saveProfile, signOut, onAuthChange,
    listMembers, addMember, setMemberStatus, removeMember,
    readCache,
  };
})();
