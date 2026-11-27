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
  const ctx = await browser.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
  await ctx.route('**/vendor/supabase.js', r => r.fulfill({ contentType: 'application/javascript', body: FAKE }));
  await ctx.addInitScript(s => { if (!sessionStorage.getItem('init')) { localStorage.clear(); if (s) localStorage.setItem('fake-sb', JSON.stringify(s)); if (s && s.catalog) localStorage.setItem('fake-sb-catalog', JSON.stringify(s.catalog)); sessionStorage.setItem('init', '1'); } }, scenario);
  const p = await ctx.newPage();
  p.errors = [];
  p.on('pageerror', e => p.errors.push(e.message));
  return p;
}
const text = (p) => p.innerText('body');
const waitText = (p, s) => p.waitForFunction(t => document.body.innerText.includes(t), s, { timeout: 15000 });

(async () => {
  const browser = await chromium.launch();

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
    // Pràctica: entra i salta totes les postures
    await p.click('text=Començar pràctica');
    for (let i = 0; i < 60; i++) {
      const done = await p.evaluate(() => document.body.innerText.includes('Començar pràctica'));
      if (done) break;
      await p.click('button[aria-label="Postura següent"]', { timeout: 2000 }).catch(() => {});
      await p.waitForTimeout(50);
    }
    await waitText(p, 'Començar pràctica');
    await p.waitForTimeout(500);
    const practice = await p.evaluate(() => JSON.parse(localStorage.getItem('fake-sb-practice') || '[]'));
    ok(practice.length === 1, 'envia la pràctica al servidor');
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
    await p.click('text=Gestionar postures');
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

  await browser.close();
  console.log(failures ? `\n${failures} prova(es) fallida(es)` : '\nTot correcte');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
