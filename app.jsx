// app.jsx — App principal: estat global, accés, navegació

const { useState: uSA, useEffect: uEA, useMemo: uMA, useRef: uRA } = React;

// Perfil neutre: el real ve del qüestionari desat al compte
const DEFAULT_PROFILE = {
  name: '',
  age: 35, gender: '', height: 165, weight: 60,
  lifestyle: 'Moderat', sleep: 7, stress: 5,
  level: 'principiant', years: 0, style: 'Hatha',
  meditation: 'Cap', pranayama: 'Cap',
  flexibility: 5, strength: 5, balance: 5,
  currentInjuries: [], pastInjuries: [], conditions: [],
  goals: [], focusZones: [], avoidZones: [],
  duration: 30, frequency: 3, timeOfDay: 'Matí',
  material: ['Estoreta'], space: 'Mitjà',
};

const DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "bosc",
  "mode": "light",
  "typeface": "cormorant",
  "density": "normal",
  "lang": "ca",
  "illustrationStyle": "line",
  "stage": "auth",
  "role": "student"
}/*EDITMODE-END*/;

// Claus del sistema d'accés antic (codis i PIN). S'esborren en obrir l'app.
const LEGACY_KEYS = ['elbosc-session', 'elbosc-credential', 'elbosc-admin-pin', 'elbosc-roster-v1'];
const LANG_KEY = 'elbosc-lang';
const ls = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
  del: (k) => { try { localStorage.removeItem(k); } catch (e) {} },
};
LEGACY_KEYS.forEach(ls.del);

// ── Xarxa de seguretat: un error de pantalla no deixa l'app en blanc ────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    try { console.error('[El Bosc]', error, info && info.componentStack); } catch (e) {}
    try { window.EBReportError && window.EBReportError(error, info); } catch (e) {}
  }
  render() {
    if (!this.state.error) return this.props.children;
    const lang = ls.get(LANG_KEY, 'ca');
    const T = {
      ca: ['Alguna cosa ha fallat', 'Les teves dades estan a salvo. Torna a obrir aquesta pantalla.', 'Tornar a l\'inici'],
      es: ['Algo ha fallado', 'Tus datos están a salvo. Vuelve a abrir esta pantalla.', 'Volver al inicio'],
      en: ['Something went wrong', 'Your data is safe. Open this screen again.', 'Back to home'],
    }[lang] || [];
    return (
      <div role="alert" style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:32, textAlign:'center', background:'var(--paper)' }}>
        <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:26, color:'var(--ink)' }}>{T[0]}</div>
        <p style={{ fontFamily:'var(--sans)', fontSize:14, color:'var(--ink-soft)', maxWidth:300, lineHeight:1.5, margin:0 }}>{T[1]}</p>
        <button className="yb-btn yb-btn-clay" onClick={() => { this.setState({ error: null }); this.props.onReset && this.props.onReset(); }}>{T[2]}</button>
      </div>
    );
  }
}

function App() {
  const isProd = typeof IS_PROD !== 'undefined' && IS_PROD;
  const [tweaks, setTweak] = useTweaks({ ...DEFAULTS, lang: ls.get(LANG_KEY, DEFAULTS.lang) });
  const lang = tweaks.lang || 'ca';
  const t = I18N[lang] || I18N.ca;

  // auth | loading | revoked | missing | error | welcome | quiz | app | practice
  const [stage, setStage] = uSA(isProd ? 'loading' : (tweaks.stage || 'auth'));
  const [tab, setTab] = uSA('home');
  const [account, setAccount] = uSA(null);   // { userId, email, name, role, status, data }
  const [profile, setProfile] = uSA(DEFAULT_PROFILE);
  const [invite] = uSA(() => (window.readInvite ? window.readInvite() : null));
  const [showStudents, setShowStudents] = uSA(false);
  const [practiceLog, setPracticeLog] = uSA([]);
  const stats = uMA(() => window.EBBackend ? window.EBBackend.practiceStats(practiceLog) : { streak: 0, total: 0, minutes: 0, thisWeek: 0 }, [practiceLog]);
  const role = isProd ? ((account && account.role) || 'student') : (tweaks.role || 'student');

  const [poseDetail, setPoseDetail] = uSA(null);
  const [dueNotes, setDueNotes] = uSA([]);
  const [theme, setTheme] = uSA(() => ls.get('elbosc-theme', 'bosc'));
  const changeTheme = (v) => { ls.set('elbosc-theme', v); setTheme(v); };
  const [posesVersion, setPosesVersion] = uSA(0);
  const [textSize, setTextSize] = uSA(() => ls.get('elbosc-textsize', 'm'));
  const changeTextSize = (v) => { ls.set('elbosc-textsize', v); setTextSize(v); };

  const setLang = (l) => { ls.set(LANG_KEY, l); setTweak('lang', l); };

  // Només en mode disseny: el panell Tweaks pot forçar l'etapa
  uEA(() => { if (!isProd && tweaks.stage) setStage(tweaks.stage); }, [tweaks.stage]);

  // ── Accés: la sessió de Supabase i el compte del servidor manen ──────────
  const loadSeq = uRA(0);
  const enterWith = async (session) => {
    const seq = ++loadSeq.current;
    if (!session) { setAccount(null); setStage('auth'); return; }
    setStage(s => (s === 'app' || s === 'practice') ? s : 'loading');
    try {
      const acc = await window.EBBackend.loadAccount(session);
      if (seq !== loadSeq.current) return;
      setAccount(acc);
      if (acc.status === 'revoked' || acc.status === 'missing') { setStage(acc.status); return; }
      const saved = acc.data && acc.data.profile;
      const name = acc.name || (saved && saved.name) || (invite && invite.email === acc.email ? invite.name : '') || '';
      setProfile({ ...DEFAULT_PROFILE, ...(saved || {}), name });
      setPracticeLog(window.EBBackend.readPracticeLog(acc.userId));
      window.EBBackend.refreshPractice(acc.userId).then(log => { if (seq === loadSeq.current) setPracticeLog(log); }).catch(() => {});
      if (window.EBCatalog) window.EBCatalog.sync(acc.role).then(changed => { if (changed) setPosesVersion(v => v + 1); });
      // Treu ?inv= i restes de l'enllaç màgic de la barra d'adreces
      try { if (window.location.search || window.location.hash) history.replaceState(null, '', window.location.pathname); } catch (e) {}
      if (acc.role === 'teacher') { setStage(s => s === 'practice' ? s : 'app'); setTab(tb => tb === 'home' ? 'messages' : tb); return; }
      setStage(s => (s === 'app' || s === 'practice') ? s : (acc.data && acc.data.quizDone ? 'app' : 'welcome'));
    } catch (e) {
      if (seq !== loadSeq.current) return;
      setStage('error');
    }
  };

  uEA(() => {
    if (!isProd) return;
    if (!window.EBBackend || !window.EBBackend.available()) { setStage('auth'); return; }
    let alive = true;
    window.EBBackend.getSession().then(s => { if (alive) enterWith(s); }).catch(() => alive && setStage('auth'));
    const off = window.EBBackend.onAuthChange((event, session) => {
      if (event === 'SIGNED_IN') enterWith(session);
      if (event === 'SIGNED_OUT') { setAccount(null); setStage('auth'); }
    });
    return () => { alive = false; off(); };
  }, []);

  // En recuperar la connexió, envia el que s'hagi fet sense xarxa
  uEA(() => {
    if (!account) return;
    const onOnline = () => {
      window.EBBackend.refreshPractice(account.userId).then(setPracticeLog).catch(() => {});
      if (window.EBCatalog) window.EBCatalog.sync(account.role).then(changed => { if (changed) setPosesVersion(v => v + 1); });
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [account && account.userId, account && account.role]);

  const retry = () => { window.EBBackend.getSession().then(enterWith).catch(() => setStage('error')); };
  const logout = async () => {
    await window.EBBackend.signOut();
    setAccount(null); setProfile(DEFAULT_PROFILE); setPracticeLog([]); setTab('home'); setStage('auth');
  };
  const deleteAccount = async () => {
    await window.EBBackend.deleteAccount();
    setAccount(null); setProfile(DEFAULT_PROFILE); setPracticeLog([]); setTab('home'); setStage('auth');
  };
  const completePractice = (result) => {
    setStage('app');
    if (!account || !result) return;
    window.EBBackend.logPractice(account.userId, result).finally(() => setPracticeLog(window.EBBackend.readPracticeLog(account.userId)));
  };
  const hasConsent = () => !isProd || !!(account && account.data && account.data.consent);

  // Desa el perfil al compte (agrupa canvis seguits, p. ex. en escriure el nom)
  const saveTimer = uRA(null);
  const accountRef = uRA(account);
  accountRef.current = account;
  const persistProfile = (next, extra) => {
    const acc = accountRef.current;
    if (!acc || !isProd) return;
    const data = { ...(acc.data || {}), profile: next, ...(extra || {}) };
    const patch = { data, name: next.name || '' };
    accountRef.current = { ...acc, ...patch };
    setAccount(accountRef.current);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      window.EBBackend.saveProfile(acc.userId, patch).catch(() => {});
    }, extra ? 0 : 800);
  };

  // Avisos del calendari: revisa notes vençudes (a l'obrir i cada 20s)
  uEA(() => {
    const check = () => {
      try {
        const store = window.EBNotes; if (!store) return;
        const all = store.load();
        const nowTs = Date.now();
        const due = all.filter(n => !n.notifiedAt && store.dateOf(n).getTime() <= nowTs);
        if (due.length) {
          const dueIds = new Set(due.map(n => n.id));
          store.save(all.map(n => dueIds.has(n.id) ? { ...n, notifiedAt: nowTs } : n));
          setDueNotes(prev => [...prev, ...due]);
        }
      } catch (e) {}
    };
    check();
    const iv = setInterval(check, 20000);
    return () => clearInterval(iv);
  }, []);

  const asanas = uMA(() => (window.EBPoses ? window.EBPoses.effective() : ASANAS), [posesVersion]);
  const sequence = uMA(() => generateSequence(profile, asanas), [profile, asanas]);

  // Apply theme attributes to root
  uEA(() => {
    const root = document.documentElement;
    root.setAttribute('data-palette', theme || 'bosc');
    root.setAttribute('data-mode', tweaks.mode || 'light');
    root.setAttribute('data-typeface', tweaks.typeface || 'cormorant');
    root.setAttribute('data-density', tweaks.density || 'normal');
    root.setAttribute('data-textsize', textSize || 'm');
    root.setAttribute('lang', lang);
  }, [theme, textSize, tweaks.mode, tweaks.typeface, tweaks.density, lang]);

  const goHome = () => { setPoseDetail(null); setShowStudents(false); setTab('home'); if (stage === 'practice') setStage('app'); };

  const appContent = (
    <div className="yb-app" style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <ErrorBoundary onReset={goHome}>
      {stage === 'loading' && <AccessScreen kind="loading" lang={lang}/>}
      {(stage === 'revoked' || stage === 'missing') && <AccessScreen kind={stage} lang={lang} onLogout={logout}/>}
      {stage === 'error' && <AccessScreen kind="error" lang={lang} onRetry={retry} onLogout={logout}/>}
      {stage === 'auth' && <AuthGate lang={lang} invite={invite}/>}
      {stage === 'welcome' && (
        <Welcome t={t} lang={lang} setLang={setLang} onStart={() => setStage(hasConsent() ? 'quiz' : 'consent')}/>
      )}
      {stage === 'consent' && (
        <ConsentScreen lang={lang} onBack={() => setStage('welcome')}
          onAccept={(consent) => { persistProfile(profile, { consent }); setStage('quiz'); }}/>
      )}
      {stage === 'quiz' && (
        <Questionnaire t={t} profile={profile} setProfile={setProfile}
          onBack={() => setStage('welcome')}
          onComplete={() => { persistProfile(profile, { quizDone: true }); setStage('app'); setTab('home'); }}/>
      )}
      {stage === 'app' && (
        <>
          {tab === 'home' && <Dashboard t={t} profile={profile} sequence={sequence} lang={lang}
            role={role}
            theme={theme} onChangeTheme={changeTheme}
            textSize={textSize} onChangeTextSize={changeTextSize}
            onOpenStudents={() => setShowStudents(true)}
            onRedoQuiz={() => setStage(hasConsent() ? 'quiz' : 'consent')}
            stats={stats}
            onExportData={() => window.EBBackend.exportData(account)}
            onDeleteAccount={isProd && role !== 'teacher' ? deleteAccount : null}
            asanas={asanas} onPosesChanged={() => setPosesVersion(v => v + 1)}
            onStartPractice={() => setStage('practice')}
            onOpenPose={(p) => setPoseDetail(p)}
            illustrationStyle={tweaks.illustrationStyle}
            onChangeName={(nm) => { const next = { ...profile, name: nm }; setProfile(next); persistProfile(next); }}
            onLogout={logout}/>}
          {tab === 'library' && <Library t={t} lang={lang} asanas={asanas}
            onOpenPose={(p) => setPoseDetail(p)} illustrationStyle={tweaks.illustrationStyle}/>}
          {tab === 'calendar' && <Calendar t={t} lang={lang} profile={profile}/>}
          {tab === 'journal' && <Journal t={t} lang={lang}/>}
          {tab === 'messages' && <Chat t={t} lang={lang} role={role} asanas={asanas} account={isProd ? account : null}/>}
          <TabBar active={tab} setActive={setTab} t={t} role={role}/>
          {poseDetail && <PoseDetail t={t} lang={lang} asana={poseDetail} onClose={() => setPoseDetail(null)} illustrationStyle={tweaks.illustrationStyle}/>}
          {showStudents && role === 'teacher' && <StudentsPanel lang={lang} onClose={() => setShowStudents(false)}/>}
        </>
      )}
      {stage === 'practice' && (
        <PracticeMode t={t} sequence={sequence} lang={lang}
          illustrationStyle={tweaks.illustrationStyle}
          onExit={() => setStage('app')}
          onComplete={completePractice}/>
      )}
      </ErrorBoundary>
    </div>
  );

  return (
    <>
      {isProd ? (
        <div className="yb-shell-wrap">
          {appContent}
        </div>
      ) : (
        <IOSDevice>
          {appContent}
        </IOSDevice>
      )}
      {!isProd && (
        <TweaksPanel title="Tweaks">
          <TweakSection title="Estat de l'app">
            <TweakRadio value={tweaks.stage} onChange={v => setTweak('stage', v)}
              options={[
                { value: 'auth', label: 'Accés' },
                { value: 'welcome', label: 'Inici' },
                { value: 'quiz', label: 'Qüestionari' },
                { value: 'app', label: 'App' },
                { value: 'practice', label: 'Pràctica' },
              ]}/>
          </TweakSection>
          <TweakSection title="Aparença">
            <TweakRadio label="Paleta" value={tweaks.palette} onChange={v => setTweak('palette', v)}
              options={[
                { value: 'bosc', label: 'Bosc' },
                { value: 'sage', label: 'Sàlvia' },
                { value: 'ocean', label: 'Oceà' },
              ]}/>
            <TweakRadio label="Mode" value={tweaks.mode} onChange={v => setTweak('mode', v)}
              options={[
                { value: 'light', label: 'Clar' },
                { value: 'dark', label: 'Fosc' },
              ]}/>
            <TweakRadio label="Tipografia" value={tweaks.typeface} onChange={v => setTweak('typeface', v)}
              options={[
                { value: 'cormorant', label: 'Cormorant' },
                { value: 'garamond', label: 'Garamond' },
                { value: 'fraunces', label: 'Fraunces' },
              ]}/>
            <TweakRadio label="Densitat" value={tweaks.density} onChange={v => setTweak('density', v)}
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'compact', label: 'Compacta' },
              ]}/>
            <TweakRadio label="Il·lustració" value={tweaks.illustrationStyle} onChange={v => setTweak('illustrationStyle', v)}
              options={[
                { value: 'line', label: 'Línia' },
                { value: 'thick', label: 'Gruixuda' },
                { value: 'fill', label: 'Plena' },
              ]}/>
          </TweakSection>
          <TweakSection title="Idioma">
            <TweakRadio value={tweaks.lang} onChange={setLang}
              options={[
                { value: 'ca', label: 'Català' },
                { value: 'es', label: 'Castellà' },
                { value: 'en', label: 'English' },
              ]}/>
          </TweakSection>
          <TweakSection title="Xat · Rol">
            <TweakRadio value={tweaks.role} onChange={v => setTweak('role', v)}
              options={[
                { value: 'student', label: 'Alumna' },
                { value: 'teacher', label: 'Professora' },
              ]}/>
          </TweakSection>
        </TweaksPanel>
      )}
      {dueNotes.length > 0 && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(20,18,14,0.55)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={() => setDueNotes([])}>
          <div role="dialog" aria-modal="true" onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:360, background:'var(--paper)', borderRadius:20, padding:'26px 22px', boxShadow:'0 20px 60px rgba(0,0,0,0.35)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:'color-mix(in srgb, var(--accent) 16%, transparent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name="bell" size={20} color="var(--accent)"/>
              </div>
              <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:22, color:'var(--ink)' }}>{{ca:'Recordatori', es:'Recordatorio', en:'Reminder'}[lang]}</div>
            </div>
            {dueNotes.map(n => (
              <div key={n.id} style={{ padding:'10px 0', borderTop:'1px solid color-mix(in srgb, var(--ink) 8%, transparent)' }}>
                <div style={{ fontFamily:'var(--sans)', fontSize:12, color:'var(--accent)', marginBottom:2 }}>
                  {(() => { try { return window.EBNotes.dateOf(n).toLocaleDateString(lang==='ca'?'ca-ES':lang, { day:'numeric', month:'long' }); } catch(e) { return n.date; } })()} · {n.time}
                </div>
                <div style={{ fontFamily:'var(--sans)', fontSize:15, color:'var(--ink)' }}>{n.text}</div>
              </div>
            ))}
            <button onClick={() => setDueNotes([])} className="yb-btn yb-btn-clay" style={{ width:'100%', marginTop:18 }}>
              {{ca:'D\'acord', es:'De acuerdo', en:'Got it'}[lang]}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
