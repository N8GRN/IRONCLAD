// Import the functions you need from the SDKs you need
        import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
        import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
        import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
        // TODO: Add SDKs for Firebase products that you want to use
        // https://firebase.google.com/docs/web/setup#available-libraries

        // Your web app's Firebase configuration
        // For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
        const analytics = getAnalytics(app);

        const db = getFirestore();

        // Collection References
        const colRef = collection(db, 'projects');

        // Collection Data
        getDocs(colRef)
            .then((snapshot) => {
                console.log(snapshot.docs);
            })