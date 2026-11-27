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
      gte() { return api; }, neq() { return api; }, is(k) { st.isNull = k; return api; }, limit() { return api; },
      single() { return run(true); },
      insert(p) { st.op = 'insert'; st.payload = p; return api; },
      delete() { st.op = 'delete'; return api; },
      maybeSingle() { return run(true); },
      then(res, rej) { return run(false).then(res, rej); },
    };
    const run = async (single) => {
      window.__sbCalls.push({ table, op: st.op, payload: st.payload, filters: st.filters });
      const c = cfg(); const s = getS();
      if (table === 'profiles' && st.op === 'select' && st.filters.some(f => f[0] === 'role')) {
        return { data: c.profiles || [], error: null };
      }
      if (table === 'messages') {
        let rows = JSON.parse(localStorage.getItem('fake-sb-messages') || '[]');
        if (st.op === 'insert') {
          const isTeacher = c.role === 'teacher';
          const hasTeacherMsg = rows.some(r => r.student_id === st.payload.student_id && r.from_role === 'teacher');
          if (!isTeacher && (!hasTeacherMsg || st.payload.student_id !== s.user.id)) return { data: null, error: { message: 'new row violates row-level security policy' } };
          const row = { id: 'msg-' + Math.random().toString(36).slice(2), sender_id: s.user.id, read_at: null, reactions: [], created_at: new Date().toISOString(), ...st.payload };
          rows.push(row); localStorage.setItem('fake-sb-messages', JSON.stringify(rows));
          emitRow('INSERT', row);
          return { data: row, error: null };
        }
        if (st.op === 'update') {
          const f = st.filters;
          rows.forEach(r => { if (f.every(([k, v]) => r[k] === v)) { Object.assign(r, st.payload); emitRow('UPDATE', r); } });
          localStorage.setItem('fake-sb-messages', JSON.stringify(rows));
          return { data: null, error: null };
        }
        if (c.role !== 'teacher') rows = rows.filter(r => s && r.student_id === s.user.id);
        st.filters.forEach(([k, v]) => { rows = rows.filter(r => r[k] === v); });
        return { data: rows, error: null };
      }
      if (table === 'student_notes') {
        let rows = JSON.parse(localStorage.getItem('fake-sb-notes') || '[]');
        if (st.op === 'insert') { rows.push({ id: 'n-' + Date.now(), created_at: new Date().toISOString(), ...st.payload }); localStorage.setItem('fake-sb-notes', JSON.stringify(rows)); return { data: null, error: null }; }
        return { data: rows.filter(r => st.filters.every(([k, v]) => r[k] === v)), error: null };
      }
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
      if (table === 'assignments') {
        let rows = JSON.parse(localStorage.getItem('fake-sb-assignments') || '[]');
        const match = (r) => st.filters.every(([k, v]) => r[k] === v);
        if (st.op === 'insert') { if (c.role !== 'teacher') return { data: null, error: { message: 'rls' } }; rows.push({ id: 'a-' + Math.random().toString(36).slice(2), created_at: new Date().toISOString(), done_at: null, ...st.payload }); }
        else if (st.op === 'update') { rows.forEach(r => { if (match(r)) Object.assign(r, st.payload); }); }
        else if (st.op === 'delete') { rows = rows.filter(r => !match(r)); }
        else {
          let out = rows.filter(match);
          if (c.role !== 'teacher') out = out.filter(r => r.student_id === s.user.id);
          if (st.isNull) out = out.filter(r => r[st.isNull] == null);
          return { data: out, error: null };
        }
        localStorage.setItem('fake-sb-assignments', JSON.stringify(rows));
        return { data: null, error: null };
      }
      if (table === 'personal_items') {
        let rows = JSON.parse(localStorage.getItem('fake-sb-personal') || '[]');
        const f = Object.fromEntries(st.filters);
        if (st.op === 'upsert') { rows = rows.filter(r => !(r.kind === st.payload.kind && r.id === st.payload.id)).concat([st.payload]); }
        if (st.op === 'delete') { rows = rows.filter(r => !(r.kind === f.kind && r.id === f.id)); }
        if (st.op === 'select') return { data: rows.filter(r => r.user_id === s.user.id && (!f.kind || r.kind === f.kind)), error: null };
        localStorage.setItem('fake-sb-personal', JSON.stringify(rows));
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
        if (st.op === 'update') { rows.forEach(r => { if (st.filters.every(([k, v]) => r[k] === v)) Object.assign(r, st.payload); }); localStorage.setItem('fake-sb-practice', JSON.stringify(rows)); return { data: null, error: null }; }
        return { data: rows, error: null };
      }
      return { data: null, error: null };
    };
    return api;
  };
  const channels = [];
  const emitRow = (eventType, row) => channels.forEach(cb => setTimeout(() => cb({ eventType, new: row }), 10));
  window.supabase = { createClient: () => ({
    channel: () => { const ch = { on: (_t, _f, cb) => { channels.push(cb); return ch; }, subscribe: () => ch }; return ch; },
    removeChannel: () => {},
    storage: { from: () => ({
      upload: async (path, blob) => { window.__sbCalls.push({ upload: path, type: blob.type }); return { data: { path }, error: null }; },
      createSignedUrl: async (path) => ({ data: { signedUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7#' + path }, error: null }),
      createSignedUrls: async (paths) => ({ data: paths.map(p => ({ path: p, signedUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' })), error: null }),
    }) },
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
