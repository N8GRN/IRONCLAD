// /app.js
// This script runs in the browser's main thread.

// --- Firebase SDK Imports for the main app (Modular API) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging.js";

// --- Your Project's Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyDUFtZly3OhRSbK1HEItBWwIHpOtzwyvTk",
    authDomain: "ironclad-127a5.firebaseapp.com",
    projectId: "ironclad-127a5",
    storageBucket: "ironclad-127a5.firebasestorage.app",
    messagingSenderId: "57257280088", // Your Project Number / Sender ID
    appId: "1:57257280088:web:189e4db32d7ae28523402d",
    measurementId: "G-6RG40RW2YZ"
};

// --- Your VAPID Public Key (from Firebase Console > Project settings > Cloud Messaging) ---
const VAPID_PUBLIC_KEY = 'BOWyxNYRhDij8-RqU4hcMxrBjbhWo9HaOkcjF5gdkfvrZ1DH-NP1-64Nur0o6uQ-5-kcQiiLlBUVL13wwXimpC4';

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// --- DOM Elements ---
const enableNotificationsSwitch = document.getElementById('notificationToggleCheckbox');
const logDiv = document.getElementById('log');
const messagesDiv = document.getElementById('messages');

// --- Helper Functions for Logging and Display ---
function appendLog(message) {
    const p = document.createElement('p');
    p.textContent = message;
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight;
}

function displayForegroundMessage(payload) {
    const messageBox = document.createElement('div');
    messageBox.className = 'message-box';
    const title = document.createElement('div');
    title.className = 'message-title';
    title.textContent = `Title: ${payload.notification?.title || 'N/A'}`;
    const body = document.createElement('div');
    body.className = 'message-body';
    body.textContent = `Body: ${payload.notification?.body || 'N/A'}`;
    messageBox.appendChild(title);
    messageBox.appendChild(body);
    messagesDiv.appendChild(messageBox);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// --- FCM Specific Logic (Permission & Token) ---

/**
 * Requests notification permission, registers the service worker, and gets the FCM token.
 */
async function requestPermissionAndGetFCMToken() {
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
            appendLog('Service Worker registered successfully.');
            // This line ensures the messaging service knows about your service worker registration.
            // Some tutorials might omit this, but it's good practice for clarity.
            messaging.swRegistration = registration;
        } catch (error) {
            appendLog(`Service Worker registration failed: ${error}`);
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

// --- Handle messages when the app is in the foreground ---
// This listener MUST be set up after DOMContentLoaded.
onMessage(messaging, (payload) => {
    appendLog('Message received in foreground:');
    appendLog(JSON.stringify(payload));
    displayForegroundMessage(payload);

    // Optionally display a browser notification even when in foreground
    // This provides a consistent UX.
    new Notification(payload.notification?.title || 'New Message', {
        body: payload.notification?.body || 'You have a new notification.',
        icon: payload.notification?.icon || '/icon-192x192.png' // Use a generic icon
    });
});


// --- Event Listeners ---
self.addEventListener('DOMContentLoaded', () => {       
    appendLog("Document loaded. Setting up...");
    console.log("document ready")
    if (enableNotificationsSwitch) {
        const currentPermission = Notification.permission;

        if(currentPermission === 'granted') {
            console.log("has permission")
            enableNotificationsSwitch.checked = true;
            enableNotificationsSwitch.setAttribute("disabled", true)
        }
        
        enableNotificationsSwitch.addEventListener('click', function(e) {
            console.alert("permission requested")
            requestPermissionAndGetFCMToken;
            
            enableNotificationsSwitch.setAttribute("disabled", true)
        })

        appendLog("Enable Notifications switch is ready.");
    } else {
        appendLog("Enable Notifications switch not found. Please check HTML.");
    }

});
