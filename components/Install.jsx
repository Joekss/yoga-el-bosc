// components/Install.jsx — Guia per instal·lar l'app a la pantalla d'inici.
//   <InstallCard lang onOpen />   targeta a l'inici (si encara no està instal·lada)
//   <InstallGuide lang onClose /> passos segons el mòbil (iPhone, Android, ordinador)

// Android/Chrome avisa que es pot instal·lar: es guarda per usar-ho amb un botó
window.__ebInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); window.__ebInstallPrompt = e; });

const IN_T = {
  ca: {
    cardTitle: 'Instal·la El Bosc al mòbil', cardSub: 'S\'obre com una app, funciona sense connexió i et pot enviar avisos.',
    how: 'Com fer-ho', later: 'Ara no',
    title: 'Instal·lar l\'app', close: 'Tancar',
    iosIntro: 'A l\'iPhone o l\'iPad, des de Safari:',
    ios: ['Toca el botó Compartir (el quadrat amb la fletxa cap amunt), a baix de tot.', 'Baixa i tria "Afegir a la pantalla d\'inici".', 'Toca "Afegir". Obre El Bosc des de la icona nova.'],
    iosOther: 'Si l\'has obert amb un altre navegador, obre aquesta mateixa adreça amb Safari.',
    androidIntro: 'Al mòbil Android, amb Chrome:',
    android: ['Toca el menú ⋮ (a dalt a la dreta).', 'Tria "Instal·lar aplicació" o "Afegir a la pantalla d\'inici".', 'Confirma. Obre El Bosc des de la icona nova.'],
    installNow: 'Instal·lar ara',
    desktopIntro: 'A l\'ordinador, amb Chrome o Edge:',
    desktop: ['Fes clic a la icona d\'instal·lar a la barra de l\'adreça (una pantalla amb una fletxa).', 'Confirma "Instal·lar".'],
    done: 'Ja la tens instal·lada. Pots tancar aquesta guia.',
    why: 'Instal·lada, l\'app s\'obre a pantalla completa, funciona sense connexió i pot enviar-te el recordatori diari.',
  },
  es: {
    cardTitle: 'Instala El Bosc en el móvil', cardSub: 'Se abre como una app, funciona sin conexión y te puede enviar avisos.',
    how: 'Cómo hacerlo', later: 'Ahora no',
    title: 'Instalar la app', close: 'Cerrar',
    iosIntro: 'En el iPhone o el iPad, desde Safari:',
    ios: ['Toca el botón Compartir (el cuadrado con la flecha hacia arriba), abajo del todo.', 'Baja y elige "Añadir a pantalla de inicio".', 'Toca "Añadir". Abre El Bosc desde el icono nuevo.'],
    iosOther: 'Si la has abierto con otro navegador, abre esta misma dirección con Safari.',
    androidIntro: 'En el móvil Android, con Chrome:',
    android: ['Toca el menú ⋮ (arriba a la derecha).', 'Elige "Instalar aplicación" o "Añadir a pantalla de inicio".', 'Confirma. Abre El Bosc desde el icono nuevo.'],
    installNow: 'Instalar ahora',
    desktopIntro: 'En el ordenador, con Chrome o Edge:',
    desktop: ['Haz clic en el icono de instalar en la barra de la dirección (una pantalla con una flecha).', 'Confirma "Instalar".'],
    done: 'Ya la tienes instalada. Puedes cerrar esta guía.',
    why: 'Instalada, la app se abre a pantalla completa, funciona sin conexión y puede enviarte el recordatorio diario.',
  },
  en: {
    cardTitle: 'Install El Bosc on your phone', cardSub: 'It opens like an app, works offline and can send you reminders.',
    how: 'How to', later: 'Not now',
    title: 'Install the app', close: 'Close',
    iosIntro: 'On iPhone or iPad, in Safari:',
    ios: ['Tap the Share button (the square with an up arrow) at the bottom.', 'Scroll down and choose "Add to Home Screen".', 'Tap "Add". Open El Bosc from the new icon.'],
    iosOther: 'If you opened it in another browser, open this same address in Safari.',
    androidIntro: 'On Android, in Chrome:',
    android: ['Tap the ⋮ menu (top right).', 'Choose "Install app" or "Add to Home screen".', 'Confirm. Open El Bosc from the new icon.'],
    installNow: 'Install now',
    desktopIntro: 'On a computer, in Chrome or Edge:',
    desktop: ['Click the install icon in the address bar (a screen with an arrow).', 'Confirm "Install".'],
    done: 'It\'s already installed. You can close this guide.',
    why: 'Once installed, the app opens full screen, works offline and can send you the daily reminder.',
  },
};

const inPlatform = () => {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
};
const inInstalled = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const IN_DISMISS = 'elbosc-install-dismissed';

const InstallCard = ({ lang = 'ca', onOpen }) => {
  const t = IN_T[lang] || IN_T.ca;
  const [hidden, setHidden] = React.useState(() => { try { return inInstalled() || !!localStorage.getItem(IN_DISMISS); } catch (e) { return inInstalled(); } });
  if (hidden) return null;
  return (
    <div className="yb-card" style={{ margin:'16px 24px 0', padding:'14px 16px', display:'flex', gap:12, alignItems:'center' }}>
      <span aria-hidden="true" style={{ width:40, height:40, borderRadius:12, background:'color-mix(in srgb, var(--leaf) 18%, transparent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon name="download" size={18} color="var(--leaf-deep)"/>
      </span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:'var(--sans)', fontSize:14, fontWeight:600, color:'var(--ink)' }}>{t.cardTitle}</div>
        <div style={{ fontFamily:'var(--sans)', fontSize:12, color:'var(--ink-soft)', lineHeight:1.4 }}>{t.cardSub}</div>
        <div style={{ display:'flex', gap:12, marginTop:6 }}>
          <button onClick={onOpen} style={{ background:'none', border:'none', padding:0, color:'var(--accent)', fontFamily:'var(--sans)', fontSize:13, fontWeight:600, cursor:'pointer' }}>{t.how}</button>
          <button onClick={() => { try { localStorage.setItem(IN_DISMISS, '1'); } catch (e) {} setHidden(true); }} style={{ background:'none', border:'none', padding:0, color:'var(--ink-soft)', fontFamily:'var(--sans)', fontSize:13, cursor:'pointer' }}>{t.later}</button>
        </div>
      </div>
    </div>
  );
};

const InstallGuide = ({ lang = 'ca', onClose }) => {
  const t = IN_T[lang] || IN_T.ca;
  const platform = inPlatform();
  const [canPrompt, setCanPrompt] = React.useState(!!window.__ebInstallPrompt);
  const installed = inInstalled();
  const steps = platform === 'ios' ? t.ios : platform === 'android' ? t.android : t.desktop;
  const intro = platform === 'ios' ? t.iosIntro : platform === 'android' ? t.androidIntro : t.desktopIntro;
  const prompt = async () => {
    const p = window.__ebInstallPrompt; if (!p) return;
    p.prompt(); try { await p.userChoice; } catch (e) {}
    window.__ebInstallPrompt = null; setCanPrompt(false);
  };
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'var(--paper)', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'calc(env(safe-area-inset-top, 0px) + 20px) 20px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:26, color:'var(--ink)' }}>{t.title}</div>
        <button aria-label={t.close} onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', padding:6 }}><Icon name="close" size={20} color="var(--ink-soft)"/></button>
      </div>
      <div className="yb-scroll" style={{ flex:1, overflowY:'auto', padding:'8px 24px calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
        <p style={{ fontFamily:'var(--sans)', fontSize:14, color:'var(--ink-soft)', lineHeight:1.55, marginTop:0 }}>{t.why}</p>
        {installed ? (
          <p role="status" style={{ fontFamily:'var(--sans)', fontSize:15, color:'var(--leaf-deep)' }}>{t.done}</p>
        ) : (
          <>
            <div style={{ fontFamily:'var(--sans)', fontSize:15, fontWeight:600, color:'var(--ink)', margin:'16px 0 10px' }}>{intro}</div>
            <ol style={{ margin:0, paddingLeft:22, display:'flex', flexDirection:'column', gap:12 }}>
              {steps.map((s, i) => <li key={i} style={{ fontFamily:'var(--sans)', fontSize:15, color:'var(--ink)', lineHeight:1.5 }}>{s}</li>)}
            </ol>
            {platform === 'ios' && <p style={{ fontFamily:'var(--sans)', fontSize:13, color:'var(--ink-soft)', lineHeight:1.5, marginTop:16 }}>{t.iosOther}</p>}
            {canPrompt && <button className="yb-btn yb-btn-clay" style={{ width:'100%', marginTop:20 }} onClick={prompt}>{t.installNow}</button>}
          </>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { InstallCard, InstallGuide });
