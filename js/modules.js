// src/firebase.js
import { initializeApp } from './IRONCLAD/js/firebase/app';
import { getAuth } from './IRONCLAD/js/firebase/auth';
import { getFirestore } from './IRONCLAD/js/firebase/firestore';
import { getAnalytics } from './IRONCLAD/js/firebase/analytics';

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

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app); // optional




// Collection References
const colRef = collection(db, 'projects');

// Collection Data
getDocs(colRef)
    .then((snapshot) => {
        console.log(snapshot.docs);
    })