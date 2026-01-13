// js/modules.js - Firebase init, Firestore, FCM (foreground + token handling)

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, onSnapshot, doc, updateDoc, deleteDoc, getDoc, /*enablePersistence, */enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-messaging.js';

// My web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDUFtZly3OhRSbK1HEItBWwIHpOtzwyvTk",
  authDomain: "ironclad-127a5.firebaseapp.com",
  projectId: "ironclad-127a5",
  storageBucket: "ironclad-127a5.firebasestorage.app",
  messagingSenderId: "57257280088",
  appId: "1:57257280088:web:189e4db32d7ae28523402d",
  measurementId: "G-6RG40RW2YZ"
};

const VAPID_PUBLIC_KEY = 'BOWyxNYRhDij8-RqU4hcMxrBjbhWo9HaOkcjF5gdkfvrZ1DH-NP1-64Nur0o6uQ-5-kcQiiLlBUVL13wwXimpC4';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable offline persistence (IndexedDB cache for snapshots/queries)
enableIndexedDbPersistence(db)
  .then(() => {
    console.log('Firestore offline persistence enabled successfully');
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open — but in standalone PWA mode, this shouldn't happen
      console.warn('Persistence failed: Multiple tabs open (unlikely in standalone)');
    } else if (err.code === 'unimplemented') {
      // Browser doesn't support persistence (e.g., private browsing or incompatible)
      console.warn('Persistence not supported in this browser');
    } else {
      console.error('Error enabling Firestore persistence:', err);
    }
    // App continues online-only — no crash
  });


const messaging = getMessaging(app);

// Log helper (for settings.html or console)
function logMessage(msg) {
  const logEl = document.getElementById('notification-log');
  if (logEl) {
    logEl.innerHTML += `<p>${new Date().toLocaleTimeString()} - ${msg}</p>`;
    logEl.scrollTop = logEl.scrollHeight;
  } else {
    console.log(msg);
  }
}

// Request permission and get FCM token
async function requestNotificationPermission() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    logMessage('Notifications or SW not supported in this browser.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready; // assumes sw.js registered
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      logMessage('Notification permission denied.');
      return null;
    }

    logMessage('Notification permission granted.');
    const token = await getToken(messaging, {
      vapidKey: VAPID_PUBLIC_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      logMessage(`FCM Token: ${token}`);
      // TODO: Send token to your server / save to Firestore user doc
      return token;
    } else {
      logMessage('No registration token available.');
      return null;
    }
  } catch (err) {
    logMessage(`Error getting FCM token: ${err.message}`);
    return null;
  }
}

// Foreground message handler
onMessage(messaging, (payload) => {
  logMessage('Foreground FCM message received: ' + JSON.stringify(payload));
  const title = payload.notification?.title || 'IRONCLAD Update';
  const options = {
    body: payload.notification?.body || 'Check your projects!',
    icon: '/IRONCLAD/img/icons/icon-192x192.png'
  };
  new Notification(title, options);
});

// Export for use in other files (or attach to window if no modules)
window.FireDB = db;
window.requestNotificationPermission = requestNotificationPermission;

// Example usage in settings.html: document.getElementById('enable-btn').addEventListener('click', requestNotificationPermission);