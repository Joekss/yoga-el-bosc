// components/Breath.jsx — Respiració guiada i meditació amb temporitzador.
//   <BreathScreen lang mode="breath"|"meditate" onExit onDone({ durationSec, type }) />

const BR_T = {
  ca: {
    breathTitle: 'Respira', medTitle: 'Medita',
    patterns: { box: 'Quadrada', r478: '4-7-8', alt: 'Alterna' },
    desc: {
      box: 'Inspira, reté, exhala i reté, 4 temps cadascun. Calma i concentració.',
      r478: 'Inspira 4, reté 7, exhala 8. Ajuda a relaxar-se i a dormir.',
      alt: 'Tapa un orifici del nas i respira per l\'altre; canvia a cada exhalació.',
    },
    medDesc: 'Seu còmoda, tanca els ulls i segueix la respiració. Sonarà una campana a l\'inici i al final.',
    duration: 'Durada', min: 'min', interval: 'Campana cada 5 minuts',
    start: 'Començar', stop: 'Acabar', exit: 'Sortir',
    inhale: 'Inspira', hold: 'Reté', exhale: 'Exhala',
    left: 'per l\'esquerra', right: 'per la dreta',
    doneTitle: 'Molt bé', doneSub: 'minuts de calma',
    back: 'Tornar a l\'inici', remaining: 'queden',
  },
  es: {
    breathTitle: 'Respira', medTitle: 'Medita',
    patterns: { box: 'Cuadrada', r478: '4-7-8', alt: 'Alterna' },
    desc: {
      box: 'Inspira, retén, exhala y retén, 4 tiempos cada uno. Calma y concentración.',
      r478: 'Inspira 4, retén 7, exhala 8. Ayuda a relajarse y a dormir.',
      alt: 'Tapa un orificio de la nariz y respira por el otro; cambia en cada exhalación.',
    },
    medDesc: 'Siéntate cómoda, cierra los ojos y sigue la respiración. Sonará una campana al inicio y al final.',
    duration: 'Duración', min: 'min', interval: 'Campana cada 5 minutos',
    start: 'Empezar', stop: 'Terminar', exit: 'Salir',
    inhale: 'Inspira', hold: 'Retén', exhale: 'Exhala',
    left: 'por la izquierda', right: 'por la derecha',
    doneTitle: 'Muy bien', doneSub: 'minutos de calma',
    back: 'Volver al inicio', remaining: 'quedan',
  },
  en: {
    breathTitle: 'Breathe', medTitle: 'Meditate',
    patterns: { box: 'Box', r478: '4-7-8', alt: 'Alternate' },
    desc: {
      box: 'Inhale, hold, exhale and hold, 4 counts each. Calm and focus.',
      r478: 'Inhale 4, hold 7, exhale 8. Helps you relax and sleep.',
      alt: 'Close one nostril and breathe through the other; switch on each exhale.',
    },
    medDesc: 'Sit comfortably, close your eyes and follow your breath. A bell rings at the start and the end.',
    duration: 'Duration', min: 'min', interval: 'Bell every 5 minutes',
    start: 'Start', stop: 'Finish', exit: 'Exit',
    inhale: 'Inhale', hold: 'Hold', exhale: 'Exhale',
    left: 'through the left', right: 'through the right',
    doneTitle: 'Well done', doneSub: 'minutes of calm',
    back: 'Back to home', remaining: 'left',
  },
};

// Fases de cada patró: [nom, segons, escala del cercle al final de la fase]
const BR_PATTERNS = {
  box:  [['inhale', 4, 1], ['hold', 4, 1], ['exhale', 4, 0.55], ['hold', 4, 0.55]],
  r478: [['inhale', 4, 1], ['hold', 7, 1], ['exhale', 8, 0.55]],
  alt:  [['inhale', 4, 1], ['exhale', 6, 0.55]],
};

const BreathScreen = ({ lang = 'ca', mode = 'breath', onExit, onDone }) => {
  const t = BR_T[lang] || BR_T.ca;
  const isMed = mode === 'meditate';
  const [pattern, setPattern] = React.useState('box');
  const [minutes, setMinutes] = React.useState(isMed ? 10 : 5);
  const [intervalBell, setIntervalBell] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [done, setDone] = React.useState(null);
  const [elapsed, setElapsed] = React.useState(0);       // segons
  const startRef = React.useRef(0);
  const [, setTick] = React.useState(0);   // redibuixa el cercle 4 cops per segon

  const total = minutes * 60;
  const phases = BR_PATTERNS[pattern];
  const cycle = phases.reduce((s, p) => s + p[1], 0);

  // Fase actual a partir del temps transcorregut
  let phaseIdx = 0, inPhase = elapsed % cycle;
  for (let i = 0, acc = 0; i < phases.length; i++) { if (inPhase < acc + phases[i][1]) { phaseIdx = i; inPhase -= acc; break; } acc += phases[i][1]; }
  const [phaseName, phaseLen, target] = phases[phaseIdx];
  const prevTarget = phases[(phaseIdx + phases.length - 1) % phases.length][2];
  const cycleNo = Math.floor(elapsed / cycle);
  const side = cycleNo % 2 === 0 ? t.left : t.right;

  const finish = (secs) => {
    setRunning(false);
    window.EBSound && window.EBSound.bell();
    window.EBSound && window.EBSound.stopAmbient();
    setDone(secs);
    if (secs >= 30 && onDone) onDone({ durationSec: secs, type: isMed ? 'meditacio' : 'respiracio' });
  };

  React.useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      const secs = Math.floor((Date.now() - startRef.current) / 1000);
      setElapsed(secs); setTick(x => x + 1);
      if (secs >= total) { clearInterval(iv); finish(total); }
      else if (isMed && intervalBell && secs > 0 && secs % 300 === 0) window.EBSound && window.EBSound.bell();
    }, 250);
    return () => clearInterval(iv);
  }, [running]);

  // Veu a cada canvi de fase (respiració)
  React.useEffect(() => {
    if (!running || isMed || !window.EBSound) return;
    const word = t[phaseName] + (pattern === 'alt' ? ' ' + side : '');
    const keys = pattern === 'alt' ? [phaseName, cycleNo % 2 === 0 ? 'left' : 'right'] : [phaseName];
    if (window.EBVoice) window.EBVoice.say(keys, word, lang); else window.EBSound.speak(word, lang);
  }, [running, phaseIdx, cycleNo]);

  React.useEffect(() => () => { window.EBSound && window.EBSound.stopAll(); window.EBVoice && window.EBVoice.stop(); }, []);
  React.useEffect(() => { window.EBVoice && window.EBVoice.preload(['inhale', 'hold', 'exhale', 'left', 'right']); }, []);

  // Manté la pantalla encesa
  React.useEffect(() => {
    if (!running || !navigator.wakeLock) return;
    let lock = null;
    navigator.wakeLock.request('screen').then(l => { lock = l; }).catch(() => {});
    return () => { try { lock && lock.release(); } catch (e) {} };
  }, [running]);

  const start = () => {
    window.EBSound && window.EBSound.unlock();
    window.EBSound && window.EBSound.bell();
    if (isMed) window.EBSound && window.EBSound.startAmbient();
    startRef.current = Date.now(); setElapsed(0); setDone(null); setRunning(true);
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const chip = (on) => ({ padding:'10px 14px', borderRadius:999, cursor:'pointer', fontFamily:'var(--sans)', fontSize:14,
    border:'1px solid ' + (on ? 'var(--accent)' : 'rgba(255,255,255,0.25)'),
    background: on ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'transparent', color:'var(--cream)' });

  // Escala del cercle: interpolació dins de la fase
  const frac = running ? Math.min(1, ((Date.now() - startRef.current) / 1000 - (elapsed - inPhase)) / phaseLen) : 0;
  const scale = isMed ? 0.8 : (prevTarget + (target - prevTarget) * Math.max(0, frac));

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--ink)', color:'var(--cream)', padding:'calc(env(safe-area-inset-top, 0px) + 40px) 24px calc(env(safe-area-inset-bottom, 0px) + 28px)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button aria-label={t.exit} onClick={() => { window.EBSound && window.EBSound.stopAll(); onExit(); }} style={{ background:'transparent', border:'none', color:'var(--cream)', cursor:'pointer', padding:8 }}>
          <Icon name="close" size={22}/>
        </button>
        <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:24 }}>{isMed ? t.medTitle : t.breathTitle}</div>
        <div style={{ width:38 }}/>
      </div>

      {done != null ? (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', gap:12 }}>
          <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:40 }}>{t.doneTitle}</div>
          <div style={{ fontFamily:'var(--sans)', fontSize:16, opacity:0.8 }}>{Math.max(1, Math.round(done / 60))} {t.doneSub}</div>
          <button className="yb-btn yb-btn-clay" style={{ marginTop:24 }} onClick={onExit}>{t.back}</button>
        </div>
      ) : running ? (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:28 }}>
          <div aria-hidden="true" style={{ width:240, height:240, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
            background:'radial-gradient(circle, color-mix(in srgb, var(--accent) 55%, transparent) 0%, color-mix(in srgb, var(--accent) 12%, transparent) 70%)',
            transform:`scale(${scale})`, transition:'transform 0.25s linear' }}/>
          <div role="status" aria-live="polite" style={{ textAlign:'center' }}>
            {!isMed && <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:34 }}>{t[phaseName]}{pattern === 'alt' && <span style={{ fontSize:18, opacity:0.8 }}> · {side}</span>}</div>}
            <div style={{ fontFamily:'var(--sans)', fontSize:14, opacity:0.7, marginTop:6 }}>{fmt(Math.max(0, total - elapsed))} {t.remaining}</div>
          </div>
          <button className="yb-btn yb-btn-ghost" style={{ color:'var(--cream)', borderColor:'rgba(255,255,255,0.3)' }} onClick={() => finish(elapsed)}>{t.stop}</button>
        </div>
      ) : (
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', gap:22 }}>
          {!isMed && (
            <div role="radiogroup" aria-label={t.breathTitle} style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {Object.keys(BR_PATTERNS).map(k => (
                <button key={k} role="radio" aria-checked={pattern === k} onClick={() => setPattern(k)} style={chip(pattern === k)}>{t.patterns[k]}</button>
              ))}
            </div>
          )}
          <p style={{ fontFamily:'var(--sans)', fontSize:15, lineHeight:1.55, opacity:0.85, margin:0 }}>{isMed ? t.medDesc : t.desc[pattern]}</p>
          <div>
            <div style={{ fontFamily:'var(--sans)', fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--accent)', marginBottom:10 }}>{t.duration}</div>
            <div role="radiogroup" aria-label={t.duration} style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {(isMed ? [5, 10, 15, 20, 30] : [3, 5, 10]).map(m => (
                <button key={m} role="radio" aria-checked={minutes === m} onClick={() => setMinutes(m)} style={chip(minutes === m)}>{m} {t.min}</button>
              ))}
            </div>
          </div>
          {isMed && (
            <label htmlFor="eb-med-int" style={{ display:'flex', gap:10, alignItems:'center', fontFamily:'var(--sans)', fontSize:15 }}>
              <input id="eb-med-int" type="checkbox" checked={intervalBell} onChange={e => setIntervalBell(e.target.checked)} style={{ width:20, height:20, accentColor:'var(--accent)' }}/>
              {t.interval}
            </label>
          )}
          <button className="yb-btn yb-btn-clay" style={{ width:'100%', marginTop:12 }} onClick={start}>{t.start}</button>
        </div>
      )}
    </div>
  );
};

window.BreathScreen = BreathScreen;
