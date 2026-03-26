import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
export const db = getFirestore(app);
