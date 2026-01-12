/*
    Name: modules.js
    Description: Attempt to load all used Firebase libraries (e.g., Firestore, Messaging, Authorization, etc.) for Global use

    Author: Nathan Green
    Version: v2.0
    Last Update: 01.12.2026
*/

// Core app + Firestore imports (modular style)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
import { getFirestore, collection, getDocs, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-messaging.js'; // Ensure this version matches your SW


// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDUFtZly3OhRSbK1HEItBWwIHpOtzwyvTk",
  authDomain: "ironclad-127a5.firebaseapp.com",
  projectId: "ironclad-127a5",
  storageBucket: "ironclad-127a5.firebasestorage.app",
  messagingSenderId: "57257280088",
  appId: "1:57257280088:web:189e4db32d7ae28523402d",
  measurementId: "G-6RG40RW2YZ"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Cloud Messaging
const messaging = getMessaging(app);

// VAPID key from Firebase Console > Project settings > Cloud Messaging
const VAPID_PUBLIC_KEY = 'BOWyxNYRhDij8-RqU4hcMxrBjbhWo9HaOkcjF5gdkfvrZ1DH-NP1-64Nur0o6uQ-5-kcQiiLlBUVL13wwXimpC4';


/////////////////////////////////////   MESSAGING   ////////////////////////////////////
// --- FCM Specific Functions ---

/**
 * Requests notification permission and retrieves the FCM registration token.
 * @param {function(string): void} successCallback - Callback to execute on success with the token.
 * @param {function(Error): void} errorCallback - Callback to execute on error.
 */

/* [01.12.2026] Deleted to prevent duplicate Push */
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

////////////////////////////////////////////////////////////////////////////////////////////


// Example usage: Fetch docs from a collection
async function loadData(col) {
  try {
    const querySnapshot = await getDocs(collection(db, col));
    querySnapshot.forEach((doc) => {
      console.log(`${doc.id} → ${doc.data()}`);
    });
  } catch (error) {
    console.error('Firestore error:', error);
  }
}

// Example: Real-time listener (use onSnapshot, not snapshot)
function watchCollection(col) {
  onSnapshot(collection(db, col), (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        console.log('New doc:', change.doc.data());
      }
    });
  });
}



// Call project functions (e.g., on page load)
/*
loadData('projects');
watchCollection('projects');
*/

window.firebaseConfig = firebaseConfig;
window.initializeApp = initializeApp;
window.getFirestore = getFirestore;
window.collection = collection;
window.getDocs = getDocs;
window.onSnapshot = onSnapshot;
window.app = app;
window.FireDB = db;
window.loadData = loadData;
window.watchCollection = watchCollection;

// Export FCM related objects and functions
window.getMessaging = getMessaging; // For direct access if needed
window.messaging = messaging;       // The initialized messaging instance
window.getToken = getToken;         // Explicitly expose getToken for app.js
window.onMessage = onMessage;       // Explicitly expose onMessage for app.js (crucial for app.js)
window.requestNotificationPermissionAndGetFCMToken = requestNotificationPermissionAndGetFCMToken;