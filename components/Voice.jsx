// components/Voice.jsx — Estudi de veu de la professora.
//   <VoiceStudio lang onClose />
//   La Cèlia grava les frases de la pràctica, la respiració i els noms de les postures.
//   Les alumnes les senten durant la pràctica en lloc de la veu del mòbil (data/voice.jsx).

const VS_T = {
  ca: {
    title: 'La teva veu', close: 'Tancar',
    intro: 'Grava aquestes frases amb la teva veu. Les alumnes les sentiran durant la pràctica en lloc de la veu del mòbil. Les que no gravis les continuarà dient el mòbil.',
    tip: 'Grava en un lloc tranquil, amb el mòbil a un pam de la boca. Pots tornar a gravar qualsevol frase tantes vegades com vulguis.',
    progress: '{n} de {m} gravades',
    practice: 'Pràctica', breath: 'Respiració', poses: 'Noms de les postures',
    posesHint: 'Digues el nom tal com el dius a classe.',
    search: 'Busca una postura',
    recorded: 'Gravada', notRecorded: 'Sense gravar', recording: 'Gravant…', saving: 'Desant…',
    record: 'Gravar', rerecord: 'Tornar a gravar', stop: 'Aturar i desar', play: 'Escoltar', remove: 'Esborrar',
    errSave: 'No s\'ha pogut desar la gravació. Comprova la connexió i torna-ho a provar.',
    errPlay: 'No s\'ha pogut reproduir la gravació.',
    permission: 'Cal permís de micròfon. Activa\'l a la configuració del navegador i torna-ho a provar.',
    unsupported: 'Aquest navegador no pot gravar àudio.', empty: 'No s\'ha gravat res. Torna-ho a provar.',
  },
  es: {
    title: 'Tu voz', close: 'Cerrar',
    intro: 'Graba estas frases con tu voz. Las alumnas las oirán durante la práctica en lugar de la voz del móvil. Las que no grabes las seguirá diciendo el móvil.',
    tip: 'Graba en un sitio tranquilo, con el móvil a un palmo de la boca. Puedes volver a grabar cualquier frase tantas veces como quieras.',
    progress: '{n} de {m} grabadas',
    practice: 'Práctica', breath: 'Respiración', poses: 'Nombres de las posturas',
    posesHint: 'Di el nombre tal como lo dices en clase.',
    search: 'Busca una postura',
    recorded: 'Grabada', notRecorded: 'Sin grabar', recording: 'Grabando…', saving: 'Guardando…',
    record: 'Grabar', rerecord: 'Volver a grabar', stop: 'Parar y guardar', play: 'Escuchar', remove: 'Borrar',
    errSave: 'No se ha podido guardar la grabación. Comprueba la conexión y vuelve a probar.',
    errPlay: 'No se ha podido reproducir la grabación.',
    permission: 'Hace falta permiso de micrófono. Actívalo en la configuración del navegador y vuelve a probar.',
    unsupported: 'Este navegador no puede grabar audio.', empty: 'No se ha grabado nada. Vuelve a probar.',
  },
  en: {
    title: 'Your voice', close: 'Close',
    intro: 'Record these phrases in your own voice. Students will hear them during practice instead of the phone\'s voice. Anything you don\'t record is still read by the phone.',
    tip: 'Record somewhere quiet, with the phone a hand\'s width from your mouth. You can re-record any phrase as often as you like.',
    progress: '{n} of {m} recorded',
    practice: 'Practice', breath: 'Breathing', poses: 'Pose names',
    posesHint: 'Say the name the way you say it in class.',
    search: 'Find a pose',
    recorded: 'Recorded', notRecorded: 'Not recorded', recording: 'Recording…', saving: 'Saving…',
    record: 'Record', rerecord: 'Record again', stop: 'Stop and save', play: 'Listen', remove: 'Delete',
    errSave: 'Couldn\'t save the recording. Check your connection and try again.',
    errPlay: 'Couldn\'t play the recording.',
    permission: 'Microphone permission is needed. Turn it on in your browser settings and try again.',
    unsupported: 'This browser can\'t record audio.', empty: 'Nothing was recorded. Try again.',
  },
};

const vsFmt = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s) % 60).padStart(2, '0');

const VoiceStudio = ({ lang = 'ca', onClose }) => {
  const t = VS_T[lang] || VS_T.ca;
  const V = window.EBVoice;
  const [, setV] = React.useState(0);
  const refresh = () => setV(x => x + 1);
  const [active, setActive] = React.useState(null);      // { key, secs, state: 'rec'|'save' }
  const [err, setErr] = React.useState('');
  const [q, setQ] = React.useState('');
  const recRef = React.useRef(null);
  const playRef = React.useRef(null);

  React.useEffect(() => () => {
    if (recRef.current && recRef.current.cancel) recRef.current.cancel();
    try { playRef.current && playRef.current.pause(); } catch (e) {}
  }, []);

  const poses = (window.EBPoses ? window.EBPoses.effective() : (window.ASANAS || []))
    .map(a => ({ key: V.poseKey(a.id), label: a.name[lang] || a.name.ca, sub: a.sanskrit }))
    .sort((a, b) => a.label.localeCompare(b.label, lang));
  const groups = [
    { id: 'practice', title: t.practice, items: V.PHRASES.filter(p => p.group === 'practice').map(p => ({ key: p.key, label: p.text[lang] || p.text.ca })) },
    { id: 'breath', title: t.breath, items: V.PHRASES.filter(p => p.group === 'breath').map(p => ({ key: p.key, label: p.text[lang] || p.text.ca })) },
    { id: 'poses', title: t.poses, hint: t.posesHint, items: poses },
  ];
  const total = groups.reduce((s, g) => s + g.items.length, 0);
  const done = groups.reduce((s, g) => s + g.items.filter(i => V.get(i.key)).length, 0);
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const stopPlayback = () => { try { playRef.current && playRef.current.pause(); } catch (e) {} playRef.current = null; };

  const start = async (key) => {
    if (active) return;
    setErr(''); stopPlayback();
    setActive({ key, secs: 0, state: 'starting' });
    try {
      const h = await window.EBRecorder.start({ maxSec: 20, onTick: (s) => setActive(a => a && a.key === key ? { ...a, secs: s } : a) });
      recRef.current = h;
      h.onAutoStop = () => finish(key);
      setActive({ key, secs: 0, state: 'rec' });
    } catch (e) {
      recRef.current = null; setActive(null);
      setErr(t[e && e.message] || t.unsupported);
    }
  };

  const finish = async (key) => {
    const h = recRef.current; recRef.current = null;
    if (!h) return;
    setActive(a => a ? { ...a, state: 'save' } : a);
    try {
      const { blob, duration } = await h.stop();
      await V.record(key, blob, duration);
      refresh();
    } catch (e) {
      setErr(t[e && e.message] || t.errSave);
    }
    setActive(null);
  };

  const play = async (key) => {
    setErr(''); stopPlayback();
    try {
      const el = await V._audio(key);
      if (!el) throw new Error('no');
      playRef.current = el; el.currentTime = 0;
      await el.play();
    } catch (e) { setErr(t.errPlay); }
  };

  const remove = (key) => { stopPlayback(); V.remove(key); refresh(); };

  const btn = (extra) => ({ width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...extra });

  const renderItem = (it) => {
    const m = V.get(it.key);
    const isActive = active && active.key === it.key;
    return (
      <div key={it.key} className="eb-row" style={{ cursor: 'default' }}>
        <div className="eb-row-body">
          <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--ink)' }}>{it.label}</span>
          {it.sub && <span className="eb-row-sub" style={{ fontStyle: 'italic' }}>{it.sub}</span>}
          <span className="eb-row-sub" style={{ color: isActive ? 'var(--accent)' : m ? 'var(--leaf-deep)' : 'var(--ink-soft)' }}>
            {isActive ? (active.state === 'save' ? t.saving : t.recording + ' ' + vsFmt(active.secs) + ' / 0:20') : m ? t.recorded + ' · ' + vsFmt(m.duration || 0) : t.notRecorded}
          </span>
        </div>
        <div className="eb-row-end" style={{ gap: 8 }}>
          {isActive && active.state === 'rec' ? (
            <button aria-label={t.stop} onClick={() => finish(it.key)} style={btn({ background: 'var(--accent)', color: 'var(--cream)' })}>
              <span style={{ width: 13, height: 13, borderRadius: 3, background: 'var(--cream)' }}/>
            </button>
          ) : (
            <>
              {m && <button aria-label={t.play + ': ' + it.label} disabled={!!active} onClick={() => play(it.key)} style={btn({ background: 'var(--paper-2)', color: 'var(--ink)', opacity: active ? 0.4 : 1 })}><Icon name="play" size={15} color="var(--ink)"/></button>}
              <button aria-label={(m ? t.rerecord : t.record) + ': ' + it.label} disabled={!!active} onClick={() => start(it.key)}
                style={btn({ background: m ? 'var(--paper-2)' : 'var(--ink)', opacity: active ? 0.4 : 1 })}>
                <Icon name="mic" size={17} color={m ? 'var(--ink)' : 'var(--cream)'}/>
              </button>
              {m && <button aria-label={t.remove + ': ' + it.label} disabled={!!active} onClick={() => remove(it.key)} style={btn({ background: 'transparent', width: 32, opacity: active ? 0.4 : 1 })}><Icon name="trash" size={16} color="var(--ink-soft)"/></button>}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="eb-screen" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 28, color: 'var(--ink)' }}>{t.title}</div>
        <button aria-label={t.close} onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6 }}><Icon name="close" size={20} color="var(--ink-soft)"/></button>
      </div>
      <div className="yb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '4px 20px calc(env(safe-area-inset-bottom, 0px) + 32px)' }}>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.55, margin: '0 0 12px' }}>{t.intro}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '6px 0 4px' }}>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--paper-2)', overflow: 'hidden' }}>
            <div style={{ width: (total ? 100 * done / total : 0) + '%', height: '100%', background: 'var(--leaf)', transition: 'width .4s' }}/>
          </div>
          <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums' }}>{t.progress.replace('{n}', done).replace('{m}', total)}</span>
        </div>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, margin: '8px 0 0' }}>{t.tip}</p>
        {err && <div role="alert" style={{ marginTop: 12, fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--accent-deep)' }}>{err}</div>}

        {groups.map(g => {
          const items = g.id === 'poses' && q.trim() ? g.items.filter(i => norm(i.label + ' ' + i.sub).includes(norm(q))) : g.items;
          return (
            <section key={g.id}>
              <div className="eb-group-title">{g.title}</div>
              {g.hint && <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-soft)', margin: '-4px 4px 10px' }}>{g.hint}</p>}
              {g.id === 'poses' && (
                <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t.search} aria-label={t.search}
                  style={{ width: '100%', marginBottom: 10, padding: '11px 14px', borderRadius: 14, border: '1px solid var(--line)', background: 'var(--cream)', fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink)' }}/>
              )}
              <div className="eb-group">
                {items.map(renderItem)}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

Object.assign(window, { VoiceStudio });
