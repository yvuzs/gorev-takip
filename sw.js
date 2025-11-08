// sw.js (minimal ve güvenli)
const CACHE = 'gt-v1';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './styles.css', './app.js', // varsa
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // 1) Chrome extension, data:, chrome-extension: vs. asla dokunma
  if (url.protocol === 'chrome-extension:' || url.protocol === 'chrome:'
      || url.protocol === 'data:') return;

  // 2) Sadece aynı origin (github.io’daki kendi dosyaların) için cache-strategy
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(res =>
        res || fetch(e.request).then(r => {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return r;
        })
      )
    );
    return;
  }

  // 3) Cross-origin (örn: https://script.google.com) → doğrudan network
  //    (CORS/credentiallar Apps Script’in verdiği gibi kalsın)
  e.respondWith(fetch(e.request));
});
