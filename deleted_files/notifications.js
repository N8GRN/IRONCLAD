// /js/app.js

// Firebase SDK Imports for the main app
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // <--- REPLACE THIS
    authDomain: "ironclad-127a5.firebaseapp.com",
    projectId: "ironclad-127a5",
    storageBucket: "ironclad-127a5.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // <--- REPLACE THIS (This is your Project Number/Sender ID)
    appId: "YOUR_APP_ID" // <--- REPLACE THIS
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

const logDiv = document.getElementById('log');
const messagesDiv = document.getElementById('messages');
const requestPermissionButton = document.getElementById('requestPermissionButton');

function appendLog(message) {
    const p = document.createElement('p');
    p.textContent = message;
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight; // Scroll to bottom
}

function displayForegroundMessage(payload) {
    const messageBox = document.createElement('div');
    messageBox.className = 'message-box';
    const title = document.createElement('div');
    title.className = 'message-title';
    title.textContent = `Title: ${payload.notification.title}`;
    const body = document.createElement('div');
    body.className = 'message-body';
    body.textContent = `Body: ${payload.notification.body}`;
    messageBox.appendChild(title);
    messageBox.appendChild(body);
    messagesDiv.appendChild(messageBox);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// 1. Register the Service Worker
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
            appendLog('Service Worker registered successfully with scope: /');
            return registration;
        } catch (error) {
            appendLog(`Service Worker registration failed: ${error}`);
        }
    } else {
        appendLog('Service Workers are not supported in this browser.');
        return null;
    }
}

// 2. Request Notification Permission and Get FCM Token
async function requestNotificationPermissionAndGetToken() {
    try {
        appendLog('Requesting notification permission...');
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            appendLog('Notification permission granted.');

            // Get FCM registration token
            // IMPORTANT: Replace 'YOUR_VAPID_KEY_HERE' with your actual VAPID key from Firebase Console
            const currentToken = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY_HERE' });
            if (currentToken) {
                appendLog(`FCM Registration Token: ${currentToken}`);
                // In a real app, you would send this token to your server
                // to associate it with the user and send targeted notifications.
            } else {
                appendLog('No FCM registration token available. Request permission to generate one.');
            }
        } else {
            appendLog('Notification permission denied.');
        }
    } catch (error) {
        appendLog(`Error getting FCM token or permission: ${error}`);
    }
}

// 3. Handle messages when the app is in the foreground
onMessage(messaging, (payload) => {
    appendLog('Message received in foreground:');
    appendLog(JSON.stringify(payload));
    displayForegroundMessage(payload);

    // Optionally display a notification even in foreground
    // You might want to customize this based on your UI
    new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: payload.notification.icon || '/icon-192x192.png' // Use a default icon
    });
});

// Event Listener for the button
requestPermissionButton.addEventListener('click', requestNotificationPermissionAndGetToken);

// Initial setup on page load
document.addEventListener('DOMContentLoaded', async () => {
    appendLog("Page loaded. Initializing Firebase Messaging...");
    await registerServiceWorker(); // Ensure service worker is registered first
});
