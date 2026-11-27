// components/Teacher.jsx — Panell de seguiment de la professora.
//   Llista d'alumnes amb avisos (no practica, molèsties), fitxa de cada alumna,
//   assignar una rutina i informe imprimible.

const TP_T = {
  ca: {
    title: 'Seguiment', sub: 'Les teves alumnes · El Bosc',
    active: 'alumnes', thisWeek: 'han practicat aquesta setmana', alerts: 'avisos',
    never: 'Encara no ha practicat', today: 'Avui', yesterday: 'Ahir', daysAgo: 'Fa {n} dies',
    inactive: 'Fa dies que no practica', pain: 'Molèsties recents',
    loading: 'Carregant…', empty: 'Encara no hi ha cap alumna que hagi entrat a l\'app.', error: 'No s\'ha pogut carregar. Comprova la connexió.', retry: 'Tornar-ho a provar',
    back: 'Tornar', close: 'Tancar',
    s30: 'pràctiques (30 dies)', min30: 'minuts (30 dies)', feel: 'com se sent (mitjana)',
    profile: 'Perfil', level: 'Nivell', goals: 'Objectius', injuries: 'Lesions i condicions', none: '—',
    history: 'Últimes pràctiques', noHistory: 'Cap pràctica encara.',
    breath: 'Respiració', med: 'Meditació', session: 'Sessió', minutes: 'min',
    energy: { low: 'cansada', ok: 'normal', high: 'amb energia' }, hurtToday: 'molèstia a',
    assigned: 'Rutines assignades', pending: 'Pendent', done: 'Feta',
    assign: 'Assignar una rutina', choose: 'Tria una rutina', notePh: 'Nota per a l\'alumna (opcional)', send: 'Assignar',
    noRoutines: 'Encara no has creat cap rutina. Crea-les a Configuració → Crear rutines.',
    report: 'Informe', print: 'Imprimir o desar PDF', reportTitle: 'Informe de seguiment',
    period: 'Últims 30 dies', generated: 'Generat el', remove: 'Treure',
  },
  es: {
    title: 'Seguimiento', sub: 'Tus alumnas · El Bosc',
    active: 'alumnas', thisWeek: 'han practicado esta semana', alerts: 'avisos',
    never: 'Aún no ha practicado', today: 'Hoy', yesterday: 'Ayer', daysAgo: 'Hace {n} días',
    inactive: 'Hace días que no practica', pain: 'Molestias recientes',
    loading: 'Cargando…', empty: 'Aún no hay ninguna alumna que haya entrado en la app.', error: 'No se ha podido cargar. Comprueba la conexión.', retry: 'Volver a probar',
    back: 'Volver', close: 'Cerrar',
    s30: 'prácticas (30 días)', min30: 'minutos (30 días)', feel: 'cómo se siente (media)',
    profile: 'Perfil', level: 'Nivel', goals: 'Objetivos', injuries: 'Lesiones y condiciones', none: '—',
    history: 'Últimas prácticas', noHistory: 'Ninguna práctica todavía.',
    breath: 'Respiración', med: 'Meditación', session: 'Sesión', minutes: 'min',
    energy: { low: 'cansada', ok: 'normal', high: 'con energía' }, hurtToday: 'molestia en',
    assigned: 'Rutinas asignadas', pending: 'Pendiente', done: 'Hecha',
    assign: 'Asignar una rutina', choose: 'Elige una rutina', notePh: 'Nota para la alumna (opcional)', send: 'Asignar',
    noRoutines: 'Aún no has creado ninguna rutina. Créalas en Configuración → Crear rutinas.',
    report: 'Informe', print: 'Imprimir o guardar PDF', reportTitle: 'Informe de seguimiento',
    period: 'Últimos 30 días', generated: 'Generado el', remove: 'Quitar',
  },
  en: {
    title: 'Progress', sub: 'Your students · El Bosc',
    active: 'students', thisWeek: 'practised this week', alerts: 'alerts',
    never: 'Hasn\'t practised yet', today: 'Today', yesterday: 'Yesterday', daysAgo: '{n} days ago',
    inactive: 'Hasn\'t practised for a while', pain: 'Recent discomfort',
    loading: 'Loading…', empty: 'No students have signed in yet.', error: 'Couldn\'t load. Check your connection.', retry: 'Try again',
    back: 'Back', close: 'Close',
    s30: 'practices (30 days)', min30: 'minutes (30 days)', feel: 'how she feels (average)',
    profile: 'Profile', level: 'Level', goals: 'Goals', injuries: 'Injuries and conditions', none: '—',
    history: 'Recent practices', noHistory: 'No practices yet.',
    breath: 'Breathing', med: 'Meditation', session: 'Session', minutes: 'min',
    energy: { low: 'tired', ok: 'normal', high: 'energetic' }, hurtToday: 'discomfort in',
    assigned: 'Assigned routines', pending: 'Pending', done: 'Done',
    assign: 'Assign a routine', choose: 'Choose a routine', notePh: 'Note for the student (optional)', send: 'Assign',
    noRoutines: 'You haven\'t created any routines yet. Create them in Settings → Create routines.',
    report: 'Report', print: 'Print or save PDF', reportTitle: 'Progress report',
    period: 'Last 30 days', generated: 'Generated on', remove: 'Remove',
  },
};
const TP_FACES = ['☁️', '🌫️', '🌿', '🌸', '✨'];

// Càlculs per alumna
const tpSummary = (st) => {
  const now = Date.now();
  const ps = st.practices || [];
  const last = ps[0] ? new Date(ps[0].completed_at).getTime() : null;
  const daysSince = last == null ? null : Math.floor((now - last) / 864e5);
  const monday = new Date(); monday.setHours(0, 0, 0, 0); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const week = new Set(ps.filter(p => new Date(p.completed_at) >= monday).map(p => new Date(p.completed_at).toDateString())).size;
  const p30 = ps.filter(p => now - new Date(p.completed_at).getTime() < 30 * 864e5);
  const feels = p30.map(p => p.feeling).filter(Boolean);
  const pain = ps.filter(p => now - new Date(p.completed_at).getTime() < 14 * 864e5 &&
    (p.discomfort || (p.checkin && p.checkin.discomfort && p.checkin.discomfort.length)));
  return {
    daysSince, week, n30: p30.length,
    min30: Math.round(p30.reduce((s, p) => s + (p.duration_sec || 0), 0) / 60),
    feelAvg: feels.length ? feels.reduce((a, b) => a + b, 0) / feels.length : null,
    lastFeeling: (ps.find(p => p.feeling) || {}).feeling || null,
    pain, inactive: daysSince == null || daysSince >= 7,
  };
};

const tpAgo = (t, d) => d == null ? t.never : d === 0 ? t.today : d === 1 ? t.yesterday : t.daysAgo.replace('{n}', d);
const tpDate = (iso, lang) => { try { return new Date(iso).toLocaleDateString(lang === 'ca' ? 'ca-ES' : lang, { day:'numeric', month:'short' }); } catch (e) { return ''; } };
const tpKind = (t, p) => (p.checkin && p.checkin.type === 'respiracio') ? t.breath : (p.checkin && p.checkin.type === 'meditacio') ? t.med : t.session;

const TrackingPanel = ({ lang = 'ca', onClose }) => {
  const t = TP_T[lang] || TP_T.ca;
  const [data, setData] = React.useState(null);
  const [err, setErr] = React.useState('');
  const [openId, setOpenId] = React.useState(null);
  const [report, setReport] = React.useState(false);

  const load = () => {
    setErr('');
    window.EBTeacher.tracking().then(setData).catch(() => { setErr(t.error); setData(d => d || []); });
  };
  React.useEffect(load, []);

  const rows = (data || []).map(st => ({ st, sm: tpSummary(st) }))
    .sort((a, b) => (b.sm.pain.length > 0) - (a.sm.pain.length > 0) || (b.sm.inactive - a.sm.inactive) || ((a.sm.daysSince ?? 999) - (b.sm.daysSince ?? 999)));
  const open = rows.find(r => r.st.id === openId);
  const practisedWeek = rows.filter(r => r.sm.week > 0).length;
  const alerts = rows.filter(r => r.sm.pain.length || r.sm.inactive).length;

  const shell = { position:'fixed', inset:0, zIndex:9999, background:'var(--paper)', display:'flex', flexDirection:'column' };
  const head = (title, onBack) => (
    <div style={{ padding:'calc(env(safe-area-inset-top, 0px) + 20px) 20px 12px', borderBottom:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)', display:'flex', alignItems:'center', gap:12 }}>
      <button aria-label={onBack ? t.back : t.close} onClick={onBack || onClose} style={{ background:'transparent', border:'none', cursor:'pointer', padding:6 }}>
        <Icon name={onBack ? 'back' : 'close'} size={20} color="var(--ink-soft)"/>
      </button>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:'var(--sans)', fontSize:10, letterSpacing:'0.2em', color:'var(--accent)', textTransform:'uppercase' }}>{t.sub}</div>
        <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:22, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</div>
      </div>
    </div>
  );

  if (open && report) return <ReportView lang={lang} st={open.st} sm={open.sm} onClose={() => setReport(false)}/>;
  if (open) return (
    <div style={shell}>
      {head(open.st.name, () => setOpenId(null))}
      <StudentDetail lang={lang} st={open.st} sm={open.sm} onChanged={load} onReport={() => setReport(true)}/>
    </div>
  );

  return (
    <div style={shell}>
      {head(t.title)}
      <div className="yb-scroll" style={{ flex:1, overflowY:'auto', padding:'14px 16px calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
        {err && <div role="alert" style={{ fontFamily:'var(--sans)', fontSize:13, color:'var(--accent)', textAlign:'center', padding:10 }}>{err} <button onClick={load} style={{ background:'none', border:'none', color:'var(--accent)', textDecoration:'underline', cursor:'pointer', font:'inherit' }}>{t.retry}</button></div>}
        {data === null && <div style={{ textAlign:'center', padding:32, fontFamily:'var(--sans)', color:'var(--ink-soft)' }}>{t.loading}</div>}
        {data && !data.length && !err && <div style={{ textAlign:'center', padding:32, fontFamily:'var(--sans)', fontSize:14, color:'var(--ink-soft)' }}>{t.empty}</div>}
        {rows.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginBottom:16 }}>
            {[[rows.length, t.active], [practisedWeek, t.thisWeek], [alerts, t.alerts]].map(([v, l], i) => (
              <div key={i} className="yb-card" style={{ padding:'12px 10px', textAlign:'center' }}>
                <div style={{ fontFamily:'var(--serif)', fontSize:28, fontStyle:'italic', color: i === 2 && v ? 'var(--accent)' : 'var(--ink)' }}>{v}</div>
                <div style={{ fontFamily:'var(--sans)', fontSize:11, color:'var(--ink-soft)', lineHeight:1.3 }}>{l}</div>
              </div>
            ))}
          </div>
        )}
        {rows.map(({ st, sm }) => (
          <button key={st.id} onClick={() => setOpenId(st.id)} className="yb-card"
            style={{ width:'100%', display:'flex', gap:12, alignItems:'center', padding:'12px 14px', marginBottom:8, border:'none', cursor:'pointer', textAlign:'left', color:'var(--ink)' }}>
            <span aria-hidden="true" style={{ width:40, height:40, borderRadius:'50%', background:'var(--accent)', color:'var(--cream)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--serif)', fontSize:18, flexShrink:0 }}>{st.initials}</span>
            <span style={{ flex:1, minWidth:0 }}>
              <span style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                <span style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:17 }}>{st.name}</span>
                {sm.pain.length > 0 && <span style={{ fontFamily:'var(--sans)', fontSize:10, padding:'2px 8px', borderRadius:999, background:'color-mix(in srgb, #C0503A 15%, transparent)', color:'#A3392B' }}>{t.pain}</span>}
                {sm.inactive && <span style={{ fontFamily:'var(--sans)', fontSize:10, padding:'2px 8px', borderRadius:999, background:'color-mix(in srgb, var(--ink) 8%, transparent)', color:'var(--ink-soft)' }}>{t.inactive}</span>}
              </span>
              <span style={{ display:'block', fontFamily:'var(--sans)', fontSize:12, color:'var(--ink-soft)', marginTop:2 }}>
                {tpAgo(t, sm.daysSince)} · {sm.week}/{st.frequency || 3} {t.thisWeek.split(' ').slice(-2).join(' ')}
              </span>
            </span>
            {sm.lastFeeling && <span aria-hidden="true" style={{ fontSize:20 }}>{TP_FACES[sm.lastFeeling - 1]}</span>}
            <Icon name="next" size={14} color="var(--ink-soft)"/>
          </button>
        ))}
      </div>
    </div>
  );
};

const StudentDetail = ({ lang, st, sm, onChanged, onReport }) => {
  const t = TP_T[lang] || TP_T.ca;
  const routines = window.EBRoutines ? window.EBRoutines.load() : [];
  const [rid, setRid] = React.useState('');
  const [note, setNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const label = { fontFamily:'var(--sans)', fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--accent)', margin:'22px 0 10px' };
  const inp = { width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:12, border:'1.5px solid color-mix(in srgb, var(--ink) 12%, transparent)', background:'var(--cream)', color:'var(--ink)', fontFamily:'var(--sans)', fontSize:15 };

  const assign = async () => {
    const r = routines.find(x => x.id === rid); if (!r) return;
    setBusy(true); setMsg('');
    try { await window.EBTeacher.assign(st.id, r, note); setRid(''); setNote(''); onChanged(); }
    catch (e) { setMsg(t.error); }
    setBusy(false);
  };

  return (
    <div className="yb-scroll" style={{ flex:1, overflowY:'auto', padding:'14px 18px calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
        {[[sm.n30, t.s30], [sm.min30, t.min30], [sm.feelAvg ? TP_FACES[Math.round(sm.feelAvg) - 1] : '—', t.feel]].map(([v, l], i) => (
          <div key={i} className="yb-card" style={{ padding:'12px 8px', textAlign:'center' }}>
            <div style={{ fontFamily:'var(--serif)', fontSize:26, fontStyle:'italic' }}>{v}</div>
            <div style={{ fontFamily:'var(--sans)', fontSize:11, color:'var(--ink-soft)', lineHeight:1.3 }}>{l}</div>
          </div>
        ))}
      </div>
      <button className="yb-btn yb-btn-ghost" style={{ width:'100%', marginTop:12 }} onClick={onReport}>
        <Icon name="pdf" size={14} color="currentColor"/> {t.report}
      </button>

      <div style={label}>{t.profile}</div>
      <div style={{ fontFamily:'var(--sans)', fontSize:14, lineHeight:1.7, color:'var(--ink)' }}>
        <div><b>{t.level}:</b> {st.level || t.none}</div>
        <div><b>{t.goals}:</b> {(st.goals || []).join(', ') || t.none}</div>
        <div><b>{t.injuries}:</b> {(st.injuries || []).join(', ') || t.none}</div>
      </div>

      <div style={label}>{t.assign}</div>
      {routines.length === 0 ? (
        <p style={{ fontFamily:'var(--sans)', fontSize:13, color:'var(--ink-soft)', margin:0 }}>{t.noRoutines}</p>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <select id="tp-routine" aria-label={t.choose} value={rid} onChange={e => setRid(e.target.value)} style={inp}>
            <option value="">{t.choose}</option>
            {routines.map(r => <option key={r.id} value={r.id}>{r.name} · {(r.poseIds || []).length}</option>)}
          </select>
          <input id="tp-note" aria-label={t.notePh} value={note} onChange={e => setNote(e.target.value)} placeholder={t.notePh} style={inp}/>
          <button className="yb-btn yb-btn-clay" disabled={!rid || busy} style={{ opacity: rid ? 1 : 0.5 }} onClick={assign}>{t.send}</button>
          {msg && <div role="alert" style={{ fontFamily:'var(--sans)', fontSize:12, color:'var(--accent)' }}>{msg}</div>}
        </div>
      )}
      {(st.assignments || []).length > 0 && (
        <>
          <div style={label}>{t.assigned}</div>
          {st.assignments.map(a => (
            <div key={a.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, padding:'8px 0', borderBottom:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)', fontFamily:'var(--sans)', fontSize:14 }}>
              <span style={{ minWidth:0 }}>{a.routine && a.routine.name} <span style={{ color:'var(--ink-soft)', fontSize:12 }}>· {tpDate(a.created_at, lang)}</span></span>
              <span style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
                <span style={{ fontSize:11, padding:'2px 8px', borderRadius:999, background: a.done_at ? 'color-mix(in srgb, var(--leaf) 18%, transparent)' : 'color-mix(in srgb, var(--accent) 14%, transparent)', color: a.done_at ? 'var(--leaf-deep)' : 'var(--accent)' }}>{a.done_at ? t.done : t.pending}</span>
                {!a.done_at && <button aria-label={t.remove} onClick={() => window.EBTeacher.unassign(a.id).then(onChanged).catch(() => {})} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}><Icon name="close" size={12} color="var(--ink-soft)"/></button>}
              </span>
            </div>
          ))}
        </>
      )}

      <div style={label}>{t.history}</div>
      {(st.practices || []).length === 0 && <p style={{ fontFamily:'var(--sans)', fontSize:13, color:'var(--ink-soft)', margin:0 }}>{t.noHistory}</p>}
      {(st.practices || []).slice(0, 20).map(p => <PracticeRow key={p.id} t={t} lang={lang} p={p}/>)}
    </div>
  );
};

const PracticeRow = ({ t, lang, p }) => (
  <div style={{ padding:'10px 0', borderBottom:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)', fontFamily:'var(--sans)', fontSize:13, color:'var(--ink)' }}>
    <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
      <span>{tpDate(p.completed_at, lang)} · {tpKind(t, p)} · {Math.max(1, Math.round((p.duration_sec || 0) / 60))} {t.minutes}</span>
      {p.feeling && <span aria-label={'feeling ' + p.feeling}>{TP_FACES[p.feeling - 1]}</span>}
    </div>
    {p.checkin && (p.checkin.energy || (p.checkin.discomfort || []).length > 0) && (
      <div style={{ color:'var(--ink-soft)', fontSize:12, marginTop:2 }}>
        {p.checkin.energy ? t.energy[p.checkin.energy] : ''}{(p.checkin.discomfort || []).length ? ' · ' + t.hurtToday + ' ' + p.checkin.discomfort.join(', ').toLowerCase() : ''}
      </div>
    )}
    {p.discomfort && <div style={{ color:'#A3392B', fontSize:12, marginTop:2 }}>“{p.discomfort}”</div>}
  </div>
);

// Informe imprimible (els estils d'impressió amaguen la resta de l'app)
const ReportView = ({ lang, st, sm, onClose }) => {
  const t = TP_T[lang] || TP_T.ca;
  const p30 = (st.practices || []).filter(p => Date.now() - new Date(p.completed_at).getTime() < 30 * 864e5);
  return (
    <div className="eb-print" style={{ position:'fixed', inset:0, zIndex:10000, background:'#fff', color:'#222', overflowY:'auto' }}>
      <div className="eb-noprint" style={{ display:'flex', gap:8, padding:'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', background:'var(--paper)', borderBottom:'1px solid #ddd', position:'sticky', top:0 }}>
        <button className="yb-btn yb-btn-ghost" onClick={onClose}>{t.back}</button>
        <button className="yb-btn yb-btn-clay" onClick={() => window.print()}>{t.print}</button>
      </div>
      <div style={{ maxWidth:720, margin:'0 auto', padding:'28px 24px 48px', fontFamily:'Georgia, serif' }}>
        <div style={{ fontFamily:'Arial, sans-serif', fontSize:11, letterSpacing:'0.2em', color:'#8C5232', textTransform:'uppercase' }}>El Bosc · {t.reportTitle}</div>
        <h1 style={{ fontStyle:'italic', fontWeight:500, fontSize:32, margin:'6px 0 4px' }}>{st.name}</h1>
        <div style={{ fontFamily:'Arial, sans-serif', fontSize:12, color:'#666' }}>{t.period} · {t.generated} {new Date().toLocaleDateString(lang === 'ca' ? 'ca-ES' : lang)}</div>
        <table style={{ width:'100%', borderCollapse:'collapse', margin:'20px 0', fontFamily:'Arial, sans-serif', fontSize:13 }}>
          <tbody>
            <tr><td style={{ padding:'6px 0', color:'#666' }}>{t.s30}</td><td style={{ textAlign:'right' }}>{sm.n30}</td></tr>
            <tr><td style={{ padding:'6px 0', color:'#666' }}>{t.min30}</td><td style={{ textAlign:'right' }}>{sm.min30}</td></tr>
            <tr><td style={{ padding:'6px 0', color:'#666' }}>{t.feel}</td><td style={{ textAlign:'right' }}>{sm.feelAvg ? sm.feelAvg.toFixed(1) + ' / 5' : '—'}</td></tr>
            <tr><td style={{ padding:'6px 0', color:'#666' }}>{t.level}</td><td style={{ textAlign:'right' }}>{st.level || '—'}</td></tr>
            <tr><td style={{ padding:'6px 0', color:'#666' }}>{t.goals}</td><td style={{ textAlign:'right' }}>{(st.goals || []).join(', ') || '—'}</td></tr>
            <tr><td style={{ padding:'6px 0', color:'#666' }}>{t.injuries}</td><td style={{ textAlign:'right' }}>{(st.injuries || []).join(', ') || '—'}</td></tr>
          </tbody>
        </table>
        <h2 style={{ fontStyle:'italic', fontWeight:500, fontSize:20, margin:'20px 0 6px' }}>{t.history}</h2>
        {p30.length === 0 && <p style={{ fontFamily:'Arial, sans-serif', fontSize:13, color:'#666' }}>{t.noHistory}</p>}
        {p30.map(p => (
          <div key={p.id} style={{ fontFamily:'Arial, sans-serif', fontSize:12.5, padding:'6px 0', borderBottom:'1px solid #eee' }}>
            <b>{tpDate(p.completed_at, lang)}</b> · {tpKind(t, p)} · {Math.max(1, Math.round((p.duration_sec || 0) / 60))} {t.minutes}
            {p.feeling ? ' · ' + p.feeling + '/5' : ''}
            {p.checkin && p.checkin.energy ? ' · ' + t.energy[p.checkin.energy] : ''}
            {p.checkin && (p.checkin.discomfort || []).length ? ' · ' + t.hurtToday + ' ' + p.checkin.discomfort.join(', ').toLowerCase() : ''}
            {p.discomfort ? <div style={{ color:'#A3392B' }}>“{p.discomfort}”</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
};

// Rutina assignada a l'alumna: targeta a l'inici
const AssignedRoutineCard = ({ lang, assignment, onStart }) => {
  if (!assignment) return null;
  const L = {
    kicker: {ca:'La Cèlia t\'ha preparat', es:'Cèlia te ha preparado', en:'Cèlia prepared for you'}[lang],
    start: {ca:'Començar', es:'Empezar', en:'Start'}[lang],
    poses: {ca:'postures', es:'posturas', en:'poses'}[lang],
  };
  const r = assignment.routine || {};
  return (
    <div className="yb-card" style={{ margin:'16px 24px 0', padding:'16px 18px', background:'color-mix(in srgb, var(--accent) 10%, var(--cream))', display:'flex', gap:14, alignItems:'center' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:'var(--sans)', fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--accent)' }}>{L.kicker}</div>
        <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:22, color:'var(--ink)' }}>{r.name}</div>
        <div style={{ fontFamily:'var(--sans)', fontSize:12, color:'var(--ink-soft)' }}>{(r.poseIds || []).length} {L.poses}{assignment.note ? ' · ' + assignment.note : ''}</div>
      </div>
      <button className="yb-btn yb-btn-clay" onClick={() => onStart(assignment)}>{L.start}</button>
    </div>
  );
};

Object.assign(window, { TrackingPanel, AssignedRoutineCard });
