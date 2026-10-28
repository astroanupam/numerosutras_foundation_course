// Lets the app open without internet. Network first (so a new build is picked up at once), cache when the network is slow or missing.
const CACHE = 'numerosutras-v1';
const FILES = ['./', './index.html', './content.js', './content-hi.js', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png', './icon-180.png'];
// content-hi.js is optional: if a host lacks it the install must still succeed
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.filter(f => f !== './content-hi.js')).then(() => c.add('./content-hi.js').catch(() => {}))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
const fromCache = req => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(new Promise(resolve => {
    let settled = false;
    const timer = setTimeout(() => { if (!settled) fromCache(req).then(r => { if (r && !settled) { settled = true; resolve(r); } }); }, 4000);   // slow link: use the saved copy
    fetch(req, { cache: 'no-cache' }).then(res => {
      clearTimeout(timer);
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      if (!settled) { settled = true; resolve(res); }
    }).catch(() => { clearTimeout(timer); fromCache(req).then(r => { if (!settled) { settled = true; resolve(r || Response.error()); } }); });
  }));
});
