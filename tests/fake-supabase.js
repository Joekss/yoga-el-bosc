// Supabase simulat per als tests: substitueix vendor/supabase.js.
// Escenari via localStorage 'fake-sb' = { role, status, quizDone, members }
(function () {
  const cfg = () => JSON.parse(localStorage.getItem('fake-sb') || '{}');
  const SESSION_KEY = 'fake-sb-session';
  const listeners = [];
  window.__sbCalls = [];
  const getS = () => JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  const emit = (ev, s) => listeners.forEach(cb => setTimeout(() => cb(ev, s), 0));
  const q = (table) => {
    const st = { table, filters: [], op: 'select', payload: null };
    const api = {
      select() { return api; }, order() { return api; },
      eq(k, v) { st.filters.push([k, v]); return api; },
      update(p) { st.op = 'update'; st.payload = p; return api; },
      upsert(p) { st.op = 'upsert'; st.payload = p; return api; },
      gte() { return api; },
      insert(p) { st.op = 'insert'; st.payload = p; return api; },
      delete() { st.op = 'delete'; return api; },
      maybeSingle() { return run(true); },
      then(res, rej) { return run(false).then(res, rej); },
    };
    const run = async (single) => {
      window.__sbCalls.push({ table, op: st.op, payload: st.payload, filters: st.filters });
      const c = cfg(); const s = getS();
      if (table === 'profiles') {
        if (st.op === 'select') return { data: s ? { id: s.user.id, email: s.user.email, name: c.name || '', role: c.role || 'student', data: c.quizDone ? { quizDone: true, profile: { name: c.name || 'Anna' } } : {} } : null, error: null };
        return { data: null, error: null };
      }
      if (table === 'members') {
        if (c.role !== 'teacher') return { data: [], error: null };
        const m = c.members || [];
        if (st.op === 'select') return { data: m, error: null };
        if (st.op === 'insert') { m.push({ ...st.payload, status: 'invited', invited_at: new Date().toISOString() }); }
        if (st.op === 'update') { m.forEach(x => { if (x.email === st.filters[0][1]) Object.assign(x, st.payload); }); }
        if (st.op === 'delete') { c.members = m.filter(x => x.email !== st.filters[0][1]); localStorage.setItem('fake-sb', JSON.stringify(c)); return { data: null, error: null }; }
        c.members = m; localStorage.setItem('fake-sb', JSON.stringify(c));
        return { data: null, error: null };
      }
      if (table === 'catalog') {
        let rows = JSON.parse(localStorage.getItem('fake-sb-catalog') || '[]');
        if (st.op === 'upsert') { if (c.role !== 'teacher') return { data: null, error: { message: 'rls' } }; rows = rows.filter(r => !(r.kind === st.payload.kind && r.id === st.payload.id)).concat([st.payload]); }
        if (st.op === 'delete') { if (c.role !== 'teacher') return { data: null, error: { message: 'rls' } }; const f = Object.fromEntries(st.filters); rows = rows.filter(r => !(r.kind === f.kind && r.id === f.id)); }
        if (st.op === 'select') return { data: rows, error: null };
        localStorage.setItem('fake-sb-catalog', JSON.stringify(rows));
        return { data: null, error: null };
      }
      if (table === 'practice_sessions') {
        const rows = JSON.parse(localStorage.getItem('fake-sb-practice') || '[]');
        if (st.op === 'upsert') { localStorage.setItem('fake-sb-practice', JSON.stringify(rows.concat(st.payload))); return { data: null, error: null }; }
        return { data: rows, error: null };
      }
      return { data: null, error: null };
    };
    return api;
  };
  window.supabase = { createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: getS() } }),
      signInWithOtp: async ({ email }) => { window.__sbCalls.push({ otp: email }); return { error: null }; },
      verifyOtp: async ({ email, token }) => {
        if (token !== '123456') return { data: {}, error: { message: 'Token has expired or is invalid' } };
        const s = { user: { id: 'u-' + email, email } };
        localStorage.setItem(SESSION_KEY, JSON.stringify(s)); emit('SIGNED_IN', s);
        return { data: { session: s }, error: null };
      },
      signOut: async () => { localStorage.removeItem(SESSION_KEY); emit('SIGNED_OUT', null); return { error: null }; },
      onAuthStateChange: (cb) => { listeners.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
    },
    from: q,
    rpc: async (name) => { window.__sbCalls.push({ rpc: name }); if (name === 'delete_my_account') { localStorage.removeItem(SESSION_KEY); return { data: null, error: null }; } return { data: cfg().status || 'active', error: null }; },
  }) };
})();
