// components/Auth.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Accés i gestió d'alumnes.
//
//   <AuthGate lang invite />   Correu → Supabase envia enllaç + codi de 6 dígits.
//                              Només s'entra amb el correu verificat.
//   <StudentsPanel lang onClose />  Llista d'alumnes (només professora; la RLS
//                              de la taula members ho garanteix al servidor).
//   <AccessScreen kind lang onLogout onRetry />  Pantalles d'espera, accés
//                              denegat i error.
//
// El rol (alumna/professora) es decideix al servidor: veure
// supabase/migrations/001_acces_i_rols.sql
// ─────────────────────────────────────────────────────────────────────────────

const { useState: uSAuth, useEffect: uEAuth, useRef: uRAuth } = React;

const AUTH_T = {
  ca: {
    headline: 'Entra a El Bosc',
    sub: 'Introdueix el teu correu i t\'enviarem un accés segur.',
    emailLabel: 'Correu electrònic',
    emailPh: 'el.teu@correu.cat',
    sendBtn: 'Enviar accés',
    sending: 'Enviant…',
    sentTitle: 'Mira el teu correu',
    sentSub: 'Hem enviat un missatge a {email}. Obre l\'enllaç o escriu aquí el codi de 6 xifres.',
    codeLabel: 'Codi del correu',
    verify: 'Entrar',
    verifying: 'Comprovant…',
    resend: 'Tornar a enviar',
    resent: 'Enviat de nou.',
    changeEmail: 'Canviar el correu',
    hint: 'No cal contrasenya. Només tu pots obrir el correu.',
    errOffline: 'No hi ha connexió. Torna-ho a provar quan en tinguis.',
    errSend: 'No s\'ha pogut enviar el correu. Espera un minut i torna-ho a provar.',
    errCode: 'Codi incorrecte o caducat. Revisa\'l o demana\'n un de nou.',
    errNoBackend: 'No s\'ha pogut carregar el servei d\'accés. Recarrega la pàgina.',
    loading: 'Obrint El Bosc…',
    blockedTitle: 'Accés no disponible',
    revokedSub: 'El teu accés està en pausa. Si creus que és un error, parla amb la Cèlia.',
    missingSub: 'Aquest correu no és a la llista d\'alumnes. Demana a la Cèlia que t\'hi afegeixi.',
    errorTitle: 'No s\'ha pogut connectar',
    errorSub: 'Comprova la connexió i torna-ho a provar.',
    retry: 'Tornar-ho a provar',
    logout: 'Sortir',
    // Alumnes
    panelTitle: 'Alumnes',
    panelSub: 'Gestió d\'accés · El Bosc',
    addStudent: 'Afegir alumna',
    namePh: 'Nom',
    emailPh2: 'correu@exemple.com',
    invite: 'Afegir',
    cancel: 'Cancel·lar',
    statusActive: 'Activa', statusInvited: 'Convidada', statusRevoked: 'En pausa',
    revoke: 'Posar en pausa', restore: 'Reactivar', delete: 'Eliminar', confirmDelete: 'Segur? Toca de nou',
    sendInvite: 'Enviar per WhatsApp', copyLink: 'Copiar enllaç', copied: 'Copiat',
    invitedAt: 'Afegida el', lastAccess: 'Últim accés',
    noStudents: 'Encara no hi ha cap alumna. Afegeix-ne una amb el botó de sota.',
    levelOpts: ['Principiant', 'Intermedi', 'Avançat'],
    dup: 'Aquest correu ja és a la llista.',
    loadErr: 'No s\'ha pogut carregar la llista.',
    inviteMsg: 'El Bosc Ioga 🌿\n\nHola {name}!\nObre aquest enllaç per entrar a l\'app:\n{url}\n\nT\'arribarà un correu a {email} per confirmar que ets tu.',
  },
  es: {
    headline: 'Entra en El Bosc',
    sub: 'Escribe tu correo y te enviaremos un acceso seguro.',
    emailLabel: 'Correo electrónico',
    emailPh: 'tu@correo.es',
    sendBtn: 'Enviar acceso',
    sending: 'Enviando…',
    sentTitle: 'Mira tu correo',
    sentSub: 'Hemos enviado un mensaje a {email}. Abre el enlace o escribe aquí el código de 6 cifras.',
    codeLabel: 'Código del correo',
    verify: 'Entrar',
    verifying: 'Comprobando…',
    resend: 'Volver a enviar',
    resent: 'Enviado de nuevo.',
    changeEmail: 'Cambiar el correo',
    hint: 'No hace falta contraseña. Solo tú puedes abrir tu correo.',
    errOffline: 'No hay conexión. Vuelve a probar cuando tengas.',
    errSend: 'No se ha podido enviar el correo. Espera un minuto y vuelve a probar.',
    errCode: 'Código incorrecto o caducado. Revísalo o pide uno nuevo.',
    errNoBackend: 'No se ha podido cargar el servicio de acceso. Recarga la página.',
    loading: 'Abriendo El Bosc…',
    blockedTitle: 'Acceso no disponible',
    revokedSub: 'Tu acceso está en pausa. Si crees que es un error, habla con Cèlia.',
    missingSub: 'Este correo no está en la lista de alumnas. Pide a Cèlia que te añada.',
    errorTitle: 'No se ha podido conectar',
    errorSub: 'Comprueba la conexión y vuelve a probar.',
    retry: 'Volver a probar',
    logout: 'Salir',
    panelTitle: 'Alumnas',
    panelSub: 'Gestión de acceso · El Bosc',
    addStudent: 'Añadir alumna',
    namePh: 'Nombre',
    emailPh2: 'correo@ejemplo.com',
    invite: 'Añadir',
    cancel: 'Cancelar',
    statusActive: 'Activa', statusInvited: 'Invitada', statusRevoked: 'En pausa',
    revoke: 'Poner en pausa', restore: 'Reactivar', delete: 'Eliminar', confirmDelete: '¿Seguro? Toca otra vez',
    sendInvite: 'Enviar por WhatsApp', copyLink: 'Copiar enlace', copied: 'Copiado',
    invitedAt: 'Añadida el', lastAccess: 'Último acceso',
    noStudents: 'Aún no hay alumnas. Añade una con el botón de abajo.',
    levelOpts: ['Principiante', 'Intermedio', 'Avanzado'],
    dup: 'Este correo ya está en la lista.',
    loadErr: 'No se ha podido cargar la lista.',
    inviteMsg: 'El Bosc Ioga 🌿\n\n¡Hola {name}!\nAbre este enlace para entrar en la app:\n{url}\n\nTe llegará un correo a {email} para confirmar que eres tú.',
  },
  en: {
    headline: 'Sign in to El Bosc',
    sub: 'Enter your email and we\'ll send you a secure sign-in.',
    emailLabel: 'Email',
    emailPh: 'you@email.com',
    sendBtn: 'Send sign-in',
    sending: 'Sending…',
    sentTitle: 'Check your email',
    sentSub: 'We sent a message to {email}. Open the link or type the 6-digit code here.',
    codeLabel: 'Code from the email',
    verify: 'Sign in',
    verifying: 'Checking…',
    resend: 'Send again',
    resent: 'Sent again.',
    changeEmail: 'Use another email',
    hint: 'No password needed. Only you can open your email.',
    errOffline: 'You\'re offline. Try again when you\'re connected.',
    errSend: 'The email couldn\'t be sent. Wait a minute and try again.',
    errCode: 'Wrong or expired code. Check it or ask for a new one.',
    errNoBackend: 'The sign-in service didn\'t load. Reload the page.',
    loading: 'Opening El Bosc…',
    blockedTitle: 'Access unavailable',
    revokedSub: 'Your access is paused. If you think this is a mistake, talk to Cèlia.',
    missingSub: 'This email isn\'t on the student list. Ask Cèlia to add you.',
    errorTitle: 'Couldn\'t connect',
    errorSub: 'Check your connection and try again.',
    retry: 'Try again',
    logout: 'Sign out',
    panelTitle: 'Students',
    panelSub: 'Access management · El Bosc',
    addStudent: 'Add student',
    namePh: 'Name',
    emailPh2: 'email@example.com',
    invite: 'Add',
    cancel: 'Cancel',
    statusActive: 'Active', statusInvited: 'Invited', statusRevoked: 'Paused',
    revoke: 'Pause access', restore: 'Reactivate', delete: 'Delete', confirmDelete: 'Sure? Tap again',
    sendInvite: 'Send via WhatsApp', copyLink: 'Copy link', copied: 'Copied',
    invitedAt: 'Added on', lastAccess: 'Last access',
    noStudents: 'No students yet. Add one with the button below.',
    levelOpts: ['Beginner', 'Intermediate', 'Advanced'],
    dup: 'This email is already on the list.',
    loadErr: 'The list couldn\'t be loaded.',
    inviteMsg: 'El Bosc Yoga 🌿\n\nHi {name}!\nOpen this link to enter the app:\n{url}\n\nYou\'ll get an email at {email} to confirm it\'s you.',
  },
};

const fmt = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ''));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Enllaç d'invitació: només omple el correu. Mai dóna accés per si sol.
const buildInviteUrl = (email, name) => {
  const base = window.location.origin + window.location.pathname;
  const payload = btoa(unescape(encodeURIComponent(`${email}|${name || ''}`)));
  return `${base}?inv=${encodeURIComponent(payload)}`;
};

const Logo = () => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 12, userSelect:'none' }}>
    <svg viewBox="0 0 80 80" width={72} height={72} aria-hidden="true" style={{ filter:'drop-shadow(0 4px 12px color-mix(in srgb, var(--accent) 25%, transparent))' }}>
      <circle cx="40" cy="40" r="40" fill="color-mix(in srgb, var(--accent) 12%, var(--cream))"/>
      <g stroke="var(--accent)" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <path d="M40 20 Q32 34 32 44 Q32 54 40 58 Q48 54 48 44 Q48 34 40 20z"/>
        <line x1="40" y1="20" x2="40" y2="58"/>
        <path d="M32 36 Q24 30 22 22 Q28 24 32 36z"/>
        <path d="M48 38 Q56 32 58 24 Q52 26 48 38z"/>
      </g>
    </svg>
    <div style={{ fontFamily:'var(--serif)', fontSize: 28, fontStyle:'italic', color:'var(--ink)', letterSpacing:'-0.01em' }}>El Bosc</div>
    <div style={{ fontFamily:'var(--serif)', fontSize: 17, color:'var(--accent)' }}>Ioga personalitzat</div>
  </div>
);

const fieldBox = (hasErr) => ({
  display:'flex', alignItems:'center', gap: 10, background:'var(--cream)', borderRadius: 16,
  border:'1.5px solid ' + (hasErr ? 'var(--accent)' : 'color-mix(in srgb, var(--ink) 10%, transparent)'),
  padding:'12px 16px', marginBottom: 16,
});
const labelStyle = { fontFamily:'var(--sans)', fontSize: 11, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--accent)', marginBottom: 8, display:'block' };
const inputStyle = { flex:1, minWidth:0, border:'none', outline:'none', background:'transparent', fontFamily:'var(--sans)', fontSize: 16, color:'var(--ink)' };

const errText = (t, code) => ({
  offline: t.errOffline, 'no-backend': t.errNoBackend, 'bad-code': t.errCode,
}[code] || t.errSend);

// ── Accés ────────────────────────────────────────────────────────────────────
const AuthGate = ({ lang = 'ca', invite }) => {
  const t = AUTH_T[lang] || AUTH_T.ca;
  const [step, setStep] = uSAuth('email');   // email | code
  const [email, setEmail] = uSAuth((invite && invite.email) || '');
  const [code, setCode] = uSAuth('');
  const [busy, setBusy] = uSAuth(false);
  const [err, setErr] = uSAuth('');
  const [note, setNote] = uSAuth('');

  const isValid = EMAIL_RE.test(email.trim());
  const codeValid = /^\d{6,8}$/.test(code);

  const send = async (resend) => {
    if (!isValid || busy) return;
    setBusy(true); setErr(''); setNote('');
    try {
      await window.EBBackend.sendLoginEmail(email);
      setStep('code');
      if (resend) setNote(t.resent);
    } catch (e) { setErr(errText(t, e.code)); }
    setBusy(false);
  };

  const verify = async () => {
    if (!codeValid || busy) return;
    setBusy(true); setErr('');
    try {
      await window.EBBackend.verifyCode(email, code);
      // L'app reacciona a onAuthStateChange i carrega el compte
    } catch (e) { setErr(errText(t, e.code)); setBusy(false); }
  };

  return (
    <div className="yb-scroll" style={{ height:'100%', overflowY:'auto', display:'flex', flexDirection:'column', background:'var(--paper)', padding:'0 28px' }}>
      <div style={{ paddingTop: 72, paddingBottom: 32 }}><Logo/></div>

      <div style={{ flex: 1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
        {step === 'email' ? (
          <form onSubmit={e => { e.preventDefault(); send(false); }}>
            <h1 style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize: 30, color:'var(--ink)', marginBottom: 8 }}>{t.headline}</h1>
            <p style={{ fontFamily:'var(--sans)', fontSize: 13, color:'var(--ink-soft)', marginBottom: 28, lineHeight: 1.5 }}>{t.sub}</p>
            <label htmlFor="eb-email" style={labelStyle}>{t.emailLabel}</label>
            <div style={fieldBox(!!err)}>
              <Icon name="mail" size={18} color="var(--ink-soft)"/>
              <input id="eb-email" type="email" inputMode="email" autoComplete="email" value={email}
                onChange={e => { setEmail(e.target.value); setErr(''); }}
                placeholder={t.emailPh} autoFocus style={inputStyle}/>
            </div>
            <button type="submit" disabled={!isValid || busy}
              className="yb-btn yb-btn-clay" style={{ width:'100%', opacity: (!isValid || busy) ? 0.55 : 1, marginBottom: 10 }}>
              {busy ? t.sending : t.sendBtn}
            </button>
          </form>
        ) : (
          <form onSubmit={e => { e.preventDefault(); verify(); }}>
            <h1 style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize: 30, color:'var(--ink)', marginBottom: 8 }}>{t.sentTitle}</h1>
            <p style={{ fontFamily:'var(--sans)', fontSize: 13, color:'var(--ink-soft)', marginBottom: 24, lineHeight: 1.5 }}>{fmt(t.sentSub, { email: email.trim() })}</p>
            <label htmlFor="eb-code" style={labelStyle}>{t.codeLabel}</label>
            <div style={fieldBox(!!err)}>
              <Icon name="key" size={18} color="var(--ink-soft)"/>
              <input id="eb-code" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 8)); setErr(''); }}
                placeholder="000000" autoFocus style={{ ...inputStyle, letterSpacing:'0.4em', fontSize: 20 }}/>
            </div>
            <button type="submit" disabled={!codeValid || busy}
              className="yb-btn yb-btn-clay" style={{ width:'100%', opacity: (!codeValid || busy) ? 0.55 : 1, marginBottom: 14 }}>
              {busy ? t.verifying : t.verify}
            </button>
            <div style={{ display:'flex', justifyContent:'space-between', gap: 12 }}>
              <button type="button" onClick={() => { setStep('email'); setCode(''); setErr(''); setNote(''); }}
                style={{ background:'none', border:'none', padding: 4, cursor:'pointer', color:'var(--ink-soft)', fontFamily:'var(--sans)', fontSize: 13 }}>
                {t.changeEmail}
              </button>
              <button type="button" onClick={() => send(true)} disabled={busy}
                style={{ background:'none', border:'none', padding: 4, cursor:'pointer', color:'var(--accent)', fontFamily:'var(--sans)', fontSize: 13 }}>
                {t.resend}
              </button>
            </div>
          </form>
        )}
        <div role="status" aria-live="polite" style={{ fontFamily:'var(--sans)', fontSize:12, color: err ? 'var(--accent)' : 'var(--ink-soft)', textAlign:'center', lineHeight:1.5, minHeight:18, marginTop: 10 }}>
          {err || note || (step === 'email' ? t.hint : '')}
        </div>
      </div>
      <div style={{ height: 36 }}/>
    </div>
  );
};

// ── Pantalles d'estat: carregant, accés denegat, error ──────────────────────
const AccessScreen = ({ kind, lang = 'ca', onLogout, onRetry }) => {
  const t = AUTH_T[lang] || AUTH_T.ca;
  const content = {
    loading: { title: t.loading },
    revoked: { title: t.blockedTitle, sub: t.revokedSub },
    missing: { title: t.blockedTitle, sub: t.missingSub },
    error:   { title: t.errorTitle, sub: t.errorSub },
  }[kind] || { title: t.loading };
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 24, background:'var(--paper)', padding:'0 32px', textAlign:'center' }}>
      <Logo/>
      <div role="status" aria-live="polite">
        <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize: 24, color:'var(--ink)', marginBottom: 8 }}>{content.title}</div>
        {content.sub && <p style={{ fontFamily:'var(--sans)', fontSize: 14, color:'var(--ink-soft)', lineHeight: 1.55, maxWidth: 320, margin:'0 auto' }}>{content.sub}</p>}
      </div>
      {kind !== 'loading' && (
        <div style={{ display:'flex', flexDirection:'column', gap: 10, width:'100%', maxWidth: 300 }}>
          {onRetry && <button onClick={onRetry} className="yb-btn yb-btn-clay" style={{ width:'100%' }}>{t.retry}</button>}
          {onLogout && <button onClick={onLogout} className="yb-btn yb-btn-ghost" style={{ width:'100%' }}>{t.logout}</button>}
        </div>
      )}
    </div>
  );
};

// ── Gestió d'alumnes (professora) ────────────────────────────────────────────
const ACCENT_PALETTE = ['#B8744A','#5A8C42','#3F7AAA','#D97A2A','#7A4A8A','#3D3D8A','#9AAA82','#6E6757'];
const accentFor = (email) => { let h = 0; for (const c of email) h = (h * 31 + c.charCodeAt(0)) >>> 0; return ACCENT_PALETTE[h % ACCENT_PALETTE.length]; };

const StudentsPanel = ({ lang = 'ca', onClose }) => {
  const t = AUTH_T[lang] || AUTH_T.ca;
  const locale = lang === 'ca' ? 'ca-ES' : lang;
  const [members, setMembers] = uSAuth(null);   // null = carregant
  const [loadErr, setLoadErr] = uSAuth('');
  const [addOpen, setAddOpen] = uSAuth(false);
  const [newName, setNewName] = uSAuth('');
  const [newEmail, setNewEmail] = uSAuth('');
  const [newLevel, setNewLevel] = uSAuth('principiant');
  const [formErr, setFormErr] = uSAuth('');
  const [busy, setBusy] = uSAuth(false);
  const [confirmDel, setConfirmDel] = uSAuth(null);
  const [copied, setCopied] = uSAuth(null);

  const statusColor = { active:'var(--leaf-deep)', invited:'var(--accent)', revoked:'var(--ink-soft)' };
  const statusLabel = { active: t.statusActive, invited: t.statusInvited, revoked: t.statusRevoked };
  const levelKeys = ['principiant','intermedi','avancat'];

  const reload = async () => {
    setLoadErr('');
    try { setMembers(await window.EBBackend.listMembers()); }
    catch (e) { setLoadErr(e.code === 'offline' ? t.errOffline : t.loadErr); setMembers(m => m || []); }
  };
  uEAuth(() => { reload(); }, []);

  const run = async (fn) => {
    setBusy(true);
    try { await fn(); await reload(); }
    catch (e) { setLoadErr(e.code === 'offline' ? t.errOffline : t.loadErr); }
    setBusy(false);
  };

  const add = async () => {
    const em = newEmail.trim().toLowerCase();
    if (!newName.trim() || !EMAIL_RE.test(em)) return;
    setBusy(true); setFormErr('');
    try {
      await window.EBBackend.addMember({ email: em, name: newName, level: newLevel });
      setNewName(''); setNewEmail(''); setAddOpen(false);
      await reload();
    } catch (e) {
      setFormErr(e.code === 'duplicate' ? t.dup : e.code === 'offline' ? t.errOffline : t.loadErr);
    }
    setBusy(false);
  };

  const inviteText = (s) => fmt(t.inviteMsg, { name: s.name, email: s.email, url: buildInviteUrl(s.email, s.name) });
  const copy = async (s) => {
    try { await navigator.clipboard.writeText(buildInviteUrl(s.email, s.name)); setCopied(s.email); setTimeout(() => setCopied(null), 1800); } catch (e) {}
  };
  const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString(locale, { day:'numeric', month:'short', year:'numeric' }); } catch (e) { return ''; } };
  const pill = (border, color) => ({ padding:'5px 10px', borderRadius:999, border:`1px solid ${border}`, background:'transparent', color, fontFamily:'var(--sans)', fontSize:11, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4 });
  const inp = { padding:'10px 14px', borderRadius:12, border:'1.5px solid color-mix(in srgb, var(--ink) 12%, transparent)', fontFamily:'var(--sans)', fontSize:15, background:'var(--cream)', outline:'none', color:'var(--ink)', minWidth:0 };

  return (
    <div style={{ position:'fixed', inset:0, background:'var(--paper)', zIndex:9999, display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'calc(env(safe-area-inset-top, 0px) + 20px) 20px 12px', borderBottom:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:40, height:40, borderRadius:'50%', background:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name="shield" size={18} color="var(--cream)"/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:'var(--sans)', fontSize:10, letterSpacing:'0.2em', color:'var(--accent)', textTransform:'uppercase' }}>{t.panelSub}</div>
          <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:22, color:'var(--ink)' }}>{t.panelTitle}{members ? ` (${members.length})` : ''}</div>
        </div>
        <button onClick={onClose} aria-label={t.cancel} style={{ background:'transparent', border:'none', cursor:'pointer', padding:6 }}>
          <Icon name="close" size={20} color="var(--ink-soft)"/>
        </button>
      </div>

      <div className="yb-scroll" style={{ flex:1, overflowY:'auto', padding:'10px 14px' }}>
        {loadErr && <div role="alert" style={{ fontFamily:'var(--sans)', fontSize:13, color:'var(--accent)', padding:'10px', textAlign:'center' }}>{loadErr}</div>}
        {members === null && <div style={{ textAlign:'center', padding:'32px 0', fontFamily:'var(--sans)', fontSize:13, color:'var(--ink-soft)' }}>…</div>}
        {members && members.length === 0 && !loadErr && (
          <div style={{ textAlign:'center', padding:'32px 12px', fontFamily:'var(--sans)', fontSize:13, color:'var(--ink-soft)', lineHeight:1.5 }}>{t.noStudents}</div>
        )}
        {(members || []).map(s => (
          <div key={s.email} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'12px 10px', borderRadius:14, marginBottom:4, opacity: s.status==='revoked' ? 0.65 : 1 }}>
            <div aria-hidden="true" style={{ width:40, height:40, borderRadius:'50%', background: s.status==='revoked' ? 'var(--sand)' : accentFor(s.email), color:'var(--cream)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--serif)', fontSize:17, flexShrink:0 }}>
              {(s.name || s.email).charAt(0).toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                <span style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:16 }}>{s.name || s.email}</span>
                <span style={{ fontFamily:'var(--sans)', fontSize:10, padding:'2px 8px', borderRadius:999, background:`color-mix(in srgb, ${statusColor[s.status]} 16%, transparent)`, color: statusColor[s.status], letterSpacing:'0.05em' }}>
                  {statusLabel[s.status]}
                </span>
              </div>
              <div style={{ fontFamily:'var(--sans)', fontSize:11, color:'var(--ink-soft)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.email}</div>
              <div style={{ fontFamily:'var(--sans)', fontSize:10, color:'var(--ink-soft)', marginTop:3, display:'flex', gap:10, flexWrap:'wrap' }}>
                <span>{t.levelOpts[Math.max(0, levelKeys.indexOf(s.level))]}</span>
                <span>{t.invitedAt} {fmtDate(s.invited_at)}</span>
                {s.last_access && <span>{t.lastAccess}: {fmtDate(s.last_access)}</span>}
              </div>
              <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
                {s.status !== 'revoked' && (
                  <a href={'https://wa.me/?text=' + encodeURIComponent(inviteText(s))} target="_blank" rel="noopener"
                    style={{ ...pill('color-mix(in srgb, var(--accent) 40%, transparent)', 'var(--accent)'), textDecoration:'none' }}>
                    <Icon name="send" size={10} color="currentColor"/> {t.sendInvite}
                  </a>
                )}
                {s.status !== 'revoked' && (
                  <button onClick={() => copy(s)} style={pill('color-mix(in srgb, var(--ink) 15%, transparent)', 'var(--ink-soft)')}>
                    {copied === s.email ? t.copied : t.copyLink}
                  </button>
                )}
                {s.status !== 'revoked' ? (
                  <button disabled={busy} onClick={() => run(() => window.EBBackend.setMemberStatus(s.email, 'revoked'))} style={pill('color-mix(in srgb, var(--accent) 40%, transparent)', 'var(--accent)')}>
                    <Icon name="lock" size={10} color="currentColor"/> {t.revoke}
                  </button>
                ) : (
                  <button disabled={busy} onClick={() => run(() => window.EBBackend.setMemberStatus(s.email, 'active'))} style={pill('color-mix(in srgb, var(--leaf) 50%, transparent)', 'var(--leaf-deep)')}>
                    <Icon name="refresh" size={10} color="currentColor"/> {t.restore}
                  </button>
                )}
                <button disabled={busy}
                  onClick={() => { if (confirmDel === s.email) { setConfirmDel(null); run(() => window.EBBackend.removeMember(s.email)); } else { setConfirmDel(s.email); setTimeout(() => setConfirmDel(c => c === s.email ? null : c), 3000); } }}
                  style={pill('color-mix(in srgb, var(--ink) 15%, transparent)', confirmDel === s.email ? 'var(--accent)' : 'var(--ink-soft)')}>
                  <Icon name="trash" size={10} color="currentColor"/> {confirmDel === s.email ? t.confirmDelete : t.delete}
                </button>
              </div>
            </div>
          </div>
        ))}
        <div style={{ height:8 }}/>
      </div>

      {addOpen ? (
        <form onSubmit={e => { e.preventDefault(); add(); }}
          style={{ padding:'14px 18px calc(env(safe-area-inset-bottom, 0px) + 14px)', borderTop:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)', display:'flex', flexDirection:'column', gap:10 }}>
          <input id="eb-new-name" aria-label={t.namePh} value={newName} onChange={e => setNewName(e.target.value)} placeholder={t.namePh} style={inp}/>
          <input id="eb-new-email" aria-label={t.emailPh2} value={newEmail} onChange={e => { setNewEmail(e.target.value); setFormErr(''); }} placeholder={t.emailPh2} type="email" autoCapitalize="none" style={inp}/>
          <select id="eb-new-level" aria-label="level" value={newLevel} onChange={e => setNewLevel(e.target.value)} style={inp}>
            {levelKeys.map((lk, i) => <option key={lk} value={lk}>{t.levelOpts[i]}</option>)}
          </select>
          {formErr && <div role="alert" style={{ fontFamily:'var(--sans)', fontSize:12, color:'var(--accent)' }}>{formErr}</div>}
          <div style={{ display:'flex', gap:8 }}>
            <button type="submit" disabled={busy || !newName.trim() || !EMAIL_RE.test(newEmail.trim())} className="yb-btn yb-btn-clay" style={{ flex:1, padding:'11px' }}>
              <Icon name="user-plus" size={14} color="var(--cream)"/> {t.invite}
            </button>
            <button type="button" onClick={() => setAddOpen(false)} className="yb-btn yb-btn-ghost" style={{ flex:1, padding:'11px' }}>{t.cancel}</button>
          </div>
        </form>
      ) : (
        <div style={{ padding:'10px 18px calc(env(safe-area-inset-bottom, 0px) + 10px)', borderTop:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)' }}>
          <button onClick={() => setAddOpen(true)} className="yb-btn yb-btn-primary" style={{ width:'100%', padding:'12px' }}>
            <Icon name="user-plus" size={14} color="currentColor"/> {t.addStudent}
          </button>
        </div>
      )}
    </div>
  );
};

// Llegeix ?inv= (format nou "correu|nom" o antic "correu|codi|nom" / "correu:codi").
// Només en treu el correu i el nom per omplir el formulari.
const readInvite = () => {
  try {
    const raw = new URLSearchParams(window.location.search).get('inv');
    if (!raw) return null;
    let dec;
    try { dec = decodeURIComponent(escape(atob(raw))); } catch (e) { dec = atob(raw); }
    const parts = dec.indexOf('|') !== -1 ? dec.split('|') : dec.split(':');
    const email = (parts[0] || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return null;
    const name = (parts.length >= 3 ? parts[2] : (parts.length === 2 && !/^\d{6}$/.test(parts[1]) ? parts[1] : '')).trim();
    return { email, name };
  } catch (e) { return null; }
};

Object.assign(window, { AuthGate, AccessScreen, StudentsPanel, readInvite });
