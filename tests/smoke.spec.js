// Proves de fum dels fluxos d'accés amb un Supabase simulat.
// Executa: node tests/smoke.spec.js  (cal un servidor a BASE, per defecte :5000)
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:5000/';
const FAKE = fs.readFileSync(path.join(__dirname, 'fake-supabase.js'), 'utf8');

let failures = 0;
const ok = (cond, msg) => { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) failures++; };

async function page(browser, scenario) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block', permissions: ['microphone'] });
  await ctx.route('**/vendor/supabase.js', r => r.fulfill({ contentType: 'application/javascript', body: FAKE }));
  await ctx.addInitScript(s => { if (!sessionStorage.getItem('init')) { localStorage.clear(); if (s) localStorage.setItem('fake-sb', JSON.stringify(s)); if (s && s.catalog) localStorage.setItem('fake-sb-catalog', JSON.stringify(s.catalog)); if (s && s.messages) localStorage.setItem('fake-sb-messages', JSON.stringify(s.messages)); if (s && s.personal) localStorage.setItem('fake-sb-personal', JSON.stringify(s.personal)); if (s && s.practice) localStorage.setItem('fake-sb-practice', JSON.stringify(s.practice)); if (s && s.assignments) localStorage.setItem('fake-sb-assignments', JSON.stringify(s.assignments)); sessionStorage.setItem('init', '1'); } }, scenario);
  const p = await ctx.newPage();
  p.errors = [];
  p.on('pageerror', e => p.errors.push(e.message));
  return p;
}
const text = (p) => p.innerText('body');
const waitText = (p, s) => p.waitForFunction(t => document.body.innerText.includes(t), s, { timeout: 15000 });

(async () => {
  // Micròfon fals perquè es puguin provar les notes de veu i l'estudi de veu
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });

  console.log('1. Enllaç d\'invitació no dóna accés');
  {
    const inv = Buffer.from('intrusa@example.com|000000|Intrusa').toString('base64');
    const p = await page(browser, {});
    await p.goto(BASE + '?inv=' + encodeURIComponent(inv));
    await waitText(p, 'Entra a El Bosc');
    ok(await p.inputValue('#eb-email') === 'intrusa@example.com', 'omple el correu des de l\'enllaç');
    ok(!(await text(p)).includes('Començar'), 'no entra a l\'app sense verificar');
    ok(p.errors.length === 0, 'sense errors JS: ' + p.errors.join(' | '));
    await p.context().close();
  }

  console.log('2. Sessió falsificada a localStorage no serveix');
  {
    const p = await page(browser, {});
    await p.goto(BASE);
    await p.evaluate(() => localStorage.setItem('elbosc-session', JSON.stringify({ email: 'x@x.com', role: 'teacher' })));
    await p.reload();
    await waitText(p, 'Entra a El Bosc');
    ok(true, 'continua a la pantalla d\'accés');
    await p.context().close();
  }

  console.log('3. Alumna nova: correu → codi → benvinguda');
  {
    const p = await page(browser, { role: 'student', status: 'active' });
    await p.goto(BASE);
    await waitText(p, 'Entra a El Bosc');
    await p.fill('#eb-email', 'anna@example.com');
    await p.click('button[type=submit]');
    await waitText(p, 'Mira el teu correu');
    await p.fill('#eb-code', '111111');
    await p.click('button[type=submit]');
    await waitText(p, 'incorrecte');
    ok(true, 'rebutja un codi dolent');
    await p.fill('#eb-code', '123456');
    await p.click('button[type=submit]');
    await waitText(p, 'Començar');
    ok(true, 'entra amb el codi bo i va a la benvinguda');
    const calls = await p.evaluate(() => window.__sbCalls);
    ok(calls.some(c => c.rpc === 'claim_invite'), 'comprova l\'estat d\'accés al servidor');
    ok(p.errors.length === 0, 'sense errors JS: ' + p.errors.join(' | '));
    await p.context().close();
  }

  console.log('4. Alumna revocada no entra');
  {
    const p = await page(browser, { role: 'student', status: 'revoked' });
    await p.goto(BASE);
    await p.fill('#eb-email', 'roser@example.com');
    await p.click('button[type=submit]');
    await p.fill('#eb-code', '123456');
    await p.click('button[type=submit]');
    await waitText(p, 'Accés no disponible');
    ok((await text(p)).includes('en pausa'), 'mostra accés en pausa');
    await p.click('text=Sortir');
    await waitText(p, 'Entra a El Bosc');
    ok(true, 'pot sortir');
    await p.context().close();
  }

  console.log('5. Correu fora de la llista no entra');
  {
    const p = await page(browser, { role: 'student', status: 'missing' });
    await p.goto(BASE);
    await p.fill('#eb-email', 'nova@example.com');
    await p.click('button[type=submit]');
    await p.fill('#eb-code', '123456');
    await p.click('button[type=submit]');
    await waitText(p, 'no és a la llista');
    ok(true, 'mostra que no és a la llista');
    await p.context().close();
  }

  console.log('6. Alumna amb qüestionari fet torna directa a l\'app i en recarregar');
  {
    const p = await page(browser, { role: 'student', status: 'active', quizDone: true, name: 'Anna' });
    await p.goto(BASE);
    await p.fill('#eb-email', 'anna@example.com');
    await p.click('button[type=submit]');
    await p.fill('#eb-code', '123456');
    await p.click('button[type=submit]');
    await waitText(p, 'Començar pràctica');
    await p.reload();
    await waitText(p, 'Començar pràctica');
    ok((await text(p)).includes('Anna'), 'manté la sessió i el nom en recarregar');
    await p.context().close();
  }

  console.log('7. Professora: gestiona alumnes');
  {
    const p = await page(browser, { role: 'teacher', members: [{ email: 'marta@example.com', name: 'Marta', level: 'intermedi', status: 'active', invited_at: '2026-10-01T10:00:00Z' }] });
    await p.goto(BASE);
    await p.fill('#eb-email', 'celia@example.com');
    await p.click('button[type=submit]');
    await p.fill('#eb-code', '123456');
    await p.click('button[type=submit]');
    await p.waitForTimeout(1200);
    const calls = await p.evaluate(() => window.__sbCalls);
    ok(!calls.some(c => c.rpc === 'claim_invite'), 'la professora no passa per la invitació');
    await p.click('text=Inici');
    await p.click('button[aria-label="El teu perfil"]');
    await p.click('text=Alumnes i accés');
    await waitText(p, 'marta@example.com');
    ok(true, 'veu la llista d\'alumnes del servidor');
    await p.click('text=Afegir alumna');
    await p.fill('#eb-new-name', 'Aina');
    await p.fill('#eb-new-email', 'Aina@Example.com');
    await p.click('form button[type=submit]');
    await waitText(p, 'aina@example.com');
    ok(true, 'afegeix una alumna (correu en minúscules)');
    await p.click('text=Posar en pausa >> nth=0');
    await waitText(p, 'En pausa');
    ok(true, 'posa en pausa una alumna');
    await p.screenshot({ path: path.join(__dirname, 'out-teacher.png') });
    ok(p.errors.length === 0, 'sense errors JS: ' + p.errors.join(' | '));
    await p.context().close();
  }

  console.log('8. Idioma es recorda');
  {
    const p = await page(browser, {});
    await p.goto(BASE);
    await p.evaluate(() => localStorage.setItem('elbosc-lang', 'es'));
    await p.reload();
    await waitText(p, 'Entra en El Bosc');
    ok(true, 'arrenca en castellà');
    await p.context().close();
  }

  console.log('9. Alumna nova: consentiment → qüestionari → pràctica registrada');
  {
    const p = await page(browser, { role: 'student', status: 'active' });
    await p.goto(BASE);
    await p.fill('#eb-email', 'pau@example.com');
    await p.click('button[type=submit]');
    await p.fill('#eb-code', '123456');
    await p.click('button[type=submit]');
    await waitText(p, 'Començar');
    await p.click('text=Començar');
    await waitText(p, 'Les teves dades, en confiança');
    ok(await p.isDisabled('text=Continuar'), 'no deixa continuar sense acceptar');
    await p.check('#eb-consent');
    await p.click('text=Continuar');
    for (let i = 0; i < 30; i++) {
      const body = await text(p);
      if (body.includes('Crear la meva pràctica')) { await p.click('text=Crear la meva pràctica'); break; }
      await p.click('text=Següent');
    }
    await waitText(p, 'Començar pràctica');
    const calls = await p.evaluate(() => window.__sbCalls);
    const saves = calls.filter(c => c.table === 'profiles' && c.op === 'update');
    ok(saves.some(c => c.payload.data && c.payload.data.consent && c.payload.data.consent.version), 'desa el consentiment amb versió');
    ok(saves.some(c => c.payload.data && c.payload.data.quizDone && c.payload.data.profile), 'desa el qüestionari');
    // Com et trobes avui? → pràctica → valoració
    await p.click('text=Començar pràctica');
    await waitText(p, 'Com et trobes avui?');
    await p.click('button:text-is("Cansada")');
    await p.click('button:text-is("10 min")');
    await p.click('button:text-is("Genolls")');
    await p.click('text=Preparar la pràctica');
    await p.waitForSelector('button[aria-label="Postura següent"]');
    for (let i = 0; i < 60; i++) {
      const done = await p.evaluate(() => document.body.innerText.includes('Com t\'has sentit?'));
      if (done) break;
      await p.click('button[aria-label="Postura següent"]', { timeout: 2000 }).catch(() => {});
      await p.waitForTimeout(50);
    }
    await waitText(p, 'Com t\'has sentit?');
    ok(true, 'en acabar demana la valoració');
    await p.click('button:has-text("Molt bé")');
    await p.click('button[aria-pressed]:text-is("Sí")');
    await p.fill('#eb-fb-note', 'Una mica el coll');
    await p.check('#eb-fb-keep');
    await p.click('button:text-is("Desar")');
    await waitText(p, 'Començar pràctica');
    await p.waitForTimeout(700);
    const practice = await p.evaluate(() => JSON.parse(localStorage.getItem('fake-sb-practice') || '[]'));
    ok(practice.length === 1, 'envia la pràctica al servidor');
    const pr = practice[0] || {};
    ok(pr.checkin && pr.checkin.energy === 'low' && pr.checkin.minutes === 10 && pr.checkin.discomfort.includes('Genolls'), 'desa com es trobava abans');
    ok(pr.feeling === 4 && pr.discomfort === 'Una mica el coll', 'desa la valoració i la molèstia');
    ok(Array.isArray(pr.pose_ids) && pr.pose_ids.length > 0, 'desa les postures fetes');
    const knee = await p.evaluate((ids) => (window.EBPoses.effective()).filter(a => ids.includes(a.id) && (a.contraindications || []).includes('lesio-genoll')).map(a => a.id), pr.pose_ids || []);
    ok(knee.length === 0, 'amb molèstia de genolls no hi ha postures contraindicades: ' + knee.join(','));
    const home = await text(p);
    ok(home.includes('Repetir l\'última'), 'ofereix repetir l\'última pràctica');
    const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('elbosc-sessions') || '[]'));
    ok(saved.length === 1 && saved[0].poseIds.length === pr.pose_ids.length, 'desa la sessió per repetir-la');
    const body = await text(p);
    ok(/1\s*Dies consecutius/.test(body) && /1 \/ \d\s*Aquesta setmana/.test(body), 'ratxa 1 i 1 aquesta setmana');
    ok(p.errors.length === 0, 'sense errors JS: ' + p.errors.join(' | '));
    await p.context().close();
  }

  console.log('10. Esborrar el compte');
  {
    const p = await page(browser, { role: 'student', status: 'active', quizDone: true, name: 'Anna' });
    await p.goto(BASE);
    await p.fill('#eb-email', 'anna@example.com');
    await p.click('button[type=submit]');
    await p.fill('#eb-code', '123456');
    await p.click('button[type=submit]');
    await waitText(p, 'Començar pràctica');
    await p.click('button[aria-label="El teu perfil"]');
    await p.click('text=Esborrar el meu compte');
    await waitText(p, 'Toca de nou');
    await p.click('text=Toca de nou');
    await waitText(p, 'Entra a El Bosc');
    const calls = await p.evaluate(() => window.__sbCalls);
    ok(calls.some(c => c.rpc === 'delete_my_account'), 'crida delete_my_account i torna a l\'accés');
    const left = await p.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('elbosc-')));
    ok(left.length === 0, 'no deixa dades al dispositiu: ' + left.join(','));
    await p.context().close();
  }

  console.log('11. Postures de la professora arriben a les alumnes');
  {
    const p = await page(browser, { role: 'teacher' });
    await p.goto(BASE);
    await p.fill('#eb-email', 'celia@example.com');
    await p.click('button[type=submit]');
    await p.fill('#eb-code', '123456');
    await p.click('button[type=submit]');
    await waitText(p, 'Inici');
    await p.click('text=Inici');
    await p.click('button[aria-label="El teu perfil"]');
    await p.click('text=Afegir o treure postures');
    await p.fill('input[placeholder="Nom"]', 'Postura del roure');
    await p.click('button:text-is("Afegir")');
    await p.waitForTimeout(800);
    const cat = await p.evaluate(() => JSON.parse(localStorage.getItem('fake-sb-catalog') || '[]'));
    ok(cat.some(r => r.kind === 'pose' && r.payload.name.ca === 'Postura del roure'), 'la postura es desa al servidor');
    await p.context().close();

    const q = await page(browser, { role: 'student', status: 'active', quizDone: true, name: 'Anna', catalog: cat });
    await q.goto(BASE);
    await q.fill('#eb-email', 'anna@example.com');
    await q.click('button[type=submit]');
    await q.fill('#eb-code', '123456');
    await q.click('button[type=submit]');
    await waitText(q, 'Començar pràctica');
    await q.getByRole('button', { name: 'Postures', exact: true }).click();
    await waitText(q, 'Postura del roure');
    ok(true, 'l\'alumna la veu a la biblioteca');
    ok(q.errors.length === 0, 'sense errors JS: ' + q.errors.join(' | '));
    await q.context().close();
  }

  console.log('12. Xat real: la professora escriu, l\'alumna rep i respon');
  {
    const annaId = 'u-anna@example.com';
    const p = await page(browser, {
      role: 'teacher',
      members: [{ email: 'anna@example.com', name: 'Anna', level: 'principiant', status: 'active', invited_at: '2026-10-01T10:00:00Z' },
                { email: 'nova@example.com', name: 'Nova', level: 'principiant', status: 'invited', invited_at: '2026-10-01T10:00:00Z' }],
      profiles: [{ id: annaId, email: 'anna@example.com', name: 'Anna', data: { profile: { level: 'intermedi', goals: ['Relaxació'] } } }],
    });
    await p.goto(BASE);
    await p.fill('#eb-email', 'celia@example.com');
    await p.click('button[type=submit]');
    await p.fill('#eb-code', '123456');
    await p.click('button[type=submit]');
    await waitText(p, 'Anna');
    const inbox = await text(p);
    ok(!inbox.includes('Núria') && !inbox.includes('Laia'), 'la safata ja no té alumnes de mostra');
    ok(!inbox.includes('Nova'), 'no mostra qui encara no ha entrat');
    await p.click('text=Anna');
    await p.fill('input[placeholder*="Anna"], textarea[placeholder*="Anna"]', 'Hola Anna, com va?');
    await p.keyboard.press('Enter');
    await p.waitForTimeout(600);
    let msgs = await p.evaluate(() => JSON.parse(localStorage.getItem('fake-sb-messages') || '[]'));
    ok(msgs.length === 1 && msgs[0].student_id === annaId && msgs[0].body === 'Hola Anna, com va?', 'el missatge es desa per a l\'Anna');
    ok(p.errors.length === 0, 'sense errors JS: ' + p.errors.join(' | '));
    await p.context().close();

    const q = await page(browser, { role: 'student', status: 'active', quizDone: true, name: 'Anna', messages: msgs });
    await q.goto(BASE);
    await q.fill('#eb-email', 'anna@example.com');
    await q.click('button[type=submit]');
    await q.fill('#eb-code', '123456');
    await q.click('button[type=submit]');
    await waitText(q, 'Començar pràctica');
    await q.getByRole('button', { name: 'Xat', exact: true }).click();
    await waitText(q, 'Hola Anna, com va?');
    ok(true, 'l\'alumna veu el missatge de la professora');
    await q.waitForTimeout(400);
    msgs = await q.evaluate(() => JSON.parse(localStorage.getItem('fake-sb-messages') || '[]'));
    ok(!!msgs[0].read_at, 'queda marcat com a llegit');
    await q.fill('input[placeholder], textarea[placeholder]', 'Molt bé, gràcies!');
    await q.keyboard.press('Enter');
    await q.waitForTimeout(600);
    msgs = await q.evaluate(() => JSON.parse(localStorage.getItem('fake-sb-messages') || '[]'));
    ok(msgs.some(m => m.from_role === 'student' && m.body === 'Molt bé, gràcies!'), 'la resposta de l\'alumna es desa');
    ok(q.errors.length === 0, 'sense errors JS: ' + q.errors.join(' | '));
    await q.context().close();
  }

  console.log('13. Diari al compte: no es perd en canviar de mòbil');
  {
    const login = async (p) => {
      await p.goto(BASE);
      await p.fill('#eb-email', 'anna@example.com');
      await p.click('button[type=submit]');
      await p.fill('#eb-code', '123456');
      await p.click('button[type=submit]');
      await waitText(p, 'Començar pràctica');
    };
    const p = await page(browser, { role: 'student', status: 'active', quizDone: true, name: 'Anna' });
    await login(p);
    await p.getByRole('button', { name: 'Diari', exact: true }).click();
    await p.fill('textarea[placeholder="..."]', 'Avui he dormit millor després del ioga');
    await p.click('text=Guardar');
    await p.waitForTimeout(600);
    const personal = await p.evaluate(() => JSON.parse(localStorage.getItem('fake-sb-personal') || '[]'));
    ok(personal.some(r => r.kind === 'journal' && r.user_id === 'u-anna@example.com' && r.payload.text.includes('dormit millor')), 'l\'entrada es desa al compte de l\'alumna');
    await p.getByRole('button', { name: 'Inici', exact: true }).click();
    await p.click('button[aria-label="El teu perfil"]');
    await p.click('text=Tancar sessió');
    await waitText(p, 'Entra a El Bosc');
    ok(await p.evaluate(() => !localStorage.getItem('elbosc-journal')), 'en tancar sessió el diari no queda al mòbil');
    await p.context().close();

    const q = await page(browser, { role: 'student', status: 'active', quizDone: true, name: 'Anna', personal });
    await login(q);
    await q.getByRole('button', { name: 'Diari', exact: true }).click();
    await waitText(q, 'dormit millor');
    ok(true, 'en un altre mòbil l\'entrada hi és');
    ok(q.errors.length === 0, 'sense errors JS: ' + q.errors.join(' | '));
    await q.context().close();
  }

  console.log('14. Avís d\'errors: s\'envia sense dades personals (i mai en local)');
  {
    const sent = [];
    const mk = async (url) => {
      const ctx = await browser.newContext({ serviceWorkers: 'block' });
      await ctx.route('**/vendor/supabase.js', r => r.fulfill({ contentType: 'application/javascript', body: FAKE }));
      await ctx.route('**/*sentry.io/**', r => { sent.push(r.request().postData() || ''); r.fulfill({ status: 200, body: '{}' }); });
      const p = await ctx.newPage();
      await p.goto(url);
      await waitText(p, 'Entra a El Bosc');
      await p.evaluate(() => setTimeout(() => { throw new Error('Fallada per a anna@example.com a ?inv=abc123'); }, 0));
      await p.waitForTimeout(1500);
      await ctx.close();
    };
    await mk(BASE);
    ok(sent.length === 0, 'en local no envia res');
    const other = BASE.replace('localhost', '127.0.0.2');
    await mk(other);
    const all = sent.join('\n');
    ok(sent.length > 0, 'a la web publicada sí que envia l\'error');
    ok(!all.includes('anna@example.com') && !all.includes('abc123'), 'sense correus ni paràmetres de l\'adreça');
  }

  console.log('15. Respiració i meditació');
  {
    const p = await page(browser, { role: 'student', status: 'active', quizDone: true, name: 'Anna' });
    await p.clock.install();
    await p.goto(BASE);
    await p.fill('#eb-email', 'anna@example.com');
    await p.click('button[type=submit]');
    await p.fill('#eb-code', '123456');
    await p.click('button[type=submit]');
    await waitText(p, 'Començar pràctica');
    await p.click('button:has-text("Respira")');
    await waitText(p, 'Quadrada');
    await p.click('button:text-is("4-7-8")');
    await p.click('button:text-is("3 min")');
    await p.click('button:text-is("Començar")');
    await waitText(p, 'Inspira');
    await p.clock.fastForward('00:05');
    await waitText(p, 'Reté');
    ok(true, 'segueix les fases inspira → reté');
    await p.clock.fastForward('03:00');
    await waitText(p, 'minuts de calma');
    ok(true, 'en acabar el temps mostra el resum');
    await p.waitForTimeout(400);
    const practice = await p.evaluate(() => JSON.parse(localStorage.getItem('fake-sb-practice') || '[]'));
    ok(practice.some(r => r.checkin && r.checkin.type === 'respiracio' && r.duration_sec === 180), 'compta com a pràctica (3 min de respiració)');
    await p.click('text=Tornar a l\'inici');
    await p.click('button:has-text("Medita")');
    await waitText(p, 'Campana cada 5 minuts');
    ok(true, 'obre la meditació amb temporitzador');
    await p.click('button[aria-label="Sortir"]');
    await waitText(p, 'La teva constància');
    ok((await text(p)).includes('1 dies practicats') && (await text(p)).includes('✓ Primera pràctica'), 'el calendari de constància mostra el dia d\'avui');
    ok(p.errors.length === 0, 'sense errors JS: ' + p.errors.join(' | '));
    await p.context().close();
  }

  console.log('16. Professora: seguiment, assignar rutina i informe; l\'alumna la fa');
  {
    const annaId = 'u-anna@example.com';
    const routine = { id: 'r-esquena', name: 'Esquena suau', poseIds: ['balasana', 'marjariasana', 'savasana'] };
    const p = await page(browser, {
      role: 'teacher',
      members: [{ email: 'anna@example.com', name: 'Anna', level: 'principiant', status: 'active', invited_at: '2026-10-01T10:00:00Z' }],
      profiles: [{ id: annaId, email: 'anna@example.com', name: 'Anna', data: { profile: { level: 'principiant', goals: ['Relaxació'], currentInjuries: ['Esquena baixa'] } } }],
      practice: [{ id: 'p1', user_id: annaId, completed_at: new Date(Date.now() - 2 * 864e5).toISOString(), duration_sec: 1200, poses: 12, feeling: 2, discomfort: 'Em fa mal el genoll en el guerrer', checkin: { energy: 'low', minutes: 20, discomfort: ['Genolls'] } }],
      catalog: [{ kind: 'routine', id: routine.id, payload: routine }],
    });
    await p.goto(BASE);
    await p.fill('#eb-email', 'celia@example.com');
    await p.click('button[type=submit]');
    await p.fill('#eb-code', '123456');
    await p.click('button[type=submit]');
    await waitText(p, 'Inici');
    await p.getByRole('button', { name: 'Inici', exact: true }).click();
    await p.click('button[aria-label="El teu perfil"]');
    await p.click('text=Seguiment de les alumnes');
    await waitText(p, 'Molèsties recents');
    ok(true, 'avisa que l\'Anna té molèsties recents');
    await p.click('button:has-text("Anna")');
    await waitText(p, 'Em fa mal el genoll');
    ok(true, 'la fitxa mostra la valoració i la molèstia');
    await p.selectOption('#tp-routine', routine.id);
    await p.fill('#tp-note', 'Fes-la abans de dormir');
    await p.click('button:text-is("Assignar")');
    await waitText(p, 'Pendent');
    const asg = await p.evaluate(() => JSON.parse(localStorage.getItem('fake-sb-assignments') || '[]'));
    ok(asg.length === 1 && asg[0].student_id === annaId && asg[0].routine.poseIds.length === 3, 'assigna la rutina a l\'Anna');
    await p.click('button:has-text("Informe")');
    await waitText(p, 'Imprimir o desar PDF');
    ok((await text(p)).toUpperCase().includes('INFORME DE SEGUIMENT'), 'obre l\'informe imprimible');
    ok(p.errors.length === 0, 'sense errors JS: ' + p.errors.join(' | '));
    await p.context().close();

    const q = await page(browser, { role: 'student', status: 'active', quizDone: true, name: 'Anna', assignments: asg });
    await q.goto(BASE);
    await q.fill('#eb-email', 'anna@example.com');
    await q.click('button[type=submit]');
    await q.fill('#eb-code', '123456');
    await q.click('button[type=submit]');
    await waitText(q, 'Esquena suau');
    ok((await text(q)).toUpperCase().includes('LA CÈLIA T\'HA PREPARAT'), 'l\'alumna veu la rutina assignada');
    await q.click('button:text-is("Començar")');
    for (let i = 0; i < 10; i++) {
      if (await q.evaluate(() => document.body.innerText.includes('Com t\'has sentit?'))) break;
      await q.click('button[aria-label="Postura següent"]', { timeout: 2000 }).catch(() => {});
      await q.waitForTimeout(50);
    }
    await waitText(q, 'Com t\'has sentit?');
    await q.waitForTimeout(400);
    const after = await q.evaluate(() => JSON.parse(localStorage.getItem('fake-sb-assignments') || '[]'));
    ok(after[0] && after[0].done_at, 'en acabar-la queda marcada com a feta');
    ok(q.errors.length === 0, 'sense errors JS: ' + q.errors.join(' | '));
    await q.context().close();
  }

  console.log('17. Foto de la professora en una postura');
  {
    const p = await page(browser, { role: 'teacher' });
    await p.goto(BASE);
    await p.fill('#eb-email', 'celia@example.com');
    await p.click('button[type=submit]');
    await p.fill('#eb-code', '123456');
    await p.click('button[type=submit]');
    await waitText(p, 'Postures');
    await p.getByRole('button', { name: 'Postures', exact: true }).click();
    await p.click('text=Postura del nen');
    await waitText(p, 'Afegir foto');
    const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    await p.setInputFiles('input[type=file][accept="image/*"]', { name: 'nen.gif', mimeType: 'image/gif', buffer: gif });
    await waitText(p, 'Canviar');
    await p.waitForTimeout(500);
    const cat = await p.evaluate(() => JSON.parse(localStorage.getItem('fake-sb-catalog') || '[]'));
    const m = cat.find(r => r.kind === 'pose_media' && r.id === 'balasana');
    ok(!!(m && m.payload.photo), 'la foto queda desada a la postura');
    ok(p.errors.length === 0, 'sense errors JS: ' + p.errors.join(' | '));
    await p.context().close();

    const q = await page(browser, { role: 'student', status: 'active', quizDone: true, name: 'Anna', catalog: cat });
    await q.goto(BASE);
    await q.fill('#eb-email', 'anna@example.com');
    await q.click('button[type=submit]');
    await q.fill('#eb-code', '123456');
    await q.click('button[type=submit]');
    await waitText(q, 'Començar pràctica');
    await q.getByRole('button', { name: 'Postures', exact: true }).click();
    await q.click('text=Postura del nen');
    await q.waitForSelector('img[alt="La Cèlia fent la postura"]', { timeout: 10000 });
    ok(true, 'l\'alumna veu la foto de la Cèlia');
    ok(!(await text(q)).includes('Afegir foto'), 'l\'alumna no pot pujar fotos');
    await q.context().close();
  }

  console.log('18. Avisos: secció a Configuració i obrir el xat des d\'una notificació');
  {
    const p = await page(browser, { role: 'student', status: 'active', quizDone: true, name: 'Anna' });
    await p.goto(BASE + '?tab=messages');
    await p.fill('#eb-email', 'anna@example.com');
    await p.click('button[type=submit]');
    await p.fill('#eb-code', '123456');
    await p.click('button[type=submit]');
    await waitText(p, 'Esperant un missatge de la Cèlia');
    ok(true, 'amb ?tab=messages obre directament el xat');
    await p.getByRole('button', { name: 'Inici', exact: true }).click();
    await p.click('button[aria-label="El teu perfil"]');
    await waitText(p, 'pantalla d\'inici');
    ok(true, 'a l\'iPhone sense instal·lar explica que cal afegir l\'app a la pantalla d\'inici');
    ok(p.errors.length === 0, 'sense errors JS: ' + p.errors.join(' | '));
    await p.context().close();
  }

  console.log('19. Guia per instal·lar l\'app');
  {
    const p = await page(browser, { role: 'student', status: 'active', quizDone: true, name: 'Anna' });
    await p.goto(BASE);
    await p.fill('#eb-email', 'anna@example.com');
    await p.click('button[type=submit]');
    await p.fill('#eb-code', '123456');
    await p.click('button[type=submit]');
    await waitText(p, 'Instal·la El Bosc al mòbil');
    await p.click('button:text-is("Com fer-ho")');
    await waitText(p, 'Afegir a la pantalla d\'inici');
    ok((await text(p)).includes('Safari'), 'a l\'iPhone explica els passos amb Safari');
    await p.click('button[aria-label="Tancar"]');
    await p.click('button:text-is("Ara no")');
    await p.reload();
    await waitText(p, 'Començar pràctica');
    ok(!(await text(p)).includes('Instal·la El Bosc al mòbil'), 'si dius "Ara no" no torna a sortir');
    ok(p.errors.length === 0, 'sense errors JS: ' + p.errors.join(' | '));
    await p.context().close();
  }

  console.log('20. Notes de veu al xat');
  {
    const msgs = [{ id: 'm1', student_id: 'u-anna@example.com', from_role: 'teacher', kind: 'text', body: 'Hola Anna!', created_at: new Date(Date.now() - 60000).toISOString(), read_at: null, reactions: [] }];
    const p = await page(browser, { role: 'student', status: 'active', quizDone: true, name: 'Anna', messages: msgs });
    await p.goto(BASE + '?tab=messages');
    await p.fill('#eb-email', 'anna@example.com');
    await p.click('button[type=submit]');
    await p.fill('#eb-code', '123456');
    await p.click('button[type=submit]');
    await waitText(p, 'Hola Anna!');
    await p.click('button[aria-label="Àudio"]');
    await waitText(p, 'Gravant… 0:02');
    ok(true, 'el comptador avança mentre grava');
    await p.click('button[aria-label="Descartar"]');
    await p.click('button[aria-label="Àudio"]');
    await waitText(p, 'Gravant… 0:01');
    ok(true, 'després de descartar es pot tornar a gravar');
    await p.click('button[aria-label="Enviar"]');
    await p.waitForFunction(() => (window.__sbCalls || []).some(c => c.upload && /\.(m4a|webm|ogg)$/.test(c.upload)), null, { timeout: 8000 });
    const up = await p.evaluate(() => window.__sbCalls.find(c => c.upload && /\.(m4a|webm|ogg)$/.test(c.upload)));
    ok(/^audio\/(mp4|webm|ogg)$/.test(up.type), 'puja l\'àudio amb un tipus que el servidor accepta (' + up.type + ')');
    ok(await p.locator('button[aria-label="Reproduir àudio"]').count() === 1, 'la nota de veu surt al xat amb el botó de reproduir');
    ok(p.errors.length === 0, 'sense errors JS: ' + p.errors.join(' | '));
    await p.context().close();
  }

  console.log('21. La professora grava la seva veu');
  {
    const p = await page(browser, { role: 'teacher', status: 'active', quizDone: true, name: 'Cèlia' });
    await p.goto(BASE);
    await p.fill('#eb-email', 'celia@example.com');
    await p.click('button[type=submit]');
    await p.fill('#eb-code', '123456');
    await p.click('button[type=submit]');
    await p.getByRole('button', { name: 'Inici', exact: true }).click();
    await p.click('button[aria-label="El teu perfil"]');
    await p.click('text=La teva veu');
    await waitText(p, '0 de 73 gravades');
    await p.click('button[aria-label^="Gravar: Respira a poc a poc"]');
    await waitText(p, 'Gravant… 0:01');
    await p.click('button[aria-label="Aturar i desar"]');
    await waitText(p, '1 de 73 gravades');
    const cat = await p.evaluate(() => JSON.parse(localStorage.getItem('fake-sb-catalog') || '[]'));
    const row = cat.find(r => r.kind === 'voice' && r.id === 'breathe');
    ok(row && /^voice\/breathe-/.test(row.payload.path), 'desa la gravació al catàleg compartit');
    ok(await p.locator('button[aria-label="Escoltar: Respira a poc a poc."]').count() === 1, 'es pot escoltar la frase gravada');
    await p.click('button[aria-label="Esborrar: Respira a poc a poc."]');
    await waitText(p, '0 de 73 gravades');
    ok(true, 'es pot esborrar');
    ok(p.errors.length === 0, 'sense errors JS: ' + p.errors.join(' | '));
    await p.context().close();
  }

  await browser.close();
  console.log(failures ? `\n${failures} prova(es) fallida(es)` : '\nTot correcte');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
