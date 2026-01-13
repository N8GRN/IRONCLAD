// js/modules.js - Firebase init, Firestore, FCM (foreground + token handling)

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-messaging.js';

// SMS verification
//--------------------------------------------------------------------
import {
  getAuth,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';
//--------------------------------------------------------------------

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
const messaging = getMessaging(app);

// [01.13.2026] - NEW
// -------------------------------------------------------------------------
// Initialize Auth
const auth = getAuth(app);

// Invisible reCAPTCHA verifier (created once, reused)
let recaptchaVerifier = null;

// Initialize reCAPTCHA verifier (lazy init on first use)
function initRecaptchaVerifier() {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: (response) => {
        console.log('reCAPTCHA solved, ready to send code');
      },
      'expired-callback': () => {
        console.warn('reCAPTCHA expired');
        alert('reCAPTCHA expired. Please try again.');
      }
    });
  }
  return recaptchaVerifier;
}

// Global variable to hold confirmation result
let confirmationResult = null;

// Send SMS verification code
async function sendPhoneVerificationCode(phoneNumber) {
  try {
    initRecaptchaVerifier();
    // Make sure reCAPTCHA is rendered/verified
    await recaptchaVerifier.render();
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    console.log('SMS code sent successfully');
    return { success: true, message: 'Code sent! Check your phone.' };
  } catch (error) {
    console.error('Error sending SMS code:', error);
    let message = 'Failed to send code. Please try again.';
    if (error.code === 'auth/invalid-phone-number') {
      message = 'Invalid phone number format. Use +1XXXXXXXXXX';
    } else if (error.code === 'auth/too-many-requests') {
      message = 'Too many attempts. Try again later.';
    } else if (error.code === 'auth/missing-recaptcha') {
      message = 'reCAPTCHA failed. Refresh and try again.';
    }
    return { success: false, message, error };
  }
}

// Verify the code entered by user
async function verifySmsCode(code) {
  if (!confirmationResult) {
    return { success: false, message: 'No verification in progress. Send code first.' };
  }

  try {
    const userCredential = await confirmationResult.confirm(code);
    const user = userCredential.user;
    console.log('User signed in:', user.uid, user.phoneNumber);

    // Optional: store user info
    localStorage.setItem('userPhone', user.phoneNumber);
    localStorage.setItem('userUid', user.uid);

    return { success: true, user, message: 'Login successful!' };
  } catch (error) {
    console.error('Code verification failed:', error);
    let message = 'Invalid or expired code.';
    if (error.code === 'auth/invalid-verification-code') {
      message = 'Wrong code. Please check and try again.';
    } else if (error.code === 'auth/code-expired') {
      message = 'Code expired. Request a new one.';
    }
    return { success: false, message, error };
  }
}

// Listen for auth state changes (useful for UI updates)
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User is signed in:', user.phoneNumber);
    // You can update UI, redirect, etc.
    localStorage.setItem('userPhone', user.phoneNumber);
    localStorage.setItem('userUid', user.uid);
    // Optional: call your drawUser() or similar
  } else {
    console.log('User is signed out');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userUid');
  }
});

// Logout function
async function logout() {
  try {
    await signOut(auth);
    console.log('Signed out');
    localStorage.clear(); // or just remove auth keys
  } catch (error) {
    console.error('Logout failed:', error);
  }
}
// -------------------------------------------------------------------------

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


// Export: SMS Authorization
window.AuthAPI = {
  sendPhoneVerificationCode,
  verifySmsCode,
  logout,
  getCurrentUser: () => auth.currentUser
};

console.log('Auth module loaded');