const APP_VERSION = 'v2025.2.14'; // ← BUMP THIS ON EVERY DEPLOY
const CACHE_NAME = `ironclad-crm-${APP_VERSION}`;

const PRECACHE_URLS = [
  '/IRONCLAD/',
  '/IRONCLAD/index.html',
  '/IRONCLAD/offline.html',        // ← Create this file!
  '/IRONCLAD/manifest.json',
  '/IRONCLAD/favicon.png',

  // Core JS/CSS
  '/IRONCLAD/js/app.js',
  '/IRONCLAD/css/styles.css',
  '/IRONCLAD/sw.js',

  // Pages
  '/IRONCLAD/pages/application.html',
  '/IRONCLAD/pages/home.html',
  '/IRONCLAD/pages/login.html',
  '/IRONCLAD/pages/newProject.html',
  '/IRONCLAD/pages/page1.html',
  '/IRONCLAD/pages/page2.html',
  '/IRONCLAD/pages/page3.html',
  '/IRONCLAD/pages/page4.html',
  '/IRONCLAD/pages/page5.html',
  '/IRONCLAD/pages/projects.html',

  // Images
  '/IRONCLAD/img/logo.png',
  '/IRONCLAD/img/icon.png',
  '/IRONCLAD/img/background.png',
  '/IRONCLAD/img/icons/logo.png',
  '/IRONCLAD/img/icons/apple-touch-icon.png',
  '/IRONCLAD/img/icons/icon-192x192.png',
  '/IRONCLAD/img/icons/icon-512x512.png',

  // Data (static)
  '/IRONCLAD/data/project_status.json',
  '/IRONCLAD/data/shingle_options.json',

  // Splash screens
  '/IRONCLAD/img/splash/splash-2048x2732.png',
  '/IRONCLAD/img/splash/splash-1668x2388.png',
  '/IRONCLAD/img/splash/splash-1536x2048.png'
];

// INSTALL
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`[SW ${APP_VERSION}] Precaching ${PRECACHE_URLS.length} assets`);
        return Promise.allSettled(
          PRECACHE_URLS.map(url => cache.add(url).catch(err => {
            console.warn(`[SW] Failed to cache: ${url}`, err);
          }))
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE – Clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME && key.startsWith('ironclad-crm-')) {
          console.log(`[SW] Deleting old cache: ${key}`);
          return caches.delete(key);
        }
      })
    ))
    .then(() => self.clients.claim())
  );
});

// FETCH
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignore cross-origin and non-http
  if (url.origin !== location.origin || !req.url.startsWith('http')) return;
  if (req.method !== 'GET') return fetch(req); // Let POSTs etc. go through

  // Navigation → Network-first + fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match('/IRONCLAD/offline.html') || caches.match('/IRONCLAD/index.html'))
    );
    return;
  }

  // Data JSON files → Stale-while-revalidate (1-hour freshness)
  if (url.pathname.startsWith('/IRONCLAD/data/') && url.pathname.endsWith('.json')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(req).then(cached => {
          const fetchPromise = fetch(req).then(netRes => {
            if (netRes && netRes.ok) {
              const clone = netRes.clone();
              clone.headers.set('sw-cached-at', Date.now());
              cache.put(req, clone);
            }
            return netRes;
          });

          if (cached) {
            const age = Date.now() - (parseInt(cached.headers.get('sw-cached-at')) || 0);
            if (age < 3_600_000) { // 1 hour
              event.waitUntil(fetchPromise);
              return cached;
            }
          }
          return fetchPromise.catch(() => cached || new Response('{"error":"offline"}', {
            headers: { 'Content-Type': 'application/json' }
          }));
        });
      })
    );
    return;
  }

  // Everything else → Stale-while-revalidate
  event.respondWith(
    caches.match(req)
      .then(cached => {
        if (cached) {
          event.waitUntil(
            fetch(req)
              .then(fresh => fresh && fresh.ok && caches.open(CACHE_NAME).then(c => c.put(req, fresh.clone())))
              .catch(() => {})
          );
          return cached;
        }

        return fetch(req)
          .then(res => {
            if (res && res.ok && res.type === 'basic') {
              const clone = res.clone();
              caches.open(CACHE_NAME).then(c => c.put(req, clone));
            }
            return res;
          })
          .catch(() => {
            if (req.destination === 'image') {
              return new Response(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='), {
                headers: { 'Content-Type': 'image/png' }
              });
            }
            return caches.match('/IRONCLAD/offline.html');
          });
      })
  );
});