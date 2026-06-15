// app.jsx — App principal: estat global, navegació, integració Tweaks

const { useState: uSA, useEffect: uEA, useMemo: uMA } = React;

// ── Processa l'enllaç d'invitació (?inv=base64) ─────────────────────────────
(function () {
  try {
    const inv = new URLSearchParams(window.location.search).get('inv');
    if (inv) {
      const dec = atob(inv);
      const i = dec.indexOf(':');
      const email = dec.slice(0, i).toLowerCase().trim();
      const code  = dec.slice(i + 1).trim();
      if (email && code) {
        localStorage.setItem('elbosc-credential', JSON.stringify({ email, code }));
        localStorage.setItem('elbosc-session', JSON.stringify({ email, role: 'student' }));
        window.__elBoscInvite = { email, code };
        // NO netegem l'URL: el link guardat als marcadors funciona sempre
      }
    }
  } catch (e) {}
})();

const DEFAULT_PROFILE = {
  name: 'Núria',
  age: 38, gender: 'Dona', height: 165, weight: 60,
  lifestyle: 'Moderat', sleep: 7, stress: 6,
  level: 'principiant', years: 1, style: 'Hatha',
  meditation: 'Alguna', pranayama: 'Cap',
  flexibility: 5, strength: 5, balance: 6,
  currentInjuries: ['Esquena baixa'], pastInjuries: [], conditions: [],
  goals: ['Relaxació', 'Flexibilitat', 'Dormir millor'],
  focusZones: ['Esquena', 'Malucs'], avoidZones: [],
  duration: 30, frequency: 3, timeOfDay: 'Matí',
  material: ['Estoreta', 'Blocs', 'Coixí'], space: 'Mitjà',
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

function App() {
  const isProd = typeof IS_PROD !== 'undefined' && IS_PROD;
  const [tweaks, setTweak] = useTweaks(DEFAULTS);
  const lang = tweaks.lang || 'ca';
  const t = I18N[lang];

  const [stage, setStage] = uSA(() => {
    if (window.__elBoscInvite) return 'welcome'; // enllaç d'invitació: accés directe
    try {
      const sess = JSON.parse(localStorage.getItem('elbosc-session') || 'null');
      if (sess?.role) return sess.role === 'teacher' ? 'app' : 'app';
    } catch (e) {}
    return tweaks.stage || 'auth';
  }); // auth | welcome | quiz | app | practice
  const [tab, setTab] = uSA('home');
  const [profile, setProfile] = uSA(() => {
    // Nom real de l'alumna: de l'invite link o de la sessió guardada
    try {
      const inv  = window.__elBoscInvite;
      if (inv?.name) return { ...DEFAULT_PROFILE, name: inv.name };
      const sess = JSON.parse(localStorage.getItem('elbosc-session') || 'null');
      if (sess?.name) return { ...DEFAULT_PROFILE, name: sess.name };
    } catch (e) {}
    return DEFAULT_PROFILE;
  });
  const [poseDetail, setPoseDetail] = uSA(null);

  // React to tweak stage change (only in dev mode)
  uEA(() => { if (!isProd && tweaks.stage) setStage(tweaks.stage); }, [tweaks.stage]);

  // Restaura el rol de sessió guardada
  uEA(() => {
    try {
      const sess = JSON.parse(localStorage.getItem('elbosc-session') || 'null');
      if (sess?.role) setTweak('role', sess.role);
      if (window.__elBoscInvite) { setTweak('role', 'student'); window.__elBoscInvite = null; }
    } catch (e) {}
  }, []);

  const sequence = uMA(() => generateSequence(profile, ASANAS), [profile]);

  // Apply theme attributes to root
  uEA(() => {
    const root = document.documentElement;
    root.setAttribute('data-palette', tweaks.palette || 'bosc');
    root.setAttribute('data-mode', tweaks.mode || 'light');
    root.setAttribute('data-typeface', tweaks.typeface || 'cormorant');
    root.setAttribute('data-density', tweaks.density || 'normal');
  }, [tweaks.palette, tweaks.mode, tweaks.typeface, tweaks.density]);

  const setLang = (l) => setTweak('lang', l);

  const appContent = (
    <div className="yb-app" style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      {stage === 'auth' && (
        <AuthGate lang={lang} adminPin="1234"
          onSuccess={(email, role) => {
            localStorage.setItem('elbosc-session', JSON.stringify({ email, role }));
            if (role === 'teacher') {
              setTweak('role', 'teacher');
              setStage('app'); setTab('messages');
            } else {
              setTweak('role', 'student');
              setStage('welcome');
            }
          }}/>
      )}
      {stage === 'welcome' && (
        <Welcome t={t} lang={lang} setLang={setLang} onStart={() => setStage('quiz')}/>
      )}
      {stage === 'quiz' && (
        <Questionnaire t={t} profile={profile} setProfile={setProfile}
          onBack={() => setStage('welcome')}
          onComplete={() => { setStage('app'); setTab('home'); }}/>
      )}
      {stage === 'app' && (
        <>
          {tab === 'home' && <Dashboard t={t} profile={profile} sequence={sequence} lang={lang}
            onStartPractice={() => setStage('practice')}
            onOpenPose={(p) => setPoseDetail(p)}
            illustrationStyle={tweaks.illustrationStyle}
            onLogout={() => {
              try {
                localStorage.removeItem('elbosc-session');
                localStorage.removeItem('elbosc-credential');
              } catch (e) {}
              setStage('auth');
            }}/>}
          {tab === 'library' && <Library t={t} lang={lang} asanas={ASANAS}
            onOpenPose={(p) => setPoseDetail(p)} illustrationStyle={tweaks.illustrationStyle}/>}
          {tab === 'calendar' && <Calendar t={t} lang={lang} profile={profile}/>}
          {tab === 'journal' && <Journal t={t} lang={lang}/>}
          {tab === 'messages' && <Chat t={t} lang={lang} role={tweaks.role || 'student'} asanas={ASANAS}/>}
          <TabBar active={tab} setActive={setTab} t={t}/>
          {poseDetail && <PoseDetail t={t} lang={lang} asana={poseDetail} onClose={() => setPoseDetail(null)} illustrationStyle={tweaks.illustrationStyle}/>}
        </>
      )}
      {stage === 'practice' && (
        <PracticeMode t={t} sequence={sequence} lang={lang}
          illustrationStyle={tweaks.illustrationStyle}
          onExit={() => setStage('app')}
          onComplete={() => setStage('app')}/>
      )}
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
            <TweakRadio value={tweaks.lang} onChange={v => setTweak('lang', v)}
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
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
