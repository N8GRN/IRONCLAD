// src/firebase.js
import { initializeApp } from '/IRONCLAD/js/firebase/firebase-app';

// import { getFirestore, collection, getDocs } from '/IRONCLAD/js/firebase/firestore/lite.js';


import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';



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

// Initialize Firebase
    const app = initializeApp(firebaseConfig);

    // Get a reference to Firestore
    const db = getFirestore(app);




// Collection References
const colRef = collection(db, 'projects');

// Collection Data
getDocs(colRef)
    .then((snapshot) => {
        console.log(snapshot.docs);
    })