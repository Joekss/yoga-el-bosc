// components/Auth.jsx
// ─────────────────────────────────────────────────────────────────────────────
// PAQUET INDEPENDENT — Sistema d'accés + Panell d'administració
//
// Fluxos:
//   1. Alumna/Professora:  email → [codi 6 dígits simulat] → app
//   2. Professora (admin): trigger ocult (logo ×7) → PIN 4 dígits → panell admin
//
// Punts d'entrada:
//   <AuthGate lang onSuccess(email, role) />
//
// Integració real (swap-in):
//   · Resend:      POST https://api.resend.com/emails  (RESEND_API_KEY)
//   · EmailJS:     emailjs.send(serviceId, templateId, { to_email, code })
//   · Supabase:    supabase.auth.signInWithOtp({ email })
//
// PIN per defecte: 1234 (configurable via prop adminPin)
// Codi demo:       123456 (accepta qualsevol codi de 6 dígits en mode prototip)
// ─────────────────────────────────────────────────────────────────────────────

const { useState: uSAuth, useEffect: uEAuth, useRef: uRAuth, useCallback: uCAuth } = React;

// ── Traduccions ──────────────────────────────────────────────────────────────
const AUTH_T = {
  ca: {
    headline: 'Entra a El Bosc',
    sub: 'Introdueix el teu correu electrònic per rebre l\'accés.',
    emailLabel: 'Correu electrònic',
    emailPh: 'el.teu@correu.cat',
    sendBtn: 'Enviar accés',
    sending: 'Enviant…',
    codeTitle: 'Comprova el teu correu',
    codeSub: 'Hem enviat un codi de 6 dígits a',
    codeLabel: 'Codi d\'accés',
    codePh: '— — — — — —',
    verify: 'Verificar',
    verifying: 'Verificant…',
    demoHint: 'Demo: utilitza el codi',
    resend: 'No has rebut el codi?',
    resendLink: 'Torna a enviar',
    resent: 'Reenviat! ✓',
    wrongCode: 'Codi incorrecte. Torna a intentar-ho.',
    changeEmail: '← Canviar correu',
    demoAccess: 'Accés ràpid (demo)',
    adminTitle: 'Panell d\'administració',
    adminSub: 'Gestió d\'alumnes · El Bosc',
    pinTitle: 'Accés professora',
    pinSub: 'Introdueix el PIN d\'administradora',
    pinWrong: 'PIN incorrecte',
    pinForgot: 'PIN oblidat? Contacta el suport.',
    rosterTitle: 'Alumnes',
    addStudent: 'Afegir alumna',
    namePh: 'Nom complet',
    emailPh2: 'correu@exemple.com',
    levelLabel: 'Nivell',
    invite: 'Convidar',
    cancel: 'Cancel·lar',
    statusActive: 'Activa',
    statusInvited: 'Convidada',
    statusRevoked: 'Revocada',
    revoke: 'Revocar',
    reinvite: 'Reenviar',
    restore: 'Restaurar',
    delete: 'Eliminar',
    invitedAt: 'Convidada el',
    lastAccess: 'Darrer accés',
    enterApp: 'Entrar a l\'app',
    closeAdmin: 'Tancar',
    logoCounts: 'Acces administradora',
    noStudents: 'Cap alumna registrada.',
    levelOpts: ['Principiant', 'Intermedi', 'Avançat'],
    teacherEnter: 'Entrar com a professora',
    studentEnter: 'Entrar com a alumna',
    demoNote: 'Prototip · Sense backend real',
  },
  es: {
    headline: 'Entra en El Bosc',
    sub: 'Introduce tu correo electrónico para recibir el acceso.',
    emailLabel: 'Correo electrónico',
    emailPh: 'tu@correo.es',
    sendBtn: 'Enviar acceso',
    sending: 'Enviando…',
    codeTitle: 'Revisa tu correo',
    codeSub: 'Hemos enviado un código de 6 dígitos a',
    codeLabel: 'Código de acceso',
    codePh: '— — — — — —',
    verify: 'Verificar',
    verifying: 'Verificando…',
    demoHint: 'Demo: usa el código',
    resend: '¿No has recibido el código?',
    resendLink: 'Volver a enviar',
    resent: '¡Reenviado! ✓',
    wrongCode: 'Código incorrecto. Inténtalo de nuevo.',
    changeEmail: '← Cambiar correo',
    demoAccess: 'Acceso rápido (demo)',
    adminTitle: 'Panel de administración',
    adminSub: 'Gestión de alumnas · El Bosc',
    pinTitle: 'Acceso profesora',
    pinSub: 'Introduce el PIN de administradora',
    pinWrong: 'PIN incorrecto',
    pinForgot: '¿PIN olvidado? Contacta soporte.',
    rosterTitle: 'Alumnas',
    addStudent: 'Añadir alumna',
    namePh: 'Nombre completo',
    emailPh2: 'correo@ejemplo.com',
    levelLabel: 'Nivel',
    invite: 'Invitar',
    cancel: 'Cancelar',
    statusActive: 'Activa',
    statusInvited: 'Invitada',
    statusRevoked: 'Revocada',
    revoke: 'Revocar',
    reinvite: 'Reenviar',
    restore: 'Restaurar',
    delete: 'Eliminar',
    invitedAt: 'Invitada el',
    lastAccess: 'Último acceso',
    enterApp: 'Entrar a la app',
    closeAdmin: 'Cerrar',
    logoCounts: 'Acceso administradora',
    noStudents: 'Sin alumnas registradas.',
    levelOpts: ['Principiante', 'Intermedio', 'Avanzado'],
    teacherEnter: 'Entrar como profesora',
    studentEnter: 'Entrar como alumna',
    demoNote: 'Prototipo · Sin backend real',
  },
  en: {
    headline: 'Enter El Bosc',
    sub: 'Enter your email to receive access.',
    emailLabel: 'Email address',
    emailPh: 'your@email.com',
    sendBtn: 'Send access',
    sending: 'Sending…',
    codeTitle: 'Check your inbox',
    codeSub: 'We sent a 6-digit code to',
    codeLabel: 'Access code',
    codePh: '— — — — — —',
    verify: 'Verify',
    verifying: 'Verifying…',
    demoHint: 'Demo: use the code',
    resend: 'Didn\'t receive the code?',
    resendLink: 'Resend',
    resent: 'Resent! ✓',
    wrongCode: 'Wrong code. Please try again.',
    changeEmail: '← Change email',
    demoAccess: 'Quick access (demo)',
    adminTitle: 'Admin panel',
    adminSub: 'Student management · El Bosc',
    pinTitle: 'Teacher access',
    pinSub: 'Enter the admin PIN',
    pinWrong: 'Wrong PIN',
    pinForgot: 'Forgot PIN? Contact support.',
    rosterTitle: 'Students',
    addStudent: 'Add student',
    namePh: 'Full name',
    emailPh2: 'email@example.com',
    levelLabel: 'Level',
    invite: 'Invite',
    cancel: 'Cancel',
    statusActive: 'Active',
    statusInvited: 'Invited',
    statusRevoked: 'Revoked',
    revoke: 'Revoke',
    reinvite: 'Resend',
    restore: 'Restore',
    delete: 'Delete',
    invitedAt: 'Invited on',
    lastAccess: 'Last access',
    enterApp: 'Enter app',
    closeAdmin: 'Close',
    logoCounts: 'Teacher access',
    noStudents: 'No students registered.',
    levelOpts: ['Beginner', 'Intermediate', 'Advanced'],
    teacherEnter: 'Enter as teacher',
    studentEnter: 'Enter as student',
    demoNote: 'Prototype · No real backend',
  },
};

// ── Llista inicial d'alumnes (el panell admin la edita) ──────────────────────
const INITIAL_ROSTER = [
  { id:'nuria',  name:'Núria Prat',    initials:'N', accent:'#B8744A', email:'nuria@example.com',  level:'principiant', status:'active',  invitedAt:'12 abr 2025', lastAccess:'Avui' },
  { id:'marta',  name:'Marta Vidal',   initials:'M', accent:'#5A8C42', email:'marta@example.com',  level:'intermedi',   status:'active',  invitedAt:'5 abr 2025',  lastAccess:'Ahir' },
  { id:'joana',  name:'Joana Ferrer',  initials:'J', accent:'#3F7AAA', email:'joana@example.com',  level:'avancat',     status:'active',  invitedAt:'1 mar 2025',  lastAccess:'Fa 2 dies' },
  { id:'aina',   name:'Aina Bosch',    initials:'A', accent:'#D97A2A', email:'aina@example.com',   level:'principiant', status:'invited', invitedAt:'28 abr 2025', lastAccess:'—' },
  { id:'laia',   name:'Laia Tort',     initials:'L', accent:'#7A4A8A', email:'laia@example.com',   level:'intermedi',   status:'active',  invitedAt:'20 mar 2025', lastAccess:'Avui' },
  { id:'roser',  name:'Roser Camps',   initials:'R', accent:'#3D3D8A', email:'roser@example.com',  level:'principiant', status:'revoked', invitedAt:'1 abr 2025',  lastAccess:'Fa 7 dies' },
];

// ── Paleta d'accents per a noves alumnes ────────────────────────────────────
const ACCENT_PALETTE = ['#B8744A','#5A8C42','#3F7AAA','#D97A2A','#7A4A8A','#3D3D8A','#9AAA82','#6E6757'];

// ── Pantalla 1: Introducció del correu ───────────────────────────────────────
const EmailScreen = ({ t, onSend, onAdminTrigger }) => {
  const [email, setEmail] = uSAuth('');
  const [busy, setBusy] = uSAuth(false);
  const [err, setErr] = uSAuth('');
  const tapCount = uRAuth(0);
  const tapTimer = uRAuth(null);

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSend = async () => {
    if (!isValid) return;
    setBusy(true); setErr('');
    // ── Real integration point ──────────────────────────────────────────
    // Resend:   await fetch('https://api.resend.com/emails', { method:'POST', headers:{'Authorization':'Bearer RE_xxx','Content-Type':'application/json'}, body: JSON.stringify({ from:'noreply@elbosc.cat', to: email, subject:'El teu accés a El Bosc', html:`<p>El teu codi és: <b>123456</b></p>` }) });
    // Supabase: await supabase.auth.signInWithOtp({ email });
    // EmailJS:  await emailjs.send('service_id','template_id',{ to_email:email, code:'123456' });
    // ───────────────────────────────────────────────────────────────────
    await new Promise(r => setTimeout(r, 900)); // simula latència
    setBusy(false);
    onSend(email);
  };

  // Trigger ocult: 7 taps al logo en < 3s
  const handleLogoTap = () => {
    tapCount.current += 1;
    clearTimeout(tapTimer.current);
    if (tapCount.current >= 7) { tapCount.current = 0; onAdminTrigger(); return; }
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 3000);
  };

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--paper)', padding:'0 28px' }}>
      {/* Logo */}
      <div onClick={handleLogoTap} style={{ paddingTop: 72, paddingBottom: 32, display:'flex', flexDirection:'column', alignItems:'center', gap: 12, cursor:'default', userSelect:'none' }}>
        <svg viewBox="0 0 80 80" width={72} height={72} style={{ filter:'drop-shadow(0 4px 12px color-mix(in srgb, var(--accent) 25%, transparent))' }}>
          <circle cx="40" cy="40" r="40" fill="color-mix(in srgb, var(--accent) 12%, var(--cream))"/>
          <g stroke="var(--accent)" strokeWidth="1.5" fill="none" strokeLinecap="round">
            <path d="M40 20 Q32 34 32 44 Q32 54 40 58 Q48 54 48 44 Q48 34 40 20z"/>
            <line x1="40" y1="20" x2="40" y2="58"/>
            <path d="M32 36 Q24 30 22 22 Q28 24 32 36z"/>
            <path d="M48 38 Q56 32 58 24 Q52 26 48 38z"/>
          </g>
        </svg>
        <div style={{ fontFamily:'var(--serif)', fontSize: 28, fontStyle:'italic', color:'var(--ink)', letterSpacing:'-0.01em' }}>El Bosc</div>
        <div style={{ fontFamily:'var(--sans)', fontSize: 10, letterSpacing:'0.3em', color:'var(--accent)', textTransform:'uppercase' }}>Ioga personalitzat</div>
      </div>

      {/* Form */}
      <div style={{ flex: 1, display:'flex', flexDirection:'column', justifyContent:'center', gap: 0 }}>
        <h1 style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize: 30, color:'var(--ink)', marginBottom: 8 }}>
          {t.headline}
        </h1>
        <p style={{ fontFamily:'var(--sans)', fontSize: 13, color:'var(--ink-soft)', marginBottom: 28, lineHeight: 1.5 }}>
          {t.sub}
        </p>

        <label style={{ fontFamily:'var(--sans)', fontSize: 11, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--accent)', marginBottom: 8, display:'block' }}>
          {t.emailLabel}
        </label>
        <div style={{ display:'flex', alignItems:'center', gap: 10, background:'var(--cream)', borderRadius: 16,
                      border:'1.5px solid ' + (err ? 'var(--accent)' : 'color-mix(in srgb, var(--ink) 10%, transparent)'),
                      padding:'12px 16px', marginBottom: 16 }}>
          <Icon name="mail" size={18} color="var(--ink-soft)"/>
          <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={t.emailPh} autoFocus
            style={{ flex:1, border:'none', outline:'none', background:'transparent',
                     fontFamily:'var(--sans)', fontSize: 16, color:'var(--ink)' }}/>
        </div>
        {err && <div style={{ fontFamily:'var(--sans)', fontSize: 12, color:'var(--accent)', marginBottom: 10 }}>{err}</div>}

        <button onClick={handleSend} disabled={!isValid || busy}
          className="yb-btn yb-btn-clay" style={{ width:'100%', opacity: (!isValid || busy) ? 0.55 : 1, marginBottom: 12 }}>
          {busy ? t.sending : t.sendBtn}
        </button>

        {/* Demo shortcut */}
        <button onClick={() => onSend('demo@elbosc.cat')}
          style={{ background:'transparent', border:'none', cursor:'pointer', fontFamily:'var(--sans)', fontSize: 12, color:'var(--ink-soft)', textDecoration:'underline', padding: 4 }}>
          {t.demoAccess}
        </button>
      </div>

      <div style={{ padding:'16px 0 36px', textAlign:'center', fontFamily:'var(--sans)', fontSize: 10, color:'var(--ink-soft)', letterSpacing:'0.1em' }}>
        {t.demoNote}
      </div>
    </div>
  );
};

// ── Pantalla 2: Verificació del codi ─────────────────────────────────────────
const CodeScreen = ({ t, lang, email, onVerified, onBack }) => {
  const [digits, setDigits] = uSAuth(['','','','','','']);
  const [busy, setBusy] = uSAuth(false);
  const [err, setErr] = uSAuth('');
  const [resent, setResent] = uSAuth(false);
  const [role, setRole] = uSAuth('student');
  const refs = Array.from({length:6}, () => uRAuth(null));

  const DEMO_CODE = '123456';

  const handleDigit = (i, val) => {
    const v = val.replace(/\D/g,'').slice(-1);
    const next = [...digits]; next[i] = v;
    setDigits(next); setErr('');
    if (v && i < 5) refs[i+1].current?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs[i-1].current?.focus();
    }
    if (e.key === 'Enter') handleVerify();
  };

  const handlePaste = (e) => {
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (p.length === 6) {
      setDigits(p.split(''));
      refs[5].current?.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length < 6) return;
    setBusy(true); setErr('');
    await new Promise(r => setTimeout(r, 700)); // simula verificació
    // ── Real: verify OTP with backend ──────────────────────────────────
    // Supabase: const { error } = await supabase.auth.verifyOtp({ email, token: code, type:'email' });
    // ──────────────────────────────────────────────────────────────────
    const ok = code === DEMO_CODE || code.length === 6; // accepta qualsevol 6 dígits en demo
    setBusy(false);
    if (ok) onVerified(email, role);
    else setErr(t.wrongCode);
  };

  const handleResend = async () => {
    setResent(true);
    await new Promise(r => setTimeout(r, 600));
    setTimeout(() => setResent(false), 2500);
  };

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--paper)', padding:'0 28px' }}>
      {/* Back + header */}
      <div style={{ paddingTop: 56, display:'flex', alignItems:'center', gap: 12, marginBottom: 32 }}>
        <button onClick={onBack} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--ink)', padding: 4 }}>
          <Icon name="back" size={22} color="var(--ink)"/>
        </button>
      </div>

      <div style={{ display:'flex', justifyContent:'center', marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius:'50%', background:'color-mix(in srgb, var(--leaf) 18%, var(--cream))',
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name="mail" size={28} color="var(--leaf-deep)"/>
        </div>
      </div>

      <h1 style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize: 28, color:'var(--ink)', textAlign:'center', marginBottom: 8 }}>
        {t.codeTitle}
      </h1>
      <p style={{ fontFamily:'var(--sans)', fontSize: 13, color:'var(--ink-soft)', textAlign:'center', marginBottom: 6, lineHeight: 1.5 }}>
        {t.codeSub}
      </p>
      <p style={{ fontFamily:'var(--sans)', fontSize: 13, color:'var(--accent)', textAlign:'center', marginBottom: 28, fontWeight: 500 }}>
        {email}
      </p>

      {/* Boxes */}
      <div style={{ display:'flex', gap: 8, justifyContent:'center', marginBottom: 16 }} onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input key={i} ref={refs[i]} value={d}
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => handleKey(i, e)}
            maxLength={1} inputMode="numeric"
            style={{ width: 44, height: 54, textAlign:'center', border:'2px solid ' + (err ? 'var(--accent)' : d ? 'var(--ink)' : 'color-mix(in srgb, var(--ink) 14%, transparent)'),
                     borderRadius: 14, fontFamily:'var(--serif)', fontSize: 26, color:'var(--ink)',
                     background: d ? 'var(--cream)' : 'var(--paper)', outline:'none', transition:'border .15s' }}/>
        ))}
      </div>

      {err && <div style={{ fontFamily:'var(--sans)', fontSize: 12, color:'var(--accent)', textAlign:'center', marginBottom: 10 }}>{err}</div>}

      {/* Demo hint */}
      <div style={{ textAlign:'center', marginBottom: 20 }}>
        <span style={{ fontFamily:'var(--sans)', fontSize: 11, color:'var(--ink-soft)' }}>
          {t.demoHint} <span style={{ fontFamily:'var(--serif)', fontSize: 15, letterSpacing:'0.2em', color:'var(--ink)', fontStyle:'italic' }}>123456</span>
        </span>
      </div>

      <button onClick={handleVerify} disabled={digits.join('').length < 6 || busy}
        className="yb-btn yb-btn-clay" style={{ width:'100%', opacity: digits.join('').length < 6 || busy ? 0.55 : 1, marginBottom: 16 }}>
        {busy ? t.verifying : t.verify}
      </button>

      {/* Rol selector (student / teacher visual) */}
      <div style={{ display:'flex', gap: 8, marginBottom: 20 }}>
        {['student','teacher'].map(r => (
          <button key={r} onClick={()=>setRole(r)}
            style={{ flex:1, padding:'10px 6px', borderRadius: 14, border:'2px solid ' + (role===r ? 'var(--ink)':'color-mix(in srgb, var(--ink) 10%, transparent)'),
                     background: role===r ? 'var(--ink)':'transparent', color: role===r ? 'var(--cream)':'var(--ink-soft)',
                     cursor:'pointer', fontFamily:'var(--sans)', fontSize: 12, display:'flex', alignItems:'center', justifyContent:'center', gap: 6, transition:'all .15s' }}>
            <Icon name={r==='teacher'?'shield':'user'} size={14} color="currentColor"/>
            {r==='student' ? t.studentEnter.split(' ').slice(-1)[0] : t.teacherEnter.split(' ').slice(-1)[0]}
          </button>
        ))}
      </div>

      <div style={{ textAlign:'center' }}>
        <span style={{ fontFamily:'var(--sans)', fontSize: 12, color:'var(--ink-soft)' }}>{t.resend} </span>
        <button onClick={handleResend} style={{ background:'transparent', border:'none', cursor:'pointer',
                fontFamily:'var(--sans)', fontSize: 12, color: resent ? 'var(--leaf-deep)':'var(--accent)', textDecoration:'underline' }}>
          {resent ? t.resent : t.resendLink}
        </button>
      </div>
    </div>
  );
};

// ── Pantalla PIN (trigger ocult → admin) ─────────────────────────────────────
const PinScreen = ({ t, adminPin, onSuccess, onClose }) => {
  const [input, setInput] = uSAuth('');
  const [shake, setShake] = uSAuth(false);

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  const press = (k) => {
    if (k === '⌫') { setInput(s => s.slice(0,-1)); return; }
    if (!k) return;
    const next = (input + k).slice(0, 4);
    setInput(next);
    if (next.length === 4) {
      if (next === adminPin) {
        setTimeout(() => onSuccess(), 200);
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setInput(''); }, 700);
      }
    }
  };

  return (
    <div style={{ position:'absolute', inset:0, background:'var(--ink)', zIndex:100, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
      <button onClick={onClose} style={{ position:'absolute', top:52, right:20, background:'transparent', border:'none', cursor:'pointer', color:'color-mix(in srgb, var(--cream) 50%, transparent)' }}>
        <Icon name="close" size={22} color="currentColor"/>
      </button>

      <div style={{ width:48, height:48, borderRadius:'50%', background:'color-mix(in srgb, var(--cream) 10%, transparent)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
        <Icon name="shield" size={22} color="var(--cream)"/>
      </div>
      <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:26, color:'var(--cream)', marginBottom:6 }}>{t.pinTitle}</div>
      <div style={{ fontFamily:'var(--sans)', fontSize:12, color:'color-mix(in srgb, var(--cream) 55%, transparent)', marginBottom:32, letterSpacing:'0.05em' }}>{t.pinSub}</div>

      {/* Dots */}
      <div style={{ display:'flex', gap:16, marginBottom:36,
                    animation: shake ? 'ybShake 0.5s ease' : 'none' }}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{ width:14, height:14, borderRadius:'50%',
                                background: i < input.length ? 'var(--accent)' : 'color-mix(in srgb, var(--cream) 20%, transparent)',
                                border:'2px solid color-mix(in srgb, var(--cream) 30%, transparent)',
                                transition:'background .15s' }}/>
        ))}
      </div>

      {/* Keypad */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, width:230 }}>
        {keys.map((k,i)=>(
          <button key={i} onClick={()=>press(k)} disabled={!k && k!=='0'}
            style={{ height:62, borderRadius:16, border:'none', cursor: !k ? 'default':'pointer',
                     background: !k ? 'transparent' : k==='⌫' ? 'color-mix(in srgb, var(--cream) 10%, transparent)' : 'color-mix(in srgb, var(--cream) 12%, transparent)',
                     color:'var(--cream)', fontFamily:'var(--serif)', fontSize: k==='⌫'?18:28, fontStyle:'italic',
                     display:'flex', alignItems:'center', justifyContent:'center',
                     transition:'background .1s', opacity: !k ? 0 : 1 }}
            onMouseDown={e=>{ e.currentTarget.style.background='color-mix(in srgb, var(--cream) 22%, transparent)'; }}
            onMouseUp={e=>{ e.currentTarget.style.background = k==='⌫' ? 'color-mix(in srgb, var(--cream) 10%, transparent)':'color-mix(in srgb, var(--cream) 12%, transparent)'; }}>
            {k==='⌫' ? <Icon name="back" size={16} color="var(--cream)"/> : k}
          </button>
        ))}
      </div>

      <div style={{ marginTop:24, fontFamily:'var(--sans)', fontSize:11, color:'color-mix(in srgb, var(--cream) 35%, transparent)' }}>
        {t.pinForgot}
      </div>

      <style>{`@keyframes ybShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }`}</style>
    </div>
  );
};

// ── Panell d'administració ────────────────────────────────────────────────────
const AdminPanel = ({ t, lang, onClose, onEnterAsTeacher }) => {
  const [roster, setRoster] = uSAuth(INITIAL_ROSTER);
  const [addOpen, setAddOpen] = uSAuth(false);
  const [newName, setNewName] = uSAuth('');
  const [newEmail, setNewEmail] = uSAuth('');
  const [newLevel, setNewLevel] = uSAuth('principiant');
  const [tab, setTab] = uSAuth('roster'); // 'roster' | 'settings'

  const statusColor = { active:'var(--leaf-deep)', invited:'var(--accent)', revoked:'var(--ink-soft)' };
  const statusLabel = { active: t.statusActive, invited: t.statusInvited, revoked: t.statusRevoked };
  const levelKeys = ['principiant','intermedi','avancat'];

  const addStudent = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    const colors = ACCENT_PALETTE;
    const accent = colors[roster.length % colors.length];
    setRoster(prev => [...prev, {
      id: 'u_' + Date.now(),
      name: newName.trim(),
      initials: newName.trim().charAt(0).toUpperCase(),
      accent, email: newEmail.trim(),
      level: newLevel, status:'invited',
      invitedAt: new Date().toLocaleDateString('ca-ES',{day:'numeric',month:'short',year:'numeric'}),
      lastAccess:'—',
    }]);
    setNewName(''); setNewEmail(''); setAddOpen(false);
  };

  const setStatus = (id, status) => setRoster(prev => prev.map(s => s.id===id ? {...s, status} : s));
  const removeStudent = (id) => setRoster(prev => prev.filter(s => s.id!==id));

  return (
    <div style={{ position:'absolute', inset:0, background:'var(--paper)', zIndex:90, display:'flex', flexDirection:'column', animation:'ybFadeUp .3s ease' }}>
      {/* Header */}
      <div style={{ padding:'50px 20px 12px', borderBottom:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:40, height:40, borderRadius:'50%', background:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name="shield" size={18} color="var(--cream)"/>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'var(--sans)', fontSize:10, letterSpacing:'0.2em', color:'var(--accent)', textTransform:'uppercase' }}>{t.adminSub}</div>
          <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:22, color:'var(--ink)' }}>{t.adminTitle}</div>
        </div>
        <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', padding:6 }}>
          <Icon name="close" size={20} color="var(--ink-soft)"/>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, padding:'10px 20px 0', borderBottom:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)' }}>
        {['roster','settings'].map(tb => (
          <button key={tb} onClick={()=>setTab(tb)}
            style={{ flex:1, padding:'8px 4px', background:'transparent', border:'none', cursor:'pointer',
                     fontFamily:'var(--sans)', fontSize:12, color: tab===tb ? 'var(--accent)':'var(--ink-soft)',
                     borderBottom: tab===tb ? '2px solid var(--accent)':'2px solid transparent', marginBottom:-1 }}>
            {tb==='roster' ? `${t.rosterTitle} (${roster.length})` : {ca:'Configuració',es:'Configuración',en:'Settings'}[lang]}
          </button>
        ))}
      </div>

      {tab === 'roster' && (
        <>
          <div className="yb-scroll" style={{ flex:1, overflowY:'auto', padding:'10px 14px' }}>
            {roster.length === 0 && (
              <div style={{ textAlign:'center', padding:'32px 0', fontFamily:'var(--sans)', fontSize:13, color:'var(--ink-soft)' }}>
                {t.noStudents}
              </div>
            )}
            {roster.map(s => (
              <div key={s.id} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'12px 10px',
                                       borderRadius:14, marginBottom:4,
                                       background: s.status==='revoked' ? 'color-mix(in srgb, var(--ink) 3%, transparent)' : 'transparent',
                                       opacity: s.status==='revoked' ? 0.6 : 1 }}>
                {/* Avatar */}
                <div style={{ width:40, height:40, borderRadius:'50%', background: s.status==='revoked' ? 'var(--sand)':s.accent,
                              color:'var(--cream)', display:'flex', alignItems:'center', justifyContent:'center',
                              fontFamily:'var(--serif)', fontSize:17, flexShrink:0 }}>
                  {s.initials}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:16 }}>{s.name}</span>
                    <span style={{ fontFamily:'var(--sans)', fontSize:10, padding:'2px 8px', borderRadius:999,
                                   background:`color-mix(in srgb, ${statusColor[s.status]} 16%, transparent)`,
                                   color: statusColor[s.status], letterSpacing:'0.05em' }}>
                      {statusLabel[s.status]}
                    </span>
                  </div>
                  <div style={{ fontFamily:'var(--sans)', fontSize:11, color:'var(--ink-soft)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {s.email}
                  </div>
                  <div style={{ fontFamily:'var(--sans)', fontSize:10, color:'var(--ink-soft)', marginTop:3, display:'flex', gap:10, flexWrap:'wrap' }}>
                    <span>{s.level}</span>
                    <span>{t.invitedAt} {s.invitedAt}</span>
                    <span>{t.lastAccess}: {s.lastAccess}</span>
                  </div>
                  {/* Actions */}
                  <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
                    {s.status==='active' && (
                      <button onClick={()=>setStatus(s.id,'revoked')}
                        style={{ padding:'5px 10px', borderRadius:999, border:'1px solid color-mix(in srgb, var(--accent) 40%, transparent)', background:'transparent', color:'var(--accent)', fontFamily:'var(--sans)', fontSize:11, cursor:'pointer' }}>
                        <Icon name="lock" size={10} color="currentColor"/> {t.revoke}
                      </button>
                    )}
                    {s.status==='invited' && (
                      <button onClick={()=>setStatus(s.id,'active')}
                        style={{ padding:'5px 10px', borderRadius:999, border:'1px solid color-mix(in srgb, var(--leaf) 50%, transparent)', background:'transparent', color:'var(--leaf-deep)', fontFamily:'var(--sans)', fontSize:11, cursor:'pointer' }}>
                        <Icon name="refresh" size={10} color="currentColor"/> {t.reinvite}
                      </button>
                    )}
                    {s.status==='revoked' && (
                      <button onClick={()=>setStatus(s.id,'active')}
                        style={{ padding:'5px 10px', borderRadius:999, border:'1px solid color-mix(in srgb, var(--leaf) 50%, transparent)', background:'transparent', color:'var(--leaf-deep)', fontFamily:'var(--sans)', fontSize:11, cursor:'pointer' }}>
                        {t.restore}
                      </button>
                    )}
                    <button onClick={()=>removeStudent(s.id)}
                      style={{ padding:'5px 10px', borderRadius:999, border:'1px solid color-mix(in srgb, var(--ink) 15%, transparent)', background:'transparent', color:'var(--ink-soft)', fontFamily:'var(--sans)', fontSize:11, cursor:'pointer' }}>
                      <Icon name="trash" size={10} color="currentColor"/> {t.delete}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ height:8 }}/>
          </div>

          {/* Add student */}
          {addOpen ? (
            <div style={{ padding:'14px 18px calc(env(safe-area-inset-bottom,12px)+14px)', borderTop:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)', display:'flex', flexDirection:'column', gap:10 }}>
              <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder={t.namePh}
                style={{ padding:'10px 14px', borderRadius:12, border:'1.5px solid color-mix(in srgb, var(--ink) 12%, transparent)',
                         fontFamily:'var(--serif)', fontSize:15, background:'var(--cream)', outline:'none', color:'var(--ink)' }}/>
              <input value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder={t.emailPh2} type="email"
                style={{ padding:'10px 14px', borderRadius:12, border:'1.5px solid color-mix(in srgb, var(--ink) 12%, transparent)',
                         fontFamily:'var(--sans)', fontSize:14, background:'var(--cream)', outline:'none', color:'var(--ink)' }}/>
              <div style={{ display:'flex', gap:8 }}>
                <select value={newLevel} onChange={e=>setNewLevel(e.target.value)}
                  style={{ flex:1, padding:'10px 12px', borderRadius:12, border:'1.5px solid color-mix(in srgb, var(--ink) 12%, transparent)',
                           fontFamily:'var(--sans)', fontSize:13, background:'var(--cream)', color:'var(--ink)', outline:'none' }}>
                  {levelKeys.map((lk,i) => <option key={lk} value={lk}>{t.levelOpts[i]}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={addStudent} className="yb-btn yb-btn-clay" style={{ flex:1, padding:'11px' }}>
                  <Icon name="user-plus" size={14} color="var(--cream)"/> {t.invite}
                </button>
                <button onClick={()=>setAddOpen(false)} className="yb-btn yb-btn-ghost" style={{ flex:1, padding:'11px' }}>
                  {t.cancel}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding:'10px 18px calc(env(safe-area-inset-bottom,12px)+10px)', borderTop:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)', display:'flex', gap:8 }}>
              <button onClick={()=>setAddOpen(true)} className="yb-btn yb-btn-primary" style={{ flex:1, padding:'12px' }}>
                <Icon name="user-plus" size={14} color="currentColor"/> {t.addStudent}
              </button>
              <button onClick={onEnterAsTeacher} className="yb-btn yb-btn-clay" style={{ flex:1, padding:'12px' }}>
                {t.enterApp}
              </button>
            </div>
          )}
        </>
      )}

      {tab === 'settings' && (
        <div className="yb-scroll" style={{ flex:1, overflowY:'auto', padding:'14px 18px' }}>
          <div className="yb-card" style={{ marginBottom:14 }}>
            <div className="yb-divider-leaf" style={{ marginBottom:12 }}>
              {({ca:'Serveis d\'email',es:'Servicios de email',en:'Email services'})[lang]}
            </div>
            <p style={{ fontFamily:'var(--sans)', fontSize:12, color:'var(--ink-soft)', lineHeight:1.55 }}>
              {({
                ca:'Integra un servei d\'enviament d\'emails per activar els magic links reals:',
                es:'Integra un servicio de envío de emails para activar los magic links reales:',
                en:'Connect an email sending service to enable real magic links:',
              })[lang]}
            </p>
            {[
              { name:'Resend', url:'resend.com', note:{ca:'Gratuït fins 3.000/mes',es:'Gratis hasta 3.000/mes',en:'Free up to 3,000/month'}[lang] },
              { name:'EmailJS', url:'emailjs.com', note:{ca:'Gratuït fins 200/mes',es:'Gratis hasta 200/mes',en:'Free up to 200/month'}[lang] },
              { name:'Supabase Auth', url:'supabase.com', note:{ca:'Gratuït fins 50.000 usuaris',es:'Gratis hasta 50.000 usuarios',en:'Free up to 50,000 users'}[lang] },
            ].map(svc => (
              <div key={svc.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid color-mix(in srgb, var(--ink) 5%, transparent)' }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'color-mix(in srgb, var(--accent) 14%, transparent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon name="mail" size={16} color="var(--accent)"/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'var(--sans)', fontSize:13, fontWeight:500 }}>{svc.name}</div>
                  <div style={{ fontFamily:'var(--sans)', fontSize:11, color:'var(--ink-soft)' }}>{svc.note}</div>
                </div>
                <span style={{ fontFamily:'var(--sans)', fontSize:10, color:'var(--ink-soft)' }}>{svc.url}</span>
              </div>
            ))}
          </div>

          <div className="yb-card">
            <div className="yb-divider-leaf" style={{ marginBottom:12 }}>PIN</div>
            <p style={{ fontFamily:'var(--sans)', fontSize:12, color:'var(--ink-soft)', lineHeight:1.55, margin:0 }}>
              {({ca:'PIN actual: ',es:'PIN actual: ',en:'Current PIN: '})[lang]}
              <span style={{ fontFamily:'var(--serif)', fontSize:18, letterSpacing:'0.3em', color:'var(--ink)' }}>1234</span>
            </p>
            <p style={{ fontFamily:'var(--sans)', fontSize:11, color:'var(--ink-soft)', marginTop:8, lineHeight:1.5 }}>
              {({ca:'Canvia\'l via la prop adminPin="XXXX" a l\'app.',es:'Cámbialo via la prop adminPin="XXXX" en la app.',en:'Change it via the adminPin="XXXX" prop in the app.'})[lang]}
            </p>
          </div>
          <div style={{ height:80 }}/>
        </div>
      )}
    </div>
  );
};

// ── Punt d'entrada: AuthGate ─────────────────────────────────────────────────
const AuthGate = ({ lang = 'ca', adminPin = '1234', onSuccess }) => {
  const t = AUTH_T[lang] || AUTH_T.ca;
  const [screen, setScreen] = uSAuth('email'); // email | code | pin | admin
  const [sentEmail, setSentEmail] = uSAuth('');

  const handleSend = (email) => { setSentEmail(email); setScreen('code'); };
  const handleVerified = (email, role) => onSuccess(email, role);
  const handleAdminTrigger = () => setScreen('pin');
  const handlePinSuccess = () => setScreen('admin');
  const handleEnterAsTeacher = () => onSuccess('celia@elbosc.cat', 'teacher');

  return (
    <div style={{ height:'100%', position:'relative', overflow:'hidden', background:'var(--paper)' }}>
      {screen === 'email' && (
        <EmailScreen t={t} onSend={handleSend} onAdminTrigger={handleAdminTrigger}/>
      )}
      {screen === 'code' && (
        <CodeScreen t={t} lang={lang} email={sentEmail} onVerified={handleVerified} onBack={()=>setScreen('email')}/>
      )}
      {screen === 'pin' && (
        <PinScreen t={t} adminPin={adminPin} onSuccess={handlePinSuccess} onClose={()=>setScreen('email')}/>
      )}
      {screen === 'admin' && (
        <AdminPanel t={t} lang={lang} onClose={()=>setScreen('email')} onEnterAsTeacher={handleEnterAsTeacher}/>
      )}
    </div>
  );
};

window.AuthGate = AuthGate;
