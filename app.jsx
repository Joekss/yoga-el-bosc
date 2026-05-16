// app.jsx — App principal: estat global, navegació, integració Tweaks

const { useState: uSA, useEffect: uEA, useMemo: uMA } = React;

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

  const [stage, setStage] = uSA(tweaks.stage || 'auth'); // auth | welcome | quiz | app | practice
  const [tab, setTab] = uSA('home');
  const [profile, setProfile] = uSA(DEFAULT_PROFILE);
  const [poseDetail, setPoseDetail] = uSA(null);

  // React to tweak stage change
  uEA(() => { if (tweaks.stage) setStage(tweaks.stage); }, [tweaks.stage]);

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
            illustrationStyle={tweaks.illustrationStyle}/>}
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
