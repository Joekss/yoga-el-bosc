// data/sound.jsx — Campana, so ambiental i veu guiada.
// Tot es genera al mòbil (Web Audio i síntesi de veu del sistema): sense
// fitxers d'àudio, funciona sense connexió i no costa res.
//
//   EBSound.prefs()            { voice, bell, ambient: 'none'|'bosc'|'pluja'|'cuencos', volume }
//   EBSound.setPrefs(patch)
//   EBSound.unlock()           cal cridar-ho des d'un toc (iOS)
//   EBSound.bell()             campana suau
//   EBSound.startAmbient() / stopAmbient()
//   EBSound.speak(text, lang)  veu del sistema en ca/es/en
//   EBSound.stopAll()

(function () {
  const KEY = 'elbosc-practice-prefs';
  const DEFAULTS = { voice: true, bell: true, ambient: 'none', volume: 0.6 };
  let ctx = null, master = null, ambient = null;

  const prefs = () => { try { return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; } catch (e) { return { ...DEFAULTS }; } };
  const setPrefs = (patch) => {
    const next = { ...prefs(), ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) {}
    if (master) master.gain.value = next.volume;
    return next;
  };

  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = prefs().volume;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  // Campana tibetana: parcials inharmònics amb caiguda llarga
  function bell() {
    if (!prefs().bell) return;
    const c = audio(); if (!c) return;
    const now = c.currentTime;
    [[220, 0.5], [528, 0.32], [880, 0.16], [1320, 0.08]].forEach(([f, g]) => {
      const o = c.createOscillator(), v = c.createGain();
      o.type = 'sine'; o.frequency.value = f;
      v.gain.setValueAtTime(0.0001, now);
      v.gain.exponentialRampToValueAtTime(g, now + 0.02);
      v.gain.exponentialRampToValueAtTime(0.0001, now + 5);
      o.connect(v); v.connect(master);
      o.start(now); o.stop(now + 5.1);
    });
  }

  function noiseBuffer(c, seconds, brown) {
    const len = c.sampleRate * seconds, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return buf;
  }

  function startAmbient() {
    stopAmbient();
    const kind = prefs().ambient;
    if (!kind || kind === 'none') return;
    const c = audio(); if (!c) return;
    const out = c.createGain(); out.gain.value = 0; out.connect(master);
    out.gain.linearRampToValueAtTime(kind === 'cuencos' ? 0.12 : 0.35, c.currentTime + 2);
    const nodes = [out];
    if (kind === 'bosc' || kind === 'pluja') {
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c, 4, kind === 'bosc');
      src.loop = true;
      const f = c.createBiquadFilter();
      f.type = kind === 'bosc' ? 'lowpass' : 'bandpass';
      f.frequency.value = kind === 'bosc' ? 500 : 1800;
      f.Q.value = kind === 'bosc' ? 0.7 : 0.4;
      // Onada lenta de volum: vent entre els arbres / ràfegues de pluja
      const lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = kind === 'bosc' ? 0.07 : 0.15; lg.gain.value = 0.12;
      const g = c.createGain(); g.gain.value = 0.25;
      lfo.connect(lg); lg.connect(g.gain);
      src.connect(f); f.connect(g); g.connect(out);
      src.start(); lfo.start();
      nodes.push(src, lfo);
    } else if (kind === 'cuencos') {
      [110, 165, 220.5].forEach((fr, i) => {
        const o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
        o.type = 'sine'; o.frequency.value = fr;
        g.gain.value = 0.25 / (i + 1);
        lfo.frequency.value = 0.05 + i * 0.03; lg.gain.value = 0.12 / (i + 1);
        lfo.connect(lg); lg.connect(g.gain);
        o.connect(g); g.connect(out); o.start(); lfo.start();
        nodes.push(o, lfo);
      });
    }
    ambient = nodes;
  }

  function stopAmbient() {
    if (!ambient || !ctx) { ambient = null; return; }
    const [out, ...srcs] = ambient;
    try { out.gain.cancelScheduledValues(ctx.currentTime); out.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8); } catch (e) {}
    setTimeout(() => srcs.forEach(n => { try { n.stop(); } catch (e) {} }), 900);
    ambient = null;
  }

  const LANGS = { ca: ['ca-ES', 'ca'], es: ['es-ES', 'es'], en: ['en-GB', 'en-US', 'en'] };
  function pickVoice(lang) {
    try {
      const voices = speechSynthesis.getVoices();
      for (const code of LANGS[lang] || [lang]) {
        const v = voices.find(x => x.lang && x.lang.toLowerCase().startsWith(code.toLowerCase()));
        if (v) return v;
      }
    } catch (e) {}
    return null;
  }

  function speak(text, lang) {
    if (!prefs().voice || !text || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice(lang);
      if (v) u.voice = v;
      u.lang = (LANGS[lang] || ['ca-ES'])[0];
      u.rate = 0.92; u.pitch = 1;
      u.volume = Math.min(1, prefs().volume + 0.3);
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  // iOS només deixa sonar àudio i veu si el primer so surt d'un toc
  function unlock() {
    audio();
    try {
      if (window.speechSynthesis) {
        speechSynthesis.getVoices();
        const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u);
      }
    } catch (e) {}
  }

  function stopAll() {
    stopAmbient();
    try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) {}
  }

  window.EBSound = { prefs, setPrefs, unlock, bell, startAmbient, stopAmbient, speak, stopAll };
})();
