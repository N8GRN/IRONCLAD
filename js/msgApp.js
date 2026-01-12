/*
    Name: msgApp.js
    Description: Request push notifications

    Author: Nathan Green
    Version: v2.0
    Last Update: 01.12.2026
*/


// --- Firebase SDK Imports for the main app (Modular API) ---
//import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
//import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging.js";
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-messaging.js'; // Ensure this version matches your SW


// --- Firebase Configuration ---
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