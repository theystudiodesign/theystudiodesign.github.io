const CACHE = 'they-gestion-v38';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './idb.js', './queue.js', './storage.js', './sync-engine.js', './auth-sync.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
    // Purge des instances ZOMBIES: à chaque nouvelle version, TOUTES les fenêtres
    // ouvertes (onglets + PWA installée) rechargent sur le nouveau build —
    // plus aucune instance à l'ancien code ne peut écraser le storage/cloud.
    const cs = await self.clients.matchAll({ type: 'window' });
    cs.forEach(c => { try { c.navigate(c.url) } catch (err) {} });
  })());
});

self.addEventListener('fetch', e => {
  const isHTML = e.request.mode === 'navigate' || (e.request.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    // NETWORK FIRST pour le HTML: dima l'version jdida, cache ghir ila ma kaynch internet
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
  } else {
    // CACHE FIRST pour les assets (icons, manifest)
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      }))
    );
  }
});
