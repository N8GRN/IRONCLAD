// Fire Notifications
//importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js'); // <-- should already be in browser
//importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDUFtZly3OhRSbK1HEItBWwIHpOtzwyvTk",
  authDomain: "ironclad-127a5.firebaseapp.com",
  projectId: "ironclad-127a5",
  storageBucket: "ironclad-127a5.firebasestorage.app",
  messagingSenderId: "57257280088",
  appId: "1:57257280088:web:189e4db32d7ae28523402d",
  measurementId: "G-6RG40RW2YZ"
};

// Initialize Firebase using the global 'firebase' object from compat library
const app = firebase.initializeApp(firebaseConfig);
const APP_VERSION = 'v2025.3.12'; // ← BUMP THIS ON EVERY DEPLOY
const CACHE_NAME = `ironclad-crm-${APP_VERSION}`;
const REPO = '/IRONCLAD/'; // ← REPOSITORY NAME

const PRECACHE_URLS = [
  REPO,
  REPO + 'index.html',
  REPO + 'offline.html',
  REPO + 'manifest.json',
  REPO + 'favicon.png',

  // Core JS/CSS
  REPO + 'js/app.js',
  REPO + 'css/styles.css',

  // Pages
  REPO + 'pages/application.html',
  REPO + 'pages/home.html',
  REPO + 'pages/login.html',
  REPO + 'pages/newProject.html',
  REPO + 'pages/projects.html',
  REPO + 'pages/roofDefinitions.html',

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

// ===============================================
// IndexedDB Helpers for Queue (vanilla, with indexing)
// ===============================================
const DB_NAME = 'ironclad-queue';
const STORE_NAME = 'pending';
const DB_VERSION = 2; // Bumped for index

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

async function queueItem(item) {
  // Basic validation
  if (!item.data || typeof item.data !== 'object') {
    throw new Error('Invalid payload: missing data');
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add({ ...item, timestamp: Date.now() });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function getPendingItems() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function removeItem(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

// Optional: Cleanup old items (>7 days)
async function cleanupOldItems() {
  const db = await openDB();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const request = index.openCursor(IDBKeyRange.upperBound(weekAgo));
    let count = 0;
    request.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        store.delete(cursor.value.id);
        count++;
        cursor.continue();
      } else {
        console.log(`[SW] Cleaned ${count} old queued items`);
        resolve(count);
      }
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

// ===============================================
// INSTALL
// ===============================================
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

// ===============================================
// ACTIVATE – Clean old caches
// ===============================================
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
      .then(cleanupOldItems) // Clean queue on activate
      .then(() => self.clients.claim())
  );
});

// ===============================================
// FETCH
// ===============================================
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignore cross-origin and non-http
  if (url.origin !== location.origin || !req.url.startsWith('http')) return;
  if (req.method !== 'GET') {
    // Handle offline write queuing
    if (req.method === 'POST' && url.pathname === REPO + 'sync-queue') {
      event.respondWith(
        req.clone().json().then(payload => {
          return queueItem(payload).then(() => {
            self.registration.sync.register('sync-projects');
            return new Response(JSON.stringify({ success: true, queued: true }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }).catch(err => {
            console.error('[SW] Queue failed:', err);
            return new Response(JSON.stringify({ error: err.message }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        }).catch(() => new Response('Invalid JSON', { status: 400 }))
      );
      return;
    }
    // Let other POSTs/PUTs etc. go to network (or fail offline)
    return fetch(req).catch(() => new Response('Offline - sync when online', { status: 503 }));
  }

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
              .catch(() => { })
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

// ===============================================
// BACKGROUND SYNC
// ===============================================
self.addEventListener('sync', event => {
  if (event.tag === 'sync-projects') {
    event.waitUntil(syncPendingProjects());
  }
});

async function syncPendingProjects() {
  try {
    const pending = await getPendingItems();
    if (pending.length === 0) {
      console.log('[SW] No pending items to sync');
      return;
    }
    console.log(`[SW] Syncing ${pending.length} queued items`);
    for (const item of pending) {
      let retries = 0;
      const maxRetries = 3;
      while (retries < maxRetries) {
        try {
          const response = await fetch('/api/projects', { // ← Swap to your prod endpoint
            method: item.method || 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data)
          });
          if (response.ok) {
            await removeItem(item.id);
            console.log(`[SW] Synced item ${item.id} after ${retries} retries`);
            break; // Success, move to next
          } else {
            retries++;
            if (retries < maxRetries) {
              const delay = Math.pow(2, retries) * 1000; // Exponential backoff
              console.log(`[SW] Sync failed for ${item.id} (attempt ${retries}): ${response.status}. Retrying in ${delay}ms`);
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              console.warn(`[SW] Max retries exceeded for ${item.id}`);
            }
          }
        } catch (err) {
          retries++;
          if (retries < maxRetries) {
            const delay = Math.pow(2, retries) * 1000;
            console.error(`[SW] Network error for ${item.id} (attempt ${retries}):`, err, `- Retrying in ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.error(`[SW] Max retries exceeded for ${item.id}:`, err);
          }
        }
      }
    }
  } catch (err) {
    console.error('[SW] Overall sync error:', err);
  }
}


// MESSAGING / PUSH NOTIFICATIONS
// --- Your Project's Firebase Configuration (MUST BE IDENTICAL TO app.js) ---
/*const firebaseConfig = {
    apiKey: "AIzaSyDUFtZly3OhRSbK1HEItBWwIHpOtzwyvTk",
    authDomain: "ironclad-127a5.firebaseapp.com",
    projectId: "ironclad-127a5",
    storageBucket: "ironclad-127a5.firebasestorage.app",
    messagingSenderId: "57257280088", // Your Project Number / Sender ID
    appId: "1:57257280088:web:189e4db32d7ae28523402d",
    measurementId: "G-6RG40RW2YZ"
};

// --- Initialize Firebase in the Service Worker ---
// Use the global 'firebase' object provided by firebase-app-compat.js
firebase.initializeApp(firebaseConfig);

// Get the Messaging instance using the global 'firebase' object
const messaging = firebase.messaging();

// --- Handle background messages ---
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    // Customize the notification that appears to the user.
    const notificationTitle = payload.notification?.title || 'New Message';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification.',
        // IMPORTANT: Ensure this icon path is correct and the file exists!
        icon: payload.notification?.icon || '/icon-192x192.png',
        image: payload.notification?.image, // Optional image
        badge: '/badge.png', // Optional badge icon
        data: payload.data, // Custom data from your message payload
        actions: [ // Example actions
            { action: 'open_url', title: 'Open' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    // Show the notification to the user
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// --- Handle notification clicks ---
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification);
    event.notification.close(); // Close the notification when clicked

    const clickedAction = event.action;

    // Check for custom data in the notification
    const urlToOpen = event.notification.data?.url || '/IRONCLAD/pages/projects.html'; // Default to homepage

    if (clickedAction === 'open_url') {
        event.waitUntil(clients.openWindow(urlToOpen));
    } else if (clickedAction === 'dismiss') {
        // Do nothing, just close the notification
        console.log('Notification dismissed.');
    } else {
        // Default behavior if no specific action or data.url is found
        event.waitUntil(clients.openWindow(urlToOpen));
    }
});
*/