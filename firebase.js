// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBLHZDMyI1eQGxu2ZxXbA3ShXMVTb4FAjQ",
  authDomain: "chat-demo-70255.firebaseapp.com",
  projectId: "chat-demo-70255",
  storageBucket: "chat-demo-70255.firebasestorage.app",
  messagingSenderId: "920982116566",
  appId: "1:920982116566:web:a67d14522282a6076ad177",
  measurementId: "G-BQ7B6NWLT5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);