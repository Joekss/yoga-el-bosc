// components/Screens.jsx — Dashboard, Library, PoseDetail, Calendar, Journal, Progress, Messages

const { useState: uS, useMemo: uM } = React;

// ── Dashboard ───────────────────────────────────────────────
const Dashboard = ({ t, profile, sequence, lang, onStartPractice, onOpenPose, illustrationStyle, onLogout }) => {
  const totalMin = Math.round(sequence.reduce((s,p)=>s+p.duration,0)/60);
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return { ca: 'Bon matí', es: 'Buenos días', en: 'Good morning' }[lang];
    if (h < 19) return { ca: 'Bona tarda', es: 'Buenas tardes', en: 'Good afternoon' }[lang];
    return { ca: 'Bona nit', es: 'Buenas noches', en: 'Good evening' }[lang];
  })();

  return (
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
        <button onClick={() => {
            const msg = { ca:'Tancar la sessió actual?', es:'¿Cerrar la sesión actual?', en:'Log out of the current session?' }[lang];
            if (window.confirm(msg)) onLogout && onLogout();
          }}
          style={{ width: 44, height: 44, borderRadius:'50%', background:'var(--cream)', display:'flex', alignItems:'center', justifyContent:'center', border: '1px solid color-mix(in srgb, var(--ink) 8%, transparent)', cursor:'pointer', padding:0 }}>
          <Icon name="user" size={20} color="var(--ink-soft)"/>
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
          {{ ca:'88 ĀSANES', es:'88 ĀSANAS', en:'88 ĀSANAS' }[lang]}
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
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  const locale = lang === 'ca' ? 'ca-ES' : lang === 'es' ? 'es-ES' : 'en-US';
  const first = new Date(year, month, 1).getDay() || 7;
  const days = new Date(year, month+1, 0).getDate();
  const days_lang = ({ ca: ['Dl','Dt','Dc','Dj','Dv','Ds','Dg'], es: ['Lu','Ma','Mi','Ju','Vi','Sá','Do'], en: ['Mo','Tu','We','Th','Fr','Sa','Su'] })[lang] || ['Mo','Tu','We','Th','Fr','Sa','Su'];
  const monthName = (() => { try { return today.toLocaleDateString(locale, { month: 'long', year: 'numeric' }); } catch(e) { return today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); } })();
  const PRACTICED_KEY = `elbosc-practiced-${year}-${month}`;
  const [practiced, setPracticed] = uS(() => {
    try { const s = JSON.parse(localStorage.getItem(PRACTICED_KEY)); if (Array.isArray(s)) return s; } catch(e) {}
    return [3, 5, 6, 9, 11, 13, 14, 17, 18, 20].filter(d => d <= today.getDate());
  });
  const toggleDay = (d) => {
    if (d > today.getDate()) return;
    setPracticed(prev => {
      const next = prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d];
      try { localStorage.setItem(PRACTICED_KEY, JSON.stringify(next)); } catch(e) {}
      return next;
    });
  };
  // Upcoming dates as real Date objects
  const upcoming = [1, 2, 3].map(n => { const d = new Date(today); d.setDate(today.getDate() + n); return d; });

  return (
    <div className="yb-scroll" style={{ height: '100%', overflowY: 'auto', background: 'var(--paper)' }}>
      <div style={{ padding: '60px 24px 8px' }}>
        <div style={{ fontFamily:'var(--sans)', fontSize: 11, letterSpacing:'0.25em', color:'var(--accent)', marginBottom: 4 }}>
          {monthName.toUpperCase()}
        </div>
        <h1 style={{ fontSize: 36, fontStyle:'italic', color:'var(--ink)' }}>{{ ca:'Calendari', es:'Calendario', en:'Calendar' }[lang]}</h1>
      </div>

      <div style={{ padding: '24px' }}>
        <div className="yb-card">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {days_lang.map(d => (<div key={d} style={{ textAlign:'center', fontFamily:'var(--sans)', fontSize: 11, color:'var(--ink-soft)', padding: 4 }}>{d}</div>))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap: 4 }}>
            {Array.from({length: first-1}).map((_,i) => (<div key={'b'+i}/>))}
            {Array.from({length: days}).map((_,i) => {
              const d = i+1;
              const isToday = d === today.getDate();
              const did = practiced.includes(d);
              const isFuture = d > today.getDate();
              return (
                <div key={d} onClick={() => toggleDay(d)}
                  style={{
                  aspectRatio: '1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  borderRadius: 10, fontFamily:'var(--sans)', fontSize: 13, position:'relative',
                  background: isToday ? 'var(--ink)' : did ? 'color-mix(in srgb, var(--accent) 22%, transparent)' : 'transparent',
                  color: isToday ? 'var(--cream)' : isFuture ? 'color-mix(in srgb, var(--ink) 35%, transparent)' : 'var(--ink)',
                  cursor: isFuture ? 'default' : 'pointer',
                }}>
                  {d}
                  {did && !isToday && (
                    <div style={{ width: 4, height: 4, borderRadius:'50%', background:'var(--accent)', marginTop: 2 }}/>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 20, paddingBottom: 100 }}>
          <div className="yb-divider-leaf" style={{ marginBottom: 14 }}>{{ca:'Pròximes sessions', es:'Próximas sesiones', en:'Upcoming sessions'}[lang]}</div>
          {upcoming.map((d, i) => (
            <div key={i} className="yb-card" style={{ marginBottom: 10, display:'flex', gap: 14, alignItems:'center' }}>
              <div style={{ textAlign:'center', minWidth: 50 }}>
                <div style={{ fontFamily:'var(--serif)', fontSize: 28, fontStyle:'italic', color:'var(--accent)' }}>{d.getDate()}</div>
                <div style={{ fontFamily:'var(--sans)', fontSize: 10, color:'var(--ink-soft)', textTransform:'uppercase' }}>{(() => { try { return d.toLocaleDateString(locale, { month: 'short' }); } catch(e) { return d.toLocaleDateString('en-US', { month: 'short' }); } })()}</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'var(--serif)', fontSize: 15 }}>{{ca:'Pràctica diària', es:'Práctica diaria', en:'Daily practice'}[lang]}</div>
                <div style={{ fontFamily:'var(--sans)', fontSize: 12, color:'var(--ink-soft)' }}>{profile.timeOfDay} · {profile.duration} min</div>
              </div>
              <Icon name="next" size={18} color="var(--ink-soft)"/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Journal ─────────────────────────────────────────────────
const Journal = ({ t, lang }) => {
  const [mood, setMood] = uS(3);
  const [note, setNote] = uS('');
  const moodEmoji = ['◔','◑','◐','●','✦'];

  return (
    <div className="yb-scroll" style={{ height: '100%', overflowY: 'auto', background: 'var(--paper)' }}>
      <div style={{ padding: '60px 24px 16px' }}>
        <div style={{ fontFamily:'var(--sans)', fontSize: 11, letterSpacing:'0.25em', color:'var(--accent)', marginBottom: 4 }}>
          {{ca:'AVUI', es:'HOY', en:'TODAY'}[lang]} · {new Date().toLocaleDateString(lang, { day:'numeric', month:'long' })}
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
                <div style={{ fontSize: 28, color: mood === i ? 'var(--accent)' : 'var(--ink)' }}>{moodEmoji[i]}</div>
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

        <button className="yb-btn yb-btn-primary" style={{ width:'100%', marginTop: 16 }}>
          {t.journal_.save}
        </button>

        {/* Past entries */}
        <div style={{ marginTop: 32 }}>
          <div className="yb-divider-leaf" style={{ marginBottom: 14 }}>{{ca:'Anteriors', es:'Anteriores', en:'Earlier'}[lang]}</div>
          {[
            { date:'29 abr', mood: 4, txt:'Sessió tranquil·la, esquena alleujada' },
            { date:'27 abr', mood: 3, txt:'M\'ha costat concentrar-me al principi' },
            { date:'25 abr', mood: 4, txt:'Equilibri millor que mai' },
          ].map((e,i) => (
            <div key={i} className="yb-card" style={{ marginBottom: 10, display:'flex', gap: 14, alignItems:'flex-start', padding: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius:'50%', background:'color-mix(in srgb, var(--accent) 18%, transparent)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 18, flexShrink:0 }}>{moodEmoji[e.mood]}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'var(--sans)', fontSize: 11, color:'var(--ink-soft)', textTransform:'uppercase' }}>{e.date}</div>
                <div style={{ fontFamily:'var(--serif)', fontSize: 14, color:'var(--ink)', marginTop: 2, fontStyle:'italic' }}>"{e.txt}"</div>
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
const TabBar = ({ active, setActive, t }) => {
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

Object.assign(window, { Dashboard, Library, PoseDetail, Calendar, Journal, Progress, Messages, TabBar });
