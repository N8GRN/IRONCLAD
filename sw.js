const APP_VERSION = 'v2025.2.24'; // ← BUMP THIS ON EVERY DEPLOY
const CACHE_NAME = `ironclad-crm-${APP_VERSION}`;
const REPO = '/IRONCLAD/'; // ← REPOSITORY NAME
const PAGES = '';  // Previously "pages/"

const PRECACHE_URLS = [
  // Core 
  REPO,
  REPO + 'index.html',
  REPO + 'offline.html',
  REPO + 'manifest.json',
  REPO + 'favicon.png',

  // Core JS/CSS
  REPO + 'js/app.js',
  REPO + 'css/styles.css',
  REPO + 'sw.js',

  // Pages
  REPO + PAGES + 'application.html',
  REPO + PAGES + 'home.html',
  REPO + PAGES + 'login.html',
  REPO + PAGES + 'newProject.html',
  REPO + PAGES + 'page1.html',
  REPO + PAGES + 'page2.html',
  REPO + PAGES + 'page3.html',
  REPO + PAGES + 'page4.html',
  REPO + PAGES + 'page5.html',
  REPO + PAGES + 'projects.html',

  // Images
  REPO + 'img/logo.png',
  REPO + 'img/icon.png',
  REPO + 'img/background.png',
  REPO + 'img/icons/logo.png',
  REPO + 'img/icons/apple-touch-icon.png',
  REPO + 'img/icons/icon-192x192.png',
  REPO + 'img/icons/icon-512x512.png',

  // Data (static)
  REPO + 'data/project_status.json',
  REPO + 'data/shingle_options.json',

  // Splash screens
  REPO + 'img/splash/splash-2048x2732.png',
  REPO + 'img/splash/splash-1668x2388.png',
  REPO + 'img/splash/splash-1536x2048.png'
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
        .catch(() => caches.match(REPO + 'offline.html') || caches.match(REPO + 'index.html'))
    );
    return;
  }

  // Data JSON files → Stale-while-revalidate (1-hour freshness)
  if (url.pathname.startsWith(REPO + 'data/') && url.pathname.endsWith('.json')) {
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
            return caches.match(REPO + 'offline.html');
          });
      })
  );
});