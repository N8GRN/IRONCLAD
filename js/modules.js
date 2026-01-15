// js/modules.js - Firebase init, Firestore, Auth, FCM (foreground + token handling)
// Updated Jan 13, 2026 - added email/password auth + user profile support

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import {
  getFirestore,
  // [01.15.2026] Removed
  // enableIndexedDbPersistence, // Correct import for modular SDK (Previously: enabpePersistence)
  initializeFirestore, // Import initializeFirestore
  /*persistentLocalCache, // Import persistentLocalCache
  persistentMultipleTabManager, // Optional: for multi-tab support
  persistentSingleTabManager, // Optional: for single-tab support*/
  memoryLocalCache,
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-messaging.js';

// Authentication imports
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';

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

// Firestore instance
//const db = getFirestore(app);

// Messaging instance
const messaging = getMessaging(app);

// Auth instance
const auth = getAuth(app);

// ───────────────────────────────────────────────
// Offline - Enable offline persistence
// ───────────────────────────────────────────────
let db;

try {
  /*db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentSingleTabManager() //persistentMultipleTabManager() // Or persistentSingleTabManager()
    })
  });*/
  db = initializeFirestore(app, {
      localCache: memoryLocalCache() // Data will only persist as long as the tab is open
    });
  console.log("Firestore initialized with persistent local cache successfully!");
} catch (err) {
  if (err.code === 'failed-precondition') {
    console.warn("Firestore persistence failed: Multiple tabs open, or browser environment restriction. Persistence can only be enabled in one tab at a time, or may be disabled by browser settings (e.g., Private Browsing).", err);
  } else if (err.code === 'unimplemented') {
    console.warn("Firestore persistence failed: The current browser/environment does not support all required features for persistence (e.g., older browser, or specific iOS/iPadOS settings).", err);
  } else {
    console.error("Firestore initialization with persistence failed for an unknown reason:", err);
  }
}

// After Firestore is initialized with persistence, you can proceed with your operations.
console.log("Firestore initialized with persistent local cache!");


// ───────────────────────────────────────────────
// Auth API - Wrapped helpers for safe usage
// ───────────────────────────────────────────────
const AuthAPI = {
  // Register new user + save profile
  register: async (email, password, username) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save profile to Firestore
      const profileResult = await AuthAPI.saveUserProfile(user.uid, username, email);
      if (!profileResult.success) {
        return { success: false, message: profileResult.message };
      }

      console.log('Registered & profile saved:', user.uid);
      return { success: true, user };
    } catch (error) {
      console.error('Registration failed:', error.code, error.message);
      let msg = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') msg = 'This email is already registered.';
      if (error.code === 'auth/invalid-email') msg = 'Invalid email format.';
      if (error.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
      return { success: false, message: msg };
    }
  },

  // Sign in existing user
  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch profile for username
      const profile = await AuthAPI.getUserProfile(user.uid);
      if (profile) {
        localStorage.setItem('activeUsername', profile.username);
      }

      console.log('Signed in:', user.uid);
      return { success: true, user };
    } catch (error) {
      console.error('Login failed:', error.code, error.message);
      let msg = 'Login failed. Please check your credentials.';
      if (error.code === 'auth/user-not-found') msg = 'No account found with this email.';
      if (error.code === 'auth/wrong-password') msg = 'Incorrect password.';
      if (error.code === 'auth/invalid-email') msg = 'Invalid email format.';
      return { success: false, message: msg };
    }
  },

  // Logout
  logout: async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('activeUsername');
      console.log('Signed out');
      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      return { success: false, message: 'Logout failed. Try again.' };
    }
  },

  // Password reset
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent!' };
    } catch (error) {
      console.error('Reset failed:', error);
      let msg = 'Failed to send reset email.';
      if (error.code === 'auth/user-not-found') msg = 'No account found with this email.';
      return { success: false, message: msg };
    }
  },

  // Save user profile to Firestore
  saveUserProfile: async (uid, username, email) => {
    try {
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, {
        username: username.trim(),
        email: email.trim(),
        createdAt: new Date()
      });
      console.log('User profile saved:', uid);
      return { success: true };
    } catch (error) {
      console.error('Failed to save profile:', error);
      return { success: false, message: 'Profile save failed. Contact support.' };
    }
  },

  // Get user profile from Firestore
  getUserProfile: async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data();
      } else {
        console.warn('No profile found for UID:', uid);
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      return null;
    }
  },

  // Current user
  getCurrentUser: () => auth.currentUser,

  // Auth state listener
  onAuthChange: (callback) => onAuthStateChanged(auth, callback)
};

// ───────────────────────────────────────────────
// FCM & Logging (unchanged from your original)
// ───────────────────────────────────────────────
function logMessage(msg) {
  const logEl = document.getElementById('log');
  if (logEl) {
    logEl.innerHTML += `<p>${new Date().toLocaleTimeString()} - ${msg}</p>`;
    logEl.scrollTop = logEl.scrollHeight;
  } else {
    console.log(msg);
  }
}

async function requestNotificationPermission() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    logMessage('Notifications or SW not supported in this browser.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      // Don't display a denied message, leave blank
      //logMessage('Notification permission denied.');
      return null;
    }

    logMessage('Notification permission granted.');
    const token = await getToken(messaging, {
      vapidKey: VAPID_PUBLIC_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      logMessage(`FCM Token: ${token}`);
      // TODO: Send token to server / save to Firestore user doc
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

onMessage(messaging, (payload) => {
  logMessage('Foreground FCM message received: ' + JSON.stringify(payload));
  const title = payload.notification?.title || 'IRONCLAD Update';
  const options = {
    body: payload.notification?.body || 'Check your projects!',
    icon: '/IRONCLAD/img/icons/icon-192x192.png'
  };
  new Notification(title, options);
});

// ───────────────────────────────────────────────
// Exports
// ───────────────────────────────────────────────
window.FireDB = db;
window.AuthAPI = AuthAPI;
window.requestNotificationPermission = requestNotificationPermission;

console.log('modules.js fully loaded – FireDB, AuthAPI, and FCM ready');