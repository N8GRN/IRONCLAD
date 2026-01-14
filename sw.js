// sw.js - Ironclad CRM Service Worker (merged FCM + caching + sync queue)
// Version bump on major changes
const APP_VERSION = 'v4.1-20260114.0';
const CACHE_NAME = `ironclad-cache-${APP_VERSION}`;
const REPO = '/IRONCLAD/'; // Adjust if deployed to root

// Files to precache (static assets - expand as needed from your img/css/js)
const PRECACHE_URLS = [
  REPO,
  REPO + 'index.html',
  REPO + 'offline.html',
  REPO + 'manifest.json',
  REPO + 'favicon.ico',
  REPO + 'favicon.png',

  // Core CSS
  REPO + 'css/styles.css',

  // Data (JSON)
  REPO + 'data/material.json',
  REPO + 'data/project_status.json',
  REPO + 'data/shingle_options.json',

  // Core JS
  REPO + 'js/app.js',
  REPO + 'js/db.js',
  REPO + 'js/modules.js',
  REPO + 'js/projects.js',

  // Images
  REPO + 'img/logo.png',
  REPO + 'img/icon.png',
  REPO + 'img/background.png',

  // Images / Icons
  REPO + 'img/icons/apple-touch-icon.png',
  REPO + 'img/icons/gear.png',
  REPO + 'img/icons/icon-72x72.png',
  REPO + 'img/icons/icon-192x192.png',
  REPO + 'img/icons/icon-512x512.png',
  REPO + 'img/icons/icon-edit.png',
  REPO + 'img/icons/icon-trash.png',
  REPO + 'img/icons/logo.png',
  REPO + 'img/icons/settings.png',
  REPO + 'img/icons/user.png',
  
  // Images / Splash
  REPO + 'img/splash/splash-1536x2048.png',
  REPO + 'img/splash/splash-1668x2388.png',
  REPO + 'img/splash/splash-2048x2732.png',
  
  // Pages
  REPO + 'pages/application.html',
  REPO + 'pages/calculator.html',
  REPO + 'pages/home.html',
  REPO + 'pages/login.html',
  REPO + 'pages/newProject.html',
  REPO + 'pages/projects.html',
  REPO + 'pages/roofDefinitions.html'
];

// Firebase imports (compat for service worker)
importScripts('https://www.gstatic.com/firebasejs/12.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.7.0/firebase-messaging-compat.js');

// Your Firebase config - REPLACE WITH YOUR REAL VALUES
const firebaseConfig = {
  apiKey: "AIzaSyDUFtZly3OhRSbK1HEItBWwIHpOtzwyvTk",
  authDomain: "ironclad-127a5.firebaseapp.com",
  projectId: "ironclad-127a5",
  storageBucket: "ironclad-127a5.firebasestorage.app",
  messagingSenderId: "57257280088",
  appId: "1:57257280088:web:189e4db32d7ae28523402d",
  measurementId: "G-6RG40RW2YZ"
};

// Initialize Firebase in SW
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background FCM messages
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'IRONCLAD Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update in your roofing CRM.',
    icon: payload.notification?.icon || REPO + 'img/icons/icon-192x192.png',
    badge: REPO + 'img/badge.png', // optional
    data: {
      url: payload.data?.url || REPO + 'pages/projects.html' // fallback
    },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'close', title: 'Close' }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  let url = event.notification.data?.url || REPO + 'index.html';

  if (action === 'open') {
    url = REPO + 'pages/projects.html'; // or wherever you want
  } else if (action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Install event - precache
/*self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[sw.js] Pre-caching files');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});*/
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('[SW] Starting precache... Attempting to cache:', PRECACHE_URLS);

        for (const url of PRECACHE_URLS) {
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (!response.ok) {
              console.error(`[SW] Failed to cache ${url} - Status: ${response.status}`);
            } else {
              await cache.put(url, response);
              console.log(`[SW] Successfully cached: ${url}`);
            }
          } catch (err) {
            console.error(`[SW] Fetch error for ${url}:`, err);
          }
        }

        console.log('[SW] Precaching complete');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Cache open failed:', err);
      })
  );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - network-first for HTML, cache-first for assets, fallback to offline.html
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(REPO + 'offline.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Optional: fallback for images etc.
        if (event.request.url.match(/\.(jpg|png|gif|svg)$/)) {
          return caches.match(REPO + 'img/offline-placeholder.png'); // if you have one
        }
      });
    })
  );
});

// IndexedDB for offline queue (your sync-projects example - expand as needed)
const DB_NAME = 'ironclad-offline';
const STORE_NAME = 'pendingProjects';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { autoIncrement: true });
      }
    };
  });
}

async function queueItem(data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.add(data);
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}

async function getPendingItems() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });
}

async function clearPending(id) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = resolve;
  });
}

// Background sync for projects
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-projects') {
    event.waitUntil(syncPendingProjects());
  }
});

async function syncPendingProjects() {
  if (!navigator.onLine) return;
  const pending = await getPendingItems();
  for (const item of pending) {
    try {
      // Example: send to Firestore - adapt to your add/update logic
      // await fetch('/api/sync', { method: 'POST', body: JSON.stringify(item.data) });
      console.log('[sw.js] Synced item:', item);
      await clearPending(item.id || item.key); // assuming autoIncrement key
    } catch (err) {
      console.error('[sw.js] Sync failed for item:', err);
      // Keep in queue for retry
    }
  }
}