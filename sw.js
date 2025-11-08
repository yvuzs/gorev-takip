// sw.js - basit PWA önbellekleme + çevrimdışı fallback
const CACHE = "gorev-takip-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png"
];

// Kurulum: temel dosyaları al
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Eski cache'leri temizle
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// İstek yakalama: öncelik ağ (GitHub/Worker güncel kalsın), düşerse cache
self.addEventListener("fetch", (e) => {
  const req = e.request;

  // Yalnız GET taleplerini cache'le
  if (req.method !== "GET") return;

  e.respondWith(
    fetch(req).then((res) => {
      // Başarılı cevapları sessizce cache'e koy
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(req, clone)).catch(()=>{});
      return res;
    }).catch(async () => {
      // Ağ yoksa cache'den ver veya basit bir fallback
      const cached = await caches.match(req, { ignoreSearch: true });
      return cached || new Response(
        "<h1>Çevrimdışı</h1><p>Bağlantı yokken sınırlı görünüm.</p>",
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    })
  );
});
