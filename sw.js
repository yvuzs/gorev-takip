// sw.js — güvenli, sade cache
const CACHE = 'gorev-takip-v7';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Sadece http/https ve aynı origin istekleri cache’lensin.
function canCache(req) {
  try {
    const u = new URL(req.url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false; // chrome-extension vs.
    // Harici domainleri (script.google.com gibi) cache’lemek istemiyorsak aşağıyı aç:
    // if (u.origin !== self.location.origin) return false;
    return true;
  } catch { return false; }
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
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
  const req = e.request;
  // Sadece GET + cache’lenebilir isteklerde çalış
  if (req.method !== 'GET' || !canCache(req)) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        // Opaque ya da başarısız cevapları cache’e koyma
        if (res.ok && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone)).catch(()=>{});
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
