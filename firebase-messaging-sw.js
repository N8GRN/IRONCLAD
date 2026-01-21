// sw.js - Ironclad CRM Service Worker (merged FCM + caching + sync queue)
// Updated Jan 20, 2026 - Firebase Hosting root, stable SDK, no duplicate notifications

const APP_VERSION = 'v4.2.2-fh-20260120'; // Bump on changes
const CACHE_NAME = `ironclad-cache-${APP_VERSION}`;
const REPO = '/'; // Firebase Hosting root

// Files to precache (only critical static assets)
const PRECACHE_URLS = [
  REPO + 'index.html',
  REPO + 'offline.html',
  REPO + 'manifest.json',
  REPO + 'favicon.png',
  REPO + 'css/styles.css',
  REPO + 'img/icons/icon-192x192.png',
  REPO + 'img/background.png',
  // Add more icons/splash if needed
];

// Firebase imports (stable compat version for SW)
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDUFtZly3OhRSbK1HEItBWwIHpOtzwyvTk",
  authDomain: "ironclad-127a5.firebaseapp.com",
  projectId: "ironclad-127a5",
  storageBucket: "ironclad-127a5.appspot.com",
  messagingSenderId: "57257280088",
  appId: "1:57257280088:web:189e4db32d7ae28523402d",
  measurementId: "G-6RG40RW2YZ"
};

// Initialize Firebase in SW
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background FCM messages (data-only preferred to avoid auto-notification + custom one)
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Background message received:', payload);

  // Prefer data fields (safer for custom control)
  const title = payload.data?.title || payload.notification?.title || 'IRONCLAD Update';
  const body = payload.data?.body || payload.notification?.body || 'You have a new update.';
  const icon = payload.data?.icon || payload.notification?.icon || REPO + 'img/icons/icon-192x192.png';
  const url = payload.data?.url || REPO + 'projects';

  const options = {
    body,
    icon,
    badge: REPO + 'img/badge.png', // Optional badge
    data: { url },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'close', title: 'Close' }
    ]
  };

  return self.registration.showNotification(title, options);
});

// Handle notification click (custom URL handling)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  let targetUrl = event.notification.data?.url || REPO + 'projects';

  if (action === 'open') {
    // Optional: force a specific page
    targetUrl = REPO + 'projects';
  } else if (action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl.split('?')[0]) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Install - precache with debug logging (tolerant of 404s)
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('[SW] Starting precache... Version:', APP_VERSION);

        for (const url of PRECACHE_URLS) {
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (!response.ok) {
              console.warn(`[SW] Skipping ${url} - Status: ${response.status}`);
              continue;
            }
            await cache.put(url, response);
            console.log(`[SW] Cached: ${url}`);
          } catch (err) {
            console.warn(`[SW] Fetch failed for ${url}:`, err);
          }
        }

        console.log('[SW] Precaching complete');
        await self.skipWaiting();
      } catch (err) {
        console.error('[SW] Install failed:', err);
      }
    })()
  );
});

// Activate - clean old caches and broadcast version
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        // Clean old caches
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
        );
        console.log('[SW] Old caches deleted');

        // Claim clients
        await self.clients.claim();
        console.log('[SW] Clients claimed');

        // Broadcast version to all open windows
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_VERSION_UPDATE',
            version: APP_VERSION
          });
        });
        console.log(`[SW] Version broadcast sent to ${clients.length} client(s): ${APP_VERSION}`);
      } catch (err) {
        console.error('[SW] Activate failed:', err);
      }
    })()
  );
});

// Handle version requests from clients
self.addEventListener('message', (event) => {
  if (event.data?.type === 'REQUEST_SW_VERSION') {
    event.source.postMessage({
      type: 'SW_VERSION_UPDATE',
      version: APP_VERSION
    });
    console.log('[SW] Sent version on request:', APP_VERSION);
  }
});

// Fetch - network-first for navigation, cache-first for assets
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(REPO + 'offline.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Optional fallback for images
        if (event.request.url.match(/\.(jpg|png|gif|svg)$/)) {
          return caches.match(REPO + 'img/offline-placeholder.png');
        }
      });
    })
  );
});

// IndexedDB queue for offline sync (simplified - expand if needed)
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
      console.log('[SW] Synced item:', item);
      await clearPending(item.id || item.key);
    } catch (err) {
      console.error('[SW] Sync failed:', err);
    }
  }
}