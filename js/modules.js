// src/firebase.js



// Your config (you already have this)
const firebaseConfig = {
    apiKey: "AIzaSyDUFtZly3OhRSbK1HEItBWwIHpOtzwyvTk",
    authDomain: "ironclad-127a5.firebaseapp.com",
    projectId: "ironclad-127a5",
    storageBucket: "ironclad-127a5.firebasestorage.app",
    messagingSenderId: "57257280088",
    appId: "1:57257280088:web:189e4db32d7ae28523402d",
    measurementId: "G-6RG40RW2YZ"
};


// Core app + Firestore imports (modular style)
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
  import { getFirestore, collection, getDocs, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';

  // Initialize
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Example usage: Fetch docs from a collection
  async function loadData() {
    try {
      const querySnapshot = await getDocs(collection(db, 'projects'));
      querySnapshot.forEach((doc) => {
        console.log(`${doc.id} → ${doc.data()}`);
      });
    } catch (error) {
      console.error('Firestore error:', error);
    }
  }

  // Example: Real-time listener (use onSnapshot, not snapshot)
  function watchCollection() {
    onSnapshot(collection(db, 'projects'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          console.log('New doc:', change.doc.data());
        }
      });
    });
  }

  // Call your functions (e.g., on page load)
  loadData();
  watchCollection();
