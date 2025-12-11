// /js/firebase-service.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    doc,        // For getting, updating, deleting specific documents
    getDoc,     // For reading a single document
    updateDoc,  // For updating a single document
    deleteDoc,  // For deleting a single document
    onSnapshot  // For real-time listeners (optional, but good to know)
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Your web app's Firebase configuration
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
const db = getFirestore(app);

console.log("Firebase App and Firestore DB initialized in firebase-service.js");

// --- Generic Firestore CRUD Functions ---

/**
 * Adds a new document to a specified collection.
 * @param {string} collectionName - The name of the collection.
 * @param {object} data - The data for the new document.
 * @returns {Promise<string>} The ID of the newly added document.
 */
export async function addDocument(collectionName, data) {
    try {
        const colRef = collection(db, collectionName);
        const docRef = await addDoc(colRef, { ...data, createdAt: new Date() }); // Add timestamp automatically
        console.log(`Document added to ${collectionName} with ID: ${docRef.id}`);
        return docRef.id;
    } catch (e) {
        console.error(`Error adding document to ${collectionName}:`, e);
        throw e; // Re-throw to allow calling functions to handle the error
    }
}

/**
 * Retrieves all documents from a specified collection.
 * @param {string} collectionName - The name of the collection.
 * @returns {Promise<Array<object>>} An array of documents, each with an 'id' property.
 */
export async function getCollectionData(collectionName) {
    try {
        const colRef = collection(db, collectionName);
        const q = query(colRef);
        const querySnapshot = await getDocs(q);
        const documents = [];
        querySnapshot.forEach((document) => {
            documents.push({ id: document.id, ...document.data() });
        });
        console.log(`Retrieved ${documents.length} documents from ${collectionName}.`);
        return documents;
    } catch (e) {
        console.error(`Error getting documents from ${collectionName}:`, e);
        throw e;
    }
}

/**
 * Retrieves a single document by its ID from a specified collection.
 * @param {string} collectionName - The name of the collection.
 * @param {string} documentId - The ID of the document to retrieve.
 * @returns {Promise<object|null>} The document data with its 'id', or null if not found.
 */
export async function getDocumentById(collectionName, documentId) {
    try {
        const docRef = doc(db, collectionName, documentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            console.log(`Document ${documentId} from ${collectionName} retrieved.`);
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            console.log(`No such document: ${documentId} in ${collectionName}`);
            return null;
        }
    } catch (e) {
        console.error(`Error getting document ${documentId} from ${collectionName}:`, e);
        throw e;
    }
}

/**
 * Updates an existing document in a specified collection.
 * @param {string} collectionName - The name of the collection.
 * @param {string} documentId - The ID of the document to update.
 * @param {object} data - The data to update.
 * @returns {Promise<void>}
 */
export async function updateDocument(collectionName, documentId, data) {
    try {
        const docRef = doc(db, collectionName, documentId);
        await updateDoc(docRef, { ...data, updatedAt: new Date() }); // Add timestamp automatically
        console.log(`Document ${documentId} in ${collectionName} updated successfully.`);
    } catch (e) {
        console.error(`Error updating document ${documentId} in ${collectionName}:`, e);
        throw e;
    }
}

/**
 * Deletes a document from a specified collection.
 * @param {string} collectionName - The name of the collection.
 * @param {string} documentId - The ID of the document to delete.
 * @returns {Promise<void>}
 */
export async function deleteDocument(collectionName, documentId) {
    try {
        const docRef = doc(db, collectionName, documentId);
        await deleteDoc(docRef);
        console.log(`Document ${documentId} deleted from ${collectionName} successfully.`);
    } catch (e) {
        console.error(`Error deleting document ${documentId} from ${collectionName}:`, e);
        throw e;
    }
}

/*
export async function getDocumentById(collectionName, documentId) {
    try {
        // Create a reference to a specific document
        const docRef = doc(db, collectionName, documentId);
        // Get the document snapshot
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log(`Document ${documentId} from ${collectionName} retrieved.`);
            // Return the document data along with its ID
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            // Document does not exist
            console.log(`No such document: ${documentId} in ${collectionName}`);
            return null;
        }
    } catch (e) {
        console.error(`Error getting document ${documentId} from ${collectionName}:`, e);
        throw e;
    }
}*/

// You can also export the 'db' instance if you need more direct access sometimes
export { db };
