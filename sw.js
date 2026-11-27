const CACHE = 'elbosc-v35';

const SHELL = [
  './',
  './manifest.webmanifest',
  './icon.svg',
  './styles/tokens.css',
  './app.jsx',
  './index.html',
  './styles/shell.css',
  './styles/modern.css',
  './components/Auth.jsx',
  './components/Consent.jsx',
  './components/Checkin.jsx',
  './components/Breath.jsx',
  './components/Teacher.jsx',
  './components/Install.jsx',
  './privacitat.html',
  './components/Chat.jsx',
  './tweaks-panel.jsx',
  './components/Icons.jsx',
  './components/Onboarding.jsx',
  './components/PoseIllustrations.jsx',
  './components/Practice.jsx',
  './components/Screens.jsx',
  './data/backend.jsx',
  './data/sound.jsx',
  './data/asanas.jsx',
  './data/i18n.jsx',
  './data/sequencer.jsx',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-152.png',
  './icons/apple-touch-icon.png',
  './vendor/react.production.min.js',
  './vendor/react-dom.production.min.js',
  './vendor/babel.min.js',
  './vendor/supabase.js',
  './vendor/sentry.min.js',
  './vendor/fonts/fonts-local.css',
  './vendor/fonts/00245b9a1c71f4b4.woff2',
  './vendor/fonts/0090d91bf7c2283f.woff2',
  './vendor/fonts/013d98d26d5ff81f.woff2',
  './vendor/fonts/0365c55734a4690f.woff2',
  './vendor/fonts/06e65844344fcae1.woff2',
  './vendor/fonts/0734c99865d0b923.woff2',
  './vendor/fonts/08c567d2b49b081d.woff2',
  './vendor/fonts/0940d166a7c25e04.woff2',
  './vendor/fonts/0a5753b0887adf6e.woff2',
  './vendor/fonts/0b848d2a008f717d.woff2',
  './vendor/fonts/136caeb9c1d5a232.woff2',
  './vendor/fonts/1ab1ad55902b85eb.woff2',
  './vendor/fonts/1c816d9e9e8af637.woff2',
  './vendor/fonts/1d4d36aa9d98896e.woff2',
  './vendor/fonts/1f7274147e0cf842.woff2',
  './vendor/fonts/1fba8b406f1052de.woff2',
  './vendor/fonts/2014a20698977e60.woff2',
  './vendor/fonts/2111493947592a10.woff2',
  './vendor/fonts/2866250edd4b652f.woff2',
  './vendor/fonts/2ce71852e431dd09.woff2',
  './vendor/fonts/3020b46914bebae5.woff2',
  './vendor/fonts/3102e2d4158d29bc.woff2',
  './vendor/fonts/37a15f2c6002c646.woff2',
  './vendor/fonts/4230ff7b3da0ccbd.woff2',
  './vendor/fonts/44d82aa937a2bd4d.woff2',
  './vendor/fonts/4beeea23a917011b.woff2',
  './vendor/fonts/539f734d82935215.woff2',
  './vendor/fonts/5637aaf62f60ce11.woff2',
  './vendor/fonts/5b1f30ec2e6494a7.woff2',
  './vendor/fonts/5f813686b161c761.woff2',
  './vendor/fonts/63f1654d1edffbf5.woff2',
  './vendor/fonts/64149ce22ab1f3e9.woff2',
  './vendor/fonts/656bbed6cec359a3.woff2',
  './vendor/fonts/6aa8d83d0cf78ea0.woff2',
  './vendor/fonts/6b226757920342b9.woff2',
  './vendor/fonts/6e1a6b2b96f42112.woff2',
  './vendor/fonts/7249155f7a06f797.woff2',
  './vendor/fonts/749a308406a63378.woff2',
  './vendor/fonts/7739a76da5efc8a2.woff2',
  './vendor/fonts/7d0fab259c5c3eed.woff2',
  './vendor/fonts/7f5a19dba64747e9.woff2',
  './vendor/fonts/8076fff0918bfd0f.woff2',
  './vendor/fonts/812acfe694de202b.woff2',
  './vendor/fonts/8ef97feeda43a26a.woff2',
  './vendor/fonts/917f8c518c3519b8.woff2',
  './vendor/fonts/95b0f05e776b0f93.woff2',
  './vendor/fonts/9c836b9521cd57dd.woff2',
  './vendor/fonts/9f59cec0deafafca.woff2',
  './vendor/fonts/a0baad365ea0059d.woff2',
  './vendor/fonts/a30c5a7e456cbadd.woff2',
  './vendor/fonts/a70a3c8d84cdc37a.woff2',
  './vendor/fonts/a7c918b36e4710d3.woff2',
  './vendor/fonts/a87ef573baf7863d.woff2',
  './vendor/fonts/a949fd4e85dcc58c.woff2',
  './vendor/fonts/aa95cc6e0229ee5f.woff2',
  './vendor/fonts/af1ab603c536a7d2.woff2',
  './vendor/fonts/b37d27cda4682cf6.woff2',
  './vendor/fonts/ba39b6fe44e8059d.woff2',
  './vendor/fonts/bd3fa9fe6bd521d9.woff2',
  './vendor/fonts/c8fa4b8e6ccfde8d.woff2',
  './vendor/fonts/cec190fce7d5a510.woff2',
  './vendor/fonts/d0047bdfc4ce6a31.woff2',
  './vendor/fonts/d693588a05a0cc58.woff2',
  './vendor/fonts/da2b612d2ce1b905.woff2',
  './vendor/fonts/daaed440e0c7d67a.woff2',
  './vendor/fonts/dbaabe890530dabe.woff2',
  './vendor/fonts/dd2628c39ef6782a.woff2',
  './vendor/fonts/dd44b623b9169168.woff2',
  './vendor/fonts/ddf39df59d677931.woff2',
  './vendor/fonts/e34c5f1bf15ea3cc.woff2',
  './vendor/fonts/e6113f5acf1467af.woff2',
  './vendor/fonts/e99b45a2e78db55d.woff2',
  './vendor/fonts/eb977a646b7204a9.woff2',
  './vendor/fonts/edcb537a3c69de93.woff2',
  './vendor/fonts/f2197f6858853184.woff2',
  './vendor/fonts/f6fc0f51aacca05c.woff2',
  './vendor/fonts/f796f680b7aadef1.woff2',
  './vendor/fonts/f802c1b5f105546c.woff2',
  './vendor/fonts/f9b24d749d791969.woff2',
  './vendor/fonts/fc546c161520abaa.woff2',
  './vendor/fonts/fc83e07548c4813a.woff2',
  './vendor/fonts/fe99e30326667f07.woff2',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // Només gestionem GET del mateix origen. Supabase i altres serveis van
  // sempre directes a la xarxa (mai a la caché).
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // Navegació HTML: xarxa primer; sense connexió, la còpia desada.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Recursos: resposta immediata des de la caché i actualització en segon
  // pla (si es publica un canvi sense pujar CACHE, arriba a la visita següent).
  e.respondWith(
    caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true }).then(cached => {
      const net = fetch(req).then(res => {
        if (res && res.ok) c.put(req, res.clone());
        return res;
      }).catch(() => cached);
      return cached || net;
    }))
  );
});

// ── Notificacions push ───────────────────────────────────────────────────────
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(data.title || 'El Bosc', {
    body: data.body || '',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    tag: data.tag || 'elbosc',
    data: { url: data.url || './' },
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) {
      if (c.url.startsWith(self.registration.scope)) { c.focus(); c.postMessage({ type: 'open', url: target }); return; }
    }
    return clients.openWindow(target);
  }));
});
