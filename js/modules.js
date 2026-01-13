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
//import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-messaging.js'; // Ensure this version matches your SW


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
//const messaging = getMessaging(app);

// VAPID key from Firebase Console > Project settings > Cloud Messaging
//const VAPID_PUBLIC_KEY = 'BOWyxNYRhDij8-RqU4hcMxrBjbhWo9HaOkcjF5gdkfvrZ1DH-NP1-64Nur0o6uQ-5-kcQiiLlBUVL13wwXimpC4';


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