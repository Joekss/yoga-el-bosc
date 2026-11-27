// components/Consent.jsx
// Consentiment previ al qüestionari (RGPD art. 9: dades de salut) i avís de salut.
// L'acceptació es desa al compte (profiles.data.consent) amb data i versió.

const CONSENT_VERSION = '2026-11';

const CONSENT_T = {
  ca: {
    kicker: 'Abans de començar',
    title: 'Les teves dades, en confiança',
    p1: 'Per adaptar la pràctica et preguntarem per lesions, molèsties i condicions de salut. Són dades sensibles.',
    p2: 'Només les fem servir per preparar les teves sessions. Les veus tu i la Cèlia, la teva professora. No es venen ni es comparteixen amb ningú més.',
    p3: 'El teu diari i el teu calendari només els veus tu. Pots descarregar les teves dades o esborrar el compte quan vulguis des de Configuració.',
    health: 'El ioga no substitueix cap tractament. Si tens una lesió, estàs embarassada o tens una condició mèdica, consulta-ho amb el teu metge abans de practicar.',
    check: 'Accepto que El Bosc tracti les meves dades de salut per personalitzar la pràctica, segons la política de privacitat.',
    policy: 'Llegir la política de privacitat',
    accept: 'Continuar',
    back: 'Tornar',
  },
  es: {
    kicker: 'Antes de empezar',
    title: 'Tus datos, en confianza',
    p1: 'Para adaptar la práctica te preguntaremos por lesiones, molestias y condiciones de salud. Son datos sensibles.',
    p2: 'Solo los usamos para preparar tus sesiones. Los ves tú y Cèlia, tu profesora. No se venden ni se comparten con nadie más.',
    p3: 'Tu diario y tu calendario solo los ves tú. Puedes descargar tus datos o borrar tu cuenta cuando quieras desde Configuración.',
    health: 'El yoga no sustituye ningún tratamiento. Si tienes una lesión, estás embarazada o tienes una condición médica, consúltalo con tu médico antes de practicar.',
    check: 'Acepto que El Bosc trate mis datos de salud para personalizar la práctica, según la política de privacidad.',
    policy: 'Leer la política de privacidad',
    accept: 'Continuar',
    back: 'Volver',
  },
  en: {
    kicker: 'Before you start',
    title: 'Your data, in confidence',
    p1: 'To adapt your practice we\'ll ask about injuries, discomfort and health conditions. This is sensitive data.',
    p2: 'We only use it to prepare your sessions. Only you and Cèlia, your teacher, can see it. It is never sold or shared with anyone else.',
    p3: 'Only you can see your journal and calendar. You can download your data or delete your account at any time from Settings.',
    health: 'Yoga doesn\'t replace any treatment. If you have an injury, are pregnant or have a medical condition, check with your doctor before practising.',
    check: 'I agree that El Bosc processes my health data to personalise my practice, as described in the privacy policy.',
    policy: 'Read the privacy policy',
    accept: 'Continue',
    back: 'Back',
  },
};

const ConsentScreen = ({ lang = 'ca', onAccept, onBack }) => {
  const t = CONSENT_T[lang] || CONSENT_T.ca;
  const [ok, setOk] = React.useState(false);
  const p = { fontFamily:'var(--sans)', fontSize:14, color:'var(--ink-soft)', lineHeight:1.6, margin:'0 0 12px' };
  return (
    <div className="yb-scroll" style={{ height:'100%', overflowY:'auto', background:'var(--paper)', padding:'calc(env(safe-area-inset-top, 0px) + 48px) 28px calc(env(safe-area-inset-bottom, 0px) + 28px)', display:'flex', flexDirection:'column' }}>
      <div style={{ fontFamily:'var(--sans)', fontSize:11, letterSpacing:'0.25em', textTransform:'uppercase', color:'var(--accent)', marginBottom:8 }}>{t.kicker}</div>
      <h1 style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:32, color:'var(--ink)', margin:'0 0 20px', lineHeight:1.1 }}>{t.title}</h1>
      <p style={p}>{t.p1}</p>
      <p style={p}>{t.p2}</p>
      <p style={p}>{t.p3}</p>
      <div style={{ display:'flex', gap:12, padding:'14px 16px', borderRadius:14, background:'color-mix(in srgb, var(--accent) 8%, var(--cream))', margin:'8px 0 20px' }}>
        <Icon name="heart" size={18} color="var(--accent)"/>
        <p style={{ ...p, margin:0, color:'var(--ink)', fontSize:13 }}>{t.health}</p>
      </div>
      <a href="privacitat.html" target="_blank" rel="noopener" style={{ fontFamily:'var(--sans)', fontSize:13, color:'var(--accent)', marginBottom:20 }}>{t.policy}</a>
      <label htmlFor="eb-consent" style={{ display:'flex', gap:12, alignItems:'flex-start', cursor:'pointer', marginBottom:24 }}>
        <input id="eb-consent" type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)}
          style={{ width:22, height:22, marginTop:1, accentColor:'var(--accent)', flexShrink:0 }}/>
        <span style={{ fontFamily:'var(--sans)', fontSize:14, color:'var(--ink)', lineHeight:1.5 }}>{t.check}</span>
      </label>
      <div style={{ flex:1 }}/>
      <button disabled={!ok} onClick={() => onAccept({ version: CONSENT_VERSION, acceptedAt: new Date().toISOString() })}
        className="yb-btn yb-btn-clay" style={{ width:'100%', opacity: ok ? 1 : 0.5, marginBottom:10 }}>{t.accept}</button>
      {onBack && <button onClick={onBack} className="yb-btn yb-btn-ghost" style={{ width:'100%' }}>{t.back}</button>}
    </div>
  );
};

Object.assign(window, { ConsentScreen, CONSENT_VERSION });
