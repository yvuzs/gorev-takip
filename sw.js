// sw.js - PWA cache stratejisi (v6)
const CACHE = "gorev-takip-v6"; // versiyonu artırırsan tüm eski cache temizlenir
const ASSETS = [
  "./",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png"
];

// Install: sadece statik varlıkları önbelleğe al (index.html YOK!)
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: eski cache'leri temizle ve anında kontrolü al
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// İstemciden "SKIP_WAITING" gelirse hemen aktif ol
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

// Fetch
self.addEventListener("fetch", (e) => {
  const req = e.request;

  // Sadece GET cache'lenir
  if (req.method !== "GET") return;

  // 1) HTML/NAVIGATION istekleri → NETWORK FIRST (en güncel dosyayı gör)
  const isHTML = req.mode === "navigate" ||
                 (req.headers.get("accept") || "").includes("text/html");
  if (isHTML) {
    e.respondWith(
      fetch(req, { cache: "no-store" })
        .then(res => {
          // başarlıysa arka planda cache'e koy (bir sonraki offline için)
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone)).catch(()=>{});
          return res;
        })
        .catch(async () => {
          // ağ yoksa cache'e düş
          const cached = await caches.match(req, { ignoreSearch: true });
          return cached || new Response(
            "<h1>Çevrimdışı</h1><p>Bağlantı yokken sınırlı görünüm.</p>",
            { headers: { "Content-Type": "text/html; charset=utf-8" } }
          );
        })
    );
    return;
  }

  // 2) Diğer varlıklar → STALE-WHILE-REVALIDATE
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(cached => {
      const net = fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone)).catch(()=>{});
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
