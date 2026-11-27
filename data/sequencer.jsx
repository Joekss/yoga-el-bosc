// data/sequencer.jsx — Lògica de generació de rutina personalitzada

function generateSequence(profile, asanas) {
  const totalSec = (profile.duration || 30) * 60;
  const level = profile.level || 'principiant';
  const goals = profile.goals || [];
  const focusZones = profile.focusZones || [];
  const avoidZones = profile.avoidZones || [];
  const injuries = injuryTags([...(profile.currentInjuries || []), ...(profile.conditions || []), ...(profile.todayDiscomfort || [])]);
  const style = profile.style || 'Hatha';
  const time = profile.timeOfDay || 'Matí';

  // Filter unsafe poses
  const avoid = avoidZones.map(slug).filter(Boolean);
  const safe = asanas.filter(a => {
    if ((a.contraindications || []).some(c => injuries.includes(c))) return false;
    // Zones a evitar (avui o sempre): fora les postures que les treballen directament
    if (avoid.length && (a.target || []).some(t => avoid.some(z => slug(t).startsWith(z.slice(0, 5))))) return false;
    return true;
  });

  // Score each asana
  const scored = safe.map(a => {
    let score = 0;
    // Level match
    if (a.level === level) score += 10;
    else if (level === 'intermedi' && a.level === 'principiant') score += 5;
    else if (level === 'avancat') score += 6;
    else if (a.level === 'avancat' && level !== 'avancat') score -= 8;

    // Focus zones
    focusZones.forEach(z => {
      if ((a.target || []).some(t => slug(t) === slug(z))) score += 6;
      if ((a.muscles || []).some(m => slug(m).includes(slug(z)))) score += 3;
    });

    // Goals
    goals.forEach(g => {
      const sg = slug(g);
      if (sg.includes('relax') && a.family === 'restauratiu') score += 5;
      if (sg.includes('forc') && (a.family === 'peu' || (a.muscles||[]).includes('core'))) score += 4;
      if (sg.includes('flex') && a.family === 'flexio') score += 4;
      if (sg.includes('equilibri') && a.family === 'equilibri') score += 5;
      if (sg.includes('energ') && a.family === 'extensio') score += 4;
      if (sg.includes('concentr') && a.family === 'meditacio') score += 3;
      if (sg.includes('dormir') && a.family === 'restauratiu') score += 6;
      if (sg.includes('espirit') && a.family === 'meditacio') score += 4;
    });

    // Style
    if (slug(style).includes('yin') && a.family === 'restauratiu') score += 3;
    if (slug(style).includes('vinyasa') && (a.family === 'peu' || a.family === 'extensio')) score += 2;
    if (slug(style).includes('restaur') && a.family === 'restauratiu') score += 4;

    // Time of day
    if (slug(time).includes('mat') && a.family !== 'restauratiu') score += 1;
    if ((slug(time).includes('vesp') || slug(time).includes('night') || slug(time).includes('noche'))
        && a.family === 'restauratiu') score += 3;

    return { asana: a, score };
  });

  scored.sort((a,b) => b.score - a.score);

  // Build phases: warmup -> main -> cooldown -> savasana
  const sequence = [];
  const usedIds = new Set();

  const findOne = (filter) => {
    return scored.find(s => filter(s.asana) && !usedIds.has(s.asana.id))?.asana;
  };
  const addPose = (a, dur) => {
    if (!a) return 0;
    usedIds.add(a.id);
    sequence.push({ ...a, duration: dur || a.duration });
    return dur || a.duration;
  };

  // 1. Centering (~10%)
  const centerSec = Math.round(totalSec * 0.10);
  addPose(findOne(a => a.id === 'sukhasana') || findOne(a => a.family === 'meditacio'), centerSec);

  // 2. Warmup (~15%)
  const warmupSec = Math.round(totalSec * 0.15);
  addPose(findOne(a => a.id === 'marjariasana'), Math.round(warmupSec * 0.6));
  addPose(findOne(a => a.family === 'mobilitat'), Math.round(warmupSec * 0.4));

  // 3. Main (~50%)
  const mainSec = Math.round(totalSec * 0.50);
  let mainBudget = mainSec;
  const mainCandidates = scored.filter(s =>
    !usedIds.has(s.asana.id) && ['peu', 'equilibri', 'extensio', 'torsio', 'flexio'].includes(s.asana.family)
  );
  for (const s of mainCandidates) {
    if (mainBudget <= 30) break;
    const dur = Math.min(s.asana.duration, mainBudget);
    addPose(s.asana, dur);
    mainBudget -= dur;
  }

  // 4. Cooldown (~10%)
  const cooldownSec = Math.round(totalSec * 0.10);
  addPose(findOne(a => a.id === 'balasana' || a.family === 'flexio'), cooldownSec);

  // 5. Savasana (~15%)
  const savSec = Math.round(totalSec * 0.15);
  addPose(findOne(a => a.id === 'savasana') || findOne(a => a.family === 'restauratiu'), savSec);

  return sequence;
}

// Tradueix lesions i condicions (en qualsevol idioma del qüestionari) a les
// etiquetes de contraindicació de les postures (data/asanas.jsx).
const INJURY_MAP = [
  [/coll|cuello|neck/, ['lesio-coll']],
  [/hernia/, ['hernia-discal', 'lesio-esquena']],
  [/esquena|espalda|back|lumbar/, ['lesio-esquena']],
  [/genoll|rodilla|knee/, ['lesio-genoll']],
  [/canell|muneca|wrist/, ['lesio-canell']],
  [/espatll|hombro|shoulder/, ['lesio-espatlla']],
  [/maluc|cadera|hip/, ['lesio-maluc']],
  [/turmell|tobillo|ankle/, ['lesio-turmell']],
  [/embaras|pregnan/, ['embaras', 'embaras-avancat']],
  [/hipertens|tension alta|high blood/, ['hipertensio', 'hipertensio-no-controlada']],
  [/vertig|mareo|dizz/, ['vertigen']],
  [/glaucom/, ['glaucoma']],
];
function injuryTags(list) {
  const out = new Set();
  (list || []).forEach(item => {
    const s = slug(item);
    if (!s) return;
    out.add(s);
    INJURY_MAP.forEach(([re, tags]) => { if (re.test(s)) tags.forEach(t => out.add(t)); });
  });
  return [...out];
}

// "Com et trobes avui?": ajusta una còpia del perfil per a la sessió d'avui
//   checkin = { energy: 'low'|'ok'|'high', minutes, discomfort: [zones] }
function adjustProfileForToday(profile, checkin) {
  if (!checkin) return profile;
  const p = { ...profile };
  if (checkin.minutes) p.duration = checkin.minutes;
  p.todayDiscomfort = checkin.discomfort || [];
  if (p.todayDiscomfort.length) p.avoidZones = [...new Set([...(p.avoidZones || []), ...p.todayDiscomfort])];
  if (checkin.energy === 'low') {
    p.goals = [...new Set([...(p.goals || []), 'Relaxació'])];
    p.style = 'Restauratiu';
    if (p.level === 'avancat') p.level = 'intermedi';
  } else if (checkin.energy === 'high') {
    p.goals = [...new Set([...(p.goals || []), 'Energia', 'Força'])];
  }
  return p;
}

function slug(s) {
  return (s||'').toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

window.generateSequence = generateSequence;
window.slugify = slug;
window.injuryTags = injuryTags;
window.adjustProfileForToday = adjustProfileForToday;
