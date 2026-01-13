/*
    Name: modules.js
    Description: Attempt to load and install all used Firebase libraries (e.g., Firestore, Messaging, Authorization, etc.) for Global use

    Author: Nathan Green
    Version: v2.0
    Last Update: 01.12.2026
*/

////////////////////////////////////////   IMPORT   ////////////////////////////////////////
// --- Import Firebase Libraries, configure paraters, and declare constants
////////////////////////////////////////////////////////////////////////////////////////////

// Core app + Firestore imports (modular style)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
import { getFirestore, collection, getDocs, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';
import { getMessaging, getToken } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-messaging.js'; // Ensure this version matches your SW


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

// Initialize Firebase App, Firestore, and Firebase Cloud Messaging
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const messaging = getMessaging(app); // [01.12.2026] New!

// [01.12.2026] NEW (from msgApp.js)
// -----------------------------------------------------------------------------------------
// VAPID key from Firebase Console > Project settings > Cloud Messaging
const VAPID_PUBLIC_KEY = 'BOWyxNYRhDij8-RqU4hcMxrBjbhWo9HaOkcjF5gdkfvrZ1DH-NP1-64Nur0o6uQ-5-kcQiiLlBUVL13wwXimpC4';


// --- DOM Elements ---
const enableNotificationsButton = document.getElementById('enableNotificationsButton');
const logDiv = document.getElementById('log');
//const messagesDiv = document.getElementById('messages'); --> Unused

// --- Helper Functions for Logging and Display ---
function appendLog(message) {
    const p = document.createElement('p');
    p.textContent = message;
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight;
}


// --- FCM Specific Logic (Permission & Token) ---
/*
 * Requests notification permission, registers the service worker, and gets the FCM token.
 */
async function requestPermissionAndGetFCMToken(successCallback, errorCallback) {
    // 1. Check browser support for Notification API
    if (!('Notification' in window)) {
        appendLog('This browser does not support notifications.');
        alert('Push notifications are not supported by your browser.');
        return;
    }

    // 2. Register your Service Worker
    if ('serviceWorker' in navigator) {
        try {
            // Register your service worker. Make sure the path is correct!
            // It MUST be at the root of your domain for FCM to work correctly.
            const registration = await navigator.serviceWorker.register('/IRONCLAD/firebase-messaging-sw.js');
            appendLog('Firebase messaging service Worker registered successfully.');
            // This line ensures the messaging service knows about your service worker registration.
            // Some tutorials might omit this, but it's good practice for clarity.
            messaging.swRegistration = registration;
        } catch (error) {
            appendLog(`Firebase messaging service Worker registration failed: ${error}`);
            console.error('Service Worker registration failed:', error);
            alert('Could not register service worker for push notifications.');
            return;
        }
    } else {
        appendLog('Service Workers are not supported in this browser.');
        alert('Service Workers are required for push notifications.');
        return;
    }

    // 3. Request Notification Permission and Get FCM Token
    try {
        appendLog('Requesting notification permission and FCM token...');
        const currentToken = await getToken(messaging, { vapidKey: VAPID_PUBLIC_KEY });

        if (currentToken) {
            appendLog(`FCM Registration Token: ${currentToken}`);
            alert('Notifications enabled and token obtained successfully! Check app log for token.');

            // Use this as potential navigation point

            // IMPORTANT: In a real app, you would send this 'currentToken' to your backend server
            // and associate it with the logged-in user so you can send targeted notifications.
        } else {
            appendLog('No FCM registration token available. User denied permission or an issue occurred.');
            alert('Notification permission denied or not supported.');
        }
    } catch (error) {
        if (error.code === 'messaging/permission-denied') {
            appendLog('Notification permission denied by the user.');
            alert('Notification permission denied. Please enable it in your browser settings.');
        } else {
            appendLog(`Error getting FCM token: ${error.message}`);
            console.error('Error getting FCM token:', error);
            alert('An error occurred while enabling notifications.');
        }
    }
}


// --- Event Listeners ---
self.addEventListener('DOMContentLoaded', () => {    
    
    const currentPermission = Notification.permission;
    
    appendLog("Document loaded. Setting up...");

    // Button
    if (enableNotificationsButton) {
        enableNotificationsButton.addEventListener('click', requestPermissionAndGetFCMToken);
        appendLog("Enable Notifications button is ready.");
    } else {
        appendLog("Enable Notifications button not found. Please check HTML.");
    }

});


// -----------------------------------------------------------------------------------------
// END NEW




/////////////////////////////////////   FIREBASE   ////////////////////////////////////
// --- Firebase functions here ---

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