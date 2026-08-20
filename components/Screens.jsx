// components/Screens.jsx — Dashboard, Library, PoseDetail, Calendar, Journal, Progress, Messages

const { useState: uS, useMemo: uM, useEffect: uE } = React;

// ── Notes del calendari (compartides amb l'App per als avisos) ──
const EB_NOTES_KEY = 'elbosc-calendar-notes';
const ebLoadNotes = () => { try { const s = JSON.parse(localStorage.getItem(EB_NOTES_KEY)); if (Array.isArray(s)) return s; } catch(e){} return []; };
const ebSaveNotes = (arr) => { try { localStorage.setItem(EB_NOTES_KEY, JSON.stringify(arr)); } catch(e){} };
const ebPad = (n) => String(n).padStart(2, '0');
const ebDayKey = (y, m, d) => `${y}-${ebPad(m+1)}-${ebPad(d)}`;
const ebNoteDate = (n) => { const [Y,M,D] = String(n.date).split('-').map(Number); const [h,mi] = String(n.time||'00:00').split(':').map(Number); return new Date(Y, (M||1)-1, D||1, h||0, mi||0, 0, 0); };
if (typeof window !== 'undefined') window.EBNotes = { load: ebLoadNotes, save: ebSaveNotes, dayKey: ebDayKey, dateOf: ebNoteDate, KEY: EB_NOTES_KEY };

// ── Dashboard ───────────────────────────────────────────────
const Dashboard = ({ t, profile, sequence, lang, role, theme, onChangeTheme, adminPin, onChangePin, onStartPractice, onOpenPose, illustrationStyle, onLogout, onChangeName }) => {
  const totalMin = Math.round(sequence.reduce((s,p)=>s+p.duration,0)/60);
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return { ca: 'Bon matí', es: 'Buenos días', en: 'Good morning' }[lang];
    if (h < 19) return { ca: 'Bona tarda', es: 'Buenas tardes', en: 'Good afternoon' }[lang];
    return { ca: 'Bona nit', es: 'Buenas noches', en: 'Good evening' }[lang];
  })();

  const [avatar, setAvatar] = uS(() => { try { return localStorage.getItem('elbosc-avatar') || null; } catch(e){ return null; } });
  const [showProfile, setShowProfile] = uS(false);
  const [pinDraft, setPinDraft] = uS('');
  const [pinMsg, setPinMsg] = uS(null);
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
    pinPh: {ca:'PIN nou (4–8, lletres o números)', es:'PIN nuevo (4–8, letras o números)', en:'New PIN (4–8, letters or numbers)'}[lang],
    pinCurrent: {ca:'PIN actual', es:'PIN actual', en:'Current PIN'}[lang],
    pinSave: {ca:'Desar', es:'Guardar', en:'Save'}[lang],
    pinOk: {ca:'PIN actualitzat.', es:'PIN actualizado.', en:'PIN updated.'}[lang],
    pinErr: {ca:'Ha de tenir 4–8 lletres o números.', es:'Debe tener 4–8 letras o números.', en:'Must be 4–8 letters or numbers.'}[lang],
  };
  const themeLabelStyle = { fontFamily:'var(--sans)', fontSize:11, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--accent)', display:'block' };
  const THEMES = [
    { id:'bosc',  label:{ca:'Bosc',es:'Bosc',en:'Forest'}[lang], color:'#B8744A' },
    { id:'sage',  label:{ca:'Sàlvia',es:'Salvia',en:'Sage'}[lang], color:'#6B8259' },
    { id:'ocean', label:{ca:'Oceà',es:'Océano',en:'Ocean'}[lang], color:'#4A7B8C' },
  ];
  const pinValid = /^[A-Za-z0-9]{4,8}$/.test(pinDraft);
  const savePin = () => {
    if (!pinValid) { setPinMsg({ type:'err', text: PT.pinErr }); return; }
    onChangePin && onChangePin(pinDraft);
    setPinDraft(''); setPinMsg({ type:'ok', text: PT.pinOk });
  };

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
          <div style={{ fontFamily:'var(--serif)', fontSize: 28, fontStyle:'italic', marginTop: 4 }}>4</div>
          <div style={{ fontFamily:'var(--sans)', fontSize: 11, color:'var(--ink-soft)' }}>{t.progress_.streak}</div>
        </div>
        <div className="yb-card" style={{ padding: 16 }}>
          <Icon name="heart" size={18} color="var(--accent)"/>
          <div style={{ fontFamily:'var(--serif)', fontSize: 28, fontStyle:'italic', marginTop: 4 }}>3 / {profile.frequency || 3}</div>
          <div style={{ fontFamily:'var(--sans)', fontSize: 11, color:'var(--ink-soft)' }}>{t.progress_.thisWeek}</div>
        </div>
      </div>

      {/* Teacher note */}
      <div style={{ padding: '0 24px 100px' }}>
        <div className="yb-card" style={{ background:'color-mix(in srgb, var(--accent) 8%, var(--cream))', display:'flex', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius:'50%', background:'var(--accent)', flexShrink: 0, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--cream)', fontFamily:'var(--serif)', fontSize: 20 }}>M</div>
          <div>
            <div style={{ fontFamily:'var(--sans)', fontSize: 11, color:'var(--accent)', letterSpacing:'0.15em', textTransform:'uppercase' }}>{t.messages_.from}</div>
            <div style={{ fontFamily:'var(--serif)', fontSize: 15, lineHeight: 1.5, color:'var(--ink)', marginTop: 4, fontStyle:'italic' }}>
              {{ ca:'"Quina sensació tens quan estàs fent aquesta pràctica? Escolta el cos."', es:'"¿Qué sensación tienes cuando haces esta práctica? Escucha el cuerpo."', en:'"What sensation do you feel during this practice? Listen to your body."' }[lang]}
            </div>
          </div>
        </div>
      </div>
    </div>

    {showProfile && (
      <div onClick={() => setShowProfile(false)}
        style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(20,18,14,0.5)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
        <div onClick={e => e.stopPropagation()}
          style={{ width:'100%', maxWidth:430, background:'var(--paper)', borderTopLeftRadius:24, borderTopRightRadius:24, padding:'22px 24px calc(28px + env(safe-area-inset-bottom, 0px))', boxShadow:'0 -10px 40px rgba(0,0,0,0.25)' }}>
          <div style={{ width:40, height:4, borderRadius:2, background:'color-mix(in srgb, var(--ink) 15%, transparent)', margin:'0 auto 18px' }}/>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16, marginBottom:20 }}>
            <div style={{ width:96, height:96, borderRadius:'50%', overflow:'hidden', background:'var(--cream)', border:'1px solid color-mix(in srgb, var(--ink) 8%, transparent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {avatar
                ? <img src={avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : <Icon name="user" size={40} color="var(--ink-soft)"/>}
            </div>
            <div style={{ width:'100%' }}>
              <label style={{ fontFamily:'var(--sans)', fontSize:11, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--accent)', display:'block', marginBottom:8, textAlign:'center' }}>{PT.nameLabel}</label>
              <input type="text" value={profile.name || ''} onChange={e => onChangeName && onChangeName(e.target.value)}
                placeholder={PT.namePh}
                style={{ width:'100%', border:'1.5px solid color-mix(in srgb, var(--ink) 12%, transparent)', borderRadius:14, padding:'12px 16px', fontFamily:'var(--serif)', fontStyle:'italic', fontSize:20, background:'var(--cream)', color:'var(--ink)', outline:'none', textAlign:'center', boxSizing:'border-box' }}/>
            </div>
          </div>

          <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', padding:'13px', borderRadius:14, background:'var(--accent)', color:'var(--cream)', fontFamily:'var(--sans)', fontSize:15, cursor:'pointer', marginBottom:4, boxSizing:'border-box' }}>
            <Icon name="image" size={18} color="var(--cream)"/>
            {PT.change}
            <input type="file" accept="image/*" onChange={onPickPhoto} style={{ display:'none' }}/>
          </label>
          <div style={{ fontFamily:'var(--sans)', fontSize:11, color:'var(--ink-soft)', textAlign:'center', marginBottom:14 }}>{PT.hint}</div>

          {avatar && (
            <button onClick={removePhoto} style={{ width:'100%', padding:'12px', borderRadius:14, background:'transparent', border:'1px solid color-mix(in srgb, var(--ink) 12%, transparent)', color:'var(--ink)', fontFamily:'var(--sans)', fontSize:14, cursor:'pointer', marginBottom:10, boxSizing:'border-box' }}>{PT.remove}</button>
          )}

          {/* Tema */}
          <div style={{ height:1, background:'color-mix(in srgb, var(--ink) 8%, transparent)', margin:'10px 0 14px' }}/>
          <label style={themeLabelStyle}>{PT.theme}</label>
          <div style={{ display:'flex', gap:10, marginTop:12, marginBottom:4 }}>
            {THEMES.map(th => (
              <button key={th.id} onClick={() => onChangeTheme && onChangeTheme(th.id)}
                style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:8, background:'transparent', border:'none', cursor:'pointer', padding:'6px 0' }}>
                <div style={{ width:42, height:42, borderRadius:'50%', background:th.color, boxShadow: theme===th.id ? ('0 0 0 3px var(--paper), 0 0 0 5px '+th.color) : 'none' }}/>
                <span style={{ fontFamily:'var(--sans)', fontSize:12, color: theme===th.id ? 'var(--ink)' : 'var(--ink-soft)' }}>{th.label}</span>
              </button>
            ))}
          </div>

          {role === 'teacher' && (
            <div style={{ marginTop:16 }}>
              <div style={{ height:1, background:'color-mix(in srgb, var(--ink) 8%, transparent)', margin:'6px 0 14px' }}/>
              <label style={themeLabelStyle}>{PT.teacherZone} · PIN</label>
              <div style={{ fontFamily:'var(--sans)', fontSize:12, color:'var(--ink-soft)', margin:'8px 0 10px' }}>
                {PT.pinCurrent}: <span style={{ fontFamily:'var(--serif)', fontSize:15, letterSpacing:'0.2em', color:'var(--ink)' }}>{adminPin}</span>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'stretch' }}>
                <input type="text" value={pinDraft} maxLength={8} placeholder={PT.pinPh}
                  autoCapitalize="none" autoCorrect="off" spellCheck="false"
                  onChange={e => { setPinDraft(e.target.value.replace(/[^A-Za-z0-9]/g,'').slice(0,8)); setPinMsg(null); }}
                  onKeyDown={e => e.key === 'Enter' && savePin()}
                  style={{ flex:1, minWidth:0, border:'1.5px solid color-mix(in srgb, var(--ink) 12%, transparent)', borderRadius:12, padding:'11px 12px', fontFamily:'var(--sans)', fontSize:14, background:'var(--cream)', color:'var(--ink)', outline:'none', boxSizing:'border-box' }}/>
                <button onClick={savePin} disabled={!pinValid}
                  style={{ flexShrink:0, padding:'0 16px', borderRadius:12, border:'none', background:'var(--accent)', color:'var(--cream)', fontFamily:'var(--sans)', fontSize:14, cursor: pinValid?'pointer':'default', opacity: pinValid?1:0.5 }}>{PT.pinSave}</button>
              </div>
              {pinMsg && <div style={{ fontFamily:'var(--sans)', fontSize:12, color: pinMsg.type==='ok' ? 'var(--leaf-deep)' : 'var(--accent)', marginTop:8 }}>{pinMsg.text}</div>}
            </div>
          )}

          <div style={{ height:1, background:'color-mix(in srgb, var(--ink) 8%, transparent)', margin:'16px 0 12px' }}/>
          <button onClick={() => { setShowProfile(false); onLogout && onLogout(); }}
            style={{ width:'100%', padding:'13px', borderRadius:14, background:'transparent', border:'1px solid color-mix(in srgb, var(--accent) 40%, transparent)', color:'var(--accent)', fontFamily:'var(--sans)', fontSize:15, cursor:'pointer', boxSizing:'border-box' }}>
            {PT.logout}
          </button>
        </div>
      </div>
    )}
    </>
  );
};

// ── Library ─────────────────────────────────────────────────
const Library = ({ t, lang, asanas, onOpenPose, illustrationStyle }) => {
  const [filter, setFilter] = uS('all');
  const families = ['all','peu','equilibri','flexio','extensio','torsio','restauratiu','meditacio','mobilitat'];
  const familyLabels = { all: { ca:'Totes', es:'Todas', en:'All' }, peu:'Peu', equilibri:'Equilibri', flexio:'Flexió', extensio:'Extensió', torsio:'Torsió', restauratiu:'Restaurativa', meditacio:'Meditació', mobilitat:'Mobilitat' };

  const filtered = filter === 'all' ? asanas : asanas.filter(a => a.family === filter);

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

      <div style={{ padding: '8px 24px 100px', display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12 }}>
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
const PoseDetail = ({ t, lang, asana, onClose, illustrationStyle }) => {
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
          <button onClick={onClose} style={{ background:'var(--cream)', border:'none', borderRadius:'50%', width:40, height:40, cursor:'pointer' }}>
            <Icon name="back" size={18}/>
          </button>
          <div style={{ display:'flex', gap: 8 }}>
            <button style={{ background:'var(--cream)', border:'none', borderRadius:'50%', width:40, height:40, cursor:'pointer' }}>
              <Icon name="heart" size={18} color="var(--ink-soft)"/>
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
        <div style={{ padding: '0 24px 100px', display:'flex', flexDirection:'column', gap: 16 }}>
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
    const onStorage = (e) => { if (e.key === EB_NOTES_KEY) setNotes(ebLoadNotes()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
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
                <button onClick={addNote} disabled={!draftText.trim()}
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
const jSave = (arr) => { try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(arr)); } catch(e){} };
const MOOD_EMOJI = ['◔','◑','◐','●','✦'];

const Journal = ({ t, lang, onShare }) => {
  const [entries, setEntries] = uS(jLoad);
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

// ── Progress ────────────────────────────────────────────────
const Progress = ({ t, lang, profile }) => (
  <div className="yb-scroll" style={{ height:'100%', overflowY:'auto', background:'var(--paper)' }}>
    <div style={{ padding: '60px 24px 16px' }}>
      <h1 style={{ fontSize: 36, fontStyle:'italic', color:'var(--ink)' }}>{t.progress_.title}</h1>
    </div>
    <div style={{ padding: '0 24px 100px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { v: 4, l: t.progress_.streak, ic:'flame' },
          { v: 12, l: t.progress_.total, ic:'flower' },
          { v: 268, l: t.progress_.minutesPracticed, ic:'timer' },
          { v: profile.frequency || 3, l: t.progress_.thisWeek, ic:'heart' },
        ].map((s, i) => (
          <div key={i} className="yb-card" style={{ padding: 16 }}>
            <Icon name={s.ic} size={18} color="var(--accent)"/>
            <div style={{ fontFamily:'var(--serif)', fontSize: 32, fontStyle:'italic', marginTop: 4, color:'var(--ink)' }}>{s.v}</div>
            <div style={{ fontFamily:'var(--sans)', fontSize: 11, color:'var(--ink-soft)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="yb-card">
        <div className="yb-divider-leaf" style={{ marginBottom: 16 }}>{{ca:'Setmana', es:'Semana', en:'Week'}[lang]}</div>
        <div style={{ display:'flex', alignItems:'flex-end', gap: 8, height: 120 }}>
          {[0.3, 0.6, 0, 0.8, 0.5, 0.9, 0.4].map((v,i) => (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap: 6 }}>
              <div style={{ height: '100%', width:'100%', display:'flex', alignItems:'flex-end' }}>
                <div style={{ width:'100%', height: `${v*100}%`, background: v > 0 ? 'var(--accent)' : 'var(--paper-2)', borderRadius: 6, minHeight: 4 }}/>
              </div>
              <div style={{ fontFamily:'var(--sans)', fontSize: 10, color:'var(--ink-soft)' }}>{['L','M','M','J','V','S','D'][i]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="yb-card" style={{ marginTop: 16, background: 'color-mix(in srgb, var(--leaf) 12%, var(--cream))' }}>
        <div style={{ fontFamily:'var(--sans)', fontSize: 11, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--leaf-deep)' }}>{t.progress_.favPose}</div>
        <div style={{ fontFamily:'var(--serif)', fontSize: 22, fontStyle:'italic', color:'var(--ink)', marginTop: 4 }}>Bālāsana</div>
        <div style={{ fontFamily:'var(--sans)', fontSize: 12, color:'var(--ink-soft)', marginTop: 2 }}>9 {{ca:'pràctiques', es:'prácticas', en:'practices'}[lang]}</div>
      </div>
    </div>
  </div>
);

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

      <div style={{ padding: '0 24px 100px' }}>
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
const TabBar = ({ active, setActive, t, role }) => {
  const tabs = [
    { id:'home', icon:'home', label: t.nav.home },
    { id:'library', icon:'library', label: t.nav.library },
    { id:'calendar', icon:'calendar', label: t.nav.calendar },
    { id:'journal', icon:'journal', label: t.nav.journal },
    { id:'messages', icon:'chat', label: t.nav.messages },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: '10px 12px 30px',
      background: 'color-mix(in srgb, var(--paper) 92%, transparent)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid color-mix(in srgb, var(--ink) 6%, transparent)',
      display: 'flex', justifyContent: 'space-around',
    }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => setActive(tab.id)} style={{
          background:'transparent', border:'none', cursor:'pointer',
          display:'flex', flexDirection:'column', alignItems:'center', gap: 4,
          padding: '6px 10px', minWidth: 56,
          color: active === tab.id ? 'var(--accent)' : 'var(--ink-soft)',
        }}>
          <Icon name={tab.icon} size={20} color="currentColor" strokeWidth={active === tab.id ? 1.8 : 1.5}/>
          <div style={{ fontFamily:'var(--sans)', fontSize: 10, letterSpacing:'0.05em' }}>{tab.label}</div>
        </button>
      ))}
    </div>
  );
};

// ── Config (professora): canvi de PIN d'accés ───────────────
const ConfigScreen = ({ t, lang, currentPin, onChangePin }) => {
  const [p1, setP1] = uS('');
  const [p2, setP2] = uS('');
  const [msg, setMsg] = uS(null); // { type:'ok'|'err', text }
  const valid = /^\d{4}$/.test(p1) && /^\d{4}$/.test(p2);
  const L = {
    kicker: {ca:'PROFESSORA', es:'PROFESORA', en:'TEACHER'}[lang],
    title:  {ca:'Configuració', es:'Configuración', en:'Settings'}[lang],
    sec:    {ca:'PIN d\'accés', es:'PIN de acceso', en:'Access PIN'}[lang],
    desc:   {ca:'Canvia el codi que et demana l\'app per entrar al panell de professora.', es:'Cambia el código que te pide la app para entrar al panel de profesora.', en:'Change the code the app asks to enter the teacher panel.'}[lang],
    cur:    {ca:'PIN actual', es:'PIN actual', en:'Current PIN'}[lang],
    l1:     {ca:'PIN nou (4 xifres)', es:'PIN nuevo (4 cifras)', en:'New PIN (4 digits)'}[lang],
    l2:     {ca:'Repeteix el PIN nou', es:'Repite el PIN nuevo', en:'Repeat new PIN'}[lang],
    save:   {ca:'Desar PIN', es:'Guardar PIN', en:'Save PIN'}[lang],
  };
  const save = () => {
    if (!/^\d{4}$/.test(p1)) { setMsg({ type:'err', text:{ca:'El PIN ha de tenir 4 xifres.', es:'El PIN debe tener 4 cifras.', en:'PIN must be 4 digits.'}[lang] }); return; }
    if (p1 !== p2) { setMsg({ type:'err', text:{ca:'Els PINs no coincideixen.', es:'Los PIN no coinciden.', en:'PINs do not match.'}[lang] }); return; }
    onChangePin && onChangePin(p1);
    setP1(''); setP2('');
    setMsg({ type:'ok', text:{ca:'PIN actualitzat correctament.', es:'PIN actualizado correctamente.', en:'PIN updated successfully.'}[lang] });
  };
  const inputStyle = { width:'100%', border:'1.5px solid color-mix(in srgb, var(--ink) 12%, transparent)', borderRadius:14, padding:'12px 16px', fontFamily:'var(--serif)', fontSize:20, background:'var(--cream)', color:'var(--ink)', outline:'none', letterSpacing:'0.35em', textAlign:'center', boxSizing:'border-box' };
  const labelStyle = { fontFamily:'var(--sans)', fontSize:11, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--accent)', display:'block', marginBottom:8 };
  return (
    <div className="yb-scroll" style={{ height:'100%', overflowY:'auto', background:'var(--paper)' }}>
      <div style={{ padding:'60px 24px 8px' }}>
        <div style={{ fontFamily:'var(--sans)', fontSize:11, letterSpacing:'0.25em', color:'var(--accent)', marginBottom:4 }}>{L.kicker}</div>
        <h1 style={{ fontSize:36, fontStyle:'italic', color:'var(--ink)' }}>{L.title}</h1>
      </div>
      <div style={{ padding:'16px 24px 100px' }}>
        <div className="yb-card">
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <Icon name="lock" size={18} color="var(--accent)"/>
            <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:18, color:'var(--ink)' }}>{L.sec}</div>
          </div>
          <div style={{ fontFamily:'var(--sans)', fontSize:13, color:'var(--ink-soft)', marginBottom:18, lineHeight:1.5 }}>{L.desc}</div>

          <div style={{ fontFamily:'var(--sans)', fontSize:12, color:'var(--ink-soft)', marginBottom:18 }}>
            {L.cur}: <span style={{ fontFamily:'var(--serif)', fontSize:16, letterSpacing:'0.25em', color:'var(--ink)' }}>{currentPin}</span>
          </div>

          <label style={labelStyle}>{L.l1}</label>
          <input type="tel" inputMode="numeric" maxLength={4} value={p1}
            onChange={e => { setP1(e.target.value.replace(/\D/g,'').slice(0,4)); setMsg(null); }}
            placeholder="————" style={{ ...inputStyle, marginBottom:16 }}/>

          <label style={labelStyle}>{L.l2}</label>
          <input type="tel" inputMode="numeric" maxLength={4} value={p2}
            onChange={e => { setP2(e.target.value.replace(/\D/g,'').slice(0,4)); setMsg(null); }}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="————" style={{ ...inputStyle, marginBottom:16 }}/>

          {msg && <div style={{ fontFamily:'var(--sans)', fontSize:13, color: msg.type==='ok' ? 'var(--leaf-deep)' : 'var(--accent)', marginBottom:12 }}>{msg.text}</div>}

          <button onClick={save} disabled={!valid} className="yb-btn yb-btn-clay" style={{ width:'100%', opacity: valid?1:0.55 }}>{L.save}</button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Dashboard, Library, PoseDetail, Calendar, Journal, Progress, Messages, TabBar, ConfigScreen });
