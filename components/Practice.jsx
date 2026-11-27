// components/Practice.jsx — Pantalla de pràctica guiada amb timer

const { useState: useStateP, useEffect: useEffectP, useRef: useRefP } = React;

const PracticeMode = ({ t, sequence, lang, onExit, onComplete, illustrationStyle = 'line' }) => {
  const [idx, setIdx] = useStateP(0);
  const [remaining, setRemaining] = useStateP(sequence[0]?.duration || 30);
  const [paused, setPaused] = useStateP(false);
  const [phase, setPhase] = useStateP('hold'); // hold | transition
  const PL = {
    exit:  {ca:'Sortir de la pràctica', es:'Salir de la práctica', en:'Exit practice'}[lang] || 'Exit',
    prev:  {ca:'Postura anterior', es:'Postura anterior', en:'Previous pose'}[lang] || 'Previous',
    next:  {ca:'Postura següent', es:'Postura siguiente', en:'Next pose'}[lang] || 'Next',
    pause: {ca:'Pausa', es:'Pausa', en:'Pause'}[lang] || 'Pause',
    play:  {ca:'Continuar', es:'Continuar', en:'Resume'}[lang] || 'Resume',
  };
  const [soundOpen, setSoundOpen] = useStateP(false);
  const [sp, setSp] = useStateP(() => (window.EBSound ? window.EBSound.prefs() : { voice: false, bell: false, ambient: 'none', volume: 0.6 }));
  const changeSound = (patch) => {
    if (!window.EBSound) return;
    const next = window.EBSound.setPrefs(patch); setSp(next);
    if ('ambient' in patch) { if (paused) window.EBSound.stopAmbient(); else window.EBSound.startAmbient(); }
  };
  const SL = {
    title: {ca:'So i veu', es:'Sonido y voz', en:'Sound and voice'}[lang],
    voice: {ca:'Veu guiada', es:'Voz guiada', en:'Voice guidance'}[lang],
    bell:  {ca:'Campana entre postures', es:'Campana entre posturas', en:'Bell between poses'}[lang],
    amb:   {ca:'So ambiental', es:'Sonido ambiental', en:'Ambient sound'}[lang],
    vol:   {ca:'Volum', es:'Volumen', en:'Volume'}[lang],
    opts:  { none: {ca:'Cap', es:'Ninguno', en:'None'}[lang], bosc: {ca:'Bosc', es:'Bosque', en:'Forest'}[lang], pluja: {ca:'Pluja', es:'Lluvia', en:'Rain'}[lang], cuencos: {ca:'Bols', es:'Cuencos', en:'Bowls'}[lang] },
    breathe: {ca:'Respira a poc a poc', es:'Respira despacio', en:'Breathe slowly'}[lang],
    next:  {ca:'Prepara\'t per canviar', es:'Prepárate para cambiar', en:'Get ready to change'}[lang],
    secs:  {ca:'segons', es:'segundos', en:'seconds'}[lang],
    done:  {ca:'Pràctica acabada. Gràcies.', es:'Práctica terminada. Gracias.', en:'Practice complete. Thank you.'}[lang],
  };
  const practiced = useRefP(0);   // segons reals practicats (sense pauses)
  const done = useRefP(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    window.EBSound && window.EBSound.stopAll();
    onComplete({ durationSec: practiced.current, poses: Math.min(idx + 1, sequence.length), poseIds: sequence.map(a => a.id) });
  };

  // Manté la pantalla encesa durant la pràctica (si el navegador ho permet)
  useEffectP(() => {
    let lock = null, alive = true;
    const req = () => {
      try {
        if (navigator.wakeLock && document.visibilityState === 'visible') {
          navigator.wakeLock.request('screen').then(l => { if (alive) lock = l; else l.release(); }).catch(() => {});
        }
      } catch (e) {}
    };
    req();
    document.addEventListener('visibilitychange', req);
    return () => { alive = false; document.removeEventListener('visibilitychange', req); try { lock && lock.release(); } catch (e) {} };
  }, []);

  const current = sequence[idx];
  // En canviar de postura: campana i veu amb el nom i la durada
  useEffectP(() => {
    if (!current || !window.EBSound) return;
    window.EBSound.bell();
    const name = current.name[lang] || current.name.ca;
    const t = setTimeout(() => window.EBSound.speak(name + '. ' + current.duration + ' ' + SL.secs + '.', lang), 600);
    return () => clearTimeout(t);
  }, [idx]);
  // Recordatoris a mitja postura i abans de canviar
  useEffectP(() => {
    if (!current || !window.EBSound || paused) return;
    if (current.duration >= 40 && remaining === Math.round(current.duration / 2)) window.EBSound.speak(SL.breathe, lang);
    if (current.duration >= 20 && remaining === 5 && idx < sequence.length - 1) window.EBSound.speak(SL.next, lang);
  }, [remaining]);
  useEffectP(() => {
    if (!window.EBSound) return;
    if (paused) { window.EBSound.stopAmbient(); try { speechSynthesis.cancel(); } catch (e) {} }
    else window.EBSound.startAmbient();
  }, [paused]);
  useEffectP(() => () => { window.EBSound && window.EBSound.stopAll(); }, []);
  const totalDur = sequence.reduce((s, p) => s + p.duration, 0);
  const elapsed = sequence.slice(0, idx).reduce((s, p) => s + p.duration, 0) + (current ? current.duration - remaining : 0);

  useEffectP(() => {
    if (paused || !current) return;
    const t = setInterval(() => {
      practiced.current += 1;
      setRemaining(r => {
        if (r <= 1) {
          if (idx < sequence.length - 1) {
            setIdx(i => i + 1);
            return sequence[idx + 1].duration;
          } else {
            clearInterval(t);
            setTimeout(finish, 800);
            return 0;
          }
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [idx, paused, sequence.length]);

  if (!current) return null;
  const fmtTime = s => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
  const progress = current.duration > 0 ? 1 - remaining / current.duration : 0;

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column', position: 'relative',
      background: 'var(--ink)', color: 'var(--cream)',
    }}>
      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => { window.EBSound && window.EBSound.stopAll(); onExit(); }} aria-label={PL.exit} style={{ background:'transparent', border:'none', color:'var(--cream)', cursor:'pointer', padding: 8 }}>
          <Icon name="close" size={22}/>
        </button>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 12, letterSpacing: '0.2em', opacity: 0.7 }}>
          {String(idx+1).padStart(2,'0')} / {String(sequence.length).padStart(2,'0')}
        </div>
        <button onClick={() => setSoundOpen(true)} aria-label={SL.title} style={{ background:'transparent', border:'none', color:'var(--cream)', cursor:'pointer', padding: 8 }}>
          <Icon name={sp.voice || sp.bell || sp.ambient !== 'none' ? 'bell' : 'moon'} size={20}/>
        </button>
      </div>

      {/* Pose info */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.3em', color: 'var(--accent)', marginBottom: 16 }}>
          {current.sanskrit}
        </div>
        <h2 style={{ fontSize: 36, fontStyle: 'italic', marginBottom: 28, lineHeight: 1.1, color:'var(--cream)' }}>
          {current.name[lang] || current.name.ca}
        </h2>

        {/* Breathing circle + pose */}
        <div style={{ position: 'relative', width: 'min(240px, 30vh)', height: 'min(240px, 30vh)', marginBottom: 16 }}>
          <svg viewBox="0 0 240 240" style={{ position:'absolute', inset:0 }}>
            <circle cx="120" cy="120" r="110" fill="none" stroke="color-mix(in srgb, var(--accent) 30%, transparent)" strokeWidth="1"/>
            <circle cx="120" cy="120" r="110" fill="none" stroke="var(--accent)" strokeWidth="2"
              strokeDasharray={`${2 * Math.PI * 110}`}
              strokeDashoffset={`${2 * Math.PI * 110 * (1 - progress)}`}
              transform="rotate(-90 120 120)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}/>
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--cream)' }}>
            <div style={{ width:"62%", height:"62%", display:"flex", alignItems:"center", justifyContent:"center" }}><PoseSVG id={current.id} size={150} color="var(--cream)" style={illustrationStyle}/></div>
          </div>
        </div>

        <div style={{ fontFamily: 'var(--serif)', fontSize: 'min(64px, 8vh)', lineHeight: 1, color: 'var(--cream)', fontVariantNumeric: 'tabular-nums' }}>
          {fmtTime(remaining)}
        </div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 13, opacity: 0.7, marginTop: 8 }}>
          {current.breath[lang] || current.breath.ca}
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '16px 28px calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <button aria-label={PL.prev} onClick={() => { if(idx>0){ setIdx(idx-1); setRemaining(sequence[idx-1].duration); } }}
            disabled={idx === 0}
            style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'50%', width:48, height:48, color:'var(--cream)', cursor:'pointer', opacity: idx===0?0.3:1 }}>
            <Icon name="back" size={18}/>
          </button>

          <button aria-label={paused ? PL.play : PL.pause} onClick={() => setPaused(!paused)}
            style={{ background:'var(--accent)', border:'none', borderRadius:'50%', width:72, height:72, color:'var(--cream)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: '0 10px 28px color-mix(in srgb, var(--accent) 45%, transparent)' }}>
            <Icon name={paused ? 'play' : 'pause'} size={26} color="var(--cream)"/>
          </button>

          <button aria-label={PL.next} onClick={() => { if(idx<sequence.length-1){ setIdx(idx+1); setRemaining(sequence[idx+1].duration); } else finish(); }}
            style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'50%', width:48, height:48, color:'var(--cream)', cursor:'pointer' }}>
            <Icon name="next" size={18}/>
          </button>
        </div>

        {/* Total progress */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'var(--sans)', fontSize:11, opacity:0.6, marginBottom:6 }}>
            <span>{fmtTime(elapsed)}</span><span>{fmtTime(totalDur)}</span>
          </div>
          <div style={{ height: 2, background: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow:'hidden' }}>
            <div style={{ width: `${100*elapsed/totalDur}%`, height:'100%', background:'var(--accent)', transition:'width 1s linear' }}/>
          </div>
        </div>
      </div>
      {soundOpen && (
        <div onClick={() => setSoundOpen(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end', zIndex:20 }}>
          <div role="dialog" aria-label={SL.title} onClick={e => e.stopPropagation()}
            style={{ width:'100%', background:'var(--paper)', color:'var(--ink)', borderRadius:'24px 24px 0 0', padding:'22px 22px calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
            <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:24, marginBottom:14 }}>{SL.title}</div>
            {[['voice', SL.voice], ['bell', SL.bell]].map(([k, label]) => (
              <label key={k} htmlFor={'eb-snd-' + k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', fontFamily:'var(--sans)', fontSize:15 }}>
                {label}
                <input id={'eb-snd-' + k} type="checkbox" checked={!!sp[k]} onChange={e => changeSound({ [k]: e.target.checked })} style={{ width:22, height:22, accentColor:'var(--accent)' }}/>
              </label>
            ))}
            <div style={{ fontFamily:'var(--sans)', fontSize:15, margin:'10px 0 8px' }}>{SL.amb}</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {Object.keys(SL.opts).map(k => (
                <button key={k} onClick={() => changeSound({ ambient: k })} aria-pressed={sp.ambient === k}
                  style={{ padding:'8px 14px', borderRadius:999, border:'1px solid ' + (sp.ambient === k ? 'var(--accent)' : 'color-mix(in srgb, var(--ink) 15%, transparent)'), background: sp.ambient === k ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'transparent', color: sp.ambient === k ? 'var(--accent)' : 'var(--ink)', fontFamily:'var(--sans)', fontSize:14, cursor:'pointer' }}>
                  {SL.opts[k]}
                </button>
              ))}
            </div>
            <label htmlFor="eb-snd-vol" style={{ display:'block', fontFamily:'var(--sans)', fontSize:15, margin:'16px 0 6px' }}>{SL.vol}</label>
            <input id="eb-snd-vol" type="range" min="0" max="1" step="0.05" value={sp.volume} onChange={e => changeSound({ volume: Number(e.target.value) })} style={{ width:'100%', accentColor:'var(--accent)' }}/>
          </div>
        </div>
      )}
    </div>
  );
};

window.PracticeMode = PracticeMode;
