// /firebase-messaging-sw.js
// This script runs in the background and handles push notifications
// even when your PWA is not open.

// --- Firebase SDK Imports for the Service Worker (Compat API) ---
// We use compat for service workers to avoid potential module resolution issues
// with the modular API in some service worker environments.
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

//import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
//import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging.js";

// --- Your Project's Firebase Configuration (MUST BE IDENTICAL TO app.js) ---
const firebaseConfig = {
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
        body: payload.notification?.body + " from Nathan" || 'You have a new notification from Nathan.',
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
    const urlToOpen = event.notification.data?.url || '/IRONCLAD/pages/projects.html'; // Default to projects page

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
