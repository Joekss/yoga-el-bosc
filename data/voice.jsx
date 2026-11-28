// data/voice.jsx — Gravar àudio i la veu de la Cèlia
//   EBRecorder.start({ maxSec, onTick })  → { stop() → Promise<{ blob, duration, ext }>, cancel() }
//     Grava del micròfon amb el format que el mòbil sap fer (AAC a l'iPhone, Opus a Android).
//     Ho fan servir el xat (notes de veu) i l'estudi de veu de la professora.
//   EBVoice  frases gravades per la Cèlia que substitueixen la veu del mòbil
//     .PHRASES                 llista de frases (clau, grup, text) que pot gravar
//     .poseKey(id)             clau del nom d'una postura
//     .get(key) / .count()     gravació d'una frase (del catàleg compartit, kind 'voice')
//     .record(key, blob, dur)  puja i desa una gravació (només professora)
//     .remove(key)
//     .preload(keys)           prepara els àudios abans de la pràctica
//     .say(keys, fallback, lang)  sona la Cèlia si totes les frases hi són; si no, la veu del mòbil
//     .stop()

(function () {
  // ── Gravadora ─────────────────────────────────────────────
  const MIMES = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
  const EXT = { 'audio/mp4': 'm4a', 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/aac': 'aac' };
  const pickMime = () => { try { return MIMES.find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || ''; } catch (e) { return ''; } };
  // El servidor només accepta aquests tipus (vegeu la migració 004 i 011)
  const baseType = (t) => { const b = (t || '').split(';')[0].trim().toLowerCase(); return EXT[b] ? b : (b.includes('webm') ? 'audio/webm' : b.includes('ogg') ? 'audio/ogg' : 'audio/mp4'); };

  const EBRecorder = {
    supported: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder),
    // Ha de cridar-se des d'un toc (l'iPhone ho exigeix). Rebutja amb 'permission' o 'unsupported'.
    start: async function ({ maxSec = 300, onTick } = {}) {
      if (!this.supported()) throw new Error('unsupported');
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
      catch (e) { throw new Error('permission'); }
      const mime = pickMime();
      let rec;
      try { rec = new MediaRecorder(stream, mime ? { mimeType: mime } : {}); }
      catch (e) { stream.getTracks().forEach(t => t.stop()); throw new Error('unsupported'); }
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      const t0 = Date.now();
      let stopped = false, autoStop = null;
      const secs = () => (Date.now() - t0) / 1000;
      const tick = setInterval(() => {
        onTick && onTick(Math.floor(secs()));
        if (secs() >= maxSec && autoStop) autoStop();
      }, 250);
      const release = () => { clearInterval(tick); try { stream.getTracks().forEach(t => t.stop()); } catch (e) {} };
      rec.start(250);   // trossos cada 250 ms: si el mòbil no avisa en aturar, no es perd res
      const handle = {
        seconds: secs,
        stop: () => new Promise((resolve, reject) => {
          if (stopped) return reject(new Error('stopped'));
          stopped = true;
          const duration = Math.max(1, Math.round(secs()));
          let finished = false;
          const done = () => {
            if (finished) return; finished = true; release();
            const type = baseType(rec.mimeType || mime);
            const blob = new Blob(chunks, { type });
            if (!blob.size) return reject(new Error('empty'));
            resolve({ blob, duration, ext: EXT[type] || 'm4a', type });
          };
          rec.onstop = done;
          setTimeout(done, 1500);          // alguns mòbils no criden onstop
          try { if (rec.state !== 'inactive') { try { rec.requestData(); } catch (e) {} rec.stop(); } else done(); } catch (e) { done(); }
        }),
        cancel: () => { if (stopped) return; stopped = true; try { rec.state !== 'inactive' && rec.stop(); } catch (e) {} release(); },
      };
      autoStop = () => { if (handle.onAutoStop) handle.onAutoStop(); };
      return handle;
    },
  };

  // ── Frases de la Cèlia ────────────────────────────────────
  const T = (ca, es, en) => ({ ca, es, en });
  const PHRASES = [
    { key: 'start',   group: 'practice', text: T('Benvinguda. Comencem: troba una postura còmoda i respira.', 'Bienvenida. Empezamos: busca una postura cómoda y respira.', 'Welcome. Let\'s begin: find a comfortable position and breathe.') },
    { key: 'breathe', group: 'practice', text: T('Respira a poc a poc.', 'Respira despacio.', 'Breathe slowly.') },
    { key: 'next',    group: 'practice', text: T('Prepara\'t per canviar.', 'Prepárate para cambiar.', 'Get ready to change.') },
    { key: 'end',     group: 'practice', text: T('Molt bé. Hem acabat la pràctica. Gràcies.', 'Muy bien. Hemos terminado la práctica. Gracias.', 'Well done. Practice is complete. Thank you.') },
    { key: 'inhale',  group: 'breath', text: T('Inspira', 'Inspira', 'Inhale') },
    { key: 'hold',    group: 'breath', text: T('Reté', 'Retén', 'Hold') },
    { key: 'exhale',  group: 'breath', text: T('Exhala', 'Exhala', 'Exhale') },
    { key: 'left',    group: 'breath', text: T('per l\'esquerra', 'por la izquierda', 'through the left') },
    { key: 'right',   group: 'breath', text: T('per la dreta', 'por la derecha', 'through the right') },
  ];
  const poseKey = (id) => 'pose:' + id;

  const KEY = 'elbosc-voice';    // { clau: { path, duration, type } }, sincronitzat amb el catàleg (kind 'voice')
  const all = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
  const cache = {};   // clau → { path, el: HTMLAudioElement }
  let playing = null, seq = 0;

  const EBVoice = {
    PHRASES, poseKey,
    get: (key) => all()[key] || null,
    count: () => Object.keys(all()).length,
    // Prefereix la veu de la Cèlia (es pot apagar al full de so de la pràctica)
    enabled: () => {
      const p = window.EBSound ? window.EBSound.prefs() : {};
      return p.voice !== false && p.celia !== false && Object.keys(all()).length > 0;
    },
    _setAll: save,
    record: async function (key, blob, duration) {
      if (!window.sb) throw new Error('no-backend');
      const type = baseType(blob.type);
      const safe = key.replace(/[^a-z0-9-]/gi, '_');
      const path = 'voice/' + safe + '-' + Date.now().toString(36) + '.' + (EXT[type] || 'm4a');
      const { error } = await window.sb.storage.from('poses').upload(path, blob, { contentType: type, upsert: false });
      if (error) throw error;
      const media = { path, duration: Math.max(1, Math.round(duration || 1)), type };
      const v = all(); v[key] = media; save(v);
      delete cache[key];
      window.EBCatalog && window.EBCatalog.queue({ op: 'upsert', kind: 'voice', id: key, payload: media });
      return media;
    },
    remove: function (key) {
      const v = all(); delete v[key]; save(v); delete cache[key];
      window.EBCatalog && window.EBCatalog.queue({ op: 'delete', kind: 'voice', id: key });
    },
    // URL temporal i element d'àudio preparat
    _audio: async function (key) {
      const m = all()[key];
      if (!m) return null;
      const c = cache[key];
      if (c && c.path === m.path) return c.el;
      const url = window.EBPoseMedia ? await window.EBPoseMedia.url(m.path) : null;
      if (!url) return null;
      const el = new Audio(); el.preload = 'auto'; el.src = url;
      cache[key] = { path: m.path, el };
      return el;
    },
    preload: function (keys) { (keys || []).forEach(k => { this._audio(k).catch(() => {}); }); },
    stop: function () { seq++; if (playing) { try { playing.pause(); } catch (e) {} playing = null; } },
    // Sona les frases una darrere l'altra. Si en falta alguna, diu el text alternatiu amb la veu del mòbil.
    say: async function (keys, fallback, lang) {
      keys = [].concat(keys || []).filter(Boolean);
      const p = window.EBSound ? window.EBSound.prefs() : { voice: true, volume: 0.6 };
      if (p.voice === false) return;
      const v = all();
      if (!this.enabled() || !keys.length || !keys.every(k => v[k])) {
        if (fallback && window.EBSound) window.EBSound.speak(fallback, lang);
        return;
      }
      this.stop();
      try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) {}
      const my = seq;
      for (const k of keys) {
        if (my !== seq) return;
        const el = await this._audio(k).catch(() => null);
        if (!el || my !== seq) { if (fallback && window.EBSound && my === seq) window.EBSound.speak(fallback, lang); return; }
        el.volume = Math.min(1, (typeof p.volume === 'number' ? p.volume : 0.6) + 0.35);
        try { el.currentTime = 0; } catch (e) {}
        playing = el;
        const ok = await new Promise(res => {
          el.onended = () => res(true); el.onerror = () => res(false);
          el.play().catch(() => res(false));
        });
        if (!ok) { if (fallback && window.EBSound && my === seq) window.EBSound.speak(fallback, lang); return; }
      }
      if (my === seq) playing = null;
    },
  };

  window.EBRecorder = EBRecorder;
  window.EBVoice = EBVoice;
})();
