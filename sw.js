const CACHE = 'guitarlog-v8';
const URLS = [
  '/guitarlog/',
  '/guitarlog/index.html',
  '/guitarlog/manifest.webmanifest',
  '/guitarlog/icon-192.png',
  '/guitarlog/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(URLS)));
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

  // index.html はネットワーク優先（常に最新を取得、オフライン時のみキャッシュを使う）
  if (url.pathname === '/guitarlog/' || url.pathname === '/guitarlog/index.html') {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // 画像・マニフェストはキャッシュ優先
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
