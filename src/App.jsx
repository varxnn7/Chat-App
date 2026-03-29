import React from "react";
import {useEffect, useState} from "react";
import {auth, db} from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";

import Login from "./components/login";
import Chat from "./components/chat";

// “This function checks login and shows chat with real-time messages from Firebase.”
function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // UseEffect Hook to check login status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Automatically add/update user in the 'users' collection when they log in
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "users", currentUser.uid), {
          uid: currentUser.uid,
          email: currentUser.email,
        }, { merge: true });
      } else {
        setSelectedUser(null);
      }
    });
    return () => unsubscribe();
  },[]);

  // Fetch all users for the contact list
  useEffect (()=> {
    if (!user) return;
    const unsubscribe = onSnapshot(collection(db,"users"), (snapshot) => {
      const allUsers = snapshot.docs.map((doc) => doc.data());
      setUsers(allUsers.filter(u => u.uid !== user.uid));
    });
    return() => unsubscribe();
  },[user]);

  // UI what USER SEE?
  return (
    <div className="app">
      <div className="app-container">
        {user ? (
          selectedUser ? (
            <Chat user={user} selectedUser={selectedUser} onBack={() => setSelectedUser(null)} />
          ) : (
            <div className="contact-list-container">
              <div className="chat-header">
                <div className="user-info">
                  <div className="avatar">{user.email[0].toUpperCase()}</div>
                  <div className="details">
                    <h2>Contacts</h2>
                    <p>{user.email}</p>
                  </div>
                </div>
                <button onClick={() => auth.signOut()} className="logout-button">Sign Out</button>
              </div>
              <div className="contact-list">
                <h3 className="contact-list-title">Select someone to chat with</h3>
                {users.length === 0 && <p className="no-users">No other users found.</p>}
                {users.map((u) => (
                  <div key={u.uid} className="contact-item" onClick={() => setSelectedUser(u)}>
                    <div className="avatar">{u.email[0].toUpperCase()}</div>
                    <div className="contact-details">
                      <h4>{u.email}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          <Login />
        )}
      </div>
    </div>
  );
}
export default App;