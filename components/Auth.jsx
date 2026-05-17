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
    sub: 'Introdueix el teu correu per continuar.',
    emailLabel: 'Correu electrònic',
    emailPh: 'el.teu@correu.cat',
    sendBtn: 'Continuar',
    sending: 'Verificant…',
    codeTitle: 'Benvinguda!',
    codeSub: 'El teu codi d\'accés personal és:',
    saveCode: 'Guarda aquest codi per a accessos futurs',
    codeLabel: 'Codi d\'accés',
    codePh: '— — — — — —',
    verify: 'Entrar',
    verifying: 'Verificant…',
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
    sub: 'Introduce tu correo para continuar.',
    emailLabel: 'Correo electrónico',
    emailPh: 'tu@correo.es',
    sendBtn: 'Continuar',
    sending: 'Verificando…',
    codeTitle: '¡Bienvenida!',
    codeSub: 'Tu código de acceso personal es:',
    saveCode: 'Guarda este código para futuros accesos',
    codeLabel: 'Código de acceso',
    codePh: '— — — — — —',
    verify: 'Entrar',
    verifying: 'Verificando…',
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
    sub: 'Enter your email to continue.',
    emailLabel: 'Email address',
    emailPh: 'your@email.com',
    sendBtn: 'Continue',
    sending: 'Checking…',
    codeTitle: 'Welcome!',
    codeSub: 'Your personal access code is:',
    saveCode: 'Save this code for future access',
    codeLabel: 'Access code',
    codePh: '— — — — — —',
    verify: 'Enter',
    verifying: 'Verifying…',
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
const ROSTER_KEY = 'elbosc-roster-v1';
const loadRoster = () => { try { const s=localStorage.getItem(ROSTER_KEY); if(s) return JSON.parse(s); } catch(e){} return null; };
const saveRoster = (r) => { try { localStorage.setItem(ROSTER_KEY, JSON.stringify(r)); } catch(e){} };

// ── Codi determinista: igual en QUALSEVOL dispositiu per al mateix correu ─────
// L'alumna posa el correu → l'app calcula el codi → el mostra → accés automàtic
const _APP_KEY = 'el-bosc-yoga-2025';
const computeCode = (email) => {
  const s = _APP_KEY + email.toLowerCase().trim();
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) & 0x7fffffff;
  return String(100000 + (h % 900000));
};
const genCode = computeCode; // per als registres nous, usa el codi determinista

const INITIAL_ROSTER = [
  { id:'nuria',  name:'Núria Prat',    initials:'N', accent:'#B8744A', email:'nuria@example.com',  level:'principiant', status:'active',  code:'847293', invitedAt:'12 abr 2025', lastAccess:'Avui' },
  { id:'marta',  name:'Marta Vidal',   initials:'M', accent:'#5A8C42', email:'marta@example.com',  level:'intermedi',   status:'active',  code:'362815', invitedAt:'5 abr 2025',  lastAccess:'Ahir' },
  { id:'joana',  name:'Joana Ferrer',  initials:'J', accent:'#3F7AAA', email:'joana@example.com',  level:'avancat',     status:'active',  code:'591472', invitedAt:'1 mar 2025',  lastAccess:'Fa 2 dies' },
  { id:'aina',   name:'Aina Bosch',    initials:'A', accent:'#D97A2A', email:'aina@example.com',   level:'principiant', status:'invited', code:'743068', invitedAt:'28 abr 2025', lastAccess:'—' },
  { id:'laia',   name:'Laia Tort',     initials:'L', accent:'#7A4A8A', email:'laia@example.com',   level:'intermedi',   status:'active',  code:'219854', invitedAt:'20 mar 2025', lastAccess:'Avui' },
  { id:'roser',  name:'Roser Camps',   initials:'R', accent:'#3D3D8A', email:'roser@example.com',  level:'principiant', status:'revoked', code:'638247', invitedAt:'1 abr 2025',  lastAccess:'Fa 7 dies' },
];

// ── Paleta d'accents per a noves alumnes ────────────────────────────────────
const ACCENT_PALETTE = ['#B8744A','#5A8C42','#3F7AAA','#D97A2A','#7A4A8A','#3D3D8A','#9AAA82','#6E6757'];

// ── Pantalla 1: Introducció del correu ───────────────────────────────────────
const EmailScreen = ({ t, lang, onSend, onAdminTrigger, checkEmail }) => {
  const [email, setEmail] = uSAuth('');
  const [err, setErr] = uSAuth('');
  const tapCount = uRAuth(0);
  const tapTimer = uRAuth(null);

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSend = () => {
    if (!isValid) return;
    const result = checkEmail ? checkEmail(email) : { ok: true };
    if (!result.ok) {
      setErr(result.reason === 'revoked'
        ? { ca:'El teu accés ha estat suspès. Contacta amb la Cèlia.', es:'Tu acceso ha sido suspendido. Contacta con Cèlia.', en:'Your access has been revoked. Contact Cèlia.' }[lang]
        : { ca:'Correu no registrat. Contacta amb la Cèlia.', es:'Correo no registrado. Contacta con Cèlia.', en:'Email not registered. Contact Cèlia.' }[lang]
      );
      return;
    }
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

        <button onClick={handleSend} disabled={!isValid}
          className="yb-btn yb-btn-clay" style={{ width:'100%', opacity: !isValid ? 0.55 : 1, marginBottom: 12 }}>
          {t.sendBtn}
        </button>

      </div>

      <div style={{ height: 36 }}/>
    </div>
  );
};

// ── Pantalla 2: Mostra el codi i accés automàtic ─────────────────────────────
const CodeScreen = ({ t, lang, email, correctCode, onVerified, onBack }) => {
  const [digits, setDigits] = uSAuth(['','','','','','']);
  const [ready, setReady] = uSAuth(false);

  // Auto-omple els quadres dígit a dígit i entra automàticament
  uEAuth(() => {
    if (!correctCode || correctCode.length < 6) return;
    const chars = correctCode.split('');
    let i = 0;
    const iv = setInterval(() => {
      if (i < chars.length) {
        const idx = i++;
        setDigits(prev => { const next = [...prev]; next[idx] = chars[idx]; return next; });
      } else {
        clearInterval(iv);
        setReady(true);
        setTimeout(() => onVerified(email, 'student'), 600);
      }
    }, 90);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--paper)', padding:'0 28px' }}>
      {/* Back */}
      <div style={{ paddingTop: 56, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background:'transparent', border:'none', cursor:'pointer', padding: 4 }}>
          <Icon name="back" size={22} color="var(--ink)"/>
        </button>
      </div>

      {/* Icon */}
      <div style={{ display:'flex', justifyContent:'center', marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius:'50%', background:'color-mix(in srgb, var(--leaf) 18%, var(--cream))',
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name="shield" size={28} color="var(--leaf-deep)"/>
        </div>
      </div>

      <h1 style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize: 32, color:'var(--ink)', textAlign:'center', marginBottom: 6 }}>
        {t.codeTitle}
      </h1>
      <p style={{ fontFamily:'var(--sans)', fontSize: 13, color:'var(--accent)', textAlign:'center', marginBottom: 28, fontWeight: 500 }}>
        {email}
      </p>

      {/* Codi en gran */}
      <div style={{ textAlign:'center', marginBottom: 6 }}>
        <div style={{ fontFamily:'var(--sans)', fontSize: 11, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--ink-soft)', marginBottom: 10 }}>
          {t.codeSub}
        </div>
        <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize: 46, letterSpacing:'0.22em', color:'var(--ink)', lineHeight: 1 }}>
          {correctCode}
        </div>
        <div style={{ fontFamily:'var(--sans)', fontSize: 11, color:'var(--ink-soft)', marginTop: 8 }}>
          {t.saveCode}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}/>

      {/* Quadres animats */}
      <div style={{ display:'flex', gap: 8, justifyContent:'center', marginBottom: 28 }}>
        {digits.map((d, i) => (
          <div key={i}
            style={{ width: 44, height: 54, display:'flex', alignItems:'center', justifyContent:'center',
                     border: '2px solid ' + (d ? 'var(--leaf-deep)' : 'color-mix(in srgb, var(--ink) 10%, transparent)'),
                     borderRadius: 14, fontFamily:'var(--serif)', fontSize: 26, color:'var(--ink)',
                     background: d ? 'color-mix(in srgb, var(--leaf) 10%, var(--cream))' : 'var(--paper)',
                     transition:'all .12s' }}>
            {d}
          </div>
        ))}
      </div>

      <button onClick={() => onVerified(email, 'student')}
        className="yb-btn yb-btn-clay" style={{ width:'100%' }}>
        {ready ? t.verify : t.verifying}
      </button>
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
const AdminPanel = ({ t, lang, onClose, onEnterAsTeacher, roster, setRoster }) => {
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
      code: genCode(newEmail.trim().toLowerCase()),
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
                  {/* Code */}
                  {s.email && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6, flexWrap:'wrap' }}>
                      <span style={{ fontFamily:'var(--sans)', fontSize:12, color:'var(--ink-soft)' }}>{({ca:'Codi:',es:'Código:',en:'Code:'})[lang]}</span>
                      <span style={{ fontFamily:'var(--serif)', fontSize:16, letterSpacing:'0.25em', color:'var(--ink)', fontStyle:'italic' }}>{computeCode(s.email.toLowerCase())}</span>
                      <button onClick={()=>{
                        const base = window.location.origin + window.location.pathname;
                        const code = computeCode(s.email.toLowerCase());
                        const inv  = btoa(`${s.email}|${code}|${s.name}`);
                        const url  = `${base}?inv=${inv}`;
                        const msg  = {
                          ca:`El Bosc Ioga 🌿\n\nHola ${s.name}!\nPer entrar a l'app:\n1. Obre: ${base}\n2. Posa el teu correu: ${s.email}\nEl teu codi: ${code}\n\nAccés directe: ${url}`,
                          es:`El Bosc Ioga 🌿\n\n¡Hola ${s.name}!\nPara entrar en la app:\n1. Abre: ${base}\n2. Pon tu correo: ${s.email}\nTu código: ${code}\n\nAcceso directo: ${url}`,
                          en:`El Bosc Ioga 🌿\n\nHi ${s.name}!\nTo enter the app:\n1. Open: ${base}\n2. Enter your email: ${s.email}\nYour code: ${code}\n\nDirect link: ${url}`,
                        }[lang] || '';
                        window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
                      }}
                        style={{ padding:'3px 10px', borderRadius:999, border:'1px solid color-mix(in srgb, var(--accent) 40%, transparent)', background:'color-mix(in srgb, var(--accent) 8%, transparent)', color:'var(--accent)', fontFamily:'var(--sans)', fontSize:10, cursor:'pointer' }}>
                        {({ca:'Enviar per WhatsApp',es:'Enviar por WhatsApp',en:'Send via WhatsApp'})[lang]}
                      </button>
                    </div>
                  )}
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
  const [studentCode, setStudentCode] = uSAuth('');

  // Roster persistent en localStorage
  const [roster, setRosterState] = uSAuth(() => loadRoster() || INITIAL_ROSTER);
  const setRoster = (updater) => {
    setRosterState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveRoster(next);
      return next;
    });
  };

  const checkEmail = (email) => {
    const em = email.trim().toLowerCase();
    // Únic cas de bloqueig: accés revocat per la Cèlia al panell admin
    // (el roster NOMÉS existeix al dispositiu de la Cèlia, per la resta d'alumnes
    //  el roster estarà buit i NO s'ha de bloquejar l'entrada)
    const s = roster.find(x => x.email.toLowerCase() === em);
    if (s && s.status === 'revoked') return { ok: false, reason: 'revoked' };
    // Qualsevol correu vàlid pot entrar → el codi es calcula deterministament
    return { ok: true };
  };

  const handleSend = (email) => {
    const em = email.trim().toLowerCase();
    // Codi determinista: sempre el mateix per al mateix correu, en qualsevol dispositiu
    const code = computeCode(em);
    setStudentCode(code);
    setSentEmail(email);
    setScreen('code');
  };
  const handleVerified = (email, role) => onSuccess(email, role);
  const handleAdminTrigger = () => setScreen('pin');
  const handlePinSuccess = () => setScreen('admin');
  const handleEnterAsTeacher = () => onSuccess('celia@elbosc.cat', 'teacher');

  return (
    <div style={{ height:'100%', position:'relative', overflow:'hidden', background:'var(--paper)' }}>
      {screen === 'email' && (
        <EmailScreen t={t} lang={lang} onSend={handleSend} onAdminTrigger={handleAdminTrigger} checkEmail={checkEmail}/>
      )}
      {screen === 'code' && (
        <CodeScreen t={t} lang={lang} email={sentEmail} correctCode={studentCode} onVerified={handleVerified} onBack={()=>setScreen('email')}/>
      )}
      {screen === 'pin' && (
        <PinScreen t={t} adminPin={adminPin} onSuccess={handlePinSuccess} onClose={()=>setScreen('email')}/>
      )}
      {screen === 'admin' && (
        <AdminPanel t={t} lang={lang} roster={roster} setRoster={setRoster} onClose={()=>setScreen('email')} onEnterAsTeacher={handleEnterAsTeacher}/>
      )}
    </div>
  );
};

window.AuthGate = AuthGate;
