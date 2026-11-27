// components/Screens.jsx — Dashboard, Library, PoseDetail, Calendar, Journal, Messages

const { useState: uS, useMemo: uM, useEffect: uE } = React;

// ── Notes del calendari (compartides amb l'App per als avisos) ──
const EB_NOTES_KEY = 'elbosc-calendar-notes';
const ebLoadNotes = () => { try { const s = JSON.parse(localStorage.getItem(EB_NOTES_KEY)); if (Array.isArray(s)) return s; } catch(e){} return []; };
const ebSaveNotes = (arr) => { try { localStorage.setItem(EB_NOTES_KEY, JSON.stringify(arr)); } catch(e){} try { window.EBPersonal && window.EBPersonal.changed('calendar', arr); } catch(e){} };
const ebPad = (n) => String(n).padStart(2, '0');
const ebDayKey = (y, m, d) => `${y}-${ebPad(m+1)}-${ebPad(d)}`;
const ebNoteDate = (n) => { const [Y,M,D] = String(n.date).split('-').map(Number); const [h,mi] = String(n.time||'00:00').split(':').map(Number); return new Date(Y, (M||1)-1, D||1, h||0, mi||0, 0, 0); };
if (typeof window !== 'undefined') window.EBNotes = { load: ebLoadNotes, save: ebSaveNotes, dayKey: ebDayKey, dateOf: ebNoteDate, KEY: EB_NOTES_KEY };

// ── Avisos: missatges nous i recordatori diari (notificacions push) ──
const NotificationSettings = ({ lang, role, onOpenInstall }) => {
  const [support] = uS(() => (window.EBPush ? window.EBPush.support() : 'unsupported'));
  const [on, setOn] = uS(false);
  const [messages, setMessages] = uS(true);
  const [reminder, setReminder] = uS(role !== 'teacher');
  const [time, setTime] = uS('09:00');
  const [busy, setBusy] = uS(false);
  const [msg, setMsg] = uS(null);
  const L = {
    title: {ca:'Avisos', es:'Avisos', en:'Notifications'}[lang],
    messages: {ca:'Missatges nous del xat', es:'Mensajes nuevos del chat', en:'New chat messages'}[lang],
    reminder: {ca:'Recordatori diari per practicar', es:'Recordatorio diario para practicar', en:'Daily practice reminder'}[lang],
    at: {ca:'a les', es:'a las', en:'at'}[lang],
    enable: {ca:'Activar els avisos', es:'Activar los avisos', en:'Turn on notifications'}[lang],
    save: {ca:'Desar', es:'Guardar', en:'Save'}[lang],
    off: {ca:'Desactivar en aquest mòbil', es:'Desactivar en este móvil', en:'Turn off on this phone'}[lang],
    saved: {ca:'Avisos desats.', es:'Avisos guardados.', en:'Notifications saved.'}[lang],
    disabled: {ca:'Avisos desactivats.', es:'Avisos desactivados.', en:'Notifications turned off.'}[lang],
    ios: {ca:'A l\'iPhone, primer afegeix l\'app a la pantalla d\'inici (Compartir → Afegir a la pantalla d\'inici) i obre-la des d\'allà.', es:'En el iPhone, primero añade la app a la pantalla de inicio (Compartir → Añadir a pantalla de inicio) y ábrela desde allí.', en:'On iPhone, first add the app to your Home Screen (Share → Add to Home Screen) and open it from there.'}[lang],
    unsupported: {ca:'Aquest navegador no pot enviar avisos. Obre l\'app amb Chrome (Android) o Safari (iPhone), o instal·la-la.', es:'Este navegador no puede enviar avisos. Abre la app con Chrome (Android) o Safari (iPhone), o instálala.', en:'This browser can\'t send notifications. Open the app in Chrome (Android) or Safari (iPhone), or install it.'}[lang],
    install: {ca:'Com instal·lar l\'app', es:'Cómo instalar la app', en:'How to install the app'}[lang],
    denied: {ca:'Els avisos estan bloquejats. Activa\'ls als ajustos del mòbil per a aquesta app.', es:'Los avisos están bloqueados. Actívalos en los ajustes del móvil para esta app.', en:'Notifications are blocked. Allow them in your phone settings for this app.'}[lang],
    error: {ca:'No s\'han pogut activar. Torna-ho a provar.', es:'No se han podido activar. Vuelve a probar.', en:'Couldn\'t turn them on. Try again.'}[lang],
    note: {ca:'Per privacitat, l\'avís no mostra el text del missatge. Si ja has practicat aquell dia, no et recordarem res.', es:'Por privacidad, el aviso no muestra el texto del mensaje. Si ya has practicado ese día, no te recordaremos nada.', en:'For privacy, the notification doesn\'t show the message text. If you\'ve already practised that day, we won\'t remind you.'}[lang],
  };
  uE(() => {
    if (support !== 'ok' || !window.EBPush) return;
    window.EBPush.current().then(c => { if (c) { setOn(true); setMessages(c.notify_messages); setReminder(!!c.reminder_time); if (c.reminder_time) setTime(c.reminder_time); } });
  }, []);
  const save = async () => {
    setBusy(true); setMsg(null);
    try { await window.EBPush.enable({ messages, reminderTime: reminder ? time : null, lang }); setOn(true); setMsg({ ok: true, text: L.saved }); }
    catch (e) { setMsg({ ok: false, text: e.code === 'denied' ? L.denied : L.error }); }
    setBusy(false);
  };
  const off = async () => { setBusy(true); await window.EBPush.disable(); setOn(false); setMsg({ ok: true, text: L.disabled }); setBusy(false); };
  const Switch = ({ id, checked, onChange, label }) => (
    <span className="eb-switch"><input id={id} type="checkbox" role="switch" aria-label={label} checked={checked} onChange={e => onChange(e.target.checked)}/><span/></span>
  );
  return (
    <div>
      <div className="eb-group-title">{L.title}</div>
      <div className="eb-group">
        {support !== 'ok' ? (
          <div className="eb-row" style={{ cursor:'default', alignItems:'flex-start' }}>
            <span className="eb-row-icon amber"><Icon name="bell" size={18} color="currentColor"/></span>
            <span className="eb-row-body" style={{ fontSize:14, lineHeight:1.45 }}>{L[support === 'ios-install' ? 'ios' : support]}</span>
          </div>
        ) : (
          <>
            <label htmlFor="eb-push-msg" className="eb-row">
              <span className="eb-row-icon"><Icon name="chat" size={18} color="currentColor"/></span>
              <span className="eb-row-body">{L.messages}</span>
              <Switch id="eb-push-msg" checked={messages} onChange={setMessages} label={L.messages}/>
            </label>
            <label htmlFor="eb-push-rem" className="eb-row">
              <span className="eb-row-icon amber"><Icon name="bell" size={18} color="currentColor"/></span>
              <span className="eb-row-body">{L.reminder}</span>
              <Switch id="eb-push-rem" checked={reminder} onChange={setReminder} label={L.reminder}/>
            </label>
            {reminder && (
              <div className="eb-row" style={{ cursor:'default' }}>
                <span className="eb-row-icon"><Icon name="clock" size={18} color="currentColor"/></span>
                <span className="eb-row-body">{L.at}</span>
                <input id="eb-push-time" aria-label={L.reminder} type="time" value={time} step="900" onChange={e => setTime(e.target.value || '09:00')}
                  style={{ border:'none', borderRadius:10, padding:'8px 10px', background:'color-mix(in srgb, var(--ink) 6%, transparent)', color:'var(--ink)', fontFamily:'var(--sans)', fontSize:16, fontWeight:600 }}/>
              </div>
            )}
            <div style={{ padding:'12px 16px 14px', display:'flex', flexDirection:'column', gap:8 }}>
              <button disabled={busy} onClick={save} className="yb-btn yb-btn-clay" style={{ width:'100%' }}>{on ? L.save : L.enable}</button>
              {on && <button disabled={busy} onClick={off} className="yb-btn yb-btn-ghost" style={{ width:'100%' }}>{L.off}</button>}
              <span style={{ fontFamily:'var(--sans)', fontSize:12.5, color:'var(--ink-soft)', lineHeight:1.45 }}>{L.note}</span>
            </div>
          </>
        )}
        {onOpenInstall && (
          <button className="eb-row" onClick={onOpenInstall}>
            <span className="eb-row-icon"><Icon name="download" size={18} color="currentColor"/></span>
            <span className="eb-row-body">{L.install}</span>
            <span className="eb-row-end"><Icon name="next" size={16} color="currentColor"/></span>
          </button>
        )}
      </div>
      {msg && <div role="status" style={{ fontFamily:'var(--sans)', fontSize:13, color: msg.ok ? 'var(--leaf-deep)' : '#B0432F', margin:'8px 4px 0' }}>{msg.text}</div>}
    </div>
  );
};

// ── Calendari de constància: últimes 12 setmanes i petits hitos ──
const ConstancyCalendar = ({ lang, log }) => {
  const WEEKS = 12;
  const dayKey = (d) => d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  const perDay = {};
  log.forEach(x => { const k = dayKey(new Date(x.completed_at)); perDay[k] = (perDay[k] || 0) + (x.duration_sec || 0); });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(today); start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - (WEEKS - 1) * 7);
  const weeks = [];
  for (let w = 0; w < WEEKS; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) { const day = new Date(start); day.setDate(start.getDate() + w * 7 + d); col.push(day); }
    weeks.push(col);
  }
  const level = (sec) => sec <= 0 ? 0 : sec < 600 ? 1 : sec < 1500 ? 2 : 3;
  const bg = ['color-mix(in srgb, var(--ink) 7%, transparent)', 'color-mix(in srgb, var(--leaf) 35%, transparent)', 'color-mix(in srgb, var(--leaf) 65%, transparent)', 'var(--leaf-deep)'];
  const totalMin = Math.round(log.reduce((s, x) => s + (x.duration_sec || 0), 0) / 60);
  const days = Object.keys(perDay).length;
  let best = 0, run = 0;
  for (let i = 0; i < 400; i++) { const d = new Date(today); d.setDate(d.getDate() - i); if (perDay[dayKey(d)]) { run++; best = Math.max(best, run); } else run = 0; }
  const L = {
    title: {ca:'La teva constància', es:'Tu constancia', en:'Your consistency'}[lang],
    days:  {ca:'dies practicats', es:'días practicados', en:'days practised'}[lang],
    less:  {ca:'Menys', es:'Menos', en:'Less'}[lang], more: {ca:'Més', es:'Más', en:'More'}[lang],
  };
  const MILESTONES = [
    [log.length >= 1, {ca:'Primera pràctica', es:'Primera práctica', en:'First practice'}],
    [best >= 3, {ca:'3 dies seguits', es:'3 días seguidos', en:'3 days in a row'}],
    [best >= 7, {ca:'Una setmana seguida', es:'Una semana seguida', en:'A full week'}],
    [log.length >= 10, {ca:'10 pràctiques', es:'10 prácticas', en:'10 practices'}],
    [totalMin >= 300, {ca:'5 hores', es:'5 horas', en:'5 hours'}],
    [log.length >= 50, {ca:'50 pràctiques', es:'50 prácticas', en:'50 practices'}],
  ];
  const fmtDay = (d) => { try { return d.toLocaleDateString(lang === 'ca' ? 'ca-ES' : lang, { day:'numeric', month:'short' }); } catch (e) { return ''; } };
  return (
    <div className="yb-card" style={{ padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12, gap:8, flexWrap:'wrap' }}>
        <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:20 }}>{L.title}</div>
        <div style={{ fontFamily:'var(--sans)', fontSize:12, color:'var(--ink-soft)' }}>{days} {L.days}</div>
      </div>
      <div role="img" aria-label={L.title + ': ' + days + ' ' + L.days} style={{ display:'grid', gridTemplateColumns:`repeat(${WEEKS}, 1fr)`, gap:4 }}>
        {weeks.map((col, w) => (
          <div key={w} style={{ display:'grid', gridTemplateRows:'repeat(7, 1fr)', gap:4 }}>
            {col.map((d, i) => {
              const sec = perDay[dayKey(d)] || 0;
              const future = d > today;
              return <div key={i} title={fmtDay(d) + (sec ? ' · ' + Math.round(sec / 60) + ' min' : '')}
                style={{ aspectRatio:'1', borderRadius:3, background: future ? 'transparent' : bg[level(sec)], outline: d.getTime() === today.getTime() ? '1.5px solid var(--accent)' : 'none' }}/>;
            })}
          </div>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:4, marginTop:8, fontFamily:'var(--sans)', fontSize:11, color:'var(--ink-soft)' }}>
        {L.less}{bg.map((c, i) => <span key={i} style={{ width:10, height:10, borderRadius:2, background:c, display:'inline-block' }}/>)}{L.more}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:12 }}>
        {MILESTONES.map(([got, label], i) => (
          <span key={i} style={{ fontFamily:'var(--sans)', fontSize:11.5, padding:'4px 10px', borderRadius:999,
            border:'1px solid ' + (got ? 'color-mix(in srgb, var(--leaf) 60%, transparent)' : 'color-mix(in srgb, var(--ink) 10%, transparent)'),
            color: got ? 'var(--leaf-deep)' : 'var(--ink-soft)', opacity: got ? 1 : 0.6 }}>
            {got ? '✓ ' : ''}{label[lang]}
          </span>
        ))}
      </div>
    </div>
  );
};

// ── Dashboard ───────────────────────────────────────────────
const Dashboard = ({ t, profile, sequence, lang, role, theme, onChangeTheme, textSize, onChangeTextSize, onOpenStudents, onRedoQuiz, stats, onExportData, onDeleteAccount, onRepeat, lastPoseIds, onOpenBreath, practiceLog, assignment, onStartAssignment, onOpenTracking, onOpenInstall, asanas, onPosesChanged, onStartPractice, onOpenPose, illustrationStyle, onLogout, onChangeName }) => {
  const totalMin = Math.round(sequence.reduce((s,p)=>s+p.duration,0)/60);
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return { ca: 'Bon matí', es: 'Buenos días', en: 'Good morning' }[lang];
    if (h < 19) return { ca: 'Bona tarda', es: 'Buenas tardes', en: 'Good afternoon' }[lang];
    return { ca: 'Bona nit', es: 'Buenas noches', en: 'Good evening' }[lang];
  })();

  const [personalV, setPersonalV] = uS(0);
  uE(() => { const r = () => setPersonalV(v => v + 1); window.addEventListener('elbosc-personal-sync', r); return () => window.removeEventListener('elbosc-personal-sync', r); }, []);
  const savedSessions = uM(() => (window.EBSessions ? window.EBSessions.list() : []), [personalV]);
  const [confirmDelete, setConfirmDelete] = uS(false);
  const [deleting, setDeleting] = uS(false);
  const [deleteErr, setDeleteErr] = uS('');
  const [avatar, setAvatar] = uS(() => { try { return localStorage.getItem('elbosc-avatar') || null; } catch(e){ return null; } });
  const [showProfile, setShowProfile] = uS(false);
  const [showPoseMgr, setShowPoseMgr] = uS(false);
  const [np, setNp] = uS({ name:'', sanskrit:'', level:'principiant', family:'peu' });
  const _slug = (s) => (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'postura';
  const addPose = () => {
    if (!np.name.trim() || !window.EBPoses) return;
    const id = 'cust-' + _slug(np.name) + '-' + Date.now().toString(36).slice(-4);
    window.EBPoses.add({ id, sanskrit: np.sanskrit.trim(), name:{ ca:np.name.trim(), es:np.name.trim(), en:np.name.trim() }, level: np.level, family: np.family, duration: 45, custom: true, benefits:{ca:[],es:[],en:[]}, instructions:{ca:[],es:[],en:[]}, muscles:[], target:[], contraindications:[] });
    onPosesChanged && onPosesChanged();
    setNp({ name:'', sanskrit:'', level:'principiant', family:'peu' });
  };
  const removePose = (id) => { if (window.EBPoses) { window.EBPoses.remove(id); onPosesChanged && onPosesChanged(); } };
  const [showRoutineMgr, setShowRoutineMgr] = uS(false);
  const [rName, setRName] = uS('');
  const [rPoses, setRPoses] = uS([]);
  const [routinesV, setRoutinesV] = uS(0);
  const routines = uM(() => (window.EBRoutines ? window.EBRoutines.load() : []), [routinesV, showRoutineMgr]);
  const toggleRPose = (id) => setRPoses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const saveRoutine = () => {
    if (!rName.trim() || !rPoses.length || !window.EBRoutines) return;
    window.EBRoutines.add({ id:'r' + Date.now().toString(36), name: rName.trim(), poseIds: rPoses });
    setRoutinesV(v => v + 1); setRName(''); setRPoses([]);
  };
  const removeRoutine = (id) => { if (window.EBRoutines) { window.EBRoutines.remove(id); setRoutinesV(v => v + 1); } };
  const onPickPhoto = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // permet tornar a triar el mateix fitxer
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const size = 256, s = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, (img.width - s)/2, (img.height - s)/2, s, s, 0, 0, size, size);
        let dataUrl;
        try { dataUrl = canvas.toDataURL('image/jpeg', 0.82); } catch(err) { dataUrl = ev.target.result; }
        try { localStorage.setItem('elbosc-avatar', dataUrl); } catch(err) {}
        setAvatar(dataUrl);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };
  const removePhoto = () => { try { localStorage.removeItem('elbosc-avatar'); } catch(e){} setAvatar(null); };
  const PT = {
    title:  {ca:'El teu perfil', es:'Tu perfil', en:'Your profile'}[lang],
    change: {ca:'Canviar foto', es:'Cambiar foto', en:'Change photo'}[lang],
    hint:   {ca:'Fes una foto o tria-la de la galeria', es:'Haz una foto o elígela de la galería', en:'Take a photo or pick from gallery'}[lang],
    remove: {ca:'Treure foto', es:'Quitar foto', en:'Remove photo'}[lang],
    logout: {ca:'Tancar sessió', es:'Cerrar sesión', en:'Log out'}[lang],
    nameLabel: {ca:'El teu nom', es:'Tu nombre', en:'Your name'}[lang],
    namePh: {ca:'El teu nom', es:'Tu nombre', en:'Your name'}[lang],
    theme: {ca:'Tema', es:'Tema', en:'Theme'}[lang],
    teacherZone: {ca:'Zona professora', es:'Zona profesora', en:'Teacher zone'}[lang],
  };
  const themeLabelStyle = { fontFamily:'var(--sans)', fontSize:11, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--accent)', display:'block' };
  const THEMES = [
    { id:'bosc',  label:{ca:'Bosc',es:'Bosc',en:'Forest'}[lang], color:'#B8744A' },
    { id:'sage',  label:{ca:'Sàlvia',es:'Salvia',en:'Sage'}[lang], color:'#6B8259' },
    { id:'ocean', label:{ca:'Oceà',es:'Océano',en:'Ocean'}[lang], color:'#4A7B8C' },
  ];


  return (
    <>
    <div className="yb-scroll" style={{ height: '100%', overflowY: 'auto', background: 'var(--paper)' }}>
      <div style={{ padding: '60px 24px 16px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontFamily:'var(--sans)', fontSize: 11, letterSpacing:'0.25em', color:'var(--accent)', marginBottom: 4 }}>
            {new Date().toLocaleDateString(lang === 'ca' ? 'ca-ES' : lang, { weekday:'long', day:'numeric', month:'long' })}
          </div>
          <h1 style={{ fontSize: 32, fontStyle:'italic', color:'var(--ink)' }}>
            {greeting},<br/>
            <span style={{ color: 'var(--accent)' }}>{profile.name || ''}</span>
          </h1>
        </div>
        <button onClick={() => setShowProfile(true)} aria-label={PT.title}
          style={{ width: 44, height: 44, borderRadius:'50%', background:'var(--cream)', display:'flex', alignItems:'center', justifyContent:'center', border: '1px solid color-mix(in srgb, var(--ink) 8%, transparent)', cursor:'pointer', padding:0 }}>
          <Icon name="settings" size={20} color="var(--ink-soft)"/>
        </button>
      </div>

      {/* Hero — sessió d'avui */}
      <div style={{ padding: '0 24px' }}>
        <div onClick={onStartPractice} style={{
          position: 'relative', borderRadius: 24, overflow: 'hidden',
          background: 'linear-gradient(140deg, var(--leaf-deep) 0%, var(--leaf) 60%, var(--accent) 130%)',
          padding: '24px', color: 'var(--cream)', cursor: 'pointer',
          boxShadow: 'var(--shadow-2)', minHeight: 200,
        }}>
          <svg viewBox="0 0 200 200" style={{ position:'absolute', right: -30, bottom: -20, width: 220, opacity: 0.25 }}>
            <g stroke="var(--cream)" strokeWidth="1" fill="none">
              <path d="M40 180 Q60 100 100 110 Q140 120 160 60"/>
              <path d="M40 180 Q90 140 100 110"/>
              <ellipse cx="60" cy="130" rx="14" ry="30" transform="rotate(-30 60 130)"/>
              <ellipse cx="140" cy="100" rx="14" ry="30" transform="rotate(40 140 100)"/>
              <ellipse cx="100" cy="80" rx="14" ry="30"/>
            </g>
          </svg>
          <div style={{ position:'relative', zIndex: 1 }}>
            <div style={{ fontFamily:'var(--sans)', fontSize: 11, letterSpacing:'0.25em', opacity: 0.85, marginBottom: 8 }}>
              {t.todayPractice.toUpperCase()}
            </div>
            <h2 style={{ fontSize: 28, fontStyle:'italic', marginBottom: 12, lineHeight: 1.15, maxWidth: 250 }}>
              {{ ca:'Pràctica per al teu cos d\'avui', es:'Práctica para tu cuerpo de hoy', en:'Practice for your body today' }[lang]}
            </h2>
            <div style={{ display:'flex', gap: 16, fontFamily:'var(--sans)', fontSize: 13, opacity: 0.9, marginBottom: 24 }}>
              <span><Icon name="timer" size={14}/> {totalMin} min</span>
              <span><Icon name="flower" size={14}/> {sequence.length} {t.session.poses}</span>
              <span><Icon name="leaf" size={14}/> {t.levels[profile.level] || profile.level}</span>
            </div>
            <button className="yb-btn" style={{ background:'var(--cream)', color:'var(--ink)', padding: '12px 22px' }}>
              <Icon name="play" size={14} color="var(--ink)"/> {t.session.startPractice}
            </button>
          </div>
        </div>
      </div>

      {/* Instal·lar l'app (si encara no ho està) */}
      <InstallCard lang={lang} onOpen={onOpenInstall}/>

      {/* Rutina que ha assignat la professora */}
      <AssignedRoutineCard lang={lang} assignment={assignment} onStart={onStartAssignment}/>

      {/* Respira i Medita */}
      <div style={{ padding:'16px 24px 0', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {[['breath', 'breath', {ca:'Respira',es:'Respira',en:'Breathe'}, {ca:'3–10 min',es:'3–10 min',en:'3–10 min'}],
          ['meditate', 'moon', {ca:'Medita',es:'Medita',en:'Meditate'}, {ca:'5–30 min',es:'5–30 min',en:'5–30 min'}]].map(([m, ic, l, sub]) => (
          <button key={m} onClick={() => onOpenBreath && onOpenBreath(m)} className="yb-card"
            style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', cursor:'pointer', border:'none', textAlign:'left', color:'var(--ink)' }}>
            <span style={{ width:36, height:36, borderRadius:'50%', background:'color-mix(in srgb, var(--accent) 14%, transparent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon name={ic} size={18} color="var(--accent)"/>
            </span>
            <span>
              <span style={{ display:'block', fontFamily:'var(--serif)', fontStyle:'italic', fontSize:20 }}>{l[lang]}</span>
              <span style={{ display:'block', fontFamily:'var(--sans)', fontSize:12, color:'var(--ink-soft)' }}>{sub[lang]}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Repetir i sessions desades */}
      {(lastPoseIds || savedSessions.length > 0) && (
        <div style={{ padding: '16px 24px 0', display:'flex', gap: 8, overflowX:'auto' }} className="yb-scroll">
          {lastPoseIds && (
            <button onClick={() => onRepeat && onRepeat(lastPoseIds)} className="yb-chip clay"
              style={{ whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', gap:6, padding:'10px 14px', cursor:'pointer' }}>
              <Icon name="refresh" size={13} color="currentColor"/> {{ca:'Repetir l\'última',es:'Repetir la última',en:'Repeat last'}[lang]}
            </button>
          )}
          {savedSessions.map(ss => (
            <span key={ss.id} className="yb-chip" style={{ whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', gap:6, padding:'6px 6px 6px 12px' }}>
              <button onClick={() => onRepeat && onRepeat(ss.poseIds)} style={{ background:'none', border:'none', color:'inherit', font:'inherit', cursor:'pointer', padding:'4px 0', display:'inline-flex', alignItems:'center', gap:6 }}>
                <Icon name="heart" size={12} color="var(--accent)"/> {ss.name}
              </button>
              <button aria-label={{ca:'Treure',es:'Quitar',en:'Remove'}[lang] + ' ' + ss.name} onClick={() => window.EBSessions.remove(ss.id)} style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:'var(--ink-soft)' }}>
                <Icon name="close" size={11} color="currentColor"/>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Sequence preview */}
      <div style={{ padding: '32px 24px 16px' }}>
        <div className="yb-divider-leaf">{t.session.preview}</div>
      </div>
      <div className="yb-scroll" style={{ display:'flex', gap: 12, padding: '0 24px 8px', overflowX: 'auto' }}>
        {sequence.map((p, i) => (
          <div key={i} onClick={() => onOpenPose(p)} style={{
            flexShrink: 0, width: 120, background: 'var(--cream)',
            borderRadius: 16, padding: 12, cursor: 'pointer',
            border: '1px solid color-mix(in srgb, var(--ink) 6%, transparent)',
          }}>
            <div style={{ height: 100, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--paper-2)', borderRadius: 10, marginBottom: 10, color: 'var(--ink-soft)' }}>
              <PoseSVG id={p.id} size={80} color="var(--ink-soft)" style={illustrationStyle}/>
            </div>
            <div style={{ fontSize: 11, fontFamily:'var(--sans)', color:'var(--accent)', letterSpacing:'0.1em' }}>
              {String(i+1).padStart(2,'0')}
            </div>
            <div style={{ fontSize: 13, color:'var(--ink)', lineHeight: 1.2, marginTop: 2 }}>
              {p.name[lang] || p.name.ca}
            </div>
            <div style={{ fontSize: 11, color:'var(--ink-soft)', fontFamily:'var(--sans)', marginTop: 4 }}>
              {Math.round(p.duration)}s
            </div>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div style={{ padding: '24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12 }}>
        <div className="yb-card" style={{ padding: 16 }}>
          <Icon name="flame" size={18} color="var(--accent)"/>
          <div style={{ fontFamily:'var(--serif)', fontSize: 28, fontStyle:'italic', marginTop: 4 }}>{(stats && stats.streak) || 0}</div>
          <div style={{ fontFamily:'var(--sans)', fontSize: 11, color:'var(--ink-soft)' }}>{t.progress_.streak}</div>
        </div>
        <div className="yb-card" style={{ padding: 16 }}>
          <Icon name="heart" size={18} color="var(--accent)"/>
          <div style={{ fontFamily:'var(--serif)', fontSize: 28, fontStyle:'italic', marginTop: 4 }}>{(stats && stats.thisWeek) || 0} / {profile.frequency || 3}</div>
          <div style={{ fontFamily:'var(--sans)', fontSize: 11, color:'var(--ink-soft)' }}>{t.progress_.thisWeek}</div>
        </div>
      </div>

      {/* Calendari de constància */}
      <div style={{ padding: '0 24px 24px' }}>
        <ConstancyCalendar lang={lang} log={practiceLog || []}/>
      </div>

      {/* Teacher note */}
      <div style={{ padding: '0 24px 120px' }}>
        <div className="yb-card" style={{ background:'color-mix(in srgb, var(--accent) 8%, var(--cream))', display:'flex', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius:'50%', background:'var(--accent)', flexShrink: 0, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--cream)', fontFamily:'var(--serif)', fontSize: 20 }}>C</div>
          <div>
            <div style={{ fontFamily:'var(--sans)', fontSize: 11, color:'var(--accent)', letterSpacing:'0.15em', textTransform:'uppercase' }}>{t.messages_.from}</div>
            <div style={{ fontFamily:'var(--serif)', fontSize: 15, lineHeight: 1.5, color:'var(--ink)', marginTop: 4, fontStyle:'italic' }}>
              {{ ca:'"Quina sensació tens quan estàs fent aquesta pràctica? Escolta el cos."', es:'"¿Qué sensación tienes cuando haces esta práctica? Escucha el cuerpo."', en:'"What sensation do you feel during this practice? Listen to your body."' }[lang]}
            </div>
          </div>
        </div>
      </div>
    </div>

    {showProfile && (() => {
      const close = () => setShowProfile(false);
      const L = (o) => o[lang] || o.ca;
      const Row = ({ icon, tone, title, sub, end, onClick, danger, href }) => {
        const inner = (
          <>
            <span className={'eb-row-icon' + (tone ? ' ' + tone : '')}><Icon name={icon} size={18} color="currentColor"/></span>
            <span className="eb-row-body">{title}{sub && <span className="eb-row-sub">{sub}</span>}</span>
            <span className="eb-row-end">{end !== undefined ? end : <Icon name="next" size={16} color="currentColor"/>}</span>
          </>
        );
        return href
          ? <a className={'eb-row' + (danger ? ' danger' : '')} href={href} target="_blank" rel="noopener" style={{ textDecoration:'none' }}>{inner}</a>
          : <button className={'eb-row' + (danger ? ' danger' : '')} onClick={onClick}>{inner}</button>;
      };
      return (
      <div className="eb-backdrop" onClick={close}
        style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(10,18,13,0.45)', backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
        <div className="eb-sheet yb-scroll" role="dialog" aria-modal="true" aria-label={PT.title} onClick={e => e.stopPropagation()}
          style={{ width:'100%', maxWidth:430, maxHeight:'92dvh', overflowY:'auto', background:'var(--paper)', borderTopLeftRadius:30, borderTopRightRadius:30, padding:'10px 18px calc(28px + env(safe-area-inset-bottom, 0px))', boxShadow:'0 -10px 40px rgba(0,0,0,0.25)' }}>
          <div style={{ position:'sticky', top:-10, zIndex:2, background:'var(--paper)', padding:'8px 0 6px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ width:40 }}/>
            <div style={{ width:40, height:5, borderRadius:3, background:'color-mix(in srgb, var(--ink) 18%, transparent)' }}/>
            <button aria-label={L({ca:'Tancar',es:'Cerrar',en:'Close'})} onClick={close}
              style={{ width:40, height:40, borderRadius:'50%', border:'none', background:'var(--cream)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--ink)' }}>
              <Icon name="close" size={18} color="currentColor"/>
            </button>
          </div>

          {/* Perfil */}
          <div style={{ display:'flex', alignItems:'center', gap:16, padding:'6px 4px 4px' }}>
            <label htmlFor="eb-avatar" style={{ position:'relative', width:76, height:76, borderRadius:'50%', overflow:'hidden', background:'var(--cream)', border:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
              {avatar ? <img src={avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : <Icon name="user" size={32} color="var(--ink-soft)"/>}
              <span style={{ position:'absolute', right:2, bottom:2, width:26, height:26, borderRadius:'50%', background:'var(--accent)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 3px var(--paper)' }}><Icon name="image" size={12} color="currentColor"/></span>
              <input id="eb-avatar" type="file" accept="image/*" onChange={onPickPhoto} style={{ display:'none' }}/>
            </label>
            <div style={{ flex:1, minWidth:0 }}>
              <label htmlFor="eb-name" style={{ fontFamily:'var(--sans)', fontSize:13, fontWeight:600, color:'var(--ink-soft)' }}>{PT.nameLabel}</label>
              <input id="eb-name" type="text" value={profile.name || ''} onChange={e => onChangeName && onChangeName(e.target.value)} placeholder={PT.namePh}
                style={{ width:'100%', border:'none', borderBottom:'1.5px solid var(--line)', padding:'6px 0', fontFamily:'var(--serif)', fontSize:26, background:'transparent', color:'var(--ink)', outline:'none' }}/>
              {avatar && <button onClick={removePhoto} style={{ background:'none', border:'none', padding:'6px 0 0', color:'var(--ink-soft)', fontFamily:'var(--sans)', fontSize:13, cursor:'pointer' }}>{PT.remove}</button>}
            </div>
          </div>

          {/* Aparença */}
          <div className="eb-group-title">{L({ca:'Aparença',es:'Apariencia',en:'Appearance'})}</div>
          <div className="eb-group" style={{ padding:14, display:'flex', flexDirection:'column', gap:12 }}>
            <div className="eb-seg" role="group" aria-label={PT.theme}>
              {THEMES.map(th => (
                <button key={th.id} aria-pressed={theme === th.id} onClick={() => onChangeTheme && onChangeTheme(th.id)}>
                  <span aria-hidden="true" style={{ width:14, height:14, borderRadius:'50%', background:th.color }}/>{th.label}
                </button>
              ))}
            </div>
            <div className="eb-seg" role="group" aria-label={L({ca:'Mida del text',es:'Tamaño del texto',en:'Text size'})}>
              {[{id:'m',l:'A',f:15},{id:'l',l:'A',f:19},{id:'xl',l:'A',f:23}].map(o => (
                <button key={o.id} aria-pressed={(textSize||'m') === o.id} aria-label={o.id} onClick={() => onChangeTextSize && onChangeTextSize(o.id)} style={{ fontSize:o.f, fontFamily:'var(--serif)' }}>{o.l}</button>
              ))}
            </div>
          </div>

          {role === 'teacher' && (
            <>
              <div className="eb-group-title">{PT.teacherZone}</div>
              <div className="eb-group">
                <Row icon="chart" tone="ink" title={L({ca:'Seguiment de les alumnes',es:'Seguimiento de las alumnas',en:'Student progress'})} sub={L({ca:'Qui practica, molèsties i informes',es:'Quién practica, molestias e informes',en:'Who practises, discomfort and reports'})} onClick={() => { close(); onOpenTracking && onOpenTracking(); }}/>
                <Row icon="user-plus" title={L({ca:'Alumnes i accés',es:'Alumnas y acceso',en:'Students and access'})} sub={L({ca:'Afegir, posar en pausa, convidar',es:'Añadir, poner en pausa, invitar',en:'Add, pause, invite'})} onClick={() => { close(); onOpenStudents && onOpenStudents(); }}/>
                <Row icon="flower" title={L({ca:'Postures',es:'Posturas',en:'Poses'})} sub={L({ca:'Afegir o treure postures',es:'Añadir o quitar posturas',en:'Add or remove poses'})} onClick={() => { close(); setShowPoseMgr(true); }}/>
                <Row icon="sparkle" title={L({ca:'Rutines',es:'Rutinas',en:'Routines'})} sub={L({ca:'Crear seqüències per assignar',es:'Crear secuencias para asignar',en:'Create sequences to assign'})} onClick={() => { close(); setShowRoutineMgr(true); }}/>
              </div>
            </>
          )}

          {role !== 'teacher' && onRedoQuiz && (
            <>
              <div className="eb-group-title">{L({ca:'La meva pràctica',es:'Mi práctica',en:'My practice'})}</div>
              <div className="eb-group">
                <Row icon="leaf" title={L({ca:'Actualitzar el qüestionari',es:'Actualizar el cuestionario',en:'Update questionnaire'})} sub={L({ca:'Objectius, nivell, lesions',es:'Objetivos, nivel, lesiones',en:'Goals, level, injuries'})} onClick={() => { close(); onRedoQuiz(); }}/>
              </div>
            </>
          )}

          <NotificationSettings lang={lang} role={role} onOpenInstall={onOpenInstall ? () => { close(); onOpenInstall(); } : null}/>

          <div className="eb-group-title">{L({ca:'Privacitat',es:'Privacidad',en:'Privacy'})}</div>
          <div className="eb-group">
            <Row icon="shield" title={L({ca:'Política de privacitat',es:'Política de privacidad',en:'Privacy policy'})} href="privacitat.html"/>
            {onExportData && <Row icon="download" title={L({ca:'Descarregar les meves dades',es:'Descargar mis datos',en:'Download my data'})} onClick={onExportData}/>}
            {onDeleteAccount && (
              <Row icon="trash" tone="danger" danger end={deleting ? '…' : ''}
                title={confirmDelete ? L({ca:'Segur? Toca de nou per esborrar-ho tot',es:'¿Seguro? Toca otra vez para borrarlo todo',en:'Sure? Tap again to delete everything'}) : L({ca:'Esborrar el meu compte',es:'Borrar mi cuenta',en:'Delete my account'})}
                onClick={async () => {
                  if (deleting) return;
                  if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 4000); return; }
                  setDeleting(true); setDeleteErr('');
                  try { await onDeleteAccount(); close(); }
                  catch (e) { setDeleteErr(L({ca:'No s\'ha pogut esborrar. Comprova la connexió.',es:'No se ha podido borrar. Comprueba la conexión.',en:'Couldn\'t delete. Check your connection.'})); }
                  setDeleting(false); setConfirmDelete(false);
                }}/>
            )}
          </div>
          {deleteErr && <div role="alert" style={{ fontFamily:'var(--sans)', fontSize:13, color:'#B0432F', margin:'8px 4px' }}>{deleteErr}</div>}

          <div className="eb-group" style={{ marginTop:22 }}>
            <Row icon="back" title={PT.logout} end="" onClick={() => { close(); onLogout && onLogout(); }}/>
          </div>
        </div>
      </div>
      );
    })()}

    {showPoseMgr && (() => {
      const inp = { width:'100%', border:'1.5px solid color-mix(in srgb, var(--ink) 12%, transparent)', borderRadius:12, padding:'11px 12px', fontFamily:'var(--sans)', fontSize:14, background:'var(--cream)', color:'var(--ink)', outline:'none', boxSizing:'border-box' };
      return (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'var(--paper)', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'54px 20px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid color-mix(in srgb, var(--ink) 8%, transparent)' }}>
            <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:22, color:'var(--ink)' }}>{{ca:'Gestió de postures',es:'Gestión de posturas',en:'Manage poses'}[lang]}</div>
            <button onClick={() => setShowPoseMgr(false)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:4 }}><Icon name="close" size={22} color="var(--ink)"/></button>
          </div>
          <div className="yb-scroll" style={{ flex:1, overflowY:'auto', padding:'16px 20px 40px' }}>
            <div className="yb-card" style={{ marginBottom:16 }}>
              <div style={{ fontFamily:'var(--sans)', fontSize:11, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--accent)', marginBottom:12 }}>{{ca:'Afegir postura',es:'Añadir postura',en:'Add pose'}[lang]}</div>
              <input type="text" value={np.name} onChange={e=>setNp({...np, name:e.target.value})} placeholder={{ca:'Nom',es:'Nombre',en:'Name'}[lang]} style={inp}/>
              <input type="text" value={np.sanskrit} onChange={e=>setNp({...np, sanskrit:e.target.value})} placeholder={{ca:'Sànscrit (opcional)',es:'Sánscrito (opcional)',en:'Sanskrit (optional)'}[lang]} style={{...inp, marginTop:8}}/>
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <select value={np.level} onChange={e=>setNp({...np, level:e.target.value})} style={{...inp, flex:1}}>
                  <option value="principiant">{{ca:'Principiant',es:'Principiante',en:'Beginner'}[lang]}</option>
                  <option value="intermedi">{{ca:'Intermedi',es:'Intermedio',en:'Intermediate'}[lang]}</option>
                  <option value="avancat">{{ca:'Avançat',es:'Avanzado',en:'Advanced'}[lang]}</option>
                </select>
                <select value={np.family} onChange={e=>setNp({...np, family:e.target.value})} style={{...inp, flex:1}}>
                  {['peu','equilibri','flexio','extensio','torsio','restauratiu','meditacio','mobilitat','inversio'].map(f=>(<option key={f} value={f}>{f}</option>))}
                </select>
              </div>
              <button onClick={addPose} disabled={!np.name.trim()} className="yb-btn yb-btn-clay" style={{ width:'100%', marginTop:12, opacity: np.name.trim()?1:0.5 }}>{{ca:'Afegir',es:'Añadir',en:'Add'}[lang]}</button>
            </div>
            {(asanas||[]).map(a => (
              <div key={a.id} className="yb-card" style={{ marginBottom:8, display:'flex', alignItems:'center', gap:12, padding:'10px 14px' }}>
                <div style={{ width:40, height:40, flexShrink:0 }}><PoseSVG id={a.id} size={40}/></div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'var(--serif)', fontSize:15, color:'var(--ink)' }}>{(a.name && (a.name[lang]||a.name.ca)) || a.id}</div>
                  <div style={{ fontFamily:'var(--sans)', fontSize:11, color:'var(--ink-soft)' }}>{a.sanskrit} · {a.level}{a.custom?' · ✎':''}</div>
                </div>
                <button onClick={()=>removePose(a.id)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:6 }}><Icon name="trash" size={16} color="var(--ink-soft)"/></button>
              </div>
            ))}
          </div>
        </div>
      );
    })()}

    {showRoutineMgr && (() => {
      const inp = { width:'100%', border:'1.5px solid color-mix(in srgb, var(--ink) 12%, transparent)', borderRadius:12, padding:'11px 12px', fontFamily:'var(--sans)', fontSize:14, background:'var(--cream)', color:'var(--ink)', outline:'none', boxSizing:'border-box' };
      const nameOf = (id) => { const a = (asanas||[]).find(x => x.id === id); return a ? ((a.name && (a.name[lang]||a.name.ca)) || a.id) : id; };
      return (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'var(--paper)', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'54px 20px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid color-mix(in srgb, var(--ink) 8%, transparent)' }}>
            <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:22, color:'var(--ink)' }}>{{ca:'Rutines',es:'Rutinas',en:'Routines'}[lang]}</div>
            <button onClick={() => setShowRoutineMgr(false)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:4 }}><Icon name="close" size={22} color="var(--ink)"/></button>
          </div>
          <div className="yb-scroll" style={{ flex:1, overflowY:'auto', padding:'16px 20px 40px' }}>
            {routines.length === 0 && <div style={{ fontFamily:'var(--sans)', fontSize:13, color:'var(--ink-soft)', textAlign:'center', marginBottom:14 }}>{{ca:'Encara no hi ha rutines.',es:'Aún no hay rutinas.',en:'No routines yet.'}[lang]}</div>}
            {routines.map(r => (
              <div key={r.id} className="yb-card" style={{ marginBottom:8, display:'flex', alignItems:'center', gap:12, padding:'12px 14px' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'var(--serif)', fontSize:16, color:'var(--ink)' }}>{r.name}</div>
                  <div style={{ fontFamily:'var(--sans)', fontSize:11, color:'var(--ink-soft)' }}>{r.poseIds.length} {{ca:'postures',es:'posturas',en:'poses'}[lang]} · {r.poseIds.map(nameOf).slice(0,3).join(', ')}{r.poseIds.length>3?'…':''}</div>
                </div>
                <button onClick={()=>removeRoutine(r.id)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:6 }}><Icon name="trash" size={16} color="var(--ink-soft)"/></button>
              </div>
            ))}

            <div className="yb-card" style={{ marginTop:16 }}>
              <div style={{ fontFamily:'var(--sans)', fontSize:11, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--accent)', marginBottom:12 }}>{{ca:'Nova rutina',es:'Nueva rutina',en:'New routine'}[lang]}</div>
              <input type="text" value={rName} onChange={e=>setRName(e.target.value)} placeholder={{ca:'Nom de la rutina',es:'Nombre de la rutina',en:'Routine name'}[lang]} style={inp}/>
              {rPoses.length>0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:12 }}>
                  {rPoses.map((id,i) => (
                    <span key={id} onClick={()=>toggleRPose(id)} style={{ display:'inline-flex', alignItems:'center', gap:6, background:'var(--accent)', color:'var(--cream)', borderRadius:20, padding:'5px 10px', fontFamily:'var(--sans)', fontSize:12, cursor:'pointer' }}>{i+1}. {nameOf(id)} ✕</span>
                  ))}
                </div>
              )}
              <div style={{ fontFamily:'var(--sans)', fontSize:12, color:'var(--ink-soft)', margin:'14px 0 8px' }}>{{ca:'Toca per afegir (en ordre):',es:'Toca para añadir (en orden):',en:'Tap to add (in order):'}[lang]}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {(asanas||[]).map(a => { const on = rPoses.includes(a.id); return (
                  <button key={a.id} onClick={()=>toggleRPose(a.id)} style={{ borderRadius:20, padding:'6px 11px', fontFamily:'var(--sans)', fontSize:12, cursor:'pointer', border:'1px solid ' + (on?'var(--accent)':'color-mix(in srgb, var(--ink) 12%, transparent)'), background: on?'color-mix(in srgb, var(--accent) 15%, transparent)':'transparent', color: on?'var(--accent)':'var(--ink)' }}>{(a.name && (a.name[lang]||a.name.ca)) || a.id}</button>
                ); })}
              </div>
              <button onClick={saveRoutine} disabled={!rName.trim()||!rPoses.length} className="yb-btn yb-btn-clay" style={{ width:'100%', marginTop:16, opacity: (rName.trim()&&rPoses.length)?1:0.5 }}>{{ca:'Desar rutina',es:'Guardar rutina',en:'Save routine'}[lang]}</button>
            </div>
          </div>
        </div>
      );
    })()}
    </>
  );
};

// ── Library ─────────────────────────────────────────────────
const Library = ({ t, lang, asanas, onOpenPose, illustrationStyle }) => {
  const [filter, setFilter] = uS('all');
  const families = ['all','fav','ashtanga','peu','equilibri','flexio','extensio','torsio','inversio','restauratiu','meditacio','mobilitat'];
  const familyLabels = { all: { ca:'Totes', es:'Todas', en:'All' }, fav: { ca:'♥ Preferides', es:'♥ Favoritas', en:'♥ Favourites' }, peu:'Peu', equilibri:'Equilibri', flexio:'Flexió', extensio:'Extensió', torsio:'Torsió', restauratiu:'Restaurativa', meditacio:'Meditació', mobilitat:'Mobilitat', inversio:{ ca:'Inversió', es:'Inversión', en:'Inversion' }, ashtanga:'Ashtanga' };

  const favIds = filter === 'fav' && window.EBFavorites ? window.EBFavorites.list() : [];
  const filtered = filter === 'all' ? asanas : filter === 'fav' ? asanas.filter(a => favIds.includes(a.id)) : filter === 'ashtanga' ? asanas.filter(a => a.series === 'ashtanga') : asanas.filter(a => a.family === filter);

  return (
    <div className="yb-scroll" style={{ height: '100%', overflowY: 'auto', background: 'var(--paper)' }}>
      <div style={{ padding: '60px 24px 16px' }}>
        <div style={{ fontFamily:'var(--sans)', fontSize: 11, letterSpacing:'0.25em', color:'var(--accent)', marginBottom: 4 }}>
          {(asanas ? asanas.length : 0)} {{ ca:'ĀSANES', es:'ĀSANAS', en:'ĀSANAS' }[lang]}
        </div>
        <h1 style={{ fontSize: 36, fontStyle:'italic', color:'var(--ink)' }}>
          {{ ca:'Biblioteca', es:'Biblioteca', en:'Library' }[lang]}
        </h1>
      </div>

      <div className="yb-scroll" style={{ display:'flex', gap: 8, padding:'8px 24px 16px', overflowX:'auto' }}>
        {families.map(f => (
          <button key={f} className={"yb-chip clay" + (filter === f ? ' active' : '')} onClick={() => setFilter(f)}>
            {typeof familyLabels[f] === 'object' ? familyLabels[f][lang] : familyLabels[f]}
          </button>
        ))}
      </div>

      <div style={{ padding: '8px 24px 120px', display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12 }}>
        {filtered.map(a => (
          <div key={a.id} onClick={() => onOpenPose(a)} style={{
            background: 'var(--cream)', borderRadius: 16, padding: 14, cursor: 'pointer',
            border: '1px solid color-mix(in srgb, var(--ink) 5%, transparent)',
          }}>
            <div style={{ height: 100, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--paper-2)', borderRadius: 10, marginBottom: 10, color: 'var(--ink-soft)' }}>
              <PoseSVG id={a.id} size={88} color="var(--ink-soft)" style={illustrationStyle}/>
            </div>
            <div style={{ fontFamily:'var(--sans)', fontSize: 10, color:'var(--accent)', letterSpacing:'0.1em', textTransform:'uppercase' }}>{t.levels[a.level]}</div>
            <div style={{ fontFamily:'var(--serif)', fontSize: 15, color:'var(--ink)', lineHeight: 1.2, marginTop: 2 }}>
              {a.name[lang] || a.name.ca}
            </div>
            <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize: 11, color:'var(--ink-soft)', marginTop: 2 }}>
              {a.sanskrit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Pose Detail ─────────────────────────────────────────────
// Foto o vídeo de la professora fent la postura (si n'hi ha); la professora el puja aquí
const PoseMedia = ({ lang, poseId, canEdit }) => {
  const [media, setMedia] = uS(() => (window.EBPoseMedia ? window.EBPoseMedia.get(poseId) : null));
  const [urls, setUrls] = uS({});
  const [busy, setBusy] = uS(false);
  const [err, setErr] = uS('');
  const photoRef = React.useRef(null), videoRef = React.useRef(null);
  const L = {
    addPhoto: {ca:'Afegir foto', es:'Añadir foto', en:'Add photo'}[lang],
    addVideo: {ca:'Afegir vídeo', es:'Añadir vídeo', en:'Add video'}[lang],
    change: {ca:'Canviar', es:'Cambiar', en:'Change'}[lang],
    remove: {ca:'Treure', es:'Quitar', en:'Remove'}[lang],
    uploading: {ca:'Pujant…', es:'Subiendo…', en:'Uploading…'}[lang],
    big: {ca:'El fitxer és massa gran (màxim 50 MB).', es:'El archivo es demasiado grande (máximo 50 MB).', en:'File too large (max 50 MB).'}[lang],
    fail: {ca:'No s\'ha pogut pujar. Comprova la connexió.', es:'No se ha podido subir. Comprueba la conexión.', en:'Upload failed. Check your connection.'}[lang],
    alt: {ca:'La Cèlia fent la postura', es:'Cèlia haciendo la postura', en:'Cèlia doing the pose'}[lang],
  };
  uE(() => {
    let alive = true;
    if (!media || !window.EBPoseMedia) { setUrls({}); return; }
    Promise.all([window.EBPoseMedia.url(media.photo), window.EBPoseMedia.url(media.video)])
      .then(([photo, video]) => { if (alive) setUrls({ photo, video }); });
    return () => { alive = false; };
  }, [media && media.photo, media && media.video]);

  const pick = (kind) => async (e) => {
    const file = e.target.files && e.target.files[0]; e.target.value = '';
    if (!file) return;
    if (file.size > 50 * 1048576) { setErr(L.big); return; }
    setBusy(true); setErr('');
    try {
      const path = await window.EBPoseMedia.upload(poseId, file);
      const next = { ...(media || {}), [kind]: path };
      window.EBPoseMedia.set(poseId, next); setMedia(next);
    } catch (x) { setErr(L.fail); }
    setBusy(false);
  };
  const clear = (kind) => { const next = { ...(media || {}) }; delete next[kind]; window.EBPoseMedia.set(poseId, next); setMedia(next.photo || next.video ? next : null); };

  if (!media && !canEdit) return null;
  const btn = { padding:'6px 12px', borderRadius:999, border:'1px solid color-mix(in srgb, var(--accent) 40%, transparent)', background:'transparent', color:'var(--accent)', fontFamily:'var(--sans)', fontSize:12, cursor:'pointer' };
  return (
    <div style={{ padding:'20px 24px 0', display:'flex', flexDirection:'column', gap:12, alignItems:'center' }}>
      {media && media.video && urls.video && (
        <video src={urls.video} controls playsInline preload="metadata" style={{ width:'100%', maxWidth:420, borderRadius:20, background:'#000' }}/>
      )}
      {media && media.photo && urls.photo && !media.video && (
        <img src={urls.photo} alt={L.alt} style={{ width:'100%', maxWidth:420, borderRadius:20, objectFit:'cover' }}/>
      )}
      {media && media.photo && urls.photo && media.video && (
        <img src={urls.photo} alt={L.alt} style={{ width:'100%', maxWidth:420, borderRadius:20, objectFit:'cover' }}/>
      )}
      {canEdit && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
          <input ref={photoRef} type="file" accept="image/*" hidden onChange={pick('photo')}/>
          <input ref={videoRef} type="file" accept="video/*" hidden onChange={pick('video')}/>
          <button disabled={busy} style={btn} onClick={() => photoRef.current.click()}><Icon name="image" size={12} color="currentColor"/> {media && media.photo ? L.change : L.addPhoto}</button>
          <button disabled={busy} style={btn} onClick={() => videoRef.current.click()}><Icon name="play" size={12} color="currentColor"/> {media && media.video ? L.change : L.addVideo}</button>
          {media && media.photo && <button style={{ ...btn, color:'var(--ink-soft)', borderColor:'color-mix(in srgb, var(--ink) 15%, transparent)' }} onClick={() => clear('photo')}>{L.remove} foto</button>}
          {media && media.video && <button style={{ ...btn, color:'var(--ink-soft)', borderColor:'color-mix(in srgb, var(--ink) 15%, transparent)' }} onClick={() => clear('video')}>{L.remove} vídeo</button>}
        </div>
      )}
      {busy && <div role="status" style={{ fontFamily:'var(--sans)', fontSize:12, color:'var(--ink-soft)' }}>{L.uploading}</div>}
      {err && <div role="alert" style={{ fontFamily:'var(--sans)', fontSize:12, color:'var(--accent)' }}>{err}</div>}
    </div>
  );
};

const PoseDetail = ({ t, lang, asana, onClose, illustrationStyle, role }) => {
  const [fav, setFav] = uS(() => !!(window.EBFavorites && window.EBFavorites.has(asana.id)));
  if (!asana) return null;
  const muscleSilhouette = (
    <svg viewBox="0 0 120 200" width="100" height="160">
      <path d="M60 14c-7 0-12 5-12 12 0 5 2 9 5 11-1 1-3 3-5 8-2 6-4 14-4 22v8c0 4 1 8 2 11l-3 30c-1 8 1 16 2 24l2 30c1 8 5 14 7 18 1 2 1 6 1 9h14c0-3 0-7 1-9 2-4 6-10 7-18l2-30c1-8 3-16 2-24l-3-30c1-3 2-7 2-11v-8c0-8-2-16-4-22-2-5-4-7-5-8 3-2 5-6 5-11 0-7-5-12-12-12z" fill="var(--paper-2)" stroke="var(--ink-soft)" strokeWidth="0.6"/>
      {/* Highlight muscles */}
      {(asana.muscles || []).slice(0,4).map((m, i) => {
        const ml = m.toLowerCase();
        const positions = {
          quadr: { cx: 50, cy: 110, r: 8 }, bessons: { cx: 55, cy: 145, r: 6 },
          gluti: { cx: 60, cy: 95, r: 9 }, glutis: { cx: 60, cy: 95, r: 9 },
          isqui: { cx: 65, cy: 125, r: 8 },
          'esquena': { cx: 60, cy: 70, r: 10 }, 'esquena baixa': { cx: 60, cy: 88, r: 8 },
          core: { cx: 60, cy: 80, r: 9 }, 'oblics': { cx: 50, cy: 80, r: 6 },
          'malucs': { cx: 60, cy: 92, r: 9 }, 'engonal': { cx: 60, cy: 95, r: 5 },
          espatlles: { cx: 45, cy: 50, r: 6 }, 'espatlles': { cx: 75, cy: 50, r: 6 },
          'bra\u00e7os': { cx: 38, cy: 75, r: 6 },
          pit: { cx: 60, cy: 60, r: 9 }, 'coll': { cx: 60, cy: 30, r: 5 },
          'turmell': { cx: 55, cy: 175, r: 4 }, 'turmells': { cx: 65, cy: 175, r: 4 },
          'peus': { cx: 60, cy: 188, r: 6 }, 'canell': { cx: 35, cy: 100, r: 4 },
          psoes: { cx: 55, cy: 90, r: 6 },
        };
        const key = Object.keys(positions).find(k => ml.includes(k));
        const p = positions[key];
        if (!p) return null;
        return <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="var(--accent)" fillOpacity="0.6"/>;
      })}
    </svg>
  );

  const chakraColors = {
    muladhara: '#A52E2E', svadhisthana: '#D97A2A', manipura: '#E0B025',
    anahata: '#5A8C42', vishuddha: '#3F7AAA', ajna: '#3D3D8A', sahasrara: '#7A4A8A',
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--paper)', zIndex: 30, display:'flex', flexDirection:'column', animation: 'ybFadeUp .35s ease' }}>
      <div className="yb-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '50px 16px 20px', display:'flex', justifyContent:'space-between' }}>
          <button aria-label={({ca:'Tornar',es:'Volver',en:'Back'})[lang]} onClick={onClose} style={{ background:'var(--cream)', border:'none', borderRadius:'50%', width:40, height:40, cursor:'pointer' }}>
            <Icon name="back" size={18}/>
          </button>
          <div style={{ display:'flex', gap: 8 }}>
            <button aria-label={({ca:'Preferida',es:'Favorita',en:'Favourite'})[lang]} aria-pressed={fav}
              onClick={() => { if (window.EBFavorites) { window.EBFavorites.toggle(asana.id); setFav(window.EBFavorites.has(asana.id)); } }}
              style={{ background: fav ? 'color-mix(in srgb, var(--accent) 18%, var(--cream))' : 'var(--cream)', border:'none', borderRadius:'50%', width:40, height:40, cursor:'pointer' }}>
              <Icon name="heart" size={18} color={fav ? 'var(--accent)' : 'var(--ink-soft)'}/>
            </button>
          </div>
        </div>

        <div style={{ padding: '0 32px 8px', textAlign: 'center' }}>
          <div style={{ fontFamily:'var(--sans)', fontSize: 11, letterSpacing:'0.3em', color:'var(--accent)', marginBottom: 12 }}>
            {asana.sanskrit}
          </div>
          <h1 style={{ fontSize: 36, fontStyle:'italic', color:'var(--ink)', lineHeight: 1.1 }}>
            {asana.name[lang] || asana.name.ca}
          </h1>
        </div>

        <PoseMedia lang={lang} poseId={asana.id} canEdit={role === 'teacher'}/>

        <div style={{ display:'flex', justifyContent:'center', padding: '24px 16px' }}>
          <div style={{ width: 240, height: 240, background:'var(--cream)', borderRadius: 24, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)' }}>
            <PoseSVG id={asana.id} size={180} color="var(--ink)" style={illustrationStyle}/>
          </div>
        </div>

        {/* Pills row */}
        <div style={{ display:'flex', justifyContent:'center', gap: 8, padding: '0 24px 24px', flexWrap:'wrap' }}>
          <span className="yb-chip">{t.levels[asana.level]}</span>
          <span className="yb-chip">{Math.round(asana.duration)}s</span>
          <span className="yb-chip" style={{ background: chakraColors[asana.chakra] + '22', color: chakraColors[asana.chakra] }}>
            <Icon name="chakra" size={12} color={chakraColors[asana.chakra]}/> {asana.chakraLabel[lang] || asana.chakraLabel.ca}
          </span>
        </div>

        {/* Sections */}
        <div style={{ padding: '0 24px 120px', display:'flex', flexDirection:'column', gap: 16 }}>
          <div className="yb-card">
            <div className="yb-divider-leaf" style={{ marginBottom: 14 }}>{t.pose.benefits}</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontFamily:'var(--serif)', fontSize: 16, lineHeight: 1.6, color:'var(--ink)' }}>
              {(asana.benefits[lang] || asana.benefits.ca).map((b, i) => (<li key={i}>{b}</li>))}
            </ul>
          </div>

          <div className="yb-card">
            <div className="yb-divider-leaf" style={{ marginBottom: 14 }}>{t.pose.muscles}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {muscleSilhouette}
              <div style={{ flex: 1, display:'flex', flexWrap:'wrap', gap: 6 }}>
                {(asana.muscles || []).map((m, i) => (
                  <span key={i} className="yb-chip" style={{ background:'color-mix(in srgb, var(--accent) 14%, transparent)', color:'var(--accent-deep)' }}>{m}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="yb-card">
            <div className="yb-divider-leaf" style={{ marginBottom: 14 }}>{t.pose.steps}</div>
            <ol style={{ margin: 0, paddingLeft: 20, fontFamily:'var(--serif)', fontSize: 16, lineHeight: 1.7, color:'var(--ink)' }}>
              {(asana.instructions[lang] || asana.instructions.ca).map((s, i) => (<li key={i} style={{ marginBottom: 6 }}>{s}</li>))}
            </ol>
          </div>

          <div className="yb-card" style={{ background: 'color-mix(in srgb, var(--leaf) 10%, var(--cream))' }}>
            <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 8 }}>
              <Icon name="breath" size={20} color="var(--leaf-deep)"/>
              <div style={{ fontFamily:'var(--sans)', fontSize: 12, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--leaf-deep)' }}>{t.pose.breath}</div>
            </div>
            <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize: 17, color:'var(--ink)' }}>
              "{asana.breath[lang] || asana.breath.ca}"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Calendar ────────────────────────────────────────────────
const Calendar = ({ t, lang, profile }) => {
  const realToday = new Date();
  const locale = lang === 'ca' ? 'ca-ES' : lang === 'es' ? 'es-ES' : 'en-US';
  const [view, setView] = uS(() => ({ y: realToday.getFullYear(), m: realToday.getMonth() }));
  const [selected, setSelected] = uS(null); // dia (número) seleccionat dins el mes vist
  const [notes, setNotes] = uS(ebLoadNotes);
  const [now, setNow] = uS(() => Date.now());
  const [draftTime, setDraftTime] = uS('09:00');
  const [draftText, setDraftText] = uS('');
  const RED = '#C2493B';

  // Rellotge: refresca cada 30s perquè els dies passin de verd a vermell sols
  uE(() => { const iv = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(iv); }, []);
  // Si un altre component (l'App) modifica les notes en una altra pestanya, re-sincronitza
  uE(() => {
    const onStorage = (e) => { if (!e || !e.key || e.key === EB_NOTES_KEY) setNotes(ebLoadNotes()); };
    window.addEventListener('elbosc-personal-sync', onStorage);
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('elbosc-personal-sync', onStorage); };
  }, []);

  const days_lang = ({ ca:['Dl','Dt','Dc','Dj','Dv','Ds','Dg'], es:['Lu','Ma','Mi','Ju','Vi','Sá','Do'], en:['Mo','Tu','We','Th','Fr','Sa','Su'] })[lang] || ['Mo','Tu','We','Th','Fr','Sa','Su'];
  const first = new Date(view.y, view.m, 1).getDay() || 7;
  const daysInMonth = new Date(view.y, view.m+1, 0).getDate();
  const monthName = (() => { try { return new Date(view.y, view.m, 1).toLocaleDateString(locale, { month:'long', year:'numeric' }); } catch(e){ return new Date(view.y, view.m, 1).toLocaleDateString('en-US', { month:'long', year:'numeric' }); } })();
  const isTodayCell = (d) => d === realToday.getDate() && view.m === realToday.getMonth() && view.y === realToday.getFullYear();

  const notesForDay = (d) => notes.filter(n => n.date === ebDayKey(view.y, view.m, d)).sort((a,b) => String(a.time||'').localeCompare(String(b.time||'')));
  const changeMonth = (delta) => { setSelected(null); setView(v => { const nd = new Date(v.y, v.m + delta, 1); return { y: nd.getFullYear(), m: nd.getMonth() }; }); };

  const addNote = () => {
    if (selected == null || !draftText.trim()) return;
    const note = { id: 'n' + Date.now() + Math.random().toString(36).slice(2,6), date: ebDayKey(view.y, view.m, selected), time: draftTime || '09:00', text: draftText.trim(), notifiedAt: null };
    const next = [...ebLoadNotes(), note];
    ebSaveNotes(next); setNotes(next); setDraftText('');
  };
  const removeNote = (id) => { const next = ebLoadNotes().filter(n => n.id !== id); ebSaveNotes(next); setNotes(next); };

  const selDateLabel = selected != null ? (() => { try { return new Date(view.y, view.m, selected).toLocaleDateString(locale, { weekday:'long', day:'numeric', month:'long' }); } catch(e){ return String(selected); } })() : '';
  const selNotes = selected != null ? notesForDay(selected) : [];

  return (
    <div className="yb-scroll" style={{ height: '100%', overflowY: 'auto', background: 'var(--paper)' }}>
      <div style={{ padding: '60px 24px 8px' }}>
        <div style={{ fontFamily:'var(--sans)', fontSize: 11, letterSpacing:'0.25em', color:'var(--accent)', marginBottom: 4 }}>
          {{ca:'EL TEU CALENDARI', es:'TU CALENDARIO', en:'YOUR CALENDAR'}[lang]}
        </div>
        <h1 style={{ fontSize: 36, fontStyle:'italic', color:'var(--ink)' }}>{{ ca:'Calendari', es:'Calendario', en:'Calendar' }[lang]}</h1>
      </div>

      <div style={{ padding: '16px 24px' }}>
        <div className="yb-card">
          {/* Navegació de mes */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <button onClick={() => changeMonth(-1)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:6, transform:'rotate(180deg)' }}>
              <Icon name="next" size={18} color="var(--ink-soft)"/>
            </button>
            <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:17, color:'var(--ink)', textTransform:'capitalize' }}>{monthName}</div>
            <button onClick={() => changeMonth(1)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:6 }}>
              <Icon name="next" size={18} color="var(--ink-soft)"/>
            </button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {days_lang.map(d => (<div key={d} style={{ textAlign:'center', fontFamily:'var(--sans)', fontSize: 11, color:'var(--ink-soft)', padding: 4 }}>{d}</div>))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap: 4 }}>
            {Array.from({length: first-1}).map((_,i) => (<div key={'b'+i}/>))}
            {Array.from({length: daysInMonth}).map((_,i) => {
              const d = i+1;
              const dayNotes = notesForDay(d);
              const anyDue = dayNotes.some(n => ebNoteDate(n).getTime() <= now);
              const anyPending = dayNotes.some(n => ebNoteDate(n).getTime() > now);
              const today = isTodayCell(d);
              const isSel = d === selected;
              let bg = 'transparent', color = 'var(--ink)';
              if (today) { bg = 'var(--ink)'; color = 'var(--cream)'; }
              if (anyPending) { bg = 'var(--leaf)'; color = 'var(--cream)'; }
              if (anyDue) { bg = RED; color = '#fff'; }
              return (
                <div key={d} onClick={() => setSelected(d)}
                  style={{
                  aspectRatio: '1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  borderRadius: 10, fontFamily:'var(--sans)', fontSize: 13, position:'relative', cursor:'pointer',
                  background: bg, color: color,
                  boxShadow: isSel ? '0 0 0 2px var(--accent)' : (today && (anyPending||anyDue) ? '0 0 0 2px var(--ink)' : 'none'),
                }}>
                  {d}
                  {dayNotes.length > 0 && (
                    <div style={{ position:'absolute', bottom:4, display:'flex', gap:2 }}>
                      {dayNotes.slice(0,3).map((n,idx) => (<div key={idx} style={{ width:4, height:4, borderRadius:'50%', background: (bg==='transparent') ? 'var(--accent)' : 'rgba(255,255,255,0.85)' }}/>))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panell del dia seleccionat */}
        {selected != null && (
          <div className="yb-card" style={{ marginTop: 16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:18, color:'var(--ink)', textTransform:'capitalize' }}>{selDateLabel}</div>
              <button onClick={() => setSelected(null)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:4 }}>
                <Icon name="close" size={18} color="var(--ink-soft)"/>
              </button>
            </div>

            {selNotes.length === 0 && (
              <div style={{ fontFamily:'var(--sans)', fontSize:13, color:'var(--ink-soft)', marginBottom:6 }}>
                {{ca:'Cap nota per aquest dia. Afegeix-ne una a sota.', es:'Ninguna nota para este día. Añade una abajo.', en:'No notes for this day. Add one below.'}[lang]}
              </div>
            )}
            {selNotes.map(n => {
              const due = ebNoteDate(n).getTime() <= now;
              return (
                <div key={n.id} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 0', borderBottom:'1px solid color-mix(in srgb, var(--ink) 8%, transparent)' }}>
                  <div style={{ minWidth:52, fontFamily:'var(--serif)', fontStyle:'italic', fontSize:16, color: due ? RED : 'var(--leaf-deep)' }}>{n.time}</div>
                  <div style={{ flex:1, fontFamily:'var(--sans)', fontSize:14, color:'var(--ink)', wordBreak:'break-word' }}>{n.text}</div>
                  <button onClick={() => removeNote(n.id)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:4 }}>
                    <Icon name="trash" size={15} color="var(--ink-soft)"/>
                  </button>
                </div>
              );
            })}

            <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontFamily:'var(--sans)', fontSize:11, color:'var(--ink-soft)', letterSpacing:'0.1em' }}>
                  {{ca:'Hora:',es:'Hora:',en:'Time:'}[lang]}
                </span>
                <input type="time" value={draftTime} onChange={e => setDraftTime(e.target.value)}
                  style={{ border:'1.5px solid color-mix(in srgb, var(--ink) 12%, transparent)', borderRadius:10, padding:'8px 12px', fontFamily:'var(--sans)', fontSize:14, background:'var(--cream)', color:'var(--ink)', outline:'none' }}/>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <textarea value={draftText} onChange={e => setDraftText(e.target.value)}
                  placeholder={{ca:'Escriu la nota del dia…', es:'Escribe la nota del día…', en:'Write the day note…'}[lang]}
                  rows={3}
                  style={{ flex:1, border:'1.5px solid color-mix(in srgb, var(--ink) 12%, transparent)', borderRadius:12, padding:'10px 12px', fontFamily:'var(--serif)', fontSize:15, background:'var(--cream)', color:'var(--ink)', outline:'none', resize:'none', lineHeight:1.4 }}/>
                <button aria-label={({ca:'Afegir',es:'Añadir',en:'Add'})[lang]} onClick={addNote} disabled={!draftText.trim()}
                  style={{ background:'var(--accent)', border:'none', borderRadius:12, width:44, alignSelf:'stretch', display:'flex', alignItems:'center', justifyContent:'center', cursor: draftText.trim()?'pointer':'default', opacity: draftText.trim()?1:0.5, flexShrink:0 }}>
                  <Icon name="plus" size={20} color="var(--cream)"/>
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ height: 100 }}/>
      </div>
    </div>
  );
};

// ── Journal ─────────────────────────────────────────────────
const JOURNAL_KEY = 'elbosc-journal';
const jLoad = () => { try { const s = JSON.parse(localStorage.getItem(JOURNAL_KEY)); if (Array.isArray(s)) return s; } catch(e){} return []; };
const jSave = (arr) => { try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(arr)); } catch(e){} try { window.EBPersonal && window.EBPersonal.changed('journal', arr); } catch(e){} };
const MOOD_EMOJI = ['◔','◑','◐','●','✦'];

const Journal = ({ t, lang, onShare }) => {
  const [entries, setEntries] = uS(jLoad);
  uE(() => { const r = () => setEntries(jLoad()); window.addEventListener('elbosc-personal-sync', r); return () => window.removeEventListener('elbosc-personal-sync', r); }, []);
  const [mood, setMood] = uS(3);
  const [note, setNote] = uS('');
  const locale = lang === 'ca' ? 'ca-ES' : lang === 'es' ? 'es-ES' : 'en-US';

  const save = () => {
    if (!note.trim()) return;
    const entry = { id:'j'+Date.now()+Math.random().toString(36).slice(2,6), ts: Date.now(), mood, text: note.trim() };
    const next = [entry, ...jLoad()];
    jSave(next); setEntries(next); setNote('');
  };
  const remove = (id) => { const next = jLoad().filter(e => e.id !== id); jSave(next); setEntries(next); };
  const sorted = [...entries].sort((a,b) => b.ts - a.ts);
  const fmt = (ts) => { try { return new Date(ts).toLocaleDateString(locale, { weekday:'short', day:'numeric', month:'long' }); } catch(e){ return ''; } };

  return (
    <div className="yb-scroll" style={{ height: '100%', overflowY: 'auto', background: 'var(--paper)' }}>
      <div style={{ padding: '60px 24px 16px' }}>
        <div style={{ fontFamily:'var(--sans)', fontSize: 11, letterSpacing:'0.25em', color:'var(--accent)', marginBottom: 4 }}>
          {{ca:'AVUI', es:'HOY', en:'TODAY'}[lang]} · {new Date().toLocaleDateString(locale, { day:'numeric', month:'long' })}
        </div>
        <h1 style={{ fontSize: 36, fontStyle:'italic', color:'var(--ink)' }}>{t.journal_.title}</h1>
      </div>

      <div style={{ padding: '8px 24px 24px' }}>
        <div className="yb-card">
          <div style={{ fontFamily:'var(--sans)', fontSize: 13, color:'var(--ink-soft)', marginBottom: 16 }}>{t.journal_.how}</div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 8 }}>
            {t.journal_.moods.map((m, i) => (
              <button key={i} onClick={() => setMood(i)} style={{
                background:'transparent', border:'none', cursor:'pointer',
                padding: 8, borderRadius: 12, opacity: mood === i ? 1 : 0.4,
                transform: mood === i ? 'scale(1.15)' : 'scale(1)', transition:'all .2s',
              }}>
                <div style={{ fontSize: 28, color: mood === i ? 'var(--accent)' : 'var(--ink)' }}>{MOOD_EMOJI[i]}</div>
                <div style={{ fontFamily:'var(--sans)', fontSize: 10, color:'var(--ink-soft)', marginTop: 4 }}>{m}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="yb-card" style={{ marginTop: 16 }}>
          <div style={{ fontFamily:'var(--sans)', fontSize: 13, color:'var(--ink-soft)', marginBottom: 12 }}>{t.journal_.notes}</div>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="..."
            style={{ width:'100%', minHeight: 120, border:'none', outline:'none', resize:'none',
              fontFamily:'var(--serif)', fontSize: 16, lineHeight: 1.5, color:'var(--ink)', background:'transparent' }}/>
        </div>

        <button onClick={save} disabled={!note.trim()} className="yb-btn yb-btn-primary" style={{ width:'100%', marginTop: 16, opacity: note.trim() ? 1 : 0.55 }}>
          {t.journal_.save}
        </button>

        {/* Anotacions guardades, ordenades per data (més recent a dalt) */}
        <div style={{ marginTop: 32 }}>
          <div className="yb-divider-leaf" style={{ marginBottom: 14 }}>{{ca:'Anteriors', es:'Anteriores', en:'Earlier'}[lang]}</div>
          {sorted.length === 0 && (
            <div style={{ fontFamily:'var(--sans)', fontSize: 13, color:'var(--ink-soft)', textAlign:'center', padding:'8px 0 4px' }}>
              {{ca:'Encara no has escrit cap anotació.', es:'Aún no has escrito ninguna anotación.', en:'No entries yet.'}[lang]}
            </div>
          )}
          {sorted.map(e => (
            <div key={e.id} className="yb-card" style={{ marginBottom: 10, display:'flex', gap: 14, alignItems:'flex-start', padding: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius:'50%', background:'color-mix(in srgb, var(--accent) 18%, transparent)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 18, flexShrink:0 }}>{MOOD_EMOJI[e.mood]}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:'var(--sans)', fontSize: 11, color:'var(--ink-soft)', textTransform:'uppercase' }}>{fmt(e.ts)}</div>
                <div style={{ fontFamily:'var(--serif)', fontSize: 14, color:'var(--ink)', marginTop: 2, fontStyle:'italic', wordBreak:'break-word' }}>"{e.text}"</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {onShare && (
                  <button onClick={() => onShare({ kind:'journal', mood:e.mood, emoji:MOOD_EMOJI[e.mood], date:fmt(e.ts), text:e.text })} title="Compartir" style={{ background:'transparent', border:'none', cursor:'pointer', padding:4 }}>
                    <Icon name="send" size={15} color="var(--ink-soft)"/>
                  </button>
                )}
                <button onClick={() => remove(e.id)} title="Eliminar" style={{ background:'transparent', border:'none', cursor:'pointer', padding:4 }}>
                  <Icon name="trash" size={15} color="var(--ink-soft)"/>
                </button>
              </div>
            </div>
          ))}
          <div style={{ height: 80 }}/>
        </div>
      </div>
    </div>
  );
};

// ── Messages ────────────────────────────────────────────────
const Messages = ({ t, lang }) => {
  const msgs = {
    ca: [
      { d:'Avui · 7:30', t:'Bon dia! Avui us proposo escoltar el cos abans de començar. La sensació hi és. ❀' },
      { d:'29 abril', t:'Recordeu que dimarts no hi haurà classe presencial. Aquesta setmana centrem la pràctica en obrir malucs.' },
      { d:'25 abril', t:'Una pràctica curta a l\'estiu pot ser més efectiva si la fas amb constància. Confio en vosaltres.' },
    ],
    es: [
      { d:'Hoy · 7:30', t:'¡Buenos días! Hoy os propongo escuchar el cuerpo antes de empezar. La sensación está ahí. ❀' },
      { d:'29 abril', t:'Recordad que el martes no habrá clase presencial. Esta semana abrimos caderas.' },
      { d:'25 abril', t:'Una práctica corta en verano es efectiva si es constante. Confío en vosotras.' },
    ],
    en: [
      { d:'Today · 7:30', t:'Good morning! Today I invite you to listen to your body before starting. The sensation is there. ❀' },
      { d:'Apr 29', t:'Remember Tuesday there will be no in-person class. This week we focus on opening hips.' },
      { d:'Apr 25', t:'A short summer practice can be more effective with consistency. I trust you.' },
    ],
  }[lang];

  return (
    <div className="yb-scroll" style={{ height:'100%', overflowY:'auto', background:'var(--paper)' }}>
      <div style={{ padding: '60px 24px 16px' }}>
        <div style={{ fontFamily:'var(--sans)', fontSize: 11, letterSpacing:'0.25em', color:'var(--accent)', marginBottom: 4 }}>
          {t.messages_.from.toUpperCase()}
        </div>
        <h1 style={{ fontSize: 36, fontStyle:'italic', color:'var(--ink)' }}>{t.messages_.title}</h1>
      </div>

      <div style={{ padding: '0 24px 120px' }}>
        {msgs.map((m, i) => (
          <div key={i} className="yb-card" style={{ marginBottom: 12 }}>
            <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius:'50%', background:'var(--accent)', color:'var(--cream)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--serif)', fontSize: 18 }}>M</div>
              <div>
                <div style={{ fontFamily:'var(--sans)', fontSize: 13, color:'var(--ink)' }}>Cèlia</div>
                <div style={{ fontFamily:'var(--sans)', fontSize: 11, color:'var(--ink-soft)' }}>{m.d}</div>
              </div>
            </div>
            <div style={{ fontFamily:'var(--serif)', fontSize: 16, lineHeight: 1.55, color:'var(--ink)' }}>{m.t}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Tab bar ──────────────────────────────────────────────────
const TabBar = ({ active, setActive, t, role, badges }) => {
  const tabs = [
    { id:'home', icon:'home', label: t.nav.home },
    { id:'library', icon:'library', label: t.nav.library },
    { id:'calendar', icon:'calendar', label: t.nav.calendar },
    { id:'journal', icon:'journal', label: t.nav.journal },
    { id:'messages', icon:'chat', label: t.nav.messages },
  ];
  return (
    <nav className="eb-tabbar" aria-label="El Bosc">
      {tabs.map(tab => (
        <button key={tab.id} className="eb-tab" aria-current={active === tab.id ? 'page' : undefined}
          onClick={() => { if (active !== tab.id) { try { navigator.vibrate && navigator.vibrate(8); } catch (e) {} setActive(tab.id); } }}>
          <span className="eb-tab-pill" aria-hidden="true"/>
          <Icon name={tab.icon} size={22} color="currentColor" strokeWidth={active === tab.id ? 2.1 : 1.75}/>
          <span>{tab.label}</span>
          {badges && badges[tab.id] ? <span className="eb-tab-dot" aria-label="nou"/> : null}
        </button>
      ))}
    </nav>
  );
};

Object.assign(window, { Dashboard, Library, PoseDetail, Calendar, Journal, Messages, TabBar });
