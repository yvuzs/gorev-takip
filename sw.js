// sw.js — güvenli, sade cache
const CACHE = 'gorev-takip-v8';
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
    // Sadece http(s) olsun
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    // chrome-extension, devtools, blob, data: URI gibi şeyleri engelle
    if (u.protocol.startsWith('chrome-extension') || u.protocol.startsWith('devtools') || u.protocol.startsWith('data:') || u.protocol.startsWith('blob:')) return false;
    // sadece aynı domain cache’le
    if (u.origin !== self.location.origin) return false;
    return true;
  } catch {
    return false;
  }
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

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1) Chrome eklenti istekleriyle asla uğraşma
  if (url.protocol === 'chrome-extension:') return;

  // 2) Apps Script / diğer harici isteklerde asla cache'e sokma, direkt geçir
  if (url.hostname.endsWith('script.google.com') ||
      url.hostname.endsWith('script.googleusercontent.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 3) Kalanları (aynı origin) istersen cache-first ya da network-first ele al
  // Basit network-first:
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});


