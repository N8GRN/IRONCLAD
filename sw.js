
const APP_VERSION = 'v2025.1.75';   // ← change this any time you update
const CACHE_NAME = `ironclad-crm-${APP_VERSION}`;

const urlsToCache = [
  '/',
  './index.html',
  './manifest.json',
  './sw.js',
  './favicon.png',

  // JavaScript
  './js/app.js',

  // Styles
  './css/styles.css',

  // All pages
  './pages/application.html',
  './pages/home.html',
  './pages/login.html',
  './pages/newProject.html',
  './pages/page1.html',
  './pages/page2.html',
  './pages/page3.html',
  './pages/page4.html',
  './pages/page5.html',
  './pages/projects.html',

  // Images & icons (add every single one you use)
  './img/logo.png',
  './img/background.png',
  './img/icons/icon-logo.png',
  './img/icons/apple-touch-icon.png',
  './img/icons/icon-192x192.png',
  './img/icons/icon-512x512.png',

  // Data & JSON
  './data/project_status.json',
  './data/shingle_options.json',

  // Splash screens
  './img/splash/splash-2048x2732.png',
  './img/splash/splash-1668x2388.png',
  './img/splash/splash-1536x2048.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.error('Cache addAll failed:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const request = e.request;

  // Navigation requests (page loads) – always try network first, fall back to cache
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Everything else – cache-first
  e.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request);
    })
  );
});