<!-- sw.js (Service Worker) -->
<script type="text/plain" id="__pwa_sw">
const CACHE_NAME = 'gorev-takip-v1';
const ASSETS = [
'./',
'./index.html', // kendi dosya adını yaz: gorev_takip.html gibi
'./manifest.webmanifest',
'./icons/icon-192.png',
'./icons/icon-512.png'
];
self.addEventListener('install', e=>{
e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
self.clients.claim();
});
self.addEventListener('fetch', e=>{
e.respondWith(
caches.match(e.request).then(r=> r || fetch(e.request).then(res=>{
const copy = res.clone();
caches.open(CACHE_NAME).then(c=>{ if(e.request.method==='GET' && res.ok) c.put(e.request, copy); });
return res;
}).catch(()=> caches.match('./')))
);
});
</script>