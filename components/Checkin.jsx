// components/Checkin.jsx
//   <CheckinScreen>  "Com et trobes avui?" abans de practicar: energia, temps i molèsties.
//   <FeedbackScreen> valoració en acabar: com t'has sentit i si alguna cosa ha molestat.

const CK_T = {
  ca: {
    kicker: 'Abans de començar', title: 'Com et trobes avui?',
    energy: 'Energia', low: 'Cansada', ok: 'Normal', high: 'Amb energia',
    time: 'Temps que tens', min: 'min',
    discomfort: 'Et molesta alguna zona avui?', none: 'Cap',
    zones: ['Coll', 'Espatlles', 'Esquena', 'Canells', 'Malucs', 'Genolls'],
    go: 'Preparar la pràctica', back: 'Tornar',
    fbKicker: 'Pràctica acabada', fbTitle: 'Com t\'has sentit?',
    feelings: ['Pitjor', 'Igual', 'Bé', 'Molt bé', 'Plena'],
    hurt: 'Alguna postura t\'ha molestat?', hurtPh: 'Explica-ho breument (opcional)…',
    yes: 'Sí', no: 'No',
    save: 'Desar', skip: 'Ara no',
    fbNote: 'La Cèlia ho veurà per adaptar les properes sessions.',
    keep: 'Desar aquesta sessió per repetir-la',
  },
  es: {
    kicker: 'Antes de empezar', title: '¿Cómo te encuentras hoy?',
    energy: 'Energía', low: 'Cansada', ok: 'Normal', high: 'Con energía',
    time: 'Tiempo que tienes', min: 'min',
    discomfort: '¿Te molesta alguna zona hoy?', none: 'Ninguna',
    zones: ['Cuello', 'Hombros', 'Espalda', 'Muñecas', 'Caderas', 'Rodillas'],
    go: 'Preparar la práctica', back: 'Volver',
    fbKicker: 'Práctica terminada', fbTitle: '¿Cómo te has sentido?',
    feelings: ['Peor', 'Igual', 'Bien', 'Muy bien', 'Plena'],
    hurt: '¿Alguna postura te ha molestado?', hurtPh: 'Explícalo brevemente (opcional)…',
    yes: 'Sí', no: 'No',
    save: 'Guardar', skip: 'Ahora no',
    fbNote: 'Cèlia lo verá para adaptar las próximas sesiones.',
    keep: 'Guardar esta sesión para repetirla',
  },
  en: {
    kicker: 'Before you start', title: 'How do you feel today?',
    energy: 'Energy', low: 'Tired', ok: 'Normal', high: 'Energetic',
    time: 'Time you have', min: 'min',
    discomfort: 'Is any area bothering you today?', none: 'None',
    zones: ['Neck', 'Shoulders', 'Back', 'Wrists', 'Hips', 'Knees'],
    go: 'Prepare my practice', back: 'Back',
    fbKicker: 'Practice complete', fbTitle: 'How did you feel?',
    feelings: ['Worse', 'Same', 'Good', 'Very good', 'Wonderful'],
    hurt: 'Did any pose bother you?', hurtPh: 'Tell us briefly (optional)…',
    yes: 'Yes', no: 'No',
    save: 'Save', skip: 'Not now',
    fbNote: 'Cèlia will see it to adapt your next sessions.',
    keep: 'Save this session to repeat it',
  },
};
// Zones en català per al generador (les etiquetes de pantalla canvien d'idioma)
const CK_ZONES_CA = ['Coll', 'Espatlles', 'Esquena', 'Canells', 'Malucs', 'Genolls'];

const ckChip = (on) => ({
  padding:'10px 14px', borderRadius:999, cursor:'pointer', fontFamily:'var(--sans)', fontSize:14,
  border:'1px solid ' + (on ? 'var(--accent)' : 'color-mix(in srgb, var(--ink) 14%, transparent)'),
  background: on ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'transparent',
  color: on ? 'var(--accent)' : 'var(--ink)',
});
const ckLabel = { fontFamily:'var(--sans)', fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--accent)', margin:'22px 0 10px' };

const CheckinScreen = ({ lang = 'ca', defaultMinutes = 30, onStart, onBack }) => {
  const t = CK_T[lang] || CK_T.ca;
  const [energy, setEnergy] = React.useState('ok');
  const [minutes, setMinutes] = React.useState([10, 20, 30, 45].includes(defaultMinutes) ? defaultMinutes : 30);
  const [zones, setZones] = React.useState([]);
  const toggle = (z) => setZones(zs => zs.includes(z) ? zs.filter(x => x !== z) : [...zs, z]);
  return (
    <div className="yb-scroll" style={{ height:'100%', overflowY:'auto', background:'var(--paper)', padding:'calc(env(safe-area-inset-top, 0px) + 48px) 24px calc(env(safe-area-inset-bottom, 0px) + 24px)', display:'flex', flexDirection:'column' }}>
      <div style={{ fontFamily:'var(--sans)', fontSize:11, letterSpacing:'0.25em', textTransform:'uppercase', color:'var(--accent)', marginBottom:8 }}>{t.kicker}</div>
      <h1 style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:34, color:'var(--ink)', margin:0, lineHeight:1.1 }}>{t.title}</h1>

      <div style={ckLabel}>{t.energy}</div>
      <div role="radiogroup" aria-label={t.energy} style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['low', t.low], ['ok', t.ok], ['high', t.high]].map(([k, l]) => (
          <button key={k} role="radio" aria-checked={energy === k} onClick={() => setEnergy(k)} style={ckChip(energy === k)}>{l}</button>
        ))}
      </div>

      <div style={ckLabel}>{t.time}</div>
      <div role="radiogroup" aria-label={t.time} style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[10, 20, 30, 45].map(m => (
          <button key={m} role="radio" aria-checked={minutes === m} onClick={() => setMinutes(m)} style={ckChip(minutes === m)}>{m} {t.min}</button>
        ))}
      </div>

      <div style={ckLabel}>{t.discomfort}</div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <button aria-pressed={zones.length === 0} onClick={() => setZones([])} style={ckChip(zones.length === 0)}>{t.none}</button>
        {t.zones.map((z, i) => (
          <button key={z} aria-pressed={zones.includes(CK_ZONES_CA[i])} onClick={() => toggle(CK_ZONES_CA[i])} style={ckChip(zones.includes(CK_ZONES_CA[i]))}>{z}</button>
        ))}
      </div>

      <div style={{ flex:1, minHeight:24 }}/>
      <button className="yb-btn yb-btn-clay" style={{ width:'100%', marginBottom:10 }}
        onClick={() => { window.EBSound && window.EBSound.unlock(); onStart({ energy, minutes, discomfort: zones }); }}>
        {t.go}
      </button>
      {onBack && <button className="yb-btn yb-btn-ghost" style={{ width:'100%' }} onClick={onBack}>{t.back}</button>}
    </div>
  );
};

const FeedbackScreen = ({ lang = 'ca', onSave, onSkip }) => {
  const t = CK_T[lang] || CK_T.ca;
  const [feeling, setFeeling] = React.useState(null);
  const [hurt, setHurt] = React.useState(null);
  const [note, setNote] = React.useState('');
  const [keep, setKeep] = React.useState(false);
  const faces = ['☁️', '🌫️', '🌿', '🌸', '✨'];
  return (
    <div className="yb-scroll" style={{ height:'100%', overflowY:'auto', background:'var(--paper)', padding:'calc(env(safe-area-inset-top, 0px) + 48px) 24px calc(env(safe-area-inset-bottom, 0px) + 24px)', display:'flex', flexDirection:'column' }}>
      <div style={{ fontFamily:'var(--sans)', fontSize:11, letterSpacing:'0.25em', textTransform:'uppercase', color:'var(--accent)', marginBottom:8 }}>{t.fbKicker}</div>
      <h1 style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:34, color:'var(--ink)', margin:'0 0 22px', lineHeight:1.1 }}>{t.fbTitle}</h1>
      <div role="radiogroup" aria-label={t.fbTitle} style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8 }}>
        {t.feelings.map((f, i) => (
          <button key={f} role="radio" aria-checked={feeling === i + 1} onClick={() => setFeeling(i + 1)}
            style={{ ...ckChip(feeling === i + 1), borderRadius:16, padding:'12px 4px', display:'flex', flexDirection:'column', alignItems:'center', gap:6, fontSize:12 }}>
            <span aria-hidden="true" style={{ fontSize:24 }}>{faces[i]}</span>{f}
          </button>
        ))}
      </div>
      <div style={ckLabel}>{t.hurt}</div>
      <div style={{ display:'flex', gap:8 }}>
        <button aria-pressed={hurt === false} onClick={() => setHurt(false)} style={ckChip(hurt === false)}>{t.no}</button>
        <button aria-pressed={hurt === true} onClick={() => setHurt(true)} style={ckChip(hurt === true)}>{t.yes}</button>
      </div>
      {hurt && (
        <textarea id="eb-fb-note" aria-label={t.hurt} value={note} onChange={e => setNote(e.target.value.slice(0, 500))} placeholder={t.hurtPh} rows={3}
          style={{ marginTop:12, width:'100%', boxSizing:'border-box', borderRadius:14, border:'1.5px solid color-mix(in srgb, var(--ink) 12%, transparent)', background:'var(--cream)', color:'var(--ink)', padding:'12px', fontFamily:'var(--sans)', fontSize:15, resize:'vertical' }}/>
      )}
      <label htmlFor="eb-fb-keep" style={{ display:'flex', gap:10, alignItems:'center', marginTop:20, fontFamily:'var(--sans)', fontSize:14, color:'var(--ink)', cursor:'pointer' }}>
        <input id="eb-fb-keep" type="checkbox" checked={keep} onChange={e => setKeep(e.target.checked)} style={{ width:20, height:20, accentColor:'var(--accent)' }}/>
        {t.keep}
      </label>
      <p style={{ fontFamily:'var(--sans)', fontSize:12, color:'var(--ink-soft)', marginTop:16 }}>{t.fbNote}</p>
      <div style={{ flex:1, minHeight:24 }}/>
      <button className="yb-btn yb-btn-clay" disabled={!feeling} style={{ width:'100%', marginBottom:10, opacity: feeling ? 1 : 0.5 }}
        onClick={() => onSave({ feeling, discomfort: hurt ? (note.trim() || '—') : null, saveSession: keep })}>{t.save}</button>
      <button className="yb-btn yb-btn-ghost" style={{ width:'100%' }} onClick={() => keep ? onSave({ saveSession: true }) : onSkip()}>{t.skip}</button>
    </div>
  );
};

Object.assign(window, { CheckinScreen, FeedbackScreen });
