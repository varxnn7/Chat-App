import React from "react";
import {useEffect, useState} from "react";
import {auth,db} from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy,onSnapshot} from "firebase/firestore";

import Login from "./components/login";
import Chat from "./components/chat";

// “This function checks login and shows chat with real-time messages from Firebase.”
function App() {
  const [user, setUser] = useState(null);
  // initially no one logged in
  const [messages , setMessages] = useState([]);
  // chat messages where initially = empty []



  // UseEffect Hook to check login status
  useEffect(() => {
    // use to check someone is logged in or not?  if Yes => store that user ,  if No => user stays Null
    const unsubscribe = onAuthStateChanged(auth,(currentUser)=>{
      // update the user
      setUser(currentUser);
    });
    // cleanup function
    return () => unsubscribe();
  },[]);

  // UseEffect Hook to fetch messages from Firestore
  useEffect (()=> {
    // Go to messages collection sort by createdAt
    const q = query(collection(db,"messages"), orderBy("createdAt"));
    // onsnapshot => Real time listener  { whenever messages changes updates messages automatically}
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({id:doc.id, ...doc.data()})));
    });
    // again Cleanup function
    return() => unsubscribe();
  },[]);
 // UI what USER SEE?
  return (
    <div className = "app">
      <div className = "app-container">
        {/* If user Exist Show => Chat Component */}
        {user?(
          <Chat user ={user} messages = {messages} />
        ) : (
          // Else Show Login Component    => {This is also called CONDITIONAL RENDERING}
          <Login />
        )}
      </div>
    </div>
  );
}
export default App;