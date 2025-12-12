// /js/modules.js

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDUFtZly3OhRSbK1HEItBWwIHpOtzwyvTk",
  authDomain: "ironclad-127a5.firebaseapp.com",
  projectId: "ironclad-127a5",
  storageBucket: "ironclad-127a5.firebasestorage.app",
  messagingSenderId: "57257280088",
  appId: "1:57257280088:web:189e4db32d7ae28523402d",
  measurementId: "G-6RG40RW2YZ"
};


// Core app + Firestore imports (modular style)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js'; // Ensure this version matches your SW
import { getFirestore, collection, getDocs, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js'; // Ensure this version matches your SW

// Firebase Cloud Messaging imports (modular style)
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging.js'; // Ensure this version matches your SW


// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Cloud Messaging
const messaging = getMessaging(app);

// Get the VAPID key from your Firebase Console > Project settings > Cloud Messaging
// Make sure this is YOUR actual VAPID key!
const VAPID_PUBLIC_KEY = 'BOWyxNYRhDij8-RqU4hcMxrBjbhWo9HaOkcjF5gdkfvrZ1DH-NP1-64Nur0o6uQ-5-kcQiiLlBUVL13wwXimpC4';

// --- FCM Specific Functions ---

/**
 * Requests notification permission and retrieves the FCM registration token.
 * @param {function(string): void} successCallback - Callback to execute on success with the token.
 * @param {function(Error): void} errorCallback - Callback to execute on error.
 */
async function requestNotificationPermissionAndGetFCMToken(successCallback, errorCallback) {
    if (!('Notification' in window)) {
        const error = new Error('This browser does not support notifications.');
        console.error(error);
        if (errorCallback) errorCallback(error);
        return;
    }

    try {
        const currentToken = await getToken(messaging, { vapidKey: VAPID_PUBLIC_KEY });
        if (currentToken) {
            console.log(`FCM Registration Token: ${currentToken}`);
            if (successCallback) successCallback(currentToken);
        } else {
            const error = new Error('No FCM registration token available. User denied permission or browser does not support.');
            console.warn(error);
            if (errorCallback) errorCallback(error);
        }
    } catch (error) {
        if (error.code === 'messaging/permission-denied') {
            console.warn('Notification permission denied by the user. Please enable it in browser settings.');
        } else {
            console.error('Error getting FCM token:', error);
        }
        if (errorCallback) errorCallback(error);
    }
}

/**
 * Sets up a listener for messages received when the app is in the foreground.
 * @param {function(object): void} messageHandler - Function to call when a message is received.
 */
function setupForegroundMessageHandler(messageHandler) {
    onMessage(messaging, (payload) => {
        console.log('Message received in foreground:', payload);
        messageHandler(payload);
    });
}

// --- Firestore Example Usage (as before) ---
// Example usage: Fetch docs from a collection
async function loadData(col) {
  try {
    const querySnapshot = await getDocs(collection(db, col));
    const docs = [];
    querySnapshot.forEach((doc) => {
      docs.push({ id: doc.id, ...doc.data() });
    });
    return docs;
  } catch (error) {
    console.error('Firestore error:', error);
    throw error; // Re-throw for handling in app.js
  }
}

// Example: Real-time listener (use onSnapshot)
function watchCollection(col, callback) {
  return onSnapshot(collection(db, col), (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      callback(change);
    });
  });
}

// --- Make everything globally accessible via window (as requested) ---
window.firebaseConfig = firebaseConfig;
window.initializeApp = initializeApp; // Note: app is already initialized, this is just for reference
window.getFirestore = getFirestore;
window.collection = collection;
window.getDocs = getDocs;
window.onSnapshot = onSnapshot;

window.app = app;
window.FireDB = db; // Renamed for clarity vs. 'db' in this file

window.loadData = loadData;
window.watchCollection = watchCollection;

// Export FCM related objects and functions
window.getMessaging = getMessaging; // For direct access if needed
window.messaging = messaging;       // The initialized messaging instance
window.requestNotificationPermissionAndGetFCMToken = requestNotificationPermissionAndGetFCMToken;
window.setupForegroundMessageHandler = setupForegroundMessageHandler;

// Optional: Add a simple foreground message handler here if you want a default behavior
// This will display a browser notification for foreground messages
setupForegroundMessageHandler((payload) => {
    const notificationTitle = payload.notification?.title || 'New Message (Foreground)';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification.',
        icon: payload.notification?.icon || '/img/icons/icon-192x192.png' // Use a default icon
    };
    new Notification(notificationTitle, notificationOptions);
});