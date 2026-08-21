// components/Onboarding.jsx — pantalla de benvinguda i qüestionari multi-pas

const { useState, useMemo } = React;

const Welcome = ({ t, onStart, lang, setLang }) => (
  <div style={{
    height: '100%', display: 'flex', flexDirection: 'column',
    background: 'var(--paper)', position: 'relative', overflow: 'hidden',
  }}>
    {/* Fondo botànic */}
    <svg viewBox="0 0 393 400" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 400, opacity: 0.18 }}>
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--sky)"/>
          <stop offset="100%" stopColor="var(--paper)"/>
        </linearGradient>
      </defs>
      <rect width="393" height="400" fill="url(#skyGrad)"/>
      <g stroke="var(--leaf-deep)" strokeWidth="1.2" fill="none" opacity="0.8">
        <path d="M-20 320 Q60 200 100 280 Q140 350 200 260 Q260 180 340 290 Q400 350 420 260"/>
        <path d="M-20 360 Q80 270 140 320 Q200 360 260 300 Q320 250 420 320"/>
      </g>
      <g fill="var(--leaf)" opacity="0.5">
        <ellipse cx="50" cy="280" rx="28" ry="60" transform="rotate(-25 50 280)"/>
        <ellipse cx="340" cy="270" rx="32" ry="70" transform="rotate(20 340 270)"/>
      </g>
    </svg>

    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '60px 32px 40px', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        {['ca','es','en'].map(l => (
          <button key={l} onClick={() => setLang(l)}
            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 999,
              border: '1px solid color-mix(in srgb, var(--ink) 15%, transparent)',
              background: lang===l ? 'var(--ink)' : 'transparent',
              color: lang===l ? 'var(--cream)' : 'var(--ink-soft)',
              fontFamily: 'var(--sans)', cursor: 'pointer', textTransform: 'uppercase',
              letterSpacing: '0.1em' }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ textAlign: 'center', animation: 'ybFadeUp .6s ease' }}>
        {/* Arbre El Bosc */}
        <svg width="160" height="190" viewBox="0 0 160 200" style={{ display:'block', margin:'0 auto 12px' }}>
          {/* Arrels */}
          <g stroke="var(--accent)" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.55">
            <path d="M80 185 Q62 190 46 198"/>
            <path d="M80 185 Q70 192 62 200"/>
            <path d="M80 185 Q80 194 80 202"/>
            <path d="M80 185 Q90 192 98 200"/>
            <path d="M80 185 Q98 190 114 198"/>
            <path d="M46 198 Q38 200 32 204"/>
            <path d="M114 198 Q122 200 128 204"/>
          </g>
          {/* Tronc */}
          <path d="M74 185 Q71 158 72 132 Q73 112 74 88 Q77 68 80 46 Q83 68 86 88 Q87 112 88 132 Q89 158 86 185 Z"
                fill="var(--accent)" opacity="0.45"/>
          {/* Línies d'escorça */}
          <g stroke="var(--accent-deep)" strokeWidth="0.7" fill="none" opacity="0.25">
            <path d="M76 162 Q80 157 84 162"/>
            <path d="M75 142 Q80 137 85 142"/>
            <path d="M76 122 Q80 117 84 122"/>
          </g>
          {/* Branques */}
          <g stroke="var(--accent)" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.5">
            <path d="M76 148 Q58 140 40 134"/>
            <path d="M40 134 Q30 128 22 120"/>
            <path d="M84 144 Q102 136 120 130"/>
            <path d="M120 130 Q130 124 138 116"/>
            <path d="M75 120 Q58 112 44 105"/>
            <path d="M85 118 Q102 110 116 103"/>
            <path d="M77 94 Q64 87 52 80"/>
            <path d="M83 92 Q96 85 108 78"/>
          </g>
          {/* Fullatge — capa de fons (ombra) */}
          <g fill="var(--leaf-deep)" opacity="0.45">
            <ellipse cx="80" cy="60" rx="46" ry="56"/>
            <ellipse cx="37" cy="100" rx="31" ry="37"/>
            <ellipse cx="123" cy="94" rx="29" ry="35"/>
            <ellipse cx="23" cy="126" rx="22" ry="26"/>
            <ellipse cx="137" cy="120" rx="21" ry="25"/>
          </g>
          {/* Fullatge — capa intermèdia */}
          <g fill="var(--leaf)" opacity="0.8">
            <ellipse cx="80" cy="52" rx="41" ry="51"/>
            <ellipse cx="39" cy="92" rx="28" ry="33"/>
            <ellipse cx="121" cy="86" rx="26" ry="31"/>
            <ellipse cx="26" cy="118" rx="19" ry="23"/>
            <ellipse cx="134" cy="112" rx="18" ry="22"/>
            <ellipse cx="62" cy="72" rx="23" ry="28"/>
            <ellipse cx="100" cy="68" rx="21" ry="26"/>
          </g>
          {/* Fullatge — capa frontal (claror) */}
          <g fill="var(--sage)" opacity="0.6">
            <ellipse cx="75" cy="37" rx="29" ry="35"/>
            <ellipse cx="100" cy="43" rx="25" ry="30"/>
            <ellipse cx="50" cy="68" rx="19" ry="23"/>
            <ellipse cx="113" cy="62" rx="17" ry="21"/>
            <ellipse cx="80" cy="26" rx="21" ry="25"/>
          </g>
        </svg>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.4em', color: 'var(--accent)', marginBottom: 8 }}>
          {t.appSubtitle.toUpperCase()}
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 400, lineHeight: 1, color: 'var(--ink)', fontStyle: 'italic', letterSpacing: '-0.02em' }}>
          el bosc
        </h1>
        <div style={{ marginTop: 20, fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.55, color: 'var(--ink-soft)', maxWidth: 280, margin: '20px auto 0' }}>
          {t.welcomeBody}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={onStart} className="yb-btn yb-btn-primary" style={{ width: '100%', padding: '18px' }}>
          {t.start}
          <Icon name="arrowRight" size={18} color="currentColor"/>
        </button>
        <div style={{ textAlign: 'center', fontFamily: 'var(--hand, serif)', fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: 14 }}>
          — Cèlia · El Bosc
        </div>
      </div>
    </div>
  </div>
);

// ─── Q Steps ──────────────────────────────────────────────────────────────

const StepHeader = ({ idx, total, title, subtitle }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
      {Array.from({length: total}).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 2,
          background: i <= idx ? 'var(--accent)' : 'color-mix(in srgb, var(--ink) 12%, transparent)',
          transition: 'background .3s',
        }}/>
      ))}
    </div>
    <div style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.2em', color: 'var(--accent)', marginBottom: 8 }}>
      {String(idx+1).padStart(2,'0')} / {String(total).padStart(2,'0')}
    </div>
    <h2 style={{ fontSize: 30, lineHeight: 1.15, color: 'var(--ink)', marginBottom: 8 }}>{title}</h2>
    {subtitle && <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-soft)' }}>{subtitle}</div>}
  </div>
);

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-soft)', marginBottom: 10, fontWeight: 500 }}>{label}</div>
    {children}
  </div>
);

const ChipGroup = ({ options, value, multi, onChange, optionValues }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
    {options.map((opt, i) => {
      const v = optionValues ? optionValues[i] : opt;
      const active = multi ? (value || []).includes(v) : value === v;
      return (
        <button key={i} className={"yb-chip" + (active ? ' active' : '')}
          onClick={() => {
            if (multi) {
              const cur = value || [];
              onChange(cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]);
            } else onChange(v);
          }}>
          {opt}
        </button>
      );
    })}
  </div>
);

const SliderField = ({ value, min, max, step = 1, onChange, leftLabel, rightLabel, suffix }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-soft)', marginBottom: 4 }}>
      <span>{leftLabel}</span><span>{rightLabel}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value || min}
      onChange={e => onChange(Number(e.target.value))}
      style={{ width: '100%', accentColor: 'var(--accent)' }}/>
    <div style={{ textAlign: 'center', fontFamily: 'var(--serif)', fontSize: 26, color: 'var(--ink)', marginTop: 6 }}>
      {value || min}{suffix && <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-soft)', marginLeft: 4 }}>{suffix}</span>}
    </div>
  </div>
);

const TextInput = ({ value, onChange, placeholder, type='text' }) => (
  <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={{
      width: '100%', padding: '14px 16px',
      border: '1px solid color-mix(in srgb, var(--ink) 15%, transparent)',
      background: 'var(--cream)', borderRadius: 12,
      fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)',
      outline: 'none', transition: 'border-color .15s',
    }}
    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
    onBlur={e => e.target.style.borderColor = 'color-mix(in srgb, var(--ink) 15%, transparent)'}
  />
);

// Step definitions
const STEPS = [
  // 0 — Personal
  ({t,p,update}) => (<>
    <StepHeader idx={0} total={8} title={t.q.personalTitle} subtitle={t.q.personalSub}/>
    <Field label={t.q.name}><TextInput value={p.name} onChange={v=>update('name',v)} placeholder={t.q.namePh}/></Field>
    <Field label={t.q.age}><SliderField value={p.age} min={12} max={90} suffix="anys" onChange={v=>update('age',v)}/></Field>
    <Field label={t.q.gender}>
      <ChipGroup options={t.q.genderOpts} value={p.gender} onChange={v=>update('gender',v)}/>
    </Field>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12 }}>
      <Field label={t.q.height}><TextInput value={p.height} onChange={v=>update('height',v)} type="number" placeholder="165"/></Field>
      <Field label={t.q.weight}><TextInput value={p.weight} onChange={v=>update('weight',v)} type="number" placeholder="60"/></Field>
    </div>
  </>),
  // 1 — Lifestyle
  ({t,p,update}) => (<>
    <StepHeader idx={1} total={8} title={t.q.lifestyleTitle}/>
    <Field label={t.q.lifestyle}><ChipGroup options={t.q.lifestyleOpts} value={p.lifestyle} onChange={v=>update('lifestyle',v)}/></Field>
    <Field label={t.q.sleep}><SliderField value={p.sleep} min={3} max={12} suffix="h" onChange={v=>update('sleep',v)}/></Field>
    <Field label={t.q.stress}><SliderField value={p.stress} min={1} max={10} leftLabel={t.q.stressLow} rightLabel={t.q.stressHigh} onChange={v=>update('stress',v)}/></Field>
  </>),
  // 2 — Experience
  ({t,p,update}) => (<>
    <StepHeader idx={2} total={8} title={t.q.experienceTitle}/>
    <Field label={t.q.level}><ChipGroup options={t.q.levelOpts} optionValues={['principiant','intermedi','avancat']} value={p.level} onChange={v=>update('level',v)}/></Field>
    <Field label={t.q.years}><SliderField value={p.years||0} min={0} max={20} suffix="anys" onChange={v=>update('years',v)}/></Field>
    <Field label={t.q.style}><ChipGroup options={t.q.styleOpts} value={p.style} onChange={v=>update('style',v)}/></Field>
    <Field label={t.q.meditation}><ChipGroup options={[t.q.none, t.q.some, t.q.regular]} value={p.meditation} onChange={v=>update('meditation',v)}/></Field>
    <Field label={t.q.pranayama}><ChipGroup options={[t.q.none, t.q.some, t.q.regular]} value={p.pranayama} onChange={v=>update('pranayama',v)}/></Field>
  </>),
  // 3 — Body
  ({t,p,update}) => (<>
    <StepHeader idx={3} total={8} title={t.q.bodyTitle}/>
    <Field label={t.q.flexibility}><SliderField value={p.flexibility} min={1} max={10} leftLabel={t.q.lessSensation} rightLabel={t.q.moreSensation} onChange={v=>update('flexibility',v)}/></Field>
    <Field label={t.q.strength}><SliderField value={p.strength} min={1} max={10} leftLabel={t.q.lessSensation} rightLabel={t.q.moreSensation} onChange={v=>update('strength',v)}/></Field>
    <Field label={t.q.balance}><SliderField value={p.balance} min={1} max={10} leftLabel={t.q.lessSensation} rightLabel={t.q.moreSensation} onChange={v=>update('balance',v)}/></Field>
  </>),
  // 4 — Injuries
  ({t,p,update}) => (<>
    <StepHeader idx={4} total={8} title={t.q.injuriesTitle} subtitle={t.q.injuriesSub}/>
    <Field label={t.q.currentInjuries}><ChipGroup multi options={t.q.injuryOpts} value={p.currentInjuries||[]} onChange={v=>update('currentInjuries',v)}/></Field>
    <Field label={t.q.pastInjuries}><ChipGroup multi options={t.q.injuryOpts} value={p.pastInjuries||[]} onChange={v=>update('pastInjuries',v)}/></Field>
    <Field label={t.q.conditions}><ChipGroup multi options={t.q.conditionOpts} value={p.conditions||[]} onChange={v=>update('conditions',v)}/></Field>
  </>),
  // 5 — Goals
  ({t,p,update}) => (<>
    <StepHeader idx={5} total={8} title={t.q.goalsTitle}/>
    <Field label={t.q.goals}><ChipGroup multi options={t.q.goalOpts} value={p.goals||[]} onChange={v=>update('goals',v)}/></Field>
    <Field label={t.q.focusZones}><ChipGroup multi options={t.q.zoneOpts} value={p.focusZones||[]} onChange={v=>update('focusZones',v)}/></Field>
    <Field label={t.q.avoidZones}><ChipGroup multi options={t.q.zoneOpts} value={p.avoidZones||[]} onChange={v=>update('avoidZones',v)}/></Field>
  </>),
  // 6 — Practice
  ({t,p,update}) => (<>
    <StepHeader idx={6} total={8} title={t.q.practiceTitle}/>
    <Field label={t.q.duration}><ChipGroup options={t.q.durationOpts} optionValues={[10,20,30,45,60]} value={p.duration} onChange={v=>update('duration',v)}/></Field>
    <Field label={t.q.frequency}><SliderField value={p.frequency||3} min={1} max={7} suffix="/setmana" onChange={v=>update('frequency',v)}/></Field>
    <Field label={t.q.timeOfDay}><ChipGroup options={t.q.timeOpts} value={p.timeOfDay} onChange={v=>update('timeOfDay',v)}/></Field>
  </>),
  // 7 — Material
  ({t,p,update}) => (<>
    <StepHeader idx={7} total={8} title={t.q.materialTitle}/>
    <Field label={t.q.material}><ChipGroup multi options={t.q.materialOpts} value={p.material||[]} onChange={v=>update('material',v)}/></Field>
    <Field label={t.q.space}><ChipGroup options={t.q.spaceOpts} value={p.space} onChange={v=>update('space',v)}/></Field>
    <div className="yb-card" style={{ marginTop: 24, textAlign: 'center', background: 'color-mix(in srgb, var(--accent) 8%, var(--cream))' }}>
      <Icon name="leaf" size={28} color="var(--accent)"/>
      <div style={{ fontFamily: 'var(--serif-display)', fontStyle: 'italic', fontSize: 22, marginTop: 12, color: 'var(--ink)' }}>
        {t.q.ready}
      </div>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-soft)', marginTop: 8 }}>
        {t.q.readyBody}
      </div>
    </div>
  </>),
];

const Questionnaire = ({ t, profile, setProfile, onComplete, onBack }) => {
  const [step, setStep] = useState(0);
  const update = (k, v) => setProfile(p => ({ ...p, [k]: v }));
  const total = STEPS.length;
  const Step = STEPS[step];
  const isLast = step === total - 1;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      <div className="yb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '32px 24px 24px' }}>
        <button onClick={() => step === 0 ? onBack() : setStep(step-1)}
          style={{ background: 'transparent', border:'none', padding: 0, marginBottom: 16,
            display:'flex', alignItems:'center', gap: 6, fontFamily:'var(--sans)', fontSize: 13,
            color:'var(--ink-soft)', cursor:'pointer' }}>
          <Icon name="back" size={16}/> {t.back}
        </button>
        <div key={step} className="yb-fade-up">
          <Step t={t} p={profile} update={update}/>
        </div>
      </div>
      <div style={{ padding: '16px 24px 28px', borderTop: '1px solid color-mix(in srgb, var(--ink) 8%, transparent)', background: 'var(--paper)' }}>
        <button onClick={() => isLast ? onComplete() : setStep(step+1)}
          className={"yb-btn " + (isLast ? 'yb-btn-clay' : 'yb-btn-primary')}
          style={{ width: '100%', padding: '16px' }}>
          {isLast ? t.q.generate : t.next}
          <Icon name="arrowRight" size={16} color="currentColor"/>
        </button>
      </div>
    </div>
  );
};

Object.assign(window, { Welcome, Questionnaire });
