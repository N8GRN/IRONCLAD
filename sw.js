const APP_VERSION = 'v2025.2.50'; // ← BUMP THIS ON EVERY DEPLOY
const CACHE_NAME = `ironclad-crm-${APP_VERSION}`;
const REPO = '/IRONCLAD'; // ← REPOSITORY NAME
const PAGES = '/pages';  // Previously "pages/"

// ===================================================================
// PRECACHE LIST – using REPO + PAGES where needed
// ===================================================================
const PRECACHE_URLS = [
  // Core
  REPO + '/',
  REPO + '/index.html',
  REPO + '/offline.html',
  REPO + '/manifest.json',
  REPO + '/favicon.png',

  // Core assets
  REPO + '/js/app.js',
  REPO + '/css/styles.css',
  REPO + '/sw.js',

  // Pages (using PAGES constant – safe even if you change it later)
  REPO + PAGES + '/application.html',
  REPO + PAGES + '/home.html',
  REPO + PAGES + '/login.html',
  REPO + PAGES + '/newProject.html',
  REPO + PAGES + '/page1.html',
  REPO + PAGES + '/page2.html',
  REPO + PAGES + '/page3.html',
  REPO + PAGES + '/page4.html',
  REPO + PAGES + '/page5.html',
  REPO + PAGES + '/projects.html',

  // Images & icons
  REPO + '/img/logo.png',
  REPO + '/img/icon.png',
  REPO + '/img/background.png',
  REPO + '/img/icons/logo.png',
  REPO + '/img/icons/apple-touch-icon.png',
  REPO + '/img/icons/icon-192x192.png',
  REPO + '/img/icons/icon-512x512.png',

  // Static data
  REPO + '/data/project_status.json',
  REPO + '/data/shingle_options.json',

  // Splash screens
  REPO + '/img/splash/splash-2048x2732.png',
  REPO + '/img/splash/splash-1668x2388.png',
  REPO + '/img/splash/splash-1536x2048.png'
];

// ===================================================================
// INSTALL – Precache everything
// ===================================================================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`[SW ${APP_VERSION}] Precaching ${PRECACHE_URLS.length} assets`);
        return cache.addAll(PRECACHE_URLS);
      })
      .catch(err => {
        console.error('[SW] Precaching partially failed:', err);
      })
      .then(() => self.skipWaiting())
  );
});

// ===================================================================
// ACTIVATE – Clean up old caches (FIXED: missing return!)
// ===================================================================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(  // ← This return was missing before!
        keys.map(key => {
          if (key !== CACHE_NAME && key.startsWith('ironclad-crm-')) {
            console.log(`[SW] Deleting old cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// ===================================================================
// FETCH
// ===================================================================
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignore non-GET, cross-origin, non-http(s)
  if (req.method !== 'GET' ||
      url.origin !== location.origin ||
      !req.url.startsWith('http')) {
    return;
  }

  // ———————————————————————
  // 1. Navigation → Network-first + cache on success
  // ———————————————————————
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) {
            const clone = res.clone();
            // Critical: don't let SW terminate before caching
            event.waitUntil(
              caches.open(CACHE_NAME).then(cache => cache.put(req, clone))
            );
          }
          return res;
        })
        .catch(err => {
          console.warn('[SW] Offline – serving fallback page', err);
          return caches.match(REPO + '/offline.html')
            .then(response => response || caches.match(REPO + '/index.html'));
        })
    );
    return;
  }

  // ———————————————————————
  // 2. JSON data → Stale-while-revalidate (1 hour freshness)
  // ———————————————————————
  if (url.pathname.startsWith(REPO + '/data/') && url.pathname.endsWith('.json')) {
    event.respondWith(staleWhileRevalidateJson(event, req));
    return;
  }

  // ———————————————————————
  // 3. Everything else → Cache-first with background update
  // ———————————————————————
  event.respondWith(cacheFirstWithUpdate(event, req));
});

// Helper: JSON stale-while-revalidate (1 hour)
async function staleWhileRevalidateJson(event, request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    const age = Date.now() - (parseInt(cached.headers.get('sw-cached-at') || '0'));
    if (age < 3_600_000) { // 1 hour
      event.waitUntil(backgroundJsonUpdate(request));
      return cached;
    }
  }

  return backgroundJsonUpdate(request)
    .catch(() => cached || new Response('{"error":"offline"}', {
      headers: { 'Content-Type': 'application/json' }
    }));
}

async function backgroundJsonUpdate(request) {
  const response = await fetch(request);
  if (response && response.ok) {
    const clone = response.clone();
    clone.headers.set('sw-cached-at', Date.now());
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, clone);
  }
  return response;
}

// Helper: Generic cache-first + silent background refresh
async function cacheFirstWithUpdate(event, request) {
  const cached = await caches.match(request);

  if (cached) {
    event.waitUntil(backgroundUpdate(request));
    return cached;
  }

  return fetch(request)
    .then(async response => {
      if (response && response.ok && shouldCache(response, request)) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => {
      if (request.destination === 'image') {
        // Optional: precache a real placeholder later
        return new Response(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='), {
          headers: { 'Content-Type': 'image/png' }
        });
      }
      return caches.match(REPO + '/offline.html');
    });
}

async function backgroundUpdate(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok && shouldCache(response, request)) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
  } catch (_) { /* silent */ }
}

function shouldCache(response, request) {
  return response.type === 'basic' ||
         ['script', 'style', 'font', 'image'].includes(request.destination);
}