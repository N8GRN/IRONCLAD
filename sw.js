const APP_VERSION = 'v2025.2.5';                    // ← bump this on every deploy
const CACHE_NAME = `ironclad-crm-${APP_VERSION}`;

const PRECACHE_URLS = [
  '/IRONCLAD/',
  '/IRONCLAD/index.html',
  '/IRONCLAD/manifest.json',
  '/IRONCLAD/favicon.png',

  // JavaScript
  '/IRONCLAD/js/app.js',
  '/IRONCLAD/sw.js',

  // Styles
  '/IRONCLAD/css/styles.css',

  // Pages
  '/IRONCLAD/pages/application.html',
  '/IRONCLAD/pages/home.html',
  './pages/login.html',
  '/IRONCLAD/pages/newProject.html',
  '/IRONCLAD/pages/page1.html',
  '/IRONCLAD/pages/page2.html',
  '/IRONCLAD/pages/page3.html',
  '/IRONCLAD/pages/page4.html',
  '/IRONCLAD/pages/page5.html',
  '/IRONCLAD/pages/projects.html',

  // Images & icons
  '/IRONCLAD/img/logo.png',
  '/IRONCLAD/img/icon.png',
  '/IRONCLAD/img/background.png',
  '/IRONCLAD/img/icons/logo.png',
  '/IRONCLAD/img/icons/apple-touch-icon.png',
  '/IRONCLAD/img/icons/icon-192x192.png',
  '/IRONCLAD/img/icons/icon-512x512.png',

  // Data
  '/IRONCLAD/data/project_status.json',
  '/IRONCLAD/data/shingle_options.json',

  // Splash screens
  '/IRONCLAD/img/splash/splash-2048x2732.png',
  '/IRONCLAD/img/splash/splash-1668x2388.png',
  '/IRONCLAD/img/splash/splash-1536x2048.png'
];

// INSTALL – Precache critical assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`[SW ${APP_VERSION}] Precaching ${PRECACHE_URLS.length} files`);
        // addAll() fails entirely if *any* file 404s → use sequential add() instead
        return Promise.all(
          PRECACHE_URLS.map(url => {
            return cache.add(url).catch(err => {
              console.error(`[SW] Failed to cache ${url}:`, err);
              // Don't reject the whole install – just skip the bad file
            });
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE – Remove old caches + take control immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME && key.startsWith('ironclad-crm-')) {
            console.log(`[SW] Deleting old cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    })
    .then(() => {
      console.log(`[SW ${APP_VERSION}] Now active and controlling clients`);
      return self.clients.claim();
    })
  );
});

// FETCH – Smart strategies
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore cross-origin requests (Google Fonts, analytics, etc.)
  if (url.origin !== self.location.origin) return;

  // Ignore chrome-extension:// and other non-HTTP requests
  if (!request.url.startsWith('http')) return;

  // 1. Navigation requests (HTML page loads) → Network-first + offline fallback
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // If network succeeds, optionally cache the fresh HTML
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Offline → serve cached index.html (or any fallback page)
          return caches.match('/IRONCLAD/index.html', { cacheName: CACHE_NAME })
            || caches.match('/IRONCLAD/');
        })
    );
    return;
  }

  // 2. Everything else (JS, CSS, images, JSON) → Stale-while-revalidate
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Return cache immediately (fast!)
        if (cachedResponse) {
          // Fire-and-forget update in background
          event.waitUntil(
            fetch(request)
              .then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                  return caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, networkResponse.clone());
                  });
                }
              })
              .catch(() => { /* ignore network failure during background update */ })
          );
          return cachedResponse;
        }

        // No cache → go to network and cache result
        return fetch(request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(err => {
            console.error(`[SW] Offline and no cache for: ${request.url}`, err);
            // Optional: return a fallback image or offline page here
            return new Response('Offline – resource unavailable', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});