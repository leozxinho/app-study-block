/* StudyBlock — service worker (app instalável e funcionando sem internet no que já foi aberto).
 * - Páginas: rede primeiro; sem internet, usa o app.html guardado (o index.html é a landing, sem o app).
 * - Arquivos do build (/assets) e ícones: guardados na 1ª vez (nunca mudam de nome).
 * - Áudios (/audio): guardados quando tocam pela 1ª vez; o índice manifest.json sempre da rede.
 * Supabase e outros endereços externos não passam por aqui.
 */
const VERSION = 'minelearn-v2';
const SHELL = ['/app.html', '/manifest.webmanifest', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function cacheFirst(request) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok && res.type === 'basic') cache.put(request, res.clone());
  return res;
}

async function networkFirstPage(request) {
  try {
    const res = await fetch(request);
    // Guarda o shell do app (qualquer rota menos "/", que é a landing estática)
    if (res.ok && new URL(request.url).pathname !== '/') {
      const cache = await caches.open(VERSION);
      cache.put('/app.html', res.clone());
    }
    return res;
  } catch {
    return (await caches.match('/app.html')) || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/audio/manifest.json') return; // índice sempre atualizado
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
    return;
  }
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/audio/')) {
    event.respondWith(cacheFirst(request));
  }
});
