import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBLHZDMyI1eQGxu2ZxXbA3ShXMVTb4FAjQ",
  authDomain: "chat-demo-70255.firebaseapp.com",
  projectId: "chat-demo-70255",
  storageBucket: "chat-demo-70255.firebasestorage.app",
  messagingSenderId: "920982116566",
  appId: "1:920982116566:web:a67d14522282a6076ad177",
  measurementId: "G-BQ7B6NWLT5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Ensure session does not persist automatically after restart/reload if intended
setPersistence(auth, browserSessionPersistence);
export const db = getFirestore(app);
export const storage = getStorage(app);
