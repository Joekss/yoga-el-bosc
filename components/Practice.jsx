// components/Practice.jsx — Pantalla de pràctica guiada amb timer

const { useState: useStateP, useEffect: useEffectP, useRef: useRefP } = React;

const PracticeMode = ({ t, sequence, lang, onExit, onComplete, illustrationStyle = 'line' }) => {
  const [idx, setIdx] = useStateP(0);
  const [remaining, setRemaining] = useStateP(sequence[0]?.duration || 30);
  const [paused, setPaused] = useStateP(false);
  const [phase, setPhase] = useStateP('hold'); // hold | transition

  const current = sequence[idx];
  const totalDur = sequence.reduce((s, p) => s + p.duration, 0);
  const elapsed = sequence.slice(0, idx).reduce((s, p) => s + p.duration, 0) + (current ? current.duration - remaining : 0);

  useEffectP(() => {
    if (paused || !current) return;
    const t = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          if (idx < sequence.length - 1) {
            setIdx(i => i + 1);
            return sequence[idx + 1].duration;
          } else {
            clearInterval(t);
            setTimeout(onComplete, 800);
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
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--ink)', color: 'var(--cream)',
    }}>
      {/* Header */}
      <div style={{ padding: '60px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onExit} style={{ background:'transparent', border:'none', color:'var(--cream)', cursor:'pointer', padding: 8 }}>
          <Icon name="close" size={22}/>
        </button>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 12, letterSpacing: '0.2em', opacity: 0.7 }}>
          {String(idx+1).padStart(2,'0')} / {String(sequence.length).padStart(2,'0')}
        </div>
        <div style={{ width: 22 }}/>
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
        <div style={{ position: 'relative', width: 240, height: 240, marginBottom: 24 }}>
          <svg viewBox="0 0 240 240" style={{ position:'absolute', inset:0 }}>
            <circle cx="120" cy="120" r="110" fill="none" stroke="color-mix(in srgb, var(--accent) 30%, transparent)" strokeWidth="1"/>
            <circle cx="120" cy="120" r="110" fill="none" stroke="var(--accent)" strokeWidth="2"
              strokeDasharray={`${2 * Math.PI * 110}`}
              strokeDashoffset={`${2 * Math.PI * 110 * (1 - progress)}`}
              transform="rotate(-90 120 120)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}/>
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--cream)' }}>
            <PoseSVG id={current.id} size={150} color="var(--cream)" style={illustrationStyle}/>
          </div>
        </div>

        <div style={{ fontFamily: 'var(--serif)', fontSize: 64, lineHeight: 1, color: 'var(--cream)' }}>
          {fmtTime(remaining)}
        </div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 13, opacity: 0.7, marginTop: 8 }}>
          {current.breath[lang] || current.breath.ca}
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '24px 32px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <button onClick={() => { if(idx>0){ setIdx(idx-1); setRemaining(sequence[idx-1].duration); } }}
            disabled={idx === 0}
            style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'50%', width:48, height:48, color:'var(--cream)', cursor:'pointer', opacity: idx===0?0.3:1 }}>
            <Icon name="back" size={18}/>
          </button>

          <button onClick={() => setPaused(!paused)}
            style={{ background:'var(--accent)', border:'none', borderRadius:'50%', width:72, height:72, color:'var(--cream)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: '0 8px 24px rgba(184,116,74,0.4)' }}>
            <Icon name={paused ? 'play' : 'pause'} size={26} color="var(--cream)"/>
          </button>

          <button onClick={() => { if(idx<sequence.length-1){ setIdx(idx+1); setRemaining(sequence[idx+1].duration); } else onComplete(); }}
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
    </div>
  );
};

window.PracticeMode = PracticeMode;
