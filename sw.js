
const APP_VERSION = 'v2025.2.1';   // ← change this any time you update
const CACHE_NAME = `ironclad-crm-${APP_VERSION}`;

const urlsToCache = [
  '/IRONCLAD/',
  '/IRONCLAD/index.html',
  '/IRONCLAD/manifest.json',
  '/IRONCLAD/favicon.png',

  // JavaScript
  '/IRONCLAD/js/app.js',
  '/IRONCLAD/sw.js',

  // Styles
  '/IRONCLAD/css/styles.css',

  // All pages
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

  // Images & icons (add every single one you use)
  '/IRONCLAD/img/logo.png',
  '/IRONCLAD/img/background.png',
  '/IRONCLAD/img/icons/icon-logo.png',
  '/IRONCLAD/img/icons/apple-touch-icon.png',
  '/IRONCLAD/img/icons/icon-192x192.png',
  '/IRONCLAD/img/icons/icon-512x512.png',

  // Data & JSON
  '/IRONCLAD/data/project_status.json',
  '/IRONCLAD/data/shingle_options.json',

  // Splash screens
  '/IRONCLAD/img/splash/splash-2048x2732.png',
  '/IRONCLAD/img/splash/splash-1668x2388.png',
  '/IRONCLAD/img/splash/splash-1536x2048.png'
];

// Install: Cache essentials
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching files');
        return cache.addAll(urlsToCache);  // Fails install if any 404—test paths!
      })
      .catch(err => console.error('Install failed:', err))
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of pages immediately
  self.clients.claim();
});

// Fetch: Cache-first for offline
self.addEventListener('fetch', event => {
  // Ignore non-GET or non-same-origin
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request).then(networkResponse => {
          // Cache successful network responses (for future offline)
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Offline fallback: For HTML pages, serve cached index.html
          if (event.request.destination === 'document') {
            return caches.match('/IRONCLAD/') || new Response('Offline: App requires internet to load initially.', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          }
          // For other resources, return a simple fallback
          return new Response('Offline: Resource unavailable.', { status: 503 });
        });
      })
  );
});