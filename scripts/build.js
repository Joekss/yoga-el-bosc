#!/usr/bin/env node
// scripts/build.js — Genera dist/: la mateixa app, però compilada abans de publicar.
//
//   · Compila tots els .jsx (en l'ordre d'index.html) a un sol dist/app.js minificat,
//     així el mòbil ja no ha de baixar Babel (3 MB) ni compilar en obrir l'app.
//   · Copia la resta de fitxers estàtics.
//   · Escriu dist/sw.js amb la llista real de fitxers i una versió de caché
//     calculada del contingut: cada build nou s'actualitza sol a les alumnes.
//
// Ús:  npm run build      (després, publica la carpeta dist/)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const STATIC = ['manifest.webmanifest', 'icon.svg', 'privacitat.html', 'styles', 'icons',
  'vendor/react.production.min.js', 'vendor/react-dom.production.min.js',
  'vendor/supabase.js', 'vendor/591.supabase.js', 'vendor/fonts'];

const copy = (rel) => {
  const src = path.join(ROOT, rel), dst = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.cpSync(src, dst, { recursive: true });
};

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
  d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);

(async () => {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  // 1. Fitxers .jsx en l'ordre d'index.html
  let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const jsxFiles = [...html.matchAll(/<script type="text\/babel" src="([^"]+)"><\/script>/g)].map(m => m[1]);
  if (!jsxFiles.length) throw new Error('No s\'han trobat scripts text/babel a index.html');

  // Cada fitxer es transforma per separat i es concatena (comparteixen àmbit global,
  // igual que ara amb Babel al navegador).
  const parts = [];
  for (const f of jsxFiles) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const out = await esbuild.transform(src, { loader: 'jsx', jsx: 'transform', target: 'es2019', sourcefile: f, minifyWhitespace: true, minifySyntax: true });
    parts.push(`/* ${f} */\n${out.code}`);
  }
  const bundle = parts.join('\n');
  // Comprova que el conjunt és JavaScript vàlid (p. ex. noms globals repetits)
  await esbuild.transform(bundle, { loader: 'js' });
  fs.writeFileSync(path.join(DIST, 'app.js'), bundle);

  // 2. index.html sense Babel ni scripts text/babel
  html = html
    .replace(/\s*<script src="vendor\/babel\.min\.js"><\/script>/, '')
    .replace(/<script type="text\/babel" src="[^"]+"><\/script>\s*/g, '')
    .replace('<script>\n// Service worker', '<script src="app.js"></script>\n\n<script>\n// Service worker');
  if (!html.includes('src="app.js"')) throw new Error('No s\'ha pogut inserir app.js a index.html');
  fs.writeFileSync(path.join(DIST, 'index.html'), html);

  // 3. Estàtics
  STATIC.forEach(copy);

  // 4. Service worker amb la llista real i versió segons el contingut
  const files = walk(DIST).map(f => './' + path.relative(DIST, f).split(path.sep).join('/')).sort();
  const hash = crypto.createHash('sha256');
  files.forEach(f => hash.update(f).update(fs.readFileSync(path.join(DIST, f))));
  const version = hash.digest('hex').slice(0, 10);
  let sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  sw = sw.replace(/const CACHE = '[^']+';/, `const CACHE = 'elbosc-${version}';`)
         .replace(/const SHELL = \[[\s\S]*?\];/, `const SHELL = ${JSON.stringify(['./', ...files], null, 2)};`);
  fs.writeFileSync(path.join(DIST, 'sw.js'), sw);

  const kb = (f) => Math.round(fs.statSync(path.join(DIST, f)).size / 1024);
  console.log(`dist/ llest · ${files.length + 1} fitxers · app.js ${kb('app.js')} KB · caché elbosc-${version}`);
})().catch(e => { console.error(e.message || e); process.exit(1); });
