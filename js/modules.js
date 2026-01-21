// js/modules.js - Firebase Initialization and API Wrappers for IRONCLAD CRM

console.log('[modules.js] modules.js loaded');

// Firebase SDK Imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentSingleTabManager, collection, addDoc, getDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyDUFtZly3OhRSbK1HEItBWwIHpOtzwyvTk",
  authDomain: "ironclad-127a5.firebaseapp.com",
  projectId: "ironclad-127a5",
  storageBucket: "ironclad-127a5.appspot.com",
  messagingSenderId: "57257280088",
  appId: "1:57257280088:web:189e4db32d7ae28523402d",
  measurementId: "G-6RG40RW2YZ"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
console.log('[modules.js] Firebase App initialized');

// Firestore Initialization with Persistence
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentSingleTabManager()
    })
  });
  console.log('[modules.js] Firestore initialized with persistent local cache');
} catch (err) {
  console.error('[modules.js] Firestore persistence failed:', err);
  // Fallback to non-persistent if needed
  db = getFirestore(app);
  console.log('[modules.js] Firestore fallback to standard mode');
}

// Firebase Auth Instance
const auth = getAuth(app);
console.log('[modules.js] Firebase Auth initialized');

// Firebase Messaging Instance
const messaging = getMessaging(app);
console.log('[modules.js] Firebase Messaging initialized');

// Auth API Wrapper
const AuthAPI = {
  register: async (email, password, username) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username,
        email,
        createdAt: serverTimestamp()
      });
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  logout: async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Reset email sent! Check your inbox (including spam/junk folder).' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  getCurrentUser: () => auth.currentUser,
  onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback)
};

// Firestore API Wrapper (new for easy use in other JS files)
const FirestoreAPI = {
  addDoc: addDoc,
  getDoc: getDoc,
  updateDoc: updateDoc,
  deleteDoc: deleteDoc,
  onSnapshot: onSnapshot,
  collection: collection,
  query: query,
  orderBy: orderBy,
  serverTimestamp: serverTimestamp,
  db: db
};

// VAPID Key for FCM (from your repo)
const VAPID_PUBLIC_KEY = 'BDFpO1v8y0D1qR9qG0u2X3z4Y5v6w7x8y9z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6'; // Replace with your actual key if different

// Save FCM token (called on login)
async function saveMessagingDeviceToken() {
  try {
    const currentToken = await getToken(messaging, { vapidKey: VAPID_PUBLIC_KEY });
    if (currentToken) {
      console.log('FCM registration token:', currentToken);
      await setDoc(doc(db, 'fcmTokens', currentToken), {
        userId: auth.currentUser?.uid || null,
        timestamp: serverTimestamp(),
        platform: navigator.userAgent
      });
      console.log('FCM token saved to Firestore.');
    } else {
      console.log('No FCM registration token available. Request permission.');
    }
  } catch (error) {
    console.error('Unable to get or save FCM token:', error);
  }
}

// Foreground messaging handler
onMessage(messaging, (payload) => {
  console.log('Message received in foreground:', payload);
  // Custom notification or in-app alert
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/img/icons/icon-192x192.png'
  };
  new Notification(notificationTitle, notificationOptions);
});

// Export to window for global access
window.FirestoreAPI = FirestoreAPI;
window.AuthAPI = AuthAPI;
window.saveMessagingDeviceToken = saveMessagingDeviceToken;

console.log('[modules.js] modules.js fully loaded – FirestoreAPI, AuthAPI, and FCM ready');